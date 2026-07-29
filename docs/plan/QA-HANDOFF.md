# QA Handoff — Course Platform

> **Apa ini:** dokumen overview untuk QA yang akan menyusun test plan / automation.
> Aplikasi ini sengaja dibangun sebagai **System Under Test (SUT)** untuk portfolio QA —
> testability adalah warga kelas satu (lihat [Testability Hooks](#8-testability-hooks-kontrak-ke-automation)).
>
> Sumber kebenaran teknis lain: `CLAUDE.md` (aturan koding), `docs/reference/` (schema, design,
> architecture), `docs/plan/phase-*.md` (detail per fase). Dokumen ini meringkasnya untuk QA.
>
> _Disusun: 2026-06-22. Verifikasi ulang terhadap kode bila ada yang berubah._

---

## 1. At a glance

| Hal | Nilai |
|---|---|
| Jenis | Online course platform (self-paced), Bahasa Indonesia |
| Framework | Next.js 14.2 (App Router) · TypeScript strict · React 18 |
| Data | PostgreSQL + Prisma 6 |
| Auth | Auth.js v5 (JWT session) — credentials + (opsional) Google |
| UI | Tailwind v3 + shadcn/ui (navy + putih) |
| Deploy target | Vercel (belum di-deploy/di-verifikasi di sini) |
| Personas | STUDENT · INSTRUCTOR · ADMIN (3 shell terpisah) |
| Test (repo ini) | Vitest white-box: **159 test / 24 file**, semua hijau |
| E2E / API / performance | **TIDAK di repo ini** — lihat [§3 Strategi repo](#3-strategi-repo-penting-untuk-qa) |

**3 fitur showcase** (paling dalam untuk di-test): **Checkout & Payment**, **Video Player & Progress**,
**Quiz Engine**. ⚠️ Checkout **tanpa payment gateway** — pembayarannya disimulasikan di app, tapi flow-nya
end-to-end dan transaksinya tercatat di DB. Lihat [§6](#6-status-fitur--apa-yang-bisa-di-test).

---

## 2. Cara menjalankan lokal

```bash
# 1. Database (Postgres via OrbStack, bukan Docker Desktop)
open -a OrbStack
docker compose up -d --wait

# 2. Env — copy & isi
cp .env.example .env        # minimal: DATABASE_URL, AUTH_SECRET sudah cukup untuk core

# 3. Migrasi + seed data demo
npx prisma migrate deploy   # atau: npx prisma migrate dev
npm run db:seed

# 4. Jalankan
npm run dev                 # http://localhost:3000 (atau 3001 jika 3000 dipakai)
```

**Quality gates** (harus hijau sebelum rilis):
```bash
npm run lint        # eslint
npm run type-check  # tsc --noEmit
npm run test        # vitest (unit + component)
npm run build       # next build
```

**Env yang relevan:** `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` (core).
Opsional/eksternal: `AUTH_GOOGLE_*` (OAuth), `RESEND_API_KEY`+`EMAIL_FROM` (email — tanpa ini email **no-op**),
`MUX_*` (**di-drop**, tidak dipakai). Payment **tidak butuh env apa pun** — checkout-nya dummy.

---

## 3. Strategi repo (penting untuk QA)

Repo ini = **aplikasi (SUT)**. Berisi aplikasi + lint + type-check + **unit/component test (white-box, Vitest)** di `tests/`.

**E2E, API automation, performance test TIDAK ada di sini** — itu hidup di repo terpisah
(`course-platform-automation`). Kontrak repo ini ke automation = **testability hooks yang stabil**
(`data-testid`, `name` attribute, error message di DOM, URL state). Lihat [§8](#8-testability-hooks-kontrak-ke-automation).

Konsekuensi untuk QA:
- Logika bisnis (grading kuis, aturan enrollment, RBAC, ownership) sudah dicover **unit test white-box** di repo ini.
- Alur end-to-end lewat browser (klik, isi form, submit Server Action) **belum** ter-automate — ini scope automation repo.

**Target automation framework:** Playwright BDD (Cucumber/Gherkin). Hook utama: `data-testid`.
Lihat `course-platform-automation` repo untuk setup, feature files, dan step definitions.

---

## 3B. Automation gotchas (baca sebelum nulis test)

Hal-hal yang bikin test flaky atau salah asumsi kalau gak tau:

- **403 = HTTP 200 + konten `forbidden-page`** — middleware Next.js pakai rewrite, bukan redirect. Jangan assert `response.status() === 403`; assert `page.getByTestId("forbidden-page").isVisible()`.
- **Server Action mutation = gak ada XHR endpoint** — Playwright gak bisa `waitForResponse('/api/...')` buat Server Action. Pakai `waitForSelector` pada perubahan DOM atau `page.waitForLoadState('networkidle')`.
- **Progress video = throttled ke server tiap 5 detik + on-ended** — jangan tunggu 90% durasi video asli. Pakai dummy video 10-12 detik (`/sample-lecture.mp4`) dari seed lalu tunggu `lecture-complete-check` muncul.
- **Quiz timer = server-authoritative** — countdown di client derived dari `startedAt + timeLimit` server. Kalau mau test "submit terlambat", jangan manipulasi clock client; pakai quiz tanpa `timeLimit` buat test non-timing.
- **Search debounce 300ms** — setelah ketik di search input, tunggu minimal 400ms sebelum assert hasil.
- **Toast sukses = testid `success-toast`** — toast menghilang setelah beberapa detik. Assert segera setelah aksi.
- **Seed idempotent tapi stateful** — `npm run db:seed` bisa dijalanin ulang, tapi progress/enrollment dari test sebelumnya **tidak di-reset**. Pakai `student2@example.com` (fresh) atau reset DB sebelum suite.
- **URL state untuk filter** — filter di `/courses` tersimpan di URL query. Test filter bisa langsung navigate ke URL target, gak harus klik UI dari awal.
- **Checkout = simulasi, bukan gateway** — di `/checkout/status` transaksi PENDING punya panel `payment-simulator` dengan dua tombol (`simulate-success-button` / `simulate-cancel-button`). Nggak ada popup eksternal, nggak ada webhook, nggak ada timer — hasil pembayaran sepenuhnya ditentukan aksi user, jadi deterministik. Setelah klik, halaman di-refresh dan status dibaca ulang dari DB.
- **Course cover = CSS 3D text generatif** — jangan test dengan screenshot pixel-perfect. Assert `course-cover` visible dan berisi label yang benar.

---

## 4. Personas & RBAC

Tiap akun punya **satu persona** dengan shell/layout berbeda total:

| Persona | Landing | Area | Shell |
|---|---|---|---|
| STUDENT | `/dashboard` | marketing + belajar | top navbar (putih) |
| INSTRUCTOR | `/instructor` | management console | sidebar navy (workspace) |
| ADMIN | `/admin` | admin console | sidebar navy + badge "Admin" |

**Aturan akses (enforced di `src/middleware.ts` + re-check di tiap Server Action — defense in depth):**
- `/instructor/*` → hanya INSTRUCTOR / ADMIN; selain itu di-rewrite ke `/forbidden` (`data-testid="forbidden-page"`).
- `/admin/*` → hanya ADMIN.
- `/dashboard`, `/my-courses`, `/learn`, `/purchase-history`, `/settings` → wajib login.
- **Redirect-by-role:** setelah login & saat membuka `/` atau area student, INSTRUCTOR/ADMIN dilempar ke workspace masing-masing (`getRoleHomePath`).
- INSTRUCTOR/ADMIN yang buka `/settings` → diarahkan ke `/instructor/settings` atau `/admin/settings` (tidak melihat navbar student).
- **Ownership:** instructor hanya bisa kelola/lihat course miliknya; akses course instruktur lain → `/forbidden` (ADMIN bypass).

**Test case RBAC kunci:** student→`/instructor`=403 · instructor→`/admin`=403 · instructor→`/dashboard`=redirect ke `/instructor` · admin→semua=masuk.

---

## 5. Akun seed (kredensial test)

Password **semua** akun: `Password123!`

| Email | Role | Catatan |
|---|---|---|
| `student@example.com` | STUDENT | sudah enrolled di 2 course (1 free, 1 paid) — untuk uji progress/review |
| `student2@example.com` | STUDENT | bersih |
| `instructor@example.com` | INSTRUCTOR | Budi Santoso — punya beberapa course |
| `instructor2@example.com` … `instructor8@example.com` | INSTRUCTOR | pemilik course lain (uji ownership) |
| `admin@example.com` | ADMIN | akses penuh admin panel |

**Isi seed (≈):** 18 user · 7 kategori · 25 course (23 PUBLISHED, 2 DRAFT) · 90 section · 307 lecture · 23 quiz · 115 soal · 2 enrollment.
Seed bersifat idempotent & deterministik (`npm run db:seed`). Tidak ada UI ganti role kecuali via Admin panel.

**Test isolation strategy:**
- `student2@example.com` = akun "bersih" untuk test yang butuh fresh state (belum enrolled, 0 progress).
- Reset penuh: `npx prisma migrate reset --force` (drop + migrate + seed ulang). **Jangan di production/staging.**
- Untuk test yang bikin data baru (enrollment, progress, review): cleanup di `afterEach`/`afterAll`.
- Course DRAFT (2 buah di seed) — gunakan untuk test akses non-published (student gak boleh akses).

---

## 6. Status fitur — apa yang bisa di-test

| Fitur | Status | Catatan untuk QA |
|---|---|---|
| Auth (sign in/up, sign out, session) | ✅ | JWT. Validasi Zod, error tampil di DOM. |
| Browse / katalog course | ✅ | `/courses` — filter kategori/level/harga + sort + pagination, **semua state di URL query**. |
| Search (command palette ⌘K + `q`) | ✅ | Live search debounce 300ms; deep-link `?q=`. |
| Free enrollment | ✅ | Course gratis → enroll → redirect ke lecture pertama. |
| Video player + progress tracking | ✅ **(showcase)** | Selesai ≥90% watched; progress sticky; resume ke lecture incomplete pertama. |
| Reading lecture + "Tandai Selesai" | ✅ | Manual complete. |
| Quiz engine (attempt + grading) | ✅ **(showcase)** | All-or-nothing grading, passing score, timer opsional, review jawaban. |
| Certificate (PDF) | ✅ | Terbit saat course 100%. `/api/certificates/[courseId]`. |
| Instructor: Course CRUD + publish/unpublish | ✅ | Ownership + publish butuh ≥1 lesson + delete diblok bila ada enrollment. |
| Instructor: Lesson management (flat) | ✅ | Flat list (section disembunyikan), move up/down, type VIDEO/READING/QUIZ. |
| Instructor: Quiz builder | ✅ | Soal MULTIPLE_CHOICE/TRUE_FALSE, opsi 2–6, preview, option id stabil. |
| Instructor: Analytics dashboard + per-course | ✅ | Stats + tren enrollment 30 hari + funnel lesson. |
| Admin: dashboard / courses (archive) / users (ubah role) | ✅ | Tanpa delete dari admin; tidak bisa ubah role sendiri. |
| Review & rating | ✅ | Hanya enrolled boleh review; bintang di card + detail; 1 review/user/course. |
| Recommendation ("Course terkait") | ✅ | Kategori sama, terpopuler, di course detail. |
| Email notification (Resend) | ⚠️ Partial | Enrollment & completion email. **No-op tanpa `RESEND_API_KEY`** — pengiriman nyata belum diverifikasi. |
| **Checkout & Payment (dummy)** | ✅ | Alur penuh: course detail "Buy" → `/checkout/[courseId]` (pilih metode) → transaksi PENDING → `/checkout/status` → payment simulator (settle/cancel) → SUCCESS + auto-enrol. **Tidak ada payment gateway** (Midtrans di-drop) — pembayaran disimulasikan di server, tapi transaksinya nyata di DB. Idempotensi, ownership, dan atomicity settle+enroll unit-tested. |
| Purchase history | ✅ | `/purchase-history` — daftar transaksi user (status badge) + link "Lanjutkan pembayaran" untuk PENDING. |
| Admin transactions / categories | ◻️ Placeholder | Stub sampai fase terkait. |

Legenda: ✅ jalan & bisa di-test · ⚠️ jalan dengan batasan · ❌ belum ada · ◻️ placeholder.

---

## 7. Peta route

**Marketing / student (top navbar):**
`/` · `/courses` · `/courses/[slug]` · `/sign-in` · `/sign-up` · `/dashboard` · `/my-courses` ·
`/learn/[courseId]/[lectureId]` · `/purchase-history` · `/checkout/[courseId]` · `/checkout/status` · `/settings` · `/forbidden` · `/style-guide`

**Instructor (sidebar workspace):**
`/instructor` (dashboard) · `/instructor/courses` (My Courses) · `/instructor/courses/new` ·
`/instructor/courses/[courseId]/edit` · `/instructor/courses/[courseId]/lessons` ·
`/instructor/courses/[courseId]/quiz/[quizId]` · `/instructor/courses/[courseId]/analytics` · `/instructor/settings`

**Admin (sidebar console):**
`/admin` · `/admin/courses` · `/admin/users` · `/admin/transactions` · `/admin/categories` · `/admin/settings`

**API (route handlers):** `/api/auth/[...nextauth]` · `/api/certificates/[courseId]`

> URL publik pakai **slug** (`/courses/next-js-14-untuk-pemula`), internal pakai id.

---

## 8. Testability hooks (kontrak ke automation)

Dijaga konsisten di seluruh app (lihat `CLAUDE.md`):

- ✅ **`data-testid` stabil & deskriptif** di tiap elemen interaktif (~360 unik). Selektor utama, jangan andalkan teks/kelas.
- ✅ **`name` attribute** konsisten di input form.
- ✅ **Error message visible di DOM** (`role="alert"` + `data-testid="*-error"`), bukan cuma toast yang hilang.
- ✅ **Loading state eksplisit** (`data-testid="loading"`, skeleton ber-testid).
- ✅ **Filter/search/pagination state di URL query** (deep-linkable + reproducible).
- ✅ **Deterministik** — hindari random/time-based tanpa kontrol; `prefers-reduced-motion` dihormati (mis. carousel instruktur).
- ✅ **Toast sukses** ber-testid `success-toast`.

### Testid penting per alur (subset; total ~360, discover via `grep -rhoE 'data-testid="[^"]+"' src/`)

**Auth:** `sign-in-form` `sign-in-email` `sign-in-password` `sign-in-submit` `sign-in-error` · `sign-up-form` `sign-up-{name,email,password}` `sign-up-submit` · `user-menu-trigger` `menu-sign-out`

**Browse / katalog:** `course-grid` `course-card` `course-price` `card-rating` · `course-filters` `filter-toggle` `sort-select` · `pagination` `pagination-{prev,next}` · `course-empty` `course-grid-skeleton`

**Search:** `search-input` `search-form` `search-result-item` `search-empty-state` `search-view-all` `search-results-header` `search-clear`

**Course detail:** `course-detail` `course-hero` `hero-rating` · `enroll-card` `enroll-button` `enroll-price` `enroll-error` · `curriculum` `curriculum-section` `curriculum-lecture` · `reviews-section` `rating-summary` `rating-average` `review-form` `review-comment` `review-submit` `review-delete` `review-item` `star-input` `star-{1..5}` `star-rating` · `related-courses`

**Learn / video / progress:** `learn-sidebar` `sidebar-lecture` `lecture-complete-check` · `video-element` `video-completion-status` · `mark-complete-button` · `prev-lecture` `next-lecture` · `course-progress-percentage` `course-completed-banner` `download-certificate-button`

**Quiz (student):** `quiz-intro` `start-quiz-button` `quiz-question` `quiz-option` `submit-quiz-button` `quiz-timer` `quiz-result` `quiz-score` `quiz-passed-badge` `quiz-review-item` `retry-quiz-button` `quiz-attempt-history`

**Instructor — course:** `create-course-button` `course-form` `course-form-{title,price,slug,category,level,submit}` `course-status-badge` `publish-button` `unpublish-button` `delete-course-button` `delete-confirm-dialog` `delete-confirm-input` · `instructor-course-list` `course-status-filter` `analytics-course-link`

**Instructor — lesson:** `lesson-manager` `add-lesson-button` `lesson-item` `lesson-type-select` `lesson-video-url-input` `lesson-reading-content` `delete-lesson-button` `move-lesson-up` `move-lesson-down`

**Instructor — quiz builder:** `quiz-settings-form` `passing-score-input` `time-limit-input` `add-question-button` `question-item` `question-type-select` `option-input` `correct-answer-checkbox` `explanation-input` `preview-quiz-button` `move-question-{up,down}` `quiz-empty-warning`

**Instructor — analytics:** `instructor-stats-cards` `enrollment-chart` `recent-enrollments` `course-analytics-funnel` `funnel-row`

**Admin:** `admin-dashboard` `admin-stats-cards` · `admin-course-list` `admin-course-filters` `admin-archive-button` `admin-unarchive-button` · `admin-user-list` `admin-role-dropdown` `admin-role-confirm-dialog` `admin-role-confirm`

**Checkout (dummy):** `checkout-page` `order-summary` `order-title` `order-total` `checkout-form` `payment-method-bank_transfer` `payment-method-e_wallet` `payment-method-credit_card` `pay-now-button` `checkout-error` `dummy-payment-note` · `checkout-status` `status-success` `status-pending` `status-failed` `payment-simulator` `simulate-success-button` `simulate-cancel-button` `simulator-error` `transaction-detail` `detail-order-id` `detail-payment-method` `detail-status` `detail-amount` `start-learning-button` `retry-payment-button` · `purchase-history` `transaction-row` `continue-payment-link` `purchase-history-empty`

Radio metode pembayaran punya `name="paymentMethod"`; keduanya (form & simulator) merender `loading` saat submit.

**RBAC / shell:** `forbidden-page` `forbidden-back` · `instructor-sidebar` `admin-sidebar` `workspace-topbar` `workspace-breadcrumb`

---

## 9. Alur berisiko tinggi (test paling dalam)

1. **Video + progress** — putar < 90% (tidak complete), ≥ 90% (complete & sticky), reload (resume ke lecture incomplete pertama), course 100% → banner + sertifikat.
2. **Quiz engine** — start attempt, jawab MC (multi-jawaban = all-or-nothing) & True/False, timer habis (server otoritatif, grace 5 dtk), lulus/gagal vs passing score, retry, review + explanation. QUIZ lecture selesai dengan **lulus**.
3. **Instructor course lifecycle** — create (DRAFT) → tambah lesson → publish (gagal bila 0 lesson) → student bisa belajar → unpublish → delete (blok bila ada enrollment). Ownership: instruktur A tak bisa edit course B.
4. **Review** — hanya enrolled boleh kirim; 1 review/user/course (upsert); avg & count update; non-enrolled tak lihat form.
5. **RBAC + redirect-by-role** — lihat [§4](#4-personas--rbac).
6. **Checkout (dummy)** — beli course berbayar: pilih metode → PENDING → simulate success → SUCCESS + otomatis enrolled → bisa nonton. Negative: simulate cancel → CANCELLED (tidak enrolled, bisa retry); klik "Bayar Sekarang" dua kali → tetap satu order; buka `/checkout/status?order_id=` milik user lain → 404; sudah enrolled → `/checkout/[courseId]` redirect ke course detail.

---

## 9B. Risk matrix (prioritas testing)

Dasar: **Likelihood** (bug muncul) × **Impact** (dampak ke user/bisnis).

| Fitur | Likelihood | Impact | Risk | Coverage strategy |
|---|---|---|---|---|
| Quiz engine (grading, timer, server-side) | High | High | 🔴 Critical | Full E2E + edge (timer, multi-answer, retry, duplicate submit) |
| Video progress (threshold, resume, throttle) | High | High | 🔴 Critical | E2E + boundary (89% vs 90%), resume after reload |
| RBAC + ownership check | High | High | 🔴 Critical | Full negative testing per role + direct URL |
| Certificate (eligibility, idempotent, ownership) | Med | High | 🟠 High | E2E completion flow + direct API |
| Free enrollment + access control | Med | High | 🟠 High | E2E + non-enrolled blocked |
| Checkout dummy (state machine, idempotensi, auto-enrol) | Med | High | 🟠 High | E2E success + cancel + retry; negative: double submit, order user lain, forge query param |
| Course publish validation (min 1 lesson) | Med | Med | 🟡 Medium | Happy path + 0 lesson → gagal |
| Instructor lesson management (ownership) | Med | Med | 🟡 Medium | Ownership test + move persist |
| Search (debounce, filter kombinasi) | Low | Med | 🟡 Medium | Happy path + empty state + URL state |
| Admin role change (tidak bisa ubah diri sendiri) | Low | High | 🟡 Medium | Negative test |
| Review & rating | Low | Low | 🟢 Low | Happy path + 1 per user guard |
| Course cover (3D text generatif) | Low | Low | 🟢 Low | Smoke: element visible + label benar |
| Email notification | Low | Low | 🟢 Low | Unit test no-op (sudah ada); skip E2E |
| Placeholder (admin transactions, categories) | — | — | ⬜ Skip | Belum ada fitur |

---

## 10. Coverage white-box yang sudah ada (repo ini)

`tests/unit/` — `auth-schema` · `course-filters` · `course-service` (CRUD+ownership+publish+related) ·
`lesson-service` (default section, move, ownership) · `quiz-builder-service` (validasi soal, ownership) ·
`quiz-grading` · `quiz-service` · `progress-service` (threshold, resume, completion) ·
`enrollment-rules` · `rbac` · `roles` · `review-service` (enrollment-gated, summary) ·
`admin-analytics` (changeUserRole, archive, instructor stats) · `email` (template + no-op transport) ·
`certificate-helpers` · `certificate-service` · `profile-actions` · `format` · `utils` (slugify).
`tests/components/` — `instructor-showcase` · `nav-category-menu` · `search-input` · `settings-view`.

> Mutasi via Server Action (create/publish/delete/submit) divalidasi di **service layer** (unit) + render gating;
> klik end-to-end via browser adalah scope **automation repo**.

---

## 11. Batasan & risiko yang diketahui (untuk dicatat di test plan)

- **Payment tanpa gateway** — pembayaran disimulasikan di app (user yang memilih hasilnya), jadi tidak ada bukti integrasi payment provider nyata. Status `FAILED`, `EXPIRED`, `REFUNDED` ada di enum tapi **tidak reachable** lewat UI; jangan tulis test untuk ketiganya. Yang reachable: `PENDING`, `SUCCESS`, `CANCELLED`.
- **Email (Resend) belum diverifikasi kirim** — tanpa `RESEND_API_KEY` jadi no-op; tidak ada bukti email terkirim end-to-end.
- **Mux di-drop** — video = URL input (mp4 / YouTube embed), tidak ada upload/transcoding. Field `videoAssetId`/`videoPlaybackId` ada di schema tapi tidak dipakai.
- **Section disembunyikan dari instruktur** — di DB tetap Course→Section→Lecture, tapi instruktur lihat lesson **flat**; student render flat bila course ≤1 section. Course seed multi-section tetap per-section.
- **403 page** di-render via rewrite (status HTTP tetap 200, konten = `forbidden-page`). Verifikasi pakai konten/testid, bukan status code.
- Belum ada CI/CD, environment staging, dan deploy yang diverifikasi.

---

## 12. Model data (untuk desain test data)

Entitas inti: **User**(role) · **Category** · **Course**(status DRAFT/PUBLISHED/ARCHIVED, level, price, slug) ·
**Section** → **Lecture**(VIDEO/READING/QUIZ) · **Enrollment**(completedAt) · **LectureProgress**(watchedSeconds, isCompleted) ·
**Quiz** → **QuizQuestion**(options JSON, correctAnswerIds) → **QuizAttempt**(score, passed) ·
**Review**(rating 1–5, unique user+course) · **Certificate** · **Transaction**(status — belum dipakai).

Detail lengkap: `docs/reference/schema.md`. Migrasi: `prisma/migrations/`.

---

## 13. Pointer dokumen

| Butuh | Lihat |
|---|---|
| Aturan koding & anti-pattern | `CLAUDE.md` |
| Schema lengkap | `docs/reference/schema.md` |
| Design system (warna, tipografi) | `docs/reference/design-system.md` |
| Arsitektur & folder | `docs/reference/architecture.md` |
| Detail per fase + status | `docs/plan/phase-*.md`, `PROJECT_PLAN.md` |

---

## 14. Konteks portfolio QA (baca kalau balik setelah lama)

Proyek ini adalah **satu dari 6 proyek** di portfolio QA. Tiap proyek sengaja pakai tech stack dan automation framework berbeda untuk menunjukkan range skill:

| # | Proyek | App Stack | Automation target | Status |
|---|---|---|---|---|
| 1 | Petpals (E-commerce) | Next.js | Playwright | ✅ Done (reference impl — ada AI workflow) |
| 2 | **CoursePlatform (ini)** | Next.js | **Playwright BDD** (Cucumber/Gherkin) | 🚧 App 95%, automation belum |
| 3 | CMS | Headless CMS | Selenium Java + Allure Report | 📋 Belum |
| 4 | Admin Dashboard | — | Katalon Studio (data-driven) | 📋 Belum |
| 5 | E-Commerce Mobile | Android | Appium + (eksplor MobileWright) | 📋 Belum |
| 6 | Finance App | React Native (iOS+Android) | Maestro | 📋 Belum |

Performance track (setelah semua di atas): k6, Lighthouse CI (+ JMeter/Locust opsional).

**Kenapa proyek ini pakai Playwright BDD** (bukan plain Playwright kayak Petpals): BDD/Gherkin sebagai differentiator — feature files yang human-readable jadi artefak tersendiri, dan demonstrate kemampuan nulis test dari perspektif business requirement, bukan cuma teknis.

**Yang membedakan dari Petpals (dari sisi QA):**
- BDD feature files + step definitions vs plain page objects
- 3 persona terpisah = RBAC testing lebih kompleks
- State machine (quiz engine, video progress) = lebih banyak edge case
- Async behavior (progress throttle, server-authoritative timer)

**Kalau mau mulai automation setelah lama meninggalkan proyek ini:**
1. Baca ulang §6 (status fitur) dan §11 (batasan yang diketahui)
2. Pastikan app jalan lokal (`npm run dev` + seed), semua quality gates hijau
3. Cek `git log --oneline -20` — mungkin ada perubahan setelah doc ini ditulis
4. Baca §3B (automation gotchas) sebelum nulis test apapun
5. Mulai dari 🔴 Critical di §9B (quiz engine + video progress + RBAC)
6. Checkout E2E sudah bisa dijalankan penuh (dummy payment, tanpa kredensial apa pun)
