# 0001 — Tech Stack

- **Status:** Accepted
- **Date:** 2026-06-07
- **Phase:** Fase 1 (MVP)

## Context

The project is an online course platform built primarily as a **QA portfolio
piece** — the application is the _system under test_. That framing means code
quality, a consistent API contract, deterministic state, and testability hooks
matter as much as the features themselves. We want startup-style velocity
(single repo, fast deploys) with enterprise-style rigor (documented decisions,
test strategy). See `PROJECT_PLAN.md` §1–2 for the full brief.

Key constraints:

- Full-stack in one repo, easy to deploy (Vercel target).
- Type safety end-to-end to reduce bug surface.
- Relational data (course → section → lecture; enrollments; transactions).
- Stable testability hooks (`data-testid`, URL-driven state) from day one.
- Black-box automation (E2E, API, performance) lives in a **separate** repo;
  this repo holds the app + white-box unit/component tests only.

## Decision

| Layer                             | Choice                                              | Reasoning                                                                    |
| --------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| Framework                         | **Next.js 14** (App Router)                         | Full-stack, RSC by default, Server Actions for mutations, easy Vercel deploy |
| Language                          | **TypeScript (strict)**                             | Type safety; fewer runtime bugs; safer refactors                             |
| Database                          | **PostgreSQL**                                      | Relational model fits the domain; mature; many hosts                         |
| ORM                               | **Prisma 6**                                        | Type-safe client, solid migrations                                           |
| Auth                              | **Auth.js v5 (NextAuth beta)**                      | De-facto standard for Next.js; multi-provider                                |
| Styling                           | **Tailwind CSS v3 + shadcn/ui** (`default`/`slate`) | Utility-first; copy-in components we fully own                               |
| Forms                             | **React Hook Form + Zod**                           | Type-safe validation; schema shared client + server                          |
| Payment / Video / Storage / Email | Midtrans / Mux / Cloudflare R2 / Resend             | Wired in later phases                                                        |
| Testing (this repo)               | **Vitest**                                          | Fast white-box unit/component tests next to the code                         |

### Deviations decided during the build

These differ from a naive reading of the plan and are recorded deliberately:

1. **Next.js 14 + Tailwind v3 (not 15 / v4).** The design system (PROJECT_PLAN
   §5) is written around `tailwind.config.ts` + `extend` and the classic
   shadcn `default`/`slate` tokens — both Tailwind v3 idioms. "Next.js 14+" is
   satisfied by 14.
2. **Prisma pinned to v6** (the toolchain initially pulled v7). The plan's
   schema uses `provider = "prisma-client-js"` and `import { PrismaClient } from
"@prisma/client"`; Prisma 7 changes the generator (new `prisma-client` +
   explicit output, ESM). Pinning to 6 keeps the plan working verbatim and the
   Auth.js adapter on a well-trodden path.
3. **JWT session strategy (not database).** Auth.js v5 requires JWT sessions
   when using the Credentials provider; database sessions only work for OAuth.
   The Prisma adapter is still configured (persists users/accounts, ready for
   Google). Testability is unaffected (login via UI + cookie either way).
4. **shadcn CLI pinned to 2.3.0** for component generation — newer CLI dropped
   the `default` style flow and the legacy `toast` component.
5. **Design tokens:** the Maven palette is applied by retuning shadcn's CSS
   variables (so components adopt it) plus extra tokens; the plan's `accent`
   (orange) is exposed as `brand` to avoid colliding with shadcn's neutral
   interaction `accent`.

## Consequences

**Positive**

- One language and one repo across UI, server logic, and data access.
- Strict typing + Prisma generate catch a large class of errors at build time.
- shadcn components are vendored, so we fully control markup and `data-testid`s.
- URL-driven filters and stable test IDs give the automation repo a firm footing.

**Negative / trade-offs**

- On older majors (Next 14, Tailwind v3, Prisma 6) than the absolute latest —
  intentional, but means future upgrades (Tailwind v4, Prisma 7) are follow-ups.
- JWT sessions diverge from the plan's stated preference; revisit if a future
  requirement needs server-side session revocation.

**Follow-ups**

- CI/CD (GitHub Actions: lint + type-check + test), staging environment.
- Create the `course-platform-automation` repo (Playwright / k6) targeting the
  testability hooks established here.
