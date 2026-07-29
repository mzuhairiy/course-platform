# Online Course Platform — Project Plan (Index)

> **Peta dokumen.** File ini ramping — cuma overview + roadmap + pointer ke detail.
> Detail teknis ada di `docs/reference/`, build prompt per fase ada di `docs/plan/`.
> Aturan koding (anti-pattern + testability hooks) ada di `CLAUDE.md` (source of truth).

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

## 2. Peta Dokumen

### Reference (stabil, dibaca on-demand)

| File | Isi |
|---|---|
| `CLAUDE.md` | Rules of engagement, anti-pattern checklist, testability hooks, workflow per task. **Source of truth aturan koding.** |
| `docs/reference/architecture.md` | Tech stack, architecture pattern, environment & repo strategy, folder structure, naming. |
| `docs/reference/schema.md` | Prisma schema lengkap (source of truth struktur data). |
| `docs/reference/design-system.md` | Palet navy+putih, tipografi, spacing, component style. |

### Plan (build prompt per fase)

| File | Fase | Status |
|---|---|---|
| `docs/plan/phase-1-mvp.md` | Fase 1 — MVP (auth, browse, free enroll, video, dashboard) · Prompt 1–10 | ✅ DONE |
| `docs/plan/phase-1b-content.md` | Fase 1B — Content seeding · Prompt 16 | ✅ DONE |
| `docs/plan/ad-hoc-features.md` | Search, theme navy, konten+carousel, profile, course cover · Prompt A–E | ✅ DONE |
| `docs/plan/phase-3-learning.md` | Fase 3 — Progress + Certificate + Quiz · Prompt F, G, H, I | ✅ DONE |
| `docs/plan/phase-2-checkout.md` | Fase 2 — Checkout (dummy payment) · Prompt 11–15 | ✅ DONE |
| `docs/plan/phase-4-instructor.md` | Fase 4 — Instructor + Admin + RBAC · Prompt J, K, L, M, N | ✅ DONE |
| `docs/plan/phase-5-polish.md` | Fase 5 — Review, notification, recommendation · (search via ad-hoc) | ✅ DONE |

> **Urutan eksekusi aktual** beda dari nomor fase: 1 → 1B → ad-hoc → 3 → 4 → 5 → 2.
> Nomor fase dipertahankan sesuai roadmap awal; status label di atas yang jadi acuan progress.

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

### Fase 2 — Monetization (Checkout + Dummy Payment)

- Checkout page + pilihan metode pembayaran (dummy)
- Order management (transaksi tercatat di DB)
- Payment simulator (settle / cancel) menggantikan payment gateway
- Transaction history
- Paid enrollment flow

**Definition of Done:** User bisa "beli" course lewat checkout simulasi, transaksi masuk DB, payment success → otomatis enrolled.

> **Keputusan:** payment gateway (Midtrans) di-drop — effort integrasi + maintenance sandbox nggak sebanding nilainya buat portfolio QA. Checkout disimulasikan penuh di server; yang di-test tetap sama (state transition, idempotensi, ownership, auto-enroll).

### Fase 3 — Learning Experience (Progress + Quiz + Certificate)

- Lecture progress tracking (video watched %, mark complete)
- Quiz engine (multiple choice + true/false)
- Quiz attempt + scoring
- Course completion logic
- Certificate generation (PDF)
- Certificate verification page

**Definition of Done:** User bisa nonton sampai habis, ngerjain quiz, dapat certificate yang verifiable.

### Fase 4 — Creator Side (Instructor + Admin)

- RBAC middleware + instructor/admin layout
- Course CRUD (create, edit, delete, publish)
- Lesson management (flat list lecture, tanpa section)
- Video via URL input (Mux di-drop)
- Quiz builder
- Instructor analytics
- Admin moderation panel + user management

### Fase 5 — Polish (Search + Social + Notification)

- Search & filter
- Review & rating
- Email notification (Resend)
- Recommendation
- SEO optimization

---

## Cara Pakai (Claude Code)

1. `CLAUDE.md` selalu dibaca tiap sesi (always-on rules).
2. Saat mulai sebuah prompt, sebut fase + nomor: misal *"Kerjakan Prompt F dari `docs/plan/phase-3-learning.md`"*.
3. Agent buka file fase terkait + reference yang relevan (schema/design/architecture) sesuai kebutuhan.
4. Satu prompt = satu unit kerja. Verify (lint/type-check/test/build hijau + acceptance criteria) → commit → lanjut.
5. Kalau sebuah fitur menyentuh schema, update `docs/reference/schema.md` dulu sebelum eksekusi.
