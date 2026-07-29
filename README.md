# Course Platform

A self-paced online course platform built with Next.js. The application doubles
as a **system under test** for a QA portfolio — code quality and testability are
first-class concerns (stable `data-testid`s, deterministic state, consistent API
contracts).

**Fase 1 (MVP) is complete:** register → sign in → browse & filter courses →
view a course → enroll in a free course → watch lectures, plus a student
dashboard.

> Plan, schema, and build sequence: [`PROJECT_PLAN.md`](./PROJECT_PLAN.md).
> Engagement rules: [`CLAUDE.md`](./CLAUDE.md).
> Stack rationale & deviations: [`docs/adr/0001-tech-stack.md`](./docs/adr/0001-tech-stack.md).

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript (strict)
- **Styling:** Tailwind CSS v3 + shadcn/ui (`default` style, `slate` base)
- **Database:** PostgreSQL + Prisma 6
- **Auth:** Auth.js v5 (Credentials, JWT sessions)
- **Forms/Validation:** React Hook Form + Zod
- **Payment:** dummy checkout (no gateway) · **Video:** URL input · **Storage:** Cloudflare R2 · **Email:** Resend
- **Testing (this repo):** Vitest (white-box unit/component). E2E / API /
  performance live in the separate `course-platform-automation` repo.

## Prerequisites

- Node.js 18.18+ (developed on Node 24)
- Docker (for local PostgreSQL) — the repo uses OrbStack/Docker via `docker compose`

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables** — Prisma and Next both read `.env`:

   ```bash
   cp .env.example .env
   ```

   Set at least `DATABASE_URL` (matches the compose defaults) and `AUTH_SECRET`:

   ```bash
   openssl rand -base64 32   # paste into AUTH_SECRET
   ```

3. **Start PostgreSQL**

   ```bash
   docker compose up -d --wait
   ```

4. **Apply migrations and seed**

   ```bash
   npx prisma migrate dev
   npm run db:seed
   ```

5. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Seeded test accounts

Both use the password `Password123!`:

| Email                    | Role       |
| ------------------------ | ---------- |
| `instructor@example.com` | INSTRUCTOR |
| `student@example.com`    | STUDENT    |

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
| `npm run db:seed`      | Seed the database (idempotent)         |

## Routes

| Route                           | Access          | Description                                       |
| ------------------------------- | --------------- | ------------------------------------------------- |
| `/`                             | public          | Landing page                                      |
| `/courses`                      | public          | Course listing (filter / sort / paginate via URL) |
| `/courses/[slug]`               | public          | Course detail + enroll                            |
| `/sign-in`, `/sign-up`          | public          | Auth                                              |
| `/dashboard`                    | auth            | Student dashboard                                 |
| `/my-courses`                   | auth            | Enrolled courses                                  |
| `/learn/[courseId]/[lectureId]` | auth + enrolled | Lecture player                                    |
| `/style-guide`                  | public          | Design-system reference                           |

## Project Structure

```
src/
  app/          # Routes: (marketing), (auth), (student) + not-found/error/og/icon
  components/   # ui/ (shadcn) · shared/ (navbar, footer, container, section) · features/
  lib/          # db, auth, utils, format, course-filters, enrollment-rules
  server/       # actions/ · services/ (all DB access goes through services)
  schemas/      # Zod schemas (shared client + server)
  config/       # site, nav, routes
  types/        # shared types / module augmentation
tests/          # unit/ (white-box) ONLY
docs/adr/       # architecture decision records
prisma/         # schema · migrations · seed
```

## Testing Strategy

This repo contains **white-box** tests only (Vitest unit/component in `tests/`).
Black-box E2E, API automation, and performance/load tests live in a **separate**
repo (`course-platform-automation`) and target the running app via its
testability hooks. Do **not** add Playwright or k6 here.
