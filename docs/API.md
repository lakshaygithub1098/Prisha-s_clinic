# REST API Plan

**Status:** Authenticated test booking workflow implemented; remaining domain API is planned  
**Base path:** `/api/v1`  
**Date:** 12 November 2026

## Conventions

- HTTPS in deployed environments; JSON request/response except file downloads and exports.
- Versioned resources under `/api/v1`; OpenAPI specification should be added during backend foundation.
- Server validates all inputs with Zod and returns a stable error envelope: `{ error: { code, message, fields?, requestId } }`.
- Use UTC ISO timestamps in API payloads. Interpret clinic schedule inputs with explicit `Asia/Kolkata` timezone.
- Authenticated mutations require CSRF protection when cookie sessions are used. Paginated lists use bounded page/cursor parameters.
- Apply authorization at both route and resource level. Return no sensitive fields beyond the caller's permission.
- Rate-limit OTP, login, search and export endpoints. Record security-relevant activity in audit logs.

## Implemented bootstrap endpoints

- `GET /api/v1/health` — liveness and service version; reports MongoDB connection state without exposing credentials.
- `GET /api/v1/ready` — readiness; returns `503` until MongoDB is configured and connected.

## Implemented test endpoints

- `POST /api/v1/auth/patient/otp` â€” requests a development-only test OTP; the response includes the code only in non-production mock-OTP mode.
- `POST /api/v1/auth/patient/verify` â€” verifies the code, creates or reuses a synthetic patient account and sets an HTTP-only session cookie.
- `POST /api/v1/auth/doctor/login` and `POST /api/v1/auth/admin/login` â€” authenticate seeded staff accounts using bcrypt password hashes.
- `GET /api/v1/auth/session`, `POST /api/v1/auth/logout` â€” inspect the role-bound session and revoke it.
- `GET /api/v1/appointments/specialities`, `GET /api/v1/appointments/doctors`, `GET /api/v1/appointments/availability` â€” expose seeded test availability.
- `POST /api/v1/appointments` â€” patient-only transaction that claims an open slot and creates a confirmed appointment.
- `GET /api/v1/appointments/mine` â€” patient-scoped appointment list.
- `GET /api/v1/appointments/doctor/dashboard` â€” doctor-scoped upcoming appointments with minimum patient fields.

These routes use synthetic data in `prisha_clinic_test`. The remaining endpoints in this plan have not been implemented and production readiness is not implied.

## Authentication and sessions

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/auth/patient/otp` | Request OTP; rate-limited; do not reveal account existence |
| POST | `/auth/patient/verify` | Verify OTP and establish patient session/register patient as policy permits |
| POST | `/auth/doctor/login` | Doctor login |
| POST | `/auth/admin/login` | Admin login with separate role guard |
| POST | `/auth/logout` | Revoke current session |
| GET | `/auth/session` | Current actor and permitted capabilities |
| POST | `/auth/session/refresh` | Rotate/refresh session if session strategy requires it |

Patient OTP issuance and verification are separate to support throttling and expiry. Production provider selection is pending; mock OTP is development-only.

## Public and patient resources

- `GET /public/clinic`, `/public/specialities`, `/public/doctors`, `/public/doctors/:doctorId`, `/public/services` — approved public content only.
- `GET|PATCH /patients/me` — own profile; field allowlist and audit sensitive changes.
- `GET /appointments/availability?specialityId=&doctorId=&from=&to=` — public/authorized availability; does not reserve a slot.
- `POST /appointments` — patient booking through shared booking service; idempotency key recommended.
- `GET /patients/me/appointments?state=&from=&to=` — own upcoming/past list.
- `GET /patients/me/appointments/:appointmentId` — own appointment details.
- `POST /patients/me/appointments/:appointmentId/cancel` — policy-governed cancellation.
- `POST /patients/me/appointments/:appointmentId/reschedule` — atomically reserve replacement slot then move booking.
- `GET /patients/me/consultations` — authorized history summary/details according to policy.
- `GET /patients/me/prescriptions`; `GET /patients/me/prescriptions/:id`; `POST /patients/me/prescriptions/:id/download` — own finalized prescriptions and controlled PDF delivery.
- `GET /patients/me/medical-records`; `POST /patients/me/medical-records/:id/download` — only records explicitly authorized for patient access.
- `GET|PUT /patients/me/consents` — inspect/update consent state with versioned evidence.

## Doctor resources

- `GET /doctors/me/dashboard` — role-scoped counts and schedule summary.
- `GET /doctors/me/schedule?view=day|week|month&from=&to=` — permitted schedule.
- `GET /doctors/me/appointments` and `GET /doctors/me/appointments/:id` — authorized appointments.
- `GET /doctors/me/patients?query=`; `GET /doctors/me/patients/:patientId` — scoped search/profile; avoid unrestricted global enumeration.
- `GET /doctors/me/patients/:patientId/consultations` — authorized history.
- `POST /doctors/me/appointments/:appointmentId/check-in` — check-in state transition.
- `POST /doctors/me/appointments/:appointmentId/consultation` — create consultation draft; `PATCH /doctors/me/consultations/:id` — edit draft; `POST /doctors/me/consultations/:id/finalize` — finalize per clinical policy.
- `POST /doctors/me/consultations/:id/prescriptions` — create draft prescription; `PATCH /doctors/me/prescriptions/:id` — edit draft; `POST /doctors/me/prescriptions/:id/preview`; `POST /doctors/me/prescriptions/:id/finalize` — finalize and generate protected PDF.
- `POST /doctors/me/schedule-exports` — generate authorized CSV/XLSX export for a bounded date range; audit export.

## Admin resources

- `GET /admin/dashboard` — operational metrics only.
- `GET|POST /admin/patients`; `GET|PATCH /admin/patients/:id` — patient operations, with field-level restrictions.
- `GET|POST /admin/doctors`; `GET|PATCH /admin/doctors/:id` — staff/profile and active state.
- `GET|POST /admin/staff`; `PATCH /admin/staff/:id` — staff accounts and assigned roles.
- `GET /admin/appointments`; `POST /admin/appointments` — phone/walk-in booking through the same service as public booking; `PATCH /admin/appointments/:id` — only allowed transitions.
- `GET|PUT /admin/doctors/:doctorId/schedules`; `POST|DELETE /admin/doctors/:doctorId/schedule-exceptions` — configure availability, with validation and audit.
- `GET /admin/reports/appointments`; `POST /admin/exports/appointments` — operational reports and exports.
- `GET /admin/audit-logs` — permitted audit access; audit access to audit logs itself.
- `GET|PATCH /admin/settings` — clinic settings with explicit permission.

Admin endpoints must not include consultation note content by default. Any exceptional clinical access needs separately approved policy and explicit permission.

## Assistant

- `POST /assistant/messages` — administrative assistant with authenticated patient context and constrained tools.
- Allowed tools: discover availability, guide booking, retrieve that patient's own appointments/prescriptions, and answer from approved clinic information.
- Never diagnose, recommend treatment, prescribe, or create/update clinical records. Do not send clinical data to an AI provider without an approved privacy/security review, consent/legal basis and data minimization controls. Mock responses initially.

## Shared booking behavior

Both patient and admin create-booking routes invoke one domain service: resolve eligible doctor/speciality, evaluate schedules/exceptions, verify selected slot, atomically claim and create, record source/actor, emit notification work, and audit. The service handles duplicate-key/transaction conflicts as `409 SLOT_UNAVAILABLE`; it does not trust the availability result previously shown to the client.

## Status transition outline

`Pending -> Confirmed | Cancelled`; `Confirmed -> Checked-in | Cancelled | No-show`; `Checked-in -> In consultation | Cancelled` (only under explicit policy); `In consultation -> Completed`. Administrative overrides are permission-gated and audited. Exact transition policy is a clinic decision. Do not permit arbitrary client-supplied status updates.

## Deferred contract decisions

Pagination style, API hostname, cookie domain strategy, exact DTOs, whether patient registration is implicit at verified OTP, cancellation windows, notification semantics and upload types are implementation-time decisions after clinic policy and deployment choices. Publish these in OpenAPI before client integration.
