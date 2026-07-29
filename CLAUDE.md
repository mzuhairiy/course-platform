# CLAUDE.md

Rules of engagement untuk project ini. Baca ini setiap sesi. **File ini adalah source of truth untuk aturan koding.**

Peta dokumen — buka saat butuh detail:
- `PROJECT_PLAN.md` — index/peta + project brief + roadmap.
- `docs/reference/schema.md` — Prisma schema (struktur data).
- `docs/reference/design-system.md` — warna (navy+putih), tipografi, spacing.
- `docs/reference/architecture.md` — tech stack, folder structure, env & repo strategy.
- `docs/plan/phase-*.md` — build prompt per fase (lihat status di `PROJECT_PLAN.md`).

---

## Apa project ini

Online course platform (self-paced) yang dibangun sebagai **portfolio QA**. Aplikasi adalah *system under test* untuk demonstrasi skill QA. Artinya: kualitas code dan **testability** itu prioritas, bukan afterthought.

Showcase features (yang akan di-test paling dalam nanti): **Checkout & Payment, Video Player & Progress, Quiz Engine.**

---

## Tech Stack

Next.js 14+ (App Router) · TypeScript strict · PostgreSQL · Prisma · Auth.js v5 · Tailwind + shadcn/ui · React Hook Form + Zod · Cloudflare R2 (storage) · Deploy ke Vercel. Video via URL input (Mux di-drop). **Payment gateway di-drop** — checkout dummy/simulasi, transaksi tetap tercatat di DB.

Arsitektur: Server Components default, Client Components hanya saat butuh interactivity. Mutation lewat Server Actions. Route Handlers (`/api/`) cuma untuk kasus non-mutation (Auth.js, download sertifikat).

---

## Strategi Repo (PENTING)

**Repo ini = main repo (aplikasi).** Berisi:
- ✅ Aplikasi
- ✅ Linting, type-check
- ✅ Unit test + component test (white-box, Vitest) di `tests/`

**JANGAN setup E2E / API automation / performance test di repo ini.** Itu hidup di repo TERPISAH (`course-platform-automation`). Jangan install Playwright atau k6 di sini.

Tanggung jawab repo ini ke automation repo: sediakan **testability hooks** yang stabil (lihat bawah).

---

## Folder Structure & Naming

Struktur lengkap ada di `docs/reference/architecture.md`. Ringkas:

```
src/app/          # Routes (grouped: (marketing), (auth), (student), (instructor), (admin))
src/components/   # ui/ (shadcn) · shared/ · features/
src/lib/          # db, auth, utils
src/server/       # actions/ · services/ (business logic)
src/schemas/      # Zod schemas (shared client+server)
tests/            # unit/ · components/ HANYA (white-box)
docs/             # reference/ (schema, design, architecture) · plan/ (phase-*) · adr/
prisma/           # schema.prisma · migrations/ · seed.ts
```

Naming:
- Utils: `kebab-case.ts` · Components: `PascalCase.tsx`
- Prisma model: `PascalCase` singular · columns: `camelCase`
- Server Actions: prefix verb (`enrollCourse`, `submitQuiz`)
- Public URL pakai slug, bukan internal ID

---

## Anti-Pattern Checklist — JANGAN DILANGGAR

### Code
- ❌ File > 300 baris → split.
- ❌ Duplicate component → cek `src/components/` dulu.
- ❌ Magic number/string inline → pakai config/constant.
- ❌ Async tanpa error handling.
- ❌ `any` di TypeScript (kecuali terjustifikasi + ada comment).
- ❌ Server Action / API route tanpa Zod validation.

### Architecture
- ❌ Akses Prisma langsung dari component → selalu lewat `src/server/services/`.
- ❌ `use client` di komponen yang gak butuh interactivity.
- ❌ Endpoint return data sensitif tanpa auth check.

### Database
- ❌ Ubah schema tanpa migration. Jangan delete migration yang udah di-commit.
- ❌ N+1 query → pakai `include`/`select` yang tepat.

### Security
- ❌ Trust user input → validasi di server, selalu.
- ❌ Log sensitive data (password, token, payment detail).

---

## Testability Hooks — WAJIB ada dari awal

Ini kontrak ke automation repo. Setiap fitur yang dibuat HARUS punya:

- ✅ `data-testid` stabil + descriptive di setiap interactive element (button, input, link, card).
- ✅ Form input punya `name` attribute konsisten.
- ✅ Error message visible di DOM (jangan cuma toast yang ilang).
- ✅ Loading state explicit (`data-testid="loading"`).
- ✅ Filter/search state di URL query string (deep-linkable + testable).
- ✅ Deterministic behavior — hindari random/time-based di UI tanpa cara mengontrolnya.

---

## Workflow per Task

Build dikerjakan **satu prompt = satu unit kerja** (lihat `docs/plan/phase-*.md`). Untuk setiap task:

1. Kerjain HANYA scope task itu. **Jangan scope creep** ("sekalian tambahin X") — kalau nemu hal di luar scope, sebutin ke user, jangan langsung kerjain.
2. Sebelum selesai, run dan pastikan hijau:
   - `npm run lint`
   - `npm run type-check`
   - `npm run test`
   - `npm run build` (untuk task yang nyentuh UI/route)
3. Verify acceptance criteria task tercapai.
4. Baru lapor selesai. User yang commit (atau commit kalau diminta) dengan message jelas (`feat:`, `fix:`, `chore:`).

Kalau ada yang merah di step 2, **fix dulu sebelum lapor selesai**. Jangan numpuk error ke task berikutnya.

---

## Saat Mulai Build

Build prompt ada di `docs/plan/phase-*.md` (cek status tiap fase di `PROJECT_PLAN.md`). Saat user kasih nomor/kode prompt + nama fase, buka file fase terkait, baca prompt itu + acceptance criteria-nya, baru kerjain.

Kalau butuh detail schema → `docs/reference/schema.md`.
Kalau butuh detail design (warna, font, spacing) → `docs/reference/design-system.md`.
Kalau butuh detail struktur/arsitektur → `docs/reference/architecture.md`.

Kalau sebuah fitur menyentuh schema, update `docs/reference/schema.md` dulu sebelum bikin migration.

---

## Fokus Saat Ini

Semua fase build (1, 1B, ad-hoc, 2, 3, 4, 5) sudah DONE — cek tabel status di `PROJECT_PLAN.md`.
Fase 2 (Checkout) selesai tanpa payment gateway: checkout dummy + payment simulator, transaksi tercatat di DB.
Berikutnya: CI/CD, environment staging, dan automation repo — beririsan dengan fase testing.
