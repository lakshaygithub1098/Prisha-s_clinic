# Product Requirements Document

**Project:** Prisha'a Gynae & Thyroid Clinic platform  
**Status:** Phase 0 draft for approval  
**Date:** 12 November 2026

## Purpose

Provide a trustworthy public clinic website and coordinated patient, clinician, and clinic operations tools. All interfaces share one backend and MongoDB data store, with role and resource checks at the API boundary.

## Product surfaces

| Surface | Audience | Initial deployment |
| --- | --- | --- |
| Public website and patient portal | Prospective and registered patients | Existing clinic domain; patient portal under `/patient` |
| Doctor portal | Clinic doctors | Separate Vercel-provided URL initially |
| Admin portal | Reception and authorized clinic administrators | Doctor application under `/admin`, separate auth and permissions |
| Backend API | All applications | Portable Node.js service; hosting selected before production |

## Roles and capabilities

- **Visitor:** view clinic, doctors, services, location and contact details; start appointment booking.
- **Patient:** authenticate by mobile OTP; manage own profile, appointments, consent, authorized records, consultation history and prescriptions; request allowed cancellation/rescheduling; use the administrative assistant.
- **Doctor:** separately authenticated; view assigned schedule and authorized patient records; create consultation notes and prescriptions; finalize prescriptions; export schedule.
- **Reception/admin staff:** separately authenticated; manage patients and bookings, availability, staff and operational settings; view operational reports and audit logs. Clinical notes are not automatically visible to administrators.
- **System/service:** perform narrowly scoped background work and audit relevant actions.

Permissions are enforced server-side for every resource and action. UI visibility alone is not authorization.

## Functional scope

### Public site

Navigation: Home, About Us, Services, Contact Us, Patient Login, and a prominent Book Appointment action. The home page includes the photographic doctor hero carousel, speciality cards, a separate illustrated calm/friendly carousel, how-it-works, doctor profiles, testimonials, contact/location and footer. About includes clinic introduction and doctor biographies, photos, credentials, achievements, experience and expertise. Unprovided facts must remain clearly marked placeholders; no qualifications, awards or claims are to be invented.

### Patient portal

Mobile OTP registration/login; profile; speciality/doctor/date/time booking; upcoming and past appointments; policy-governed cancel/reschedule; consultation history; prescriptions with PDF download; authorized medical records; consent; and an administrative AI assistant. Mock OTP and mock assistant are permitted during development. No payment processing in initial scope.

### Doctor portal

Separate login; dashboard; day/week/month schedule; upcoming appointments; patient search and authorized profiles; consultation history; draft/final consultation notes; prescription creation, preview and finalization; PDF output; CSV and Excel schedule export.

### Admin portal

Separate admin authentication and permissions within the doctor app at `/admin`; dashboard; patient/doctor/staff management; patient registration; phone and walk-in appointments; appointment management; doctor availability and exceptions; operational reports and exports; audit log access; clinic settings. Access to confidential clinical content must be explicitly granted, limited and audited.

### Booking rules

Online and staff-created bookings call the same booking service and availability rules. Clinic timezone is `Asia/Kolkata`. Appointment state transitions are controlled and audited: Pending, Confirmed, Checked-in, In consultation, Completed, Cancelled, No-show. A slot must not be booked twice even under concurrent requests. Cancellation/rescheduling windows and whether bookings are immediately confirmed remain clinic policy decisions.

## Non-functional requirements

- Responsive, mobile-first patient experience; accessible keyboard, focus, contrast and screen-reader behavior.
- Secure transport in deployed environments, secure sessions, password hashing for staff accounts, OTP throttling, server-side Zod validation, role-based plus resource-level authorization, audit logs, and protected document delivery.
- Least privilege, data minimization, explicit patient consent and documented retention/backup/recovery practices.
- No real patient information in development or seed data; use synthetic data.
- No secrets or provider credentials in client bundles or repository.
- Portable backend and documented deployment configuration; free-first development, with commercial production hosting evaluated before launch. Vercel Hobby is not the clinic's production plan.
- PDFs and other large files live in private object storage; MongoDB stores metadata and protected object references.

## Visual direction

Modern Minimal plus Calm & Friendly. Forest green, sage, muted mint, ivory, white and charcoal; explicitly exclude pink, purple and lavender. Use Manrope or Inter for UI typography, rounded cards, restrained shadows, whitespace, Lucide icons and subtle botanical/health illustrations. Follow the supplied boards for composition and tone, not as a source of real clinical/business facts. See [UI_GUIDELINES.md](UI_GUIDELINES.md).

## Out of scope for initial releases

Online payments; live AI diagnosis, treatment recommendations or prescribing; AI mutation of clinical records; real OTP delivery until a provider is selected; production patient data; a purchased doctor-portal domain; and committing to paid hosting before operational/security requirements are assessed.

## Success criteria

- A patient can book an available slot; a simultaneous competing booking cannot also succeed.
- Staff phone/walk-in bookings appear in the same doctor schedule and obey the same availability rules.
- Patients can only access their own authorized data; doctors are restricted to assigned/authorized records; admin clinical access is limited and audited.
- Finalized prescriptions can be securely retrieved as PDFs, and schedule exports are available in CSV and XLSX.
- The public site presents verified clinic and provider information only, and the interfaces work across mobile and desktop.

## Open clinic decisions and content

See [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md) for the complete approval and information checklist. Key blockers before production include verified provider identities and credentials, clinic address/contact/hours, booking and cancellation policy, OTP provider, privacy/consent and retention requirements, and commercial hosting/file-storage choices.
