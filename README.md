# Bridgework — John Bowne synthetic pilot

React + Express prototype for a school × local-business project marketplace. The default demo is now grounded around **John Bowne High School (25Q425)** while keeping all individual people, business partners, projects, applications, matches and pilot outcomes synthetic.

## What is real vs. synthetic

**Historical public-reference context**
- John Bowne High School identity, DBN and location.
- The baseline indicators shown in the coordinator dashboard (graduation, college/career readiness, college/career-prep completion, postsecondary enrollment and college persistence) are included as historical reference values for the demo and should be re-verified before an external presentation.
- John Bowne pathway names are used to make the cohort structure realistic.

**Synthetic demo data**
- 36 fictional students across seven academic pathways.
- 24 fictional local businesses modeled across Kew Gardens Hills, Queens College/Kissena, Fresh Meadows, Flushing and the Forest Hills edge.
- 20 fictional student-safe projects within a modeled two-mile radius.
- 31 fictional applications, including 17 completed projects and 212 verified hours at seed state.
- Business satisfaction, career-confidence, selective/honors/research offers and postsecondary targets are scenario values, not measured outcomes or forecasts.

The UI repeats these distinctions so a demo cannot easily be mistaken for a claim that John Bowne or any business has adopted Bridgework.

## Architecture

- `apps/web` — React + TypeScript + Vite frontend.
- `apps/api` — Express + TypeScript REST API skeleton.
- `.github/workflows/deploy-pages.yml` — builds and publishes the frontend to GitHub Pages.

GitHub Pages hosts only the static frontend. The API must eventually be deployed separately. The frontend reads the API base from `VITE_API_BASE_URL`.

If `VITE_API_BASE_URL` is absent, the frontend uses a `localStorage` mock adapter seeded with the same John Bowne scenario as the Express API. This makes the GitHub Pages demo fully interactive before a backend is hosted.

## Demo roles

### School coordinator
- Public baseline + synthetic evaluation targets.
- 36-student synthetic cohort.
- Application approval queue.
- Two-mile fictional business network.
- Pilot evaluation report with explicit causal-evaluation requirements.

### Student
- Uses the fictional profile `Alex Rivera`, Grade 11, STEM Research Honors.
- Explores projects by category, distance, pathway and supervision level.
- Applies to projects and sees existing synthetic experience.

### Business
- Sees the local student/program network.
- Posts a new challenge with distance, pathway fit and safety scope.
- Reviews applicants and verifies completion.

## Run locally

Requires Node 20.19+ or 22 (see `.nvmrc`).

```bash
npm install
npm run dev:api
# in another terminal
npm run dev:web
```

Frontend: `http://localhost:5173`
API: `http://localhost:8787/api`

To force the frontend to use the local Express API:

```bash
cp apps/web/.env.example apps/web/.env.local
```

## GitHub Pages

1. Push this repository to GitHub.
2. In **Settings → Pages**, set Source to **GitHub Actions**.
3. Push to `main`; the included workflow builds `apps/web` and deploys `apps/web/dist`.
4. The Vite config sets the `/repo-name/` base path in GitHub Actions (override with `VITE_BASE_PATH`), and the build also emits `404.html` so refreshes and deep links under the subpath still load the app.
5. With no `VITE_API_BASE_URL` variable set, the deployed demo runs entirely on the built-in synthetic John Bowne data via the localStorage mock adapter.

When the backend is deployed, add a repository variable named `VITE_API_BASE_URL`, for example:

```text
https://api.example.com/api
```

## API endpoints

- `GET /api/health`
- `GET /api/school`
- `GET /api/pilot`
- `GET /api/students`
- `GET /api/businesses`
- `GET /api/opportunities`
- `GET /api/opportunities/:id`
- `POST /api/opportunities`
- `GET /api/applications`
- `POST /api/applications`
- `PATCH /api/applications/:id/status`
- `POST /api/applications/:id/feedback`
- `GET /api/metrics`

The API remains an in-memory prototype. Authentication, authorization, persistence, audit logs, school/guardian consent, youth-safety controls, privacy/security review, moderation, compensation/labor review and real partner onboarding are required before production use.

## Baseline re-verification before external use

Before presenting the historical school metrics externally, re-check the current NYC Public Schools School Quality Snapshot and school profile. The product should preserve the distinction between:
1. baseline historical school outcomes,
2. Bridgework operational activity,
3. synthetic demo scenario outcomes/targets, and
4. eventual measured causal impact.
