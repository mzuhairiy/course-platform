 # Online Course Platform — Project Plan

> Dokumen ini adalah master plan untuk rebuild project course platform dari awal.
> Bagian 1–7 di-paste sebagai **Project Knowledge** di Claude Projects.
> Bagian 8 (Build Prompts) di-paste **satu per satu** ke chat di dalam Project.

---

## 1. Project Brief

### Konteks

Project ini adalah online course platform (self-paced) yang dibangun sebagai **portfolio QA**. Aplikasi bukan tujuan akhir — aplikasi adalah *system under test* untuk demonstrasi skill QA: test automation, performance testing, load testing, risk-based testing, CI/CD integration, dan shift-left practices.

### Positioning

**"Build with startup velocity, document with enterprise rigor."**

Tooling dan workflow mimic startup (CI/CD cepat, feature flag, observability), tapi disertai artefak yang biasanya muncul di enterprise (test strategy doc, risk matrix, traceability matrix). Cover dua sisi target audience portfolio.

### Showcase Features (testing depth)

3 fitur ini akan jadi *showcase* utama untuk portfolio. Lebar di scope, tapi *dalam* di 3 fitur ini:

1. **Checkout & Payment** — E2E automation, contract testing, security testing, data integrity
2. **Video Player & Progress Tracking** — performance, cross-browser, network throttling, exploratory
3. **Quiz Engine** — boundary testing, state machine testing, timing/race condition

### Success Criteria

- Aplikasi punya flow user yang konsisten dan production-ready feel
- Backend stabil (consistent API contract, proper error handling, validation)
- Bisa dijalanin di environment staging + production
- Siap di-attach test suite (automation hooks, test IDs, deterministic state)

---

## 2. Tech Stack & Architecture Decisions

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
| Video | Mux | Handle transcoding + HLS streaming + analytics |
| Payment | Midtrans (Snap) | Lokal Indonesia, support QRIS/VA/CC |
| Email | Resend | Modern API, React Email template |
| Deployment | Vercel | Optimal untuk Next.js |
| DB Hosting | Neon atau Supabase (Postgres) | Serverless Postgres, free tier oke |
| CI/CD | GitHub Actions | Tetap di GitHub ecosystem |
| Issue Tracking | GitHub Issues + Projects | Lightweight team simulation |

### Architecture Pattern

- **App Router** dengan Server Components default, Client Components hanya saat butuh interactivity
- **Server Actions** untuk mutation (form submit, dll)
- **Route Handlers (`/api/`)** untuk webhook (Midtrans notification, Mux webhook)
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

**Kontrak antar repo:** Main repo bertanggung jawab kasih *testability hooks* — `data-testid` yang stabil, API contract yang konsisten, dan deterministic state. Automation repo bergantung pada hooks ini. Makanya anti-pattern checklist (section 7) wajib ditegakkan dari awal di main repo, supaya automation repo punya pijakan yang stabil.

> **Catatan untuk Fase build saat ini:** kita fokus **build aplikasi + linting + type-check + unit test** di repo ini dulu. Automation repo dibuat **nanti** setelah aplikasi stable. Tapi karena testability hooks (`data-testid`, dll) harus ada dari awal, prompt-prompt build di section 8 udah include requirement itu.

---

## 3. Folder Structure

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
│   │   │   ├── webhooks/midtrans/
│   │   │   └── webhooks/mux/
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
│   │   ├── mux.ts           # Mux client
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

---

## 4. Database Schema (Prisma)

Schema ini cover **Fase 1–3** (auth, course, enrollment, video, quiz, payment, certificate). Fase 4–5 di-extend nanti.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==========================================
// AUTH (Auth.js v5 compatible)
// ==========================================

enum UserRole {
  STUDENT
  INSTRUCTOR
  ADMIN
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  role          UserRole  @default(STUDENT)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts        Account[]
  sessions        Session[]
  enrollments     Enrollment[]
  progress        LectureProgress[]
  quizAttempts    QuizAttempt[]
  transactions    Transaction[]
  certificates    Certificate[]
  authoredCourses Course[]  @relation("CourseInstructor")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ==========================================
// COURSE
// ==========================================

enum CourseStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum CourseLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  courses     Course[]
}

model Course {
  id            String       @id @default(cuid())
  slug          String       @unique
  title         String
  subtitle      String?
  description   String       @db.Text
  thumbnailUrl  String?
  level         CourseLevel  @default(BEGINNER)
  language      String       @default("id")
  price         Int          @default(0)        // dalam Rupiah, 0 = free
  status        CourseStatus @default(DRAFT)
  publishedAt   DateTime?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  categoryId   String?
  category     Category? @relation(fields: [categoryId], references: [id])

  instructorId String
  instructor   User    @relation("CourseInstructor", fields: [instructorId], references: [id])

  sections     Section[]
  enrollments  Enrollment[]
  transactions Transaction[]
  certificates Certificate[]
}

model Section {
  id        String   @id @default(cuid())
  courseId  String
  title     String
  order     Int
  createdAt DateTime @default(now())

  course   Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lectures Lecture[]

  @@index([courseId])
}

enum LectureType {
  VIDEO
  READING
  QUIZ
}

model Lecture {
  id        String      @id @default(cuid())
  sectionId String
  title     String
  type      LectureType
  order     Int
  durationSeconds Int?  // untuk video
  contentMd       String? @db.Text  // untuk reading
  videoAssetId    String? // Mux asset ID
  videoPlaybackId String? // Mux playback ID
  createdAt DateTime    @default(now())

  section  Section          @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  progress LectureProgress[]
  quiz     Quiz?

  @@index([sectionId])
}

// ==========================================
// ENROLLMENT & PROGRESS
// ==========================================

model Enrollment {
  id         String   @id @default(cuid())
  userId     String
  courseId   String
  enrolledAt DateTime @default(now())
  completedAt DateTime?

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseId])
  @@index([userId])
  @@index([courseId])
}

model LectureProgress {
  id            String   @id @default(cuid())
  userId        String
  lectureId     String
  watchedSeconds Int     @default(0)
  isCompleted   Boolean  @default(false)
  completedAt   DateTime?
  updatedAt     DateTime @updatedAt

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  lecture Lecture @relation(fields: [lectureId], references: [id], onDelete: Cascade)

  @@unique([userId, lectureId])
  @@index([userId])
}

// ==========================================
// QUIZ
// ==========================================

enum QuestionType {
  MULTIPLE_CHOICE
  TRUE_FALSE
}

model Quiz {
  id           String   @id @default(cuid())
  lectureId    String   @unique
  title        String
  description  String?
  passingScore Int      @default(70)  // percentage
  timeLimit    Int?     // dalam detik, null = unlimited

  lecture   Lecture        @relation(fields: [lectureId], references: [id], onDelete: Cascade)
  questions QuizQuestion[]
  attempts  QuizAttempt[]
}

model QuizQuestion {
  id          String       @id @default(cuid())
  quizId      String
  type        QuestionType
  question    String       @db.Text
  options     Json         // [{id, text}]
  correctAnswerIds String[]
  explanation String?      @db.Text
  order       Int

  quiz Quiz @relation(fields: [quizId], references: [id], onDelete: Cascade)
}

model QuizAttempt {
  id          String   @id @default(cuid())
  userId      String
  quizId      String
  score       Int      // percentage
  passed      Boolean
  answers     Json     // [{questionId, selectedIds}]
  startedAt   DateTime @default(now())
  submittedAt DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  quiz Quiz @relation(fields: [quizId], references: [id], onDelete: Cascade)

  @@index([userId])
}

// ==========================================
// PAYMENT
// ==========================================

enum TransactionStatus {
  PENDING
  SUCCESS
  FAILED
  EXPIRED
  CANCELLED
  REFUNDED
}

model Transaction {
  id              String            @id @default(cuid())
  userId          String
  courseId        String
  orderId         String            @unique  // ID yang dikirim ke Midtrans
  amount          Int
  status          TransactionStatus @default(PENDING)
  paymentMethod   String?
  midtransToken   String?           // Snap token
  midtransResponse Json?            // Raw response untuk debugging
  paidAt          DateTime?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  user   User   @relation(fields: [userId], references: [id])
  course Course @relation(fields: [courseId], references: [id])

  @@index([userId])
  @@index([status])
}

// ==========================================
// CERTIFICATE
// ==========================================

model Certificate {
  id           String   @id @default(cuid())
  userId       String
  courseId     String
  certificateNumber String @unique  // format: CERT-YYYY-XXXXX
  issuedAt     DateTime @default(now())
  pdfUrl       String?

  user   User   @relation(fields: [userId], references: [id])
  course Course @relation(fields: [courseId], references: [id])

  @@unique([userId, courseId])
}
```

---

## 5. Design System Spec

Inspired by Maven.com — clean, minimalis, edukatif-friendly. Premium tanpa flashy.

### Colors

```ts
// tailwind.config.ts — extend
{
  colors: {
    // Base
    background: "hsl(0 0% 100%)",       // white
    foreground: "hsl(220 13% 13%)",     // near-black

    // Surface
    surface: "hsl(40 20% 97%)",         // soft cream
    "surface-muted": "hsl(220 14% 96%)",

    // Border
    border: "hsl(220 13% 91%)",
    "border-strong": "hsl(220 13% 80%)",

    // Text
    "text-muted": "hsl(220 9% 46%)",
    "text-subtle": "hsl(220 9% 60%)",

    // Accent (sparingly used)
    accent: "hsl(15 80% 50%)",          // warm orange (Maven-like)
    "accent-hover": "hsl(15 80% 45%)",

    // Semantic
    success: "hsl(142 76% 36%)",
    warning: "hsl(38 92% 50%)",
    danger: "hsl(0 84% 60%)",
  }
}
```

### Typography

- **Heading**: Inter (font-weight 600–700), atau Söhne kalau ada budget. Tracking tight.
- **Body**: Inter (font-weight 400–500), generous line-height (1.6–1.7)
- **Mono** (untuk code): JetBrains Mono atau Geist Mono

Scale:
- `text-xs` 12px — micro labels
- `text-sm` 14px — secondary info
- `text-base` 16px — body
- `text-lg` 18px — emphasized body
- `text-xl` 20px — small heading
- `text-2xl` 24px — section heading
- `text-3xl` 30px — page heading
- `text-4xl` 36px — hero secondary
- `text-5xl` 48px — hero primary
- `text-6xl` 60px+ — display

### Spacing

Generous. Card padding minimum 24px. Section vertical padding minimum 64px desktop, 48px mobile.

### Components Style Guide

- **Buttons**: rounded-md (6px), no gradient, subtle shadow on primary
- **Cards**: white background, border (1px solid border), no shadow OR very subtle (shadow-sm). Hover: border-strong + slight lift
- **Inputs**: border, focus ring accent color, generous padding (px-3 py-2.5)
- **Hover states**: subtle, gak heboh
- **Animation**: minimal, only for purposeful transitions (modal, dropdown). No decoration animation.

### Layout

- Max container width: `max-w-7xl` (1280px) untuk full content, `max-w-3xl` untuk reading content
- Grid gaps: 24px minimum
- Mobile-first responsive

---

## 6. Phase Roadmap

### Fase 1 — MVP (Auth + Browse + Free Enrollment) 🎯 *START HERE*

- Project setup, Prisma, Auth.js
- Design system foundation
- Landing page
- Course listing + filtering
- Course detail page
- Free enrollment flow
- Basic video player (no progress tracking yet)
- Student dashboard (enrolled courses)

**Definition of Done:** User bisa register → browse → enroll free course → watch video. End-to-end works.

### Fase 2 — Monetization (Checkout + Payment)

- Midtrans Snap integration
- Checkout page
- Order management
- Webhook handling (payment notification)
- Transaction history
- Paid enrollment flow

**Definition of Done:** User bisa beli course pake Midtrans (sandbox), payment success → otomatis enrolled.

### Fase 3 — Learning Experience (Progress + Quiz + Certificate)

- Lecture progress tracking (video watched %, mark complete)
- Quiz engine (multiple choice + true/false)
- Quiz attempt + scoring
- Course completion logic
- Certificate generation (PDF)
- Certificate verification page

**Definition of Done:** User bisa nonton sampai habis, ngerjain quiz, dapat certificate yang verifiable.

### Fase 4 — Creator Side (Instructor + Admin)

- Instructor dashboard
- Course creation flow
- Video upload (ke Mux)
- Quiz builder
- Course analytics
- Admin moderation panel
- RBAC enforcement

### Fase 5 — Polish (Search + Social + Notification)

- Search & filter
- Review & rating
- Email notification (Resend)
- Recommendation
- SEO optimization

---

## 7. Anti-Pattern Checklist

Untuk agent yang ngebantu coding di Projects. **Tunjukin ini ke agent setiap sesi awal.**

### Code Hygiene

- ❌ JANGAN bikin file > 300 lines. Split jadi sub-components/utilities.
- ❌ JANGAN duplicate component yang udah ada. Cek `src/components/` dulu.
- ❌ JANGAN inline magic number/string. Pake config atau constant.
- ❌ JANGAN skip error handling. Setiap async operation harus handle error.
- ❌ JANGAN pake `any` di TypeScript kecuali sangat terjustifikasi (kasih comment).
- ❌ JANGAN bikin Server Action atau API route tanpa input validation (Zod).

### Architecture

- ❌ JANGAN akses Prisma client langsung dari component. Selalu lewat `server/services/`.
- ❌ JANGAN mix Server Component sama Client Component di file yang sama. Pisahin.
- ❌ JANGAN pake `use client` di komponen yang gak butuh interactivity.
- ❌ JANGAN bikin endpoint API yang return data sensitif tanpa auth check.

### Database

- ❌ JANGAN ubah schema tanpa bikin migration.
- ❌ JANGAN delete migration yang udah di-commit.
- ❌ JANGAN bikin N+1 query. Pake `include` atau `select` yang tepat.
- ❌ JANGAN simpan secret/credential di database tanpa enkripsi.

### Testing-Friendliness (penting karena ini untuk QA portfolio)

- ✅ Setiap interactive element punya `data-testid` yang stabil dan descriptive.
- ✅ Form input punya `name` attribute yang konsisten.
- ✅ Error message visible di DOM (jangan cuma toast yang ilang).
- ✅ Loading state explicit (skeleton/spinner dengan `data-testid="loading"`).
- ✅ URL state untuk filter/search (biar bisa di-deep-link dan di-test).
- ✅ Deterministic state — hindari random/time-based behavior di UI tanpa cara mengontrolnya.

### Security

- ❌ JANGAN trust user input. Validasi di server side, selalu.
- ❌ JANGAN expose internal ID kalau gak perlu. Pake slug untuk public URL.
- ❌ JANGAN log sensitive data (password, token, payment detail).

---

## 8. Build Sequence — Fase 1 MVP Prompts

> Paste **satu per satu** ke chat di dalam Claude Project.
> Tunggu setiap step selesai dan lo verify dulu, baru lanjut ke prompt berikut.

---

### Prompt 1 — Initialize Project

```
Initialize Next.js project dengan setup berikut:

1. Buat Next.js 14+ project dengan App Router, TypeScript (strict mode), Tailwind CSS, ESLint
2. Install dependencies utama:
   - Prisma + @prisma/client
   - next-auth@beta (Auth.js v5)
   - @auth/prisma-adapter
   - zod
   - react-hook-form @hookform/resolvers
   - lucide-react
   - clsx tailwind-merge class-variance-authority
3. Setup shadcn/ui (init dengan style "default", base color "slate")
4. Install shadcn components dasar: button, input, label, card, dialog, dropdown-menu, avatar, badge, separator, skeleton, toast, sonner
5. Setup tooling code quality di repo ini:
   - Prettier + konfigurasi (.prettierrc) + integrasi sama ESLint
   - Vitest untuk unit test + 1 contoh test trivial di tests/unit/ untuk verify setup jalan
   - Script package.json: "lint", "type-check" (tsc --noEmit), "test" (vitest run), "test:watch"
   - (Pre-commit hook husky + lint-staged OPSIONAL, boleh skip dulu)
6. Buat folder structure sesuai PROJECT_PLAN section 3
   - PENTING: folder tests/ di repo ini HANYA untuk unit + component test (white-box).
     E2E, API automation, dan performance test akan ada di REPO TERPISAH
     (course-platform-automation). Jangan setup Playwright/k6 di repo ini.
7. Buat `.env.example` dengan placeholder semua env var yang dibutuhkan
8. Buat `docker-compose.yml` untuk local Postgres
9. Buat README.md dengan setup instructions

Setelah selesai, kasih gue daftar file yang dibuat dan command untuk verify setup-nya jalan
(termasuk: npm run lint, npm run type-check, npm run test harus pass).
```

---

### Prompt 2 — Database Schema & Prisma Setup

```
Setup database layer:

1. Setup Prisma dengan PostgreSQL provider
2. Copy schema dari PROJECT_PLAN section 4 ke `prisma/schema.prisma`
3. Buat `src/lib/db.ts` — Prisma client singleton (dengan logging di development)
4. Buat migration awal (`npx prisma migrate dev --name init`)
5. Buat `prisma/seed.ts` dengan data:
   - 1 user instructor (email: instructor@example.com)
   - 1 user student (email: student@example.com)
   - 3 categories (Programming, Design, Business)
   - 2 published courses (1 free, 1 paid) dengan masing-masing 2 sections dan 3 lectures
   - 1 course dalam status DRAFT
6. Setup `package.json` script: `"db:seed": "tsx prisma/seed.ts"`
7. Run seed dan verify data masuk

Acceptance criteria:
- `npx prisma studio` bisa dibuka dan data seed keliatan
- Schema lewat `npx prisma validate` tanpa error
```

---

### Prompt 3 — Auth.js v5 Setup

```
Setup authentication dengan Auth.js v5:

1. Buat `src/lib/auth.ts` dengan config Auth.js v5:
   - Prisma adapter
   - Providers: Credentials (email + password untuk simplicity Fase 1) dan Google OAuth (optional)
   - Session strategy: database (lebih mudah di-test)
   - Pages: signIn `/sign-in`, signUp `/sign-up`
2. Buat `src/app/api/auth/[...nextauth]/route.ts`
3. Buat middleware `src/middleware.ts` untuk protect route `/dashboard`, `/learn`, `/instructor`, `/admin`
4. Tambahin field `password` (hashed) ke User model di schema Prisma — buat migration
5. Buat Server Actions di `src/server/actions/auth.ts`:
   - `signUpAction(input)` — register user baru (hash password pake bcrypt)
   - `signInAction(input)` — login
   - Validation pake Zod schema di `src/schemas/auth.ts`
6. Buat page UI:
   - `src/app/(auth)/sign-in/page.tsx`
   - `src/app/(auth)/sign-up/page.tsx`
   - Pake shadcn Card + Form components, Maven-style minimalis
7. Buat helper `getCurrentUser()` di `src/lib/auth.ts` untuk Server Components

Acceptance criteria:
- User bisa register dengan email + password
- User bisa login dan dialihin ke `/dashboard`
- Middleware redirect unauthenticated user ke `/sign-in`
- Setiap form punya `data-testid` yang descriptive
```

---

### Prompt 4 — Design System Foundation

```
Setup design system foundation berdasarkan PROJECT_PLAN section 5:

1. Update `tailwind.config.ts` dengan custom colors (sesuai section 5)
2. Update `src/app/globals.css` dengan CSS variables untuk theme (light mode dulu, dark mode nanti)
3. Setup font Inter via next/font
4. Buat `src/components/ui/typography.tsx` — komponen Heading, Text dengan variant
5. Buat `src/components/shared/container.tsx` — wrapper dengan max-width consistent
6. Buat `src/components/shared/section.tsx` — wrapper untuk section dengan padding consistent
7. Buat `src/config/site.ts` — site metadata (name, description, links)
8. Update `src/app/layout.tsx` dengan font + theme

Acceptance criteria:
- Heading, Text component bisa dipake dengan variant berbeda
- Spacing consistent
- Bisa render satu showcase page (`/style-guide`) yang demoin semua typography + component shadcn yang udah diinstall
```

---

### Prompt 5 — Layout & Navigation

```
Build layout structure dan navigation:

1. Buat `src/components/shared/navbar.tsx`:
   - Logo kiri, nav links tengah, auth buttons kanan
   - Mobile: hamburger menu
   - Style Maven-like: clean, white background, subtle border bottom
   - Items: "Courses", "Categories" (dropdown), "About"
2. Buat `src/components/shared/footer.tsx`:
   - 4 column: Brand, Learn, Company, Legal
   - Copyright + social links
3. Buat `src/app/(marketing)/layout.tsx` dengan Navbar + Footer
4. Buat `src/app/(student)/layout.tsx` dengan Navbar variant (untuk authenticated user, ada avatar dropdown)
5. Avatar dropdown items: Dashboard, My Courses, Settings, Sign Out

Acceptance criteria:
- Navbar responsive (mobile + desktop)
- Sign-out berfungsi
- Avatar dropdown muncul kalau user login
- `data-testid` ada di setiap nav link dan auth button
```

---

### Prompt 6 — Landing Page

```
Build landing page (`/`):

Sections (dari atas ke bawah):
1. Hero — heading besar (text-5xl–6xl), subheading, 2 CTA button (primary "Browse Courses", secondary "How it works"). No image hero, full typography (Maven-style).
2. Categories — grid 4 column (desktop), 2 column (mobile). Tiap card: icon + nama kategori + jumlah courses.
3. Featured Courses — grid 3 column course cards.
4. Value Props — 3 column dengan icon + heading + 1-2 sentence per kolom (kenapa platform ini).
5. Instructor Spotlight — 1-2 instructor card dengan foto + nama + credibility.
6. CTA Section — final CTA dengan heading + button.

Components yang dibuat:
- `src/components/features/course/course-card.tsx`
- `src/components/features/category/category-card.tsx`
- `src/components/features/instructor/instructor-card.tsx`

Data sumber: dari database (sudah ada dari seed). Pake Server Component buat fetch.

Acceptance criteria:
- Landing page render dengan data real dari database
- Responsive (mobile, tablet, desktop)
- Course card link ke `/courses/[slug]`
- Setiap section punya `data-testid` (e.g., `data-testid="hero-section"`, `data-testid="course-card"`)
```

---

### Prompt 7 — Course Listing Page

```
Build course listing page (`/courses`):

1. Page header: "Browse Courses" + subtitle + count
2. Sidebar filter (left, desktop) / drawer (mobile):
   - Category (checkbox)
   - Level (BEGINNER / INTERMEDIATE / ADVANCED)
   - Price (Free / Paid)
3. Sort dropdown (top right): Newest, Most Popular (placeholder), Price Low-High, Price High-Low
4. Grid courses (3 column desktop, 2 tablet, 1 mobile)
5. URL state — filter dan sort harus reflect di URL query string (untuk testability + deep-link)
6. Pagination atau infinite scroll (pilih pagination dulu, lebih simple buat testing)

Components:
- `src/components/features/course/course-filter-sidebar.tsx`
- `src/components/features/course/course-sort-dropdown.tsx`
- `src/components/features/course/course-grid.tsx`

Implementation notes:
- Pake searchParams di Server Component, fetch ulang saat filter berubah
- Loading state pake Suspense + skeleton
- Empty state kalau no result

Acceptance criteria:
- Filter combination works (multi-category + level + price)
- URL berubah saat filter diubah
- Refresh page tetep apply filter dari URL
- Pagination consistent
- `data-testid` pada filter inputs, sort dropdown, course grid, pagination
```

---

### Prompt 8 — Course Detail Page

```
Build course detail page (`/courses/[slug]`):

Sections:
1. Hero — course title, subtitle, instructor info, level badge, language. Background subtle.
2. Two-column layout (desktop):
   - Left (main): Description, "What you'll learn" (bullets), Curriculum (accordion per section + lectures), Instructor bio, Reviews (placeholder Fase 5)
   - Right (sticky card): Thumbnail, price (atau "Free"), Enroll button, course meta (total lectures, duration, level, last updated)
3. Mobile: single column, sticky button bottom

Behavior:
- Kalau course free dan user belum enrolled: button "Enroll for Free" → trigger enrollment action
- Kalau course paid dan user belum enrolled: button "Buy for Rp XXX,XXX" → akan ke checkout (Fase 2 — sekarang placeholder)
- Kalau user udah enrolled: button "Continue Learning" → ke `/learn/[courseId]/[firstLectureId]`
- Kalau user belum login: button "Sign in to enroll" → redirect ke `/sign-in?callbackUrl=...`

Server Action:
- `src/server/actions/enrollment.ts` — `enrollFreeCourseAction(courseId)`
- Validation: user authenticated, course exists, course free, user belum enrolled
- Pada success: create Enrollment record, redirect ke `/learn/[courseId]/[firstLectureId]`

Acceptance criteria:
- Page render dengan data lengkap dari database
- Curriculum accordion bisa expand/collapse
- Enrollment free berfungsi end-to-end
- Sticky enrollment card di desktop
- Edge cases: course tidak exist (404), course archived (404), already enrolled (button beda)
- `data-testid` pada enroll button, curriculum items, sticky card
```

---

### Prompt 9 — Basic Video Player & Learn Page

```
Build learn page (`/learn/[courseId]/[lectureId]`):

Layout:
- Two-column desktop:
  - Left sidebar (sticky): Course title, accordion section + lectures, indikator lecture aktif
  - Right (main): Video player atau content (kalau reading lecture)
- Mobile: tab switcher antara "Player" dan "Curriculum"

Video Player:
- Pake plain HTML5 video element dulu untuk Fase 1 (Mux integration di Fase 4 saat instructor upload)
- Untuk dev/seed: pake dummy video URL (sample mp4 publik)
- Controls: play/pause, seek bar, volume, fullscreen, playback speed
- Title bar di atas video: lecture title

Navigation:
- Tombol "Previous" / "Next Lecture" di bawah player
- Klik lecture di sidebar = navigate ke lecture itu

Access Control:
- Middleware/page-level check: user harus enrolled di course ini, kalau tidak redirect ke course detail
- Kalau lecture type READING: render markdown content (pake `react-markdown` atau library serupa)
- Kalau lecture type QUIZ: render placeholder "Quiz akan tersedia di Fase 3"

Acceptance criteria:
- Video player works (play, pause, seek, fullscreen)
- Sidebar nav berfungsi
- Previous/Next navigate dengan benar (handle edge case: lecture pertama gak ada previous, terakhir gak ada next)
- Non-enrolled user kena redirect
- `data-testid` pada video element, controls, sidebar lecture items, prev/next buttons
- NOTE: untuk Fase 1, belum tracking progress (itu Fase 3)
```

---

### Prompt 10 — Student Dashboard & Polish Fase 1

```
Final piece untuk Fase 1 MVP:

1. Build student dashboard (`/dashboard`):
   - Welcome message dengan nama user
   - Section "Continue Learning" — list enrolled courses (max 3) dengan progress placeholder + continue button
   - Section "Browse More" — link ke `/courses`
   - Stats kecil: total enrolled, total completed (kosong dulu)

2. Buat page `/my-courses` — list semua enrolled courses

3. Polish:
   - Add proper metadata (title, description) untuk semua page (pake Next.js Metadata API)
   - Add favicon dan OG image placeholder
   - Loading state untuk semua dynamic content (skeleton)
   - 404 page yang on-brand
   - Error boundary di route level

4. Documentation:
   - Update README.md dengan:
     - Project description (course platform untuk QA portfolio)
     - Tech stack
     - Setup instructions (clone, install, env, db, dev)
     - Folder structure overview
     - Available scripts

5. Buat ADR pertama di `docs/adr/0001-tech-stack.md`:
   - Document tech stack decisions dari section 2 PROJECT_PLAN
   - Format: Context, Decision, Consequences

6. Tulis unit test (Vitest) untuk business logic yang udah dibuat di Fase 1:
   - Validation schema (Zod) di src/schemas/
   - Service functions di src/server/services/ yang punya logic (misal cek eligibility enrollment)
   - Util functions
   - Target: cover happy path + minimal 1-2 edge case per function
   - INGAT: cuma unit test (white-box) di repo ini. E2E nanti di repo automation terpisah.

Acceptance criteria Fase 1 secara keseluruhan:
- ✅ User bisa register → login → browse courses → enroll free course → watch video
- ✅ Semua page responsive
- ✅ Tidak ada broken link atau placeholder yang gak intentional
- ✅ Database stabil, schema consistent
- ✅ Code quality: no `any`, no unused imports, lint clean
- ✅ `data-testid` ada di semua interactive element
```

---

## 8B. Build Sequence — Fase 2 Checkout & Midtrans Prompts

> Prasyarat: Fase 1 selesai dan stable. Pakai **Midtrans Sandbox** dulu (production nanti).
> Paste satu per satu, sama disiplinnya kayak Fase 1.

---

### Prompt 11 — Midtrans Client Setup

```
Setup Midtrans integration layer (Snap):

1. Install `midtrans-client` (official Node.js library)
2. Buat `src/lib/midtrans.ts`:
   - Snap client singleton, baca dari env: MIDTRANS_SERVER_KEY, NEXT_PUBLIC_MIDTRANS_CLIENT_KEY, MIDTRANS_IS_PRODUCTION (default false)
   - Helper `createSnapTransaction(params)` — wrap snap.createTransaction
   - Helper `verifySignature(orderId, statusCode, grossAmount, signatureKey)` — SHA512(order_id + status_code + gross_amount + ServerKey), return boolean
3. Update `.env.example` dengan 3 env var di atas + comment cara dapetin dari Midtrans Dashboard (sandbox)
4. Buat `src/server/services/transaction.ts` (skeleton dulu):
   - `generateOrderId()` — format: `ORD-{timestamp}-{random6}` (unique, traceable)
   - Type definitions untuk Midtrans notification payload
5. Tulis unit test untuk `verifySignature` (happy path + signature salah + amount dimanipulasi) dan `generateOrderId` (uniqueness, format)

Acceptance criteria:
- Unit test hijau
- Tidak ada server key yang bocor ke client bundle (cek: hanya NEXT_PUBLIC_MIDTRANS_CLIENT_KEY yang boleh diakses client)
```

---

### Prompt 12 — Checkout Flow (Create Transaction + Snap Popup)

```
Build checkout flow untuk paid course:

1. Server Action `src/server/actions/checkout.ts` — `createCheckoutAction(courseId)`:
   - Validasi: user authenticated, course exists & PUBLISHED, course berbayar (price > 0), user BELUM enrolled, tidak ada transaksi PENDING aktif untuk user+course yang sama (kalau ada, reuse Snap token-nya)
   - Create Transaction record (status PENDING) dengan orderId dari generateOrderId()
   - Call createSnapTransaction dengan: order_id, gross_amount = course.price, customer_details (nama+email user), item_details (course title)
   - Simpan midtransToken ke Transaction record
   - Return { token }
2. Buat checkout page `/checkout/[courseId]`:
   - Order summary: course thumbnail, title, instructor, price breakdown
   - Button "Pay Now" → call action → load Snap.js popup pakai token
   - Snap.js script dari sandbox URL (https://app.sandbox.midtrans.com/snap/snap.js) dengan data-client-key
   - Callback Snap: onSuccess/onPending → redirect ke `/checkout/status?order_id=...`, onError → tampilkan error, onClose → tetap di halaman (transaksi masih PENDING, bisa dilanjut)
3. Update tombol "Buy" di course detail page (placeholder Fase 1) → link ke `/checkout/[courseId]`
4. Edge case yang harus dihandle:
   - User udah enrolled → redirect ke learn page
   - Course free → redirect ke course detail (free pakai enroll flow biasa)
   - Course DRAFT/ARCHIVED → 404

Acceptance criteria:
- Sandbox payment popup muncul dan bisa simulasi bayar (kartu test Midtrans)
- Transaksi PENDING ke-create di DB sebelum popup muncul
- Klik "Pay Now" dua kali tidak bikin dua transaksi (reuse PENDING)
- `data-testid` pada order summary, pay button, error message
```

---

### Prompt 13 — Webhook Handler (Payment Notification)

```
Build webhook handler Midtrans — INI BAGIAN PALING KRITIS, kerjakan hati-hati:

1. Route handler `src/app/api/webhooks/midtrans/route.ts` (POST):
   - Parse notification body
   - WAJIB verify signature_key pakai verifySignature() — kalau invalid, return 403 dan log warning (tanpa log isi payload sensitif)
   - Lookup Transaction by order_id — kalau gak ketemu, return 404
   - VERIFIKASI gross_amount dari notification == Transaction.amount di DB (cegah manipulasi)
   - Map transaction_status Midtrans → TransactionStatus internal:
     - capture (fraud_status accept) / settlement → SUCCESS
     - pending → PENDING
     - deny / cancel → CANCELLED
     - expire → EXPIRED
     - refund / partial_refund → REFUNDED
   - IDEMPOTENT: kalau Transaction sudah SUCCESS, abaikan notifikasi apapun setelahnya (return 200, no-op). Webhook Midtrans bisa dikirim lebih dari sekali.
   - Pada transisi ke SUCCESS: dalam SATU database transaction (prisma.$transaction):
     a. Update Transaction (status, paidAt, paymentMethod, midtransResponse)
     b. Create Enrollment (skipDuplicates / upsert — user mungkin udah enrolled lewat race)
   - Selalu return 200 untuk notifikasi yang valid (biar Midtrans gak retry terus)
2. Logic update + enrollment taruh di `src/server/services/transaction.ts` → `processPaymentNotification(payload)` — biar bisa di-unit-test tanpa HTTP layer
3. Unit test untuk processPaymentNotification:
   - settlement → SUCCESS + enrollment created
   - notifikasi duplikat → idempotent (enrollment tidak dobel)
   - signature invalid → rejected
   - gross_amount tidak match → rejected + status tidak berubah
   - expire setelah SUCCESS → diabaikan (out-of-order notification)
4. Dokumentasi singkat di docs/: cara test webhook lokal (ngrok / Midtrans simulator) + URL yang diset di Midtrans Dashboard

Acceptance criteria:
- Semua unit test hijau
- Simulasi bayar sandbox → webhook masuk → Transaction SUCCESS → Enrollment ke-create otomatis
- Replay notifikasi yang sama dua kali → tidak ada efek samping kedua
```

---

### Prompt 14 — Post-Payment UX (Status Page + Guard)

```
Build post-payment experience:

1. Page `/checkout/status?order_id=...`:
   - Fetch Transaction by orderId (HANYA milik user yang login — jangan bocorin transaksi orang lain)
   - Status SUCCESS → tampilan sukses + button "Start Learning" ke learn page
   - Status PENDING → tampilan menunggu + instruksi (misal VA number kalau ada) + auto-refresh/polling tiap 5 detik (max ~2 menit) karena webhook mungkin belum masuk
   - Status FAILED/EXPIRED/CANCELLED → tampilan gagal + button "Try Again" ke checkout
2. PENTING - jangan trust redirect: status di page ini HARUS dari DB (yang diupdate webhook), BUKAN dari query param redirect Midtrans. Redirect bisa dimanipulasi user.
3. Race condition: user bisa nyampe status page sebelum webhook masuk. Itulah kenapa ada polling. Kasih state "Confirming your payment..." selama PENDING.
4. Guard di learn page: pastikan akses tetap dicek via Enrollment (sudah ada dari Fase 1) — bukan via Transaction.

Acceptance criteria:
- Bayar sukses di sandbox → status page berubah SUCCESS tanpa manual refresh (via polling)
- Akses /checkout/status dengan order_id milik user lain → tidak bocor (404/403)
- Mengubah query param tidak bisa memalsukan status sukses
- `data-testid` pada status indicator, CTA buttons
```

---

### Prompt 15 — Transaction History + Fase 2 Polish

```
Final piece Fase 2:

1. Page `/transactions` (student area):
   - Table/list: tanggal, course, order ID, amount (format Rupiah), status (badge berwarna per status), payment method
   - Empty state
   - Link dari avatar dropdown: "Purchase History"
2. Tombol "Continue Payment" untuk transaksi PENDING (reuse Snap token kalau masih valid, atau create ulang)
3. Format Rupiah helper di src/lib/utils.ts (e.g., formatRupiah(150000) → "Rp 150.000") + unit test
4. Polish & hardening:
   - Course detail: kalau user punya transaksi PENDING untuk course itu, tampilkan banner "Selesaikan pembayaran" dengan link
   - Handle Midtrans Snap token expired (default 24 jam) → create transaksi baru
   - Metadata semua page baru
   - Loading & error state
5. Update README: section Payment (sandbox setup, test cards, webhook setup lokal)
6. Update docs/adr/: ADR baru `0002-payment-midtrans.md` (kenapa Midtrans Snap, kenapa webhook-driven enrollment, idempotency strategy)

Acceptance criteria Fase 2 keseluruhan:
- ✅ Full flow: browse paid course → checkout → bayar sandbox → otomatis enrolled → bisa nonton
- ✅ Webhook idempotent + signature verified + amount verified
- ✅ Status page tidak bisa dipalsukan via query param
- ✅ Transaksi PENDING bisa dilanjutkan, tidak dobel
- ✅ Unit test untuk semua logic transaction hijau
- ✅ lint + type-check + test + build hijau
```

---

## 8C. Content Seeding — Komplitin Konten (boleh dikerjakan sebelum Fase 2)

> Tujuan: bikin platform keliatan "hidup" dan production-ready dengan konten fiktif tapi believable.
> Konten masuk via seed script (belum ada instructor UI — itu Fase 4).
> Data yang kaya ini juga penting buat fase testing nanti (filter combination, pagination, search butuh variasi data).

---

### Prompt 16 — Rich Content Seed

```
Rombak `prisma/seed.ts` jadi content seed yang kaya dan believable. Seed HARUS idempotent
(bisa di-run berulang tanpa duplikat — pakai upsert by slug/email, atau reset table dulu).

1. CATEGORIES — 5 kategori:
   - Programming, Design, Business, Data & Analytics, Personal Development
   - Masing-masing dengan description singkat

2. INSTRUCTORS — 4 user instructor fiktif:
   - Nama Indonesia yang believable, email @example.com, bio 2-3 kalimat (expertise jelas)
   - Avatar: pakai https://i.pravatar.cc/150?u={email} (deterministic per email)

3. COURSES — 12 course tersebar di 5 kategori, dengan variasi:
   - Mix harga: 4 free, 8 paid (range Rp 99.000 – Rp 749.000, harga believable bukan angka bulat semua)
   - Mix level: BEGINNER / INTERMEDIATE / ADVANCED
   - 10 PUBLISHED, 1 DRAFT, 1 ARCHIVED (buat test filtering & access control nanti)
   - Judul + subtitle + deskripsi yang believable (contoh vibe: "Belajar API Testing dengan Postman dari Nol", "UI Design Fundamentals: dari Wireframe ke High-Fidelity", "Excel untuk Analisis Bisnis"). Deskripsi 2-3 paragraf markdown.
   - Thumbnail: https://picsum.photos/seed/{course-slug}/800/450 (deterministic per slug)
   - publishedAt bervariasi (3 bulan terakhir) biar sorting "Newest" ada artinya

4. CURRICULUM per course (yang PUBLISHED):
   - 3-5 sections dengan judul logis ("Pengenalan", "Setup Environment", "Praktik", "Studi Kasus", "Penutup")
   - 3-6 lectures per section, urutan (order) konsisten
   - Mix type: mayoritas VIDEO, selipkan 1-2 READING per course, 1 QUIZ placeholder di akhir section terakhir
   - VIDEO lectures: pakai sample video CC dari Google test bucket, rotasi biar gak semua sama:
     - https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
     - https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4
     - https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4
     - https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4
     - https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4 (short, cocok buat lecture pendek)
     - Simpan URL ke field video yang dipakai player sekarang, isi durationSeconds yang sesuai (durasi asli video sample-nya)
   - READING lectures: contentMd berisi konten markdown believable 3-5 paragraf + heading + bullet list (relevan sama judul lecture)

5. STUDENT TEST ACCOUNTS:
   - student@example.com (sudah ada) — enroll-kan ke 2 course (1 free, 1 paid via Enrollment langsung, anggap legacy)
   - student2@example.com — fresh, belum enroll apapun

6. Verifikasi setelah seed:
   - Landing page: featured courses & categories keisi proper
   - /courses: filter per kategori/level/price menghasilkan subset yang masuk akal, pagination kepake (12 course cukup buat 2 halaman kalau page size 9)
   - Course detail: curriculum accordion penuh, durasi total kehitung
   - Learn page: video bisa diputar, reading ke-render, lecture quiz nampilin placeholder

Acceptance criteria:
- `npm run db:seed` idempotent (run 2x tidak duplikat)
- Tidak ada course PUBLISHED yang curriculum-nya kosong
- Semua video URL bisa diputar di player
- DRAFT & ARCHIVED course tidak muncul di listing publik
- lint + type-check + test hijau
```

---

## 9. Next Steps Setelah Fase 1 Selesai

Setelah Fase 1 MVP berjalan stable, kita lanjut:

1. **Setup CI/CD** — GitHub Actions buat lint + type-check + (eventually) test
2. **Setup environment staging** — branch `staging` deploy ke Vercel preview environment dengan DB terpisah
3. **Mulai Fase 2** — Checkout & Midtrans
4. **Mulai bikin test artifacts** — test plan, risk matrix, sebelum nulis automated test

Tapi itu nanti. Sekarang fokus selesain Fase 1 dulu, satu prompt at a time.

---

## 10. Tips Saat Eksekusi di Claude Projects

- **Attach file ini sebagai Project Knowledge** di Claude Project supaya agent selalu punya konteks.
- **Satu prompt = satu PR mental.** Jangan campur prompt 5 sama prompt 6.
- **Selalu verify acceptance criteria** sebelum lanjut ke prompt berikutnya. Kalau ada yang miss, balikin ke agent untuk fix dulu.
- **Kalau agent ngerusak struktur** (misal bikin file di tempat aneh, atau pake pattern beda), stop dan koreksi langsung. Inkonsistensi awal jadi chaos di akhir.
- **Commit setiap step.** Habis prompt selesai, commit dengan message jelas (e.g., `feat: setup auth with credentials provider`).
- **Kalau lo stuck atau confused di tengah jalan,** balik ke chat ini (atau bikin chat baru dengan reference plan ini) untuk re-align.

---

*End of Project Plan*
