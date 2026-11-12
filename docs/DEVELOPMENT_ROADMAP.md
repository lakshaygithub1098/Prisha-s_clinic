# Development Roadmap and Phase 0 Findings

**Status:** First authenticated patient-to-doctor test workflow connected to Atlas  
**Date:** 13 November 2026

**Current sequence:** patient UI → doctor/admin UI → backend foundation → authentication → clinic data and workflows.

## Phases

| Phase | Scope | Exit criteria |
| --- | --- | --- |
| 0. Requirements and architecture | Repository/environment review; PRD, architecture, database, API, UI guidance, risks and missing information | Clinic reviews documents and approves architecture/policy decisions |
| 1A. Patient UI with mock data | Public website and patient portal, responsive screens, synthetic fixtures | Patient flows and design review; no live patient data |
| 1B. Doctor/admin UI with mock data | Doctor portal and admin experience in the separate doctor application | Role-specific screen review; no live patient data |
| 2. Backend foundation | Express API, environment validation, health/readiness, optional MongoDB connection | API starts without credentials; readiness reflects connection state |
| 3. Authentication and permissions | Patient development OTP, staff password login, sessions, role checks, audit | Session and role checks verified; production OTP provider still required |
| 4. Data and domain foundation | Mongoose models, indexes, synthetic seed, API validation | Test database isolated and seeded without clearing existing data |
| 5. Appointment engine | Availability, online booking, transactional slot claim, patient and doctor schedule views | Synthetic booking verified end to end; phone/walk-in, cancellation and rescheduling remain |
| 6. Consultations and prescriptions | Notes, prescription lifecycle, secure PDF metadata/delivery, patient history access | Clinical access rules and finalized-document behavior approved |
| 7. Admin management and exports | Patient/doctor/staff/schedule administration, operational reports, CSV/XLSX | Admin boundaries, export scope and audit behavior approved |
| 8. Assistant and notifications | Constrained administrative assistant, notification adapters | Privacy/security review, consent/legal basis, no clinical advice or writes |
| 9. Verification and deployment | Unit/E2E/security checks, observability, backup/restore, production deployment | Production hosting and operational readiness sign-off |

### Current progress

- **Phase 1A patient UI:** implemented as a synthetic-data prototype in `apps/patient-web`.
- **Phase 1B doctor/admin UI:** implemented in `apps/doctor-portal`; the doctor dashboard and appointment list now use live test bookings.
- **Phase 2 backend foundation:** implemented in `apps/backend`; local Atlas connectivity and core Mongoose model/index definitions are in place.
- **Phase 3 authentication:** development patient OTP, separate doctor/admin password login, HTTP-only sessions, role checks and protected portal shells are implemented.
- **Phase 4 test data:** `pnpm seed:dev` creates synthetic test specialties, staff accounts and schedules in isolated database `prisha_clinic_test`.
- **Phase 5 initial booking flow:** availability, transactional online slot booking, patient appointment list and doctor schedule use the shared MongoDB database. The end-to-end flow was verified against Atlas.
- Consultations, prescriptions, records, most admin actions, exports and production operations still need implementation. Do not enter real patient data.

The roadmap is a sequence, not a calendar estimate. The first live-data test path is connected; other screens still have placeholder behavior until their APIs are implemented.

## Environment and repository inspection

Workspace was effectively empty: only `.vscode` was present; no `package.json`, pnpm workspace, source, tests, existing docs or deployment configuration were found. The supplied environment is Windows PowerShell, with the project root at `C:\Users\Lakshay Pal\Documents\Prisha's clinic`. The clinic's mandated timezone is `Asia/Kolkata`; the session timezone is reported as `Asia/Calcutta`, the equivalent regional timezone identifier. No repo history or installed runtime versions were inferred from the directory listing.

## Missing clinic information

### Required for accurate public content

- Legal/approved clinic name and brand/logo source files.
- Clinic address, map pin, phone, email, opening hours, holiday handling and directions/parking information.
- Doctor full names, titles, approved headshots, degrees/qualifications, registration details if to be shown, verified experience, achievements, expertise and approved bios.
- Service descriptions and approved scope/claims; languages and accessibility arrangements.
- Approved testimonials and consent, or decision to omit them initially.
- Existing domain registrar/DNS access and preferred patient URL paths.

### Required for booking and operations

- Doctor-to-speciality mapping; appointment types, durations, buffers, booking horizon and slot increments.
- Weekly clinic/doctor availability, breaks, holidays and exception ownership.
- Confirmation model (immediate confirmed vs pending approval), walk-in handling, no-show and check-in rules.
- Cancellation/rescheduling cutoff, fees if any (payments remain out of scope), and staff override rules.
- New patient fields, duplicate patient matching policy, guardian/minor workflow, emergency messaging and after-hours process.
- Staff roles, permissions, account provisioning and account recovery process.

### Required for security, privacy and production

- Privacy notice, consent language/versioning, data retention/deletion/correction policy, breach escalation contact and applicable healthcare/privacy legal review.
- Who may access which clinical records; doctor assignment/covering rules; emergency access policy; audit review owner.
- OTP provider and sender identity; SMS delivery/fallback and cost decision.
- Commercial API hosting, MongoDB Atlas production tier/region, private object storage, domain/TLS, backup, restore objectives and monitoring owner.
- Prescription/PDF format, clinic identity/footer, signature rules, amendment/void workflow and document retention.
- AI provider or continued mock-only decision; data allowed to leave the system, consent/legal basis and human escalation route.

## Technical risk register

| Risk | Impact | Mitigation / decision needed |
| --- | --- | --- |
| Clinical or identity data exposed across users/roles | Severe privacy and patient harm | Default-deny role plus resource authorization, minimal DTOs, security review, audit, synthetic data and access-denial verification |
| Concurrent booking race / overlapping schedule rules | Double-booking and operational disruption | Unique slot claim index plus transaction, common booking service, idempotency, policy for durations/buffers and schedule overlap validation |
| Cross-domain patient/doctor login cookies and CORS | Login failure or insecure broad origins | Decide API origin and session cookie strategy early; exact origins, CSRF protection and deployment-specific verification |
| OTP abuse, takeover or account enumeration | Unauthorized account access and cost | Provider abstraction, hashed short-lived OTP, per-mobile/IP limits, attempt caps, generic responses, session revocation |
| Unspecified privacy/legal/retention obligations | Compliance, trust and operational risk | Obtain qualified review and clinic policy before real data or production launch |
| Vercel free-tier/commercial limitations and shared API uptime | Service interruption or inappropriate production setup | Treat Vercel Hobby as prototype only; select commercial-capable backend/storage/monitoring and recovery plan before launch |
| File/document links leak medical records | Sensitive record exposure | Private storage, scoped short-lived download, no public keys, audit access, malware/content controls as appropriate |
| AI receives sensitive health data or gives clinical advice | Patient safety and privacy risk | Mock first; tool allowlist, no diagnosis/prescribing/clinical writes, minimize data, review provider/legal basis and consent |
| DST/timezone and slot calculation errors | Wrong appointment time | Store UTC instants, explicit clinic timezone, timezone-aware schedule calculations and clear UI display |
| Unverified UI board facts enter production | Misleading medical/business claims | Treat every sample statistic/profile/medication/contact/date as mock; require clinic content approval |

## Decisions requested before Phase 1

1. Approve the proposed two-frontend monorepo and shared Express/MongoDB architecture.
2. Confirm patient website includes both the public site and patient portal, with doctor and admin together in the separately deployed doctor application.
3. Approve the design direction and use of clearly marked content placeholders while real clinic facts are collected.
4. Confirm that Phase 1 uses synthetic mock data and excludes production integrations.

Upon approval, Phase 1 can start while the clinic supplies missing content and policy choices needed by later phases.
