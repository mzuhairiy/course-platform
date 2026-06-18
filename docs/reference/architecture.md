# Architecture & Conventions

> Referensi stabil, dibaca on-demand. Aturan koding (anti-pattern) ada di `CLAUDE.md` (source of truth).

## Tech Stack & Architecture Decisions

| Layer | Choice | Reasoning |
|---|---|---|
| Framework | Next.js 14+ (App Router) | Full-stack, single repo, deploy mudah ke Vercel |
| Language | TypeScript (strict mode) | Type safety = lebih sedikit bug, lebih mudah refactor |
| Database | PostgreSQL | Relational data (course-section-lecture), mature, banyak hosted option |
| ORM | Prisma | Type-safe, mature, migration system bagus |
| Auth | Auth.js v5 (NextAuth) | Standard de facto di Next.js, support multiple provider |
| Styling | Tailwind CSS | Utility-first, pair sempurna dengan shadcn/ui |
| UI Library | shadcn/ui + custom | Copy-paste component, full control, Maven-vibe friendly |
| Forms | React Hook Form + Zod | Type-safe validation, shared schema client+server |
| File Storage | Cloudflare R2 | S3-compatible, no egress fee |
| Video | URL input (mp4 / YouTube embed) | Instructor paste link, tidak ada upload/transcoding. Mux di-drop. |
| Payment | Midtrans (Snap) | Lokal Indonesia, support QRIS/VA/CC |
| Email | Resend | Modern API, React Email template |
| Deployment | Vercel | Optimal untuk Next.js |
| DB Hosting | Neon atau Supabase (Postgres) | Serverless Postgres, free tier oke |
| CI/CD | GitHub Actions | Tetap di GitHub ecosystem |
| Issue Tracking | GitHub Issues + Projects | Lightweight team simulation |

### Architecture Pattern

- **App Router** dengan Server Components default, Client Components hanya saat butuh interactivity
- **Server Actions** untuk mutation (form submit, dll)
- **Route Handlers (`/api/`)** untuk webhook (Midtrans notification)
- **Feature-based folder organization** (bukan type-based)

### Environment Strategy

- **Local** — `.env.local`, Postgres via Docker Compose lokal
- **Preview** — auto-deploy per PR di Vercel (Preview Environment)
- **Staging** — branch `staging`, Vercel production-like environment, DB Postgres terpisah
- **Production** — branch `main`, Vercel production, DB Postgres production

### Repository Strategy

Project ini pakai **dua repo terpisah** untuk separation of concern yang bersih:

**1. Main repo (`course-platform`) — repo ini**

Berisi aplikasi + test yang *tightly coupled* dengan code aplikasi:

- ✅ **Linting** (ESLint, Prettier) — wajib, jalan di pre-commit + CI
- ✅ **Type checking** (`tsc --noEmit`) — wajib
- ✅ **Unit test** (Vitest) — test pure function, util, business logic di `server/services/`. Hidup di sini karena akses langsung ke source code dan berubah barengan sama code.
- ✅ **Component test** (opsional, Vitest + Testing Library) — kalau ada komponen kompleks yang worth di-test in-isolation.
- ✅ **Integration test** (opsional) — test Server Action / API route dengan test database.

Alasan unit/component test di sini: mereka **white-box**, butuh akses ke internal code, dan harus berubah barengan saat code berubah. Misahin mereka ke repo lain malah bikin friction.

**2. Automation repo (`course-platform-automation`) — repo TERPISAH**

Berisi test yang *black-box* dan independen dari implementasi aplikasi:

- 🎯 **E2E test** (Playwright) — test dari sudut pandang user via browser
- 🎯 **API automation** (REST testing) — test API contract dari luar
- 🎯 **Performance & load test** (k6 / JMeter) — test under load
- 🎯 **Visual regression** (opsional)
- 🎯 **Test artifacts** — test plan, risk matrix, test report, traceability matrix

Alasan dipisah: black-box test gak butuh akses source code, di-maintain dengan cycle berbeda, dan ini yang jadi *showcase utama* portfolio QA. Repo terpisah bikin portfolio lebih clean dan menonjol sebagai "QA work" yang berdiri sendiri. Automation repo nge-target running app (preview/staging URL), bukan source code.

**Kontrak antar repo:** Main repo bertanggung jawab kasih *testability hooks* — `data-testid` yang stabil, API contract yang konsisten, dan deterministic state. Automation repo bergantung pada hooks ini. Makanya anti-pattern checklist (lihat `CLAUDE.md`) wajib ditegakkan dari awal di main repo, supaya automation repo punya pijakan yang stabil.

> **Catatan untuk Fase build saat ini:** kita fokus **build aplikasi + linting + type-check + unit test** di repo ini dulu. Automation repo dibuat **nanti** setelah aplikasi stable. Tapi karena testability hooks (`data-testid`, dll) harus ada dari awal, prompt-prompt build di `docs/plan/` udah include requirement itu.


---

## Folder Structure

```
course-platform/
├── .github/
│   ├── workflows/           # GitHub Actions
│   │   ├── ci.yml           # Lint + test on PR
│   │   ├── deploy-staging.yml
│   │   └── deploy-prod.yml
│   ├── ISSUE_TEMPLATE/      # Bug report, feature request, test report template
│   └── pull_request_template.md
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts              # Seed data untuk dev + test
├── public/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (marketing)/     # Public pages: landing, about, etc
│   │   ├── (auth)/          # Sign in, sign up
│   │   ├── (student)/       # Authenticated student area
│   │   │   ├── dashboard/
│   │   │   ├── courses/
│   │   │   └── learn/[courseId]/[lectureId]/
│   │   ├── (instructor)/    # Instructor area (Fase 4)
│   │   ├── (admin)/         # Admin area (Fase 4)
│   │   ├── api/             # Route handlers (webhooks only)
│   │   │   ├── auth/[...nextauth]/
│   │   │   └── webhooks/midtrans/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/              # shadcn/ui base components
│   │   ├── shared/          # Reusable across features
│   │   └── features/        # Feature-specific components
│   │       ├── course/
│   │       ├── video-player/
│   │       ├── quiz/
│   │       └── checkout/
│   ├── lib/
│   │   ├── db.ts            # Prisma client
│   │   ├── auth.ts          # Auth.js config
│   │   ├── midtrans.ts      # Midtrans client
│   │   └── utils.ts
│   ├── server/              # Server-only logic
│   │   ├── actions/         # Server Actions
│   │   └── services/        # Business logic (callable dari actions/api)
│   ├── schemas/             # Zod schemas (shared client+server)
│   ├── types/               # TypeScript types
│   └── config/
│       ├── site.ts          # Site metadata
│       └── nav.ts           # Navigation config
├── tests/                   # Unit + component test (white-box) — TETAP di repo ini
│   ├── unit/                # Pure functions, utils, services
│   ├── components/          # Component tests (opsional)
│   └── setup.ts             # Vitest setup
│   # CATATAN: E2E, API automation, performance test ADA DI REPO TERPISAH
│   #          (course-platform-automation)
├── docs/                    # Documentation
│   ├── adr/                 # Architecture Decision Records
│   ├── test-strategy.md
│   └── risk-matrix.md
├── .env.example
├── .gitignore
├── docker-compose.yml       # Local Postgres
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Naming Conventions

- Files: `kebab-case.ts` untuk utilities, `PascalCase.tsx` untuk components
- Components: `PascalCase`
- Functions: `camelCase`
- Database tables (Prisma model): `PascalCase` singular (`Course`, `Enrollment`)
- Database columns: `camelCase`
- Server Actions: prefix `action` (e.g., `enrollCourse`, `submitQuiz`)
- API routes: kebab-case URL

