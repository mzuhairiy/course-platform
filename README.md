# Course Platform

A self-paced online course platform built with Next.js. The application doubles
as a **system under test** for a QA portfolio — code quality and testability are
first-class concerns (stable `data-testid`s, deterministic state, consistent API
contracts).

> Detailed plan, schema, design system, and build sequence live in
> [`PROJECT_PLAN.md`](./PROJECT_PLAN.md). Engagement rules are in
> [`CLAUDE.md`](./CLAUDE.md).

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript (strict)
- **Styling:** Tailwind CSS + shadcn/ui (`default` style, `slate` base)
- **Database:** PostgreSQL + Prisma
- **Auth:** Auth.js v5 (NextAuth)
- **Forms/Validation:** React Hook Form + Zod
- **Payment:** Midtrans · **Video:** Mux · **Storage:** Cloudflare R2 · **Email:** Resend
- **Testing (this repo):** Vitest (unit + component, white-box). E2E / API /
  performance live in the separate `course-platform-automation` repo.

## Prerequisites

- Node.js 18.18+ (project developed on Node 24)
- Docker (for local PostgreSQL) — or any reachable PostgreSQL instance

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # also create a .env for Prisma CLI once the schema is added (Prompt 2)
   ```

   Generate an `AUTH_SECRET`:

   ```bash
   openssl rand -base64 32
   ```

3. **Start the local database**

   ```bash
   docker compose up -d
   ```

   This brings up PostgreSQL on `localhost:5432` matching the default
   `DATABASE_URL` in `.env.example`.

4. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

> Database schema, migrations, and seed data are added in Prompt 2 of the build
> sequence (`PROJECT_PLAN.md` section 8).

## Available Scripts

| Script                 | Description                            |
| ---------------------- | -------------------------------------- |
| `npm run dev`          | Start the Next.js dev server           |
| `npm run build`        | Production build                       |
| `npm run start`        | Start the production server            |
| `npm run lint`         | ESLint (`next lint`)                   |
| `npm run type-check`   | TypeScript check (`tsc --noEmit`)      |
| `npm run test`         | Run unit/component tests once (Vitest) |
| `npm run test:watch`   | Run tests in watch mode                |
| `npm run format`       | Format the codebase with Prettier      |
| `npm run format:check` | Check formatting without writing       |

## Project Structure

```
src/
  app/          # Routes (grouped: (marketing), (auth), (student), (instructor), (admin))
  components/   # ui/ (shadcn) · shared/ · features/
  lib/          # db, auth, integrations, utils
  server/       # actions/ · services/ (business logic)
  schemas/      # Zod schemas (shared client + server)
  types/        # Shared TypeScript types
  config/       # Site + navigation config
tests/          # unit/ + components/ (white-box) ONLY
docs/           # adr/ · test-strategy · risk-matrix
prisma/         # schema · migrations · seed (added in Prompt 2)
```

## Testing Strategy

This repo contains **white-box** tests only (Vitest unit + component tests in
`tests/`). Black-box E2E, API automation, and performance/load tests live in a
**separate** repository (`course-platform-automation`) and target the running
app via its testability hooks. Do **not** add Playwright or k6 here.
