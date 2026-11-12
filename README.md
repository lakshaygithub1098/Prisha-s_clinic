# Prisha'a Gynae & Thyroid Clinic

Clinic website and management platform. Phase 0 product and architecture decisions are documented in [`docs/`](docs/PRD.md).

## Current test workflow

Patient and doctor authentication, patient appointment booking, and the doctor schedule use the shared Express API and MongoDB database. Test records are isolated in `prisha_clinic_test`. Use synthetic details only; this is not cleared for real patient information or production clinic use.

### Start locally

Install pnpm 10, copy `.env.example` to `.env`, add the Atlas connection string to `MONGODB_URI`, then seed the isolated test database:

```sh
pnpm install
pnpm seed:dev
```

Start each app in its own terminal:

```sh
pnpm dev:api      # API on http://localhost:5000
pnpm dev:patient  # patient site on http://localhost:3000
pnpm dev:doctor   # doctor/admin portal on http://localhost:4000
```

`pnpm seed:dev` creates synthetic test specialities, two doctor accounts, an admin account, and weekly test schedules. On its first run it prints a generated staff password once. Save it privately. To set or reset all seeded staff passwords, add `TEST_ACCOUNT_PASSWORD` to the local `.env` and run the seed again. The seed is idempotent and does not clear collections.

### Try the patient-to-doctor flow

1. Open `http://localhost:3000/patient/login` and enter a synthetic 10-digit number.
2. Use the displayed development OTP to sign in. No SMS is sent.
3. Book an available test slot under `/book`.
4. Open `http://localhost:4000/login` and sign in as `test.gynae@prisha.local` or `test.thyroid@prisha.local` using the seeded password.
5. The patient booking should appear in the doctor dashboard and appointments list.

Doctor/admin test emails: `test.gynae@prisha.local`, `test.thyroid@prisha.local`, and `test.admin@prisha.local`.

The frontends proxy `/api/v1` through their own origin using `BACKEND_API_URL` in deployment settings. This keeps browser session cookies first-party even though the patient and doctor apps deploy separately.

## Routes

- Public website: `/`, `/about`, `/services`, `/contact`, `/book`
- Patient portal: `/patient/login`, `/patient/dashboard`, `/patient/appointments`
- Doctor portal: `/login`, `/`, `/appointments`
- Admin portal: `/admin/login`, `/admin`

Prescription, medical-record, consultation, exports, admin-management, and AI screens still need real API workflows. Their existing UI content is not live clinical functionality.

## API and safety

- API health: `GET /api/v1/health`; readiness: `GET /api/v1/ready`.
- API docs and routes are under [`apps/backend/src/routes/v1`](apps/backend/src/routes/v1).
- Local OTP mode is only for development; production startup rejects the test database and mock OTP configuration.
- Before any live use, add a real SMS OTP provider, deploy with a production database, configure HTTPS and session origins, complete the remaining workflows, and review privacy/security, backup, and restore procedures.
- Keep `.env` private and uncommitted. Never put `MONGODB_URI` in frontend environment variables or use real patient data during development.

For repository and hosting setup, see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
