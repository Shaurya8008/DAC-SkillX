# DAC SkillX

AI-powered student skill assessment & opportunity matching engine, built for the
DGU AI Cell (DAC). See `dac_skillx_prd.pdf` (shared separately) for the full PRD.

Replaces self-reported resumes with a verified skill profile: GitHub repo
vetting, an adaptive diagnostic quiz, and a hybrid hard-skill + semantic
matching engine against posted opportunities (hackathons, research labs,
campus roles, projects).

## Structure

- `web/` — Next.js 15 app (App Router, Tailwind, shadcn/ui, TanStack Query,
  Auth.js/NextAuth, Prisma). Student- and admin-facing UI plus the
  Next.js-side API routes.
- `engine/` — Python FastAPI AI engine. Embeddings, hybrid match scoring,
  GitHub repo evaluation, and the adaptive diagnostic quiz generator.

## Running locally

Everything runs with **zero external accounts** by default: SQLite instead
of Supabase/Postgres, and deterministic mock embeddings/LLM calls instead of
OpenAI/Groq/GitHub. Flip a switch later (see "Going to production" below)
once you have real keys.

### 1. AI engine

```bash
cd engine
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health check: `curl http://localhost:8000/health`

### 2. Web app

```bash
cd web
npm install
npx prisma migrate dev   # first time only
npm run db:seed          # optional demo data (see below)
npm run dev
```

Open http://localhost:3000.

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
| FR-02 | Hybrid Matching Engine       | `engine/app/services/matching.py`, `web/src/app/api/opportunities/[id]/matches` |
| FR-03 | Opportunity Board            | `web/src/app/opportunities`                                     |
| FR-04 | GitHub Repo Vetting          | `engine/app/services/repo_eval.py`, `web/src/app/api/profile/verify-repo` |
| FR-05 | Adaptive Diagnostic Engine   | `engine/app/services/diagnostics.py`, `web/src/app/api/quiz`, `web/src/components/skill-quiz.tsx` |
| FR-06 | DAC Executive Dashboard      | `web/src/app/admin`                                              |

## Going to production

Everything is structured so swapping in real infrastructure is additive,
not a rewrite:

1. **Database**: stand up Postgres + pgvector (`docker compose up -d`, or a
   Supabase project), point `web/.env` `DATABASE_URL` at it, change the
   `datasource` provider in `web/prisma/schema.prisma` to `postgresql`, and
   follow the migration notes at the top of that file (native `TEXT[]` +
   `vector(1536)` columns, HNSW indexes).
2. **Embeddings / LLM / GitHub**: set `OPENAI_API_KEY`, `GROQ_API_KEY`,
   `GITHUB_TOKEN` in `engine/.env`. Each service in `engine/app/services/`
   auto-switches from its mock to the real API the moment its key is
   present — no code changes needed.
3. **Auth**: swap the Auth.js Credentials provider in `web/src/lib/auth.ts`
   for Supabase Auth if you want managed auth instead of the current
   bcrypt + JWT setup.
