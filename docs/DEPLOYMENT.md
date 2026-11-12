# Repository and Deployment Setup

## One repository is the right layout

Keep the whole pnpm workspace in one **private Git repository**. Create separate Vercel projects from that same repository so each application deploys on its own schedule and gets its own domain:

| Vercel project | Root directory | Public URL |
| --- | --- | --- |
| Patient website and portal | `apps/patient-web` | Clinic's purchased domain |
| Doctor and admin portal | `apps/doctor-portal` | Vercel-provided URL initially |
| Backend API | `apps/backend` | Stable API hostname |

Vercel supports multiple projects connected to one monorepo repository by assigning each a different root directory. A push can trigger separate builds for all connected projects. The Express API is supported as a Vercel project too. See Vercel's [monorepo guide](https://vercel.com/docs/monorepos) and [Express deployment guide](https://vercel.com/docs/frameworks/backend/express).

The API should have a stable hostname independent of the patient frontend. Set `BACKEND_API_URL` in both Next.js Vercel projects to that API origin. The frontends proxy `/api/v1` through their own domains so each browser stores its session cookie as a first-party cookie. Keep the API CORS allowlist restricted to the exact patient and doctor origins.

## Publish the code repository

The current workspace has no `.git` repository yet. Create a **private** repository in GitHub, then from PowerShell at the workspace root:

```powershell
git init
git add .
git status --short
git commit -m "Initial clinic platform workspace"
git branch -M main
git remote add origin <your-private-repository-url>
git push -u origin main
```

Before committing, verify `.env` is ignored and is not listed as staged. Commit `.env.example`, never `.env`. `node_modules`, `.next`, build output and `.pnpm-store` are ignored.

## Create the three Vercel projects

For each app, choose **Add New → Project**, import the same repository, and set its Root Directory from the table above. Keep the repository root `pnpm-lock.yaml` and `pnpm-workspace.yaml`; review each build before assigning domains. Set `BACKEND_API_URL` on both frontend projects. The backend deployment needs its own environment variables.

For the API project, configure the backend environment variables in that Vercel project's settings. `MONGODB_URI` belongs only to the API project and must not use a `NEXT_PUBLIC_` prefix. Set `CORS_ORIGINS` to the exact production patient and doctor origins, comma-separated; do not use a wildcard with credentialed requests. Store the Atlas URI in Vercel's encrypted environment settings and keep it out of Git. Leave `HOST` unset in production so the server binds to `0.0.0.0`; local development defaults to `127.0.0.1`.

The API now supports development OTP sign-in, separate doctor/admin password sign-in, session management, test availability, atomic appointment booking, patient appointment retrieval, and doctor schedule retrieval. Only the patient-to-doctor booking flow is connected end to end; consultation, prescription, medical-record, exports, and most admin operations remain incomplete. Development OTP exposes a code in the API response and must never be deployed. A live patient launch also needs a real SMS provider, production database separation, operational backups, monitoring, privacy/security review, and the remaining clinical workflows.

## Production constraints

- Vercel Hobby is limited to personal, noncommercial projects; a clinic's production site needs a plan that permits commercial use. Confirm provider terms for any regulated health information before sending it through the deployment.
- The current MongoDB URI has been verified locally. Production must use a separately controlled environment variable, a least-privilege Atlas user, restricted network access, backups and a tested restore process.
- The public website currently contains content placeholders. Replace them with clinic-approved facts before public launch.
- Add exact Vercel production origins to `CORS_ORIGINS`; preview deployment origins need a deliberately scoped policy if API previews are required.
- Set `NODE_ENV=production`, `MOCK_OTP=false`, and a non-test `MONGODB_DATABASE` for production. Patient sign-in will return `503` until a real OTP provider is implemented and configured.
- Keep `BACKEND_API_URL` server-side in each Next.js project. Do not use a `NEXT_PUBLIC_` prefix for backend secrets or credentials.
