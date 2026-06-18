# Ad-hoc Features (Arsip)

**Status: ✅ DONE** · Prompt A–E

> Fitur tambahan di luar urutan roadmap, dikerjakan via Claude Code langsung saat fase 1–3.
> Didokumentasikan di sini untuk jejak keputusan (kenapa, bukan cuma apa). Bukan untuk dieksekusi ulang.

**Perubahan schema yang muncul dari fitur-fitur ini** (sudah masuk `docs/reference/schema.md`):
- `User.bio` — dari Prompt D (profile settings) & content seed instruktur.
- `Course.coverLabel` — dari Prompt E (cover 3D-text).

---

## Prompt A — Search di Navbar

Command palette (Cmd/Ctrl+K) + search input navbar, placeholder "Apa yang ingin Anda pelajari?".
Server-side search (Prisma `contains` insensitive) di title + subtitle, hanya course PUBLISHED.
Integrasi `?q=` ke /courses listing (kombinasi dengan filter existing). Debounce 300ms fixed.

**Keputusan kunci:** Cmd+K palette (UX modern), debounce fixed (deterministic untuk automation),
search hasil terintegrasi ke listing (bukan dead-end), tanpa library eksternal (Algolia overkill).

data-testid: search-trigger, search-dialog, search-input, search-result-item, search-empty-state, search-view-all.

---

## Prompt B — Theme Putih + Navy (Maven-style)

Migrasi accent dari orange → navy. CSS variables + Tailwind tokens (lihat `docs/reference/design-system.md`
yang sudah disinkronkan). Footer navy gelap teks putih. Color pass only — tanpa ubah layout/typography.
WCAG AA contrast check untuk semua kombinasi baru.

**Keputusan kunci:** scope guard "color pass only" (cegah agent rombak layout), WCAG AA (poin jual QA),
sinkronisasi balik ke design system reference.

---

## Prompt C — Konten Course + Instruktur + Carousel

Tambah kategori (AI & Machine Learning, Product & Engineering). 9 course baru topik teknis
(MCP, RAG & Search, Machine Learning, Security, System Design, Agentic AI, Vibe Coding, Figma, + pelengkap).
Instruktur baru sehingga setiap instruktur punya minimal 1 course. Instructor section → carousel (embla),
desktop 4 / tablet 2 / mobile 1.2 peek, tanpa autoplay.

**Keputusan kunci:** deskripsi course harus akurat secara teknis (bukan ngawur), bio instruktur match
expertise, **autoplay carousel dimatikan** (elemen bergerak = flaky E2E test), link instruktur ke
listing ter-filter (carousel functional bukan dekoratif).

data-testid: instructor-carousel, instructor-card, carousel-prev, carousel-next.

---

## Prompt D — Profile Menu + Settings

Navbar logged-in: avatar + nama (fallback inisial di bg navy). Settings page (/settings):
Profile card (avatar via URL/preset + live preview, nama, bio), Account card (email read-only,
role read-only badge), Security card (ganti password — verify current via bcrypt). Save + back button
+ unsaved-changes guard. Server actions ambil userId dari session (bukan client).

**Keputusan kunci:** avatar via URL/preset (bukan upload — R2 belum di-setup, hindari narik Fase 4),
email & role TIDAK bisa diubah dari UI (security), ganti password ada (platform production-ready +
test surface negative testing). `User.bio` ditambahkan di sini.

data-testid: settings-back-button, profile-card, avatar-preview, name-input, bio-input,
save-profile-button, account-card, email-readonly, security-card, current/new/confirm-password-input,
change-password-button, unsaved-changes-dialog, navbar-user-name, navbar-avatar.

---

## Prompt E — Course Cover 3D-Text

Ganti thumbnail picsum → generated cover: teks 3D (CSS text-shadow berlapis) + background warna
deterministic dari slug (hash → palette navy/teal/slate/indigo). Komponen CourseCover, label ringkas
per course disimpan di `Course.coverLabel` (mis. "Next.js untuk Pemula" → "Next.js").

**Keputusan kunci:** warna **deterministic per slug bukan Math.random** (kalau random, visual regression
mustahil — screenshot gak pernah match), label disimpan ke DB bukan di-parse on-the-fly (predictable),
CSS murni tanpa library 3D. `Course.coverLabel` ditambahkan di sini.

data-testid: course-cover.
