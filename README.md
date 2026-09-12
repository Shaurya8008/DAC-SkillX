# DAC SkillX

AI-powered student skill assessment & opportunity matching engine, built for the
DGU AI Cell (DAC). See `dac_skillx_prd.pdf` (shared separately) for the full PRD.

Replaces self-reported resumes with a verified skill profile: GitHub repo
vetting, an adaptive diagnostic quiz, and a hybrid hard-skill + semantic
matching engine against posted opportunities (hackathons, research labs,
campus roles, projects).

## Structure

- `web/` — Next.js 15 app (App Router, Tailwind, shadcn/ui, TanStack Query,
  Auth.js/NextAuth, Prisma). This is the whole deployed app: UI, API
  routes, **and** the AI logic (`web/src/lib/ai/` — embeddings, hybrid
  match scoring, GitHub repo evaluation, adaptive diagnostic quiz
  generation) runs in-process here.
- `engine/` — Python FastAPI implementation of the same AI logic, matching
  the PRD's stated architecture (sec. 3) more literally. Kept as the
  reference/standalone version; **not required to run or deploy the app**
  — `web/` doesn't call out to it.

Why two copies: the PRD specifies a decoupled Python/FastAPI AI service.
That's `engine/`, and it's a complete, independently runnable
implementation. For the actual deployment, that logic was ported into
`web/src/lib/ai/` (TypeScript) so the whole app ships as a single Next.js
service with one host and one URL, instead of two services to keep alive.
The two stay logically identical — same mock/real fallback behavior, same
formulas.

## Running locally

Everything runs with **zero external accounts** by default: SQLite instead
of Supabase/Postgres, and a deterministic mock embeddings/quiz generator
instead of Gemini/GitHub. Flip a switch later (see "Going to production"
below) once you have real keys.

```bash
cd web
npm install
npx prisma migrate dev   # first time only
npm run db:seed          # optional demo data (see below)
npm run dev
```

Open http://localhost:3000.

(`engine/` can also be run standalone — see its own instructions — but
nothing in `web/` talks to it.)

### Demo accounts (from `npm run db:seed`)

| Role    | Email             | Password    |
| ------- | ----------------- | ----------- |
| Admin   | admin@dgu.ac.in   | admin123    |
| Student | alice@dgu.ac.in   | password123 |
| Student | bob@dgu.ac.in     | password123 |

A seeded hackathon opportunity ("Smart Campus Hackathon — ML + Web Track")
is included so you can test the matching engine immediately.

## Feature map (PRD sec. 4)

| ID    | Feature                     | Where                                                          |
| ----- | ---------------------------- | --------------------------------------------------------------- |
| FR-01 | Dynamic Profile Builder      | `web/src/app/register`, `web/src/app/profile`                   |
| FR-02 | Hybrid Matching Engine       | `web/src/lib/ai/matching.ts`, `web/src/app/api/opportunities/[id]/matches` |
| FR-03 | Opportunity Board            | `web/src/app/opportunities`                                     |
| FR-04 | GitHub Repo Vetting          | `web/src/lib/ai/repo-eval.ts`, `web/src/app/api/profile/verify-repo` |
| FR-05 | Adaptive Diagnostic Engine   | `web/src/lib/ai/diagnostics.ts`, `web/src/app/api/quiz`, `web/src/components/skill-quiz.tsx` |
| FR-06 | DAC Executive Dashboard      | `web/src/app/admin`                                              |

## Going to production

1. **Database**: stand up Postgres (a Supabase project, or `docker compose
   up -d` for local pgvector), point `web/.env` `DATABASE_URL` at it, and
   change the `datasource` provider in `web/prisma/schema.prisma` to
   `postgresql` — no other schema changes are required to deploy. Adopting
   native `TEXT[]` + `vector(1536)` columns and HNSW indexes (see the
   migration notes at the top of that file) is a later optimization, not a
   blocker.
2. **Embeddings / quiz generation**: set `GEMINI_API_KEY` in `web/.env` (or
   your host's env vars). `web/src/lib/ai/` auto-switches from mock to real
   the moment it's present — no code changes needed.
3. **GitHub repo vetting**: set `GITHUB_TOKEN` the same way.
4. **Auth**: swap the Auth.js Credentials provider in `web/src/lib/auth.ts`
   for Supabase Auth if you want managed auth instead of the current
   bcrypt + JWT setup.

## Market opportunity (TAM / SAM / SOM)

Rough sizing, for the project write-up — refine with real numbers before
citing externally:

- **TAM**: India has ~28,000+ AICTE-approved engineering/technical
  institutions and several million students enrolled in CS/IT-adjacent
  programs at any time. Every one of them faces the same problem this
  platform solves — resumes that can't be trusted, opportunities that
  don't reach the right students.
- **SAM**: Institutions with an active tech/AI cell, coding culture, or
  hackathon participation — a few thousand colleges nationally, reachable
  through campus-cell-to-campus-cell partnerships (the same channel DAC
  itself grew through).
- **SOM**: The initial obtainable slice is DAC's own network — the PRD's
  Phase 3 target of 150+ DGU Computer Science students. That's the beach-
  head; expansion to partner AI/tech cells at other campuses is the next
  obtainable step after campus validation.

## DAC R&D project guideline compliance

Status against the department's 7-point project development guidelines:

| # | Guideline | Status |
| - | --------- | ------ |
| 1 | Built via AI-assisted platform, mentor-reviewed before deployment | Built with Claude Code. **Pending mentor review.** |
| 2 | Separate Google account per project | **Not yet set up** — use a project-dedicated account for API keys, cloud services, and forms, not a personal one. |
| 3 | Deploy & collect real feedback | **Not yet deployed** — currently local-only. |
| 4 | TAM/SAM/SOM documented | Done — see above. |
| 5 | Campus-first deployment | Matches PRD Phase 3 (DGU CS student pilot) — pending execution. |
| 6 | Unique identity + "Powered by DAC" footer | Name set; footer added (`web/src/components/footer.tsx`). |
| 7 | Real-life solution, not just a demo | Problem (unverifiable resumes), users (students/leads/AI Cell), solution, and journey are defined in the PRD; deployment + feedback loop + commercialization angle still to be executed. |
