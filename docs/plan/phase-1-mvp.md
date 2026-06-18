# Fase 1 — MVP (Auth + Browse + Free Enrollment)

**Status: ✅ DONE** · Prompt 1–10

> Auth, design system foundation, landing, course listing+filter, course detail, free enrollment, basic video player, student dashboard.
> **Definition of Done:** register → browse → enroll free → watch video, end-to-end.

Detail teknis: schema → `docs/reference/schema.md`, struktur → `docs/reference/architecture.md`, desain → `docs/reference/design-system.md`. Aturan koding → `CLAUDE.md`.

---

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
6. Buat folder structure sesuai `docs/reference/architecture.md`
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
2. Copy schema dari `docs/reference/schema.md` ke `prisma/schema.prisma`
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
Setup design system foundation berdasarkan `docs/reference/design-system.md`:

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
   - Document tech stack decisions dari `docs/reference/architecture.md`
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
