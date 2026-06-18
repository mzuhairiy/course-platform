# Fase 4 — Creator Side (Instructor + Admin)

**Status: ✅ DONE** · Prompt J, K, L, M, N (semua selesai)

> Instructor bisa CRUD course lengkap dari UI — bukan lewat seed lagi.
> Video input pakai URL (bukan upload/Mux). Mux di-drop dari tech stack.
> Schema yang ada sudah cukup — Course, Section, Lecture, Quiz, QuizQuestion, User.role semua
> sudah di `docs/reference/schema.md`. Kalau ada perubahan minor, dokumentasikan.

**Keputusan desain yang sudah dikunci:**
- **Persona separation (STRICT):** tiap akun punya SATU persona. Student = consumer (top-nav + marketing). Instructor & Admin = management console (sidebar workspace). Instructor/Admin TIDAK punya UI belajar/beli/marketing sama sekali. Instructor bisa **Preview** course sendiri (read-only) dari dalam workspace — itu bukan enroll.
- **Redirect by role saat login:** STUDENT → `/dashboard`, INSTRUCTOR → `/instructor`, ADMIN → `/admin`. Instructor/admin tidak pernah mendarat di homepage student.
- **Video:** instructor paste URL video (YouTube embed atau direct mp4 link). Tidak ada upload file.
- **RBAC:** role-based (STUDENT / INSTRUCTOR / ADMIN) lewat middleware + server-side check per action. Tidak ada permission granular per-resource (misal "instructor A bisa edit course instructor B") — instructor hanya bisa kelola course miliknya sendiri.
- **Publish flow:** DRAFT → PUBLISHED → ARCHIVED. Instructor bisa publish/unpublish sendiri. Admin bisa archive/moderate.

Aturan koding (anti-pattern, testability hooks) → `CLAUDE.md`.

---

### Prompt J — RBAC + Persona-Separated Shells + Redirect

```
Setup role-based access control DAN shell/layout terpisah untuk tiga persona.
PRINSIP UTAMA: student, instructor, admin punya shell yang BERBEDA TOTAL. Instructor & admin
TIDAK mewarisi navbar/marketing/UI-belajar milik student. Jangan reuse navbar student di sana.

REQUIREMENT:

1. RBAC MIDDLEWARE (update src/middleware.ts yang sudah ada):
   - /instructor/* → hanya role INSTRUCTOR atau ADMIN. Selain itu → 403.
   - /admin/* → hanya role ADMIN. Selain itu → 403.
   - /dashboard, /learn, /my-courses, /transactions, /checkout, /settings → authenticated user
     (area student/umum, sudah ada).
   - PENTING: role check di middleware SAJA tidak cukup — setiap Server Action juga HARUS
     validasi role dari session (defense in depth). Middleware untuk UX redirect, bukan
     satu-satunya gerbang.

2. REDIRECT BY ROLE (kunci dari "make sense"-nya):
   - Setelah sign-in sukses, redirect berdasarkan role:
     STUDENT → /dashboard, INSTRUCTOR → /instructor, ADMIN → /admin.
   - Kalau instructor/admin membuka "/" (marketing homepage) atau /dashboard (area student),
     redirect ke workspace mereka masing-masing. Mereka tidak perlu marketing/landing.
   - Helper getRoleHomePath(role) untuk dipakai konsisten di sign-in callback + middleware.

3. INSTRUCTOR WORKSPACE SHELL (src/app/(instructor)/layout.tsx):
   - Layout SIDEBAR (management console), BUKAN top-nav student. Landing di /instructor.
   - Sidebar (kiri, collapsible di mobile), bg navy gelap + teks putih (jelas "area kerja", beda
     dari student area yang putih):
     - Dashboard (/instructor) — overview stats + analytics (dibangun di Prompt N)
     - My Courses (/instructor/courses)
     - Create Course (/instructor/courses/new)
   - (Analytics per-course diakses dari My Courses, bukan nav item terpisah. Revenue/earnings
     tampil sebagai stats di Dashboard — tidak ada halaman terpisah untuk scope ini.)
   - Top bar minimal: breadcrumb (kiri) + avatar dropdown (kanan) berisi HANYA: Settings, Sign Out.
   - TIDAK ADA: search course, "Courses"/"Categories" nav, tombol beli, cart, "Continue Learning",
     My Courses (enrolled), Purchase History, hero/marketing. Semua itu milik student.
   - Instructor bisa "Preview" course sendiri (read-only) — link dari My Courses, buka tampilan
     course seperti yang dilihat student TAPI tanpa enroll/beli (mode preview). Ini satu-satunya
     titik temu dengan UI student, dan harus read-only.

4. ADMIN CONSOLE SHELL (src/app/(admin)/layout.tsx):
   - Layout SIDEBAR juga (management console). Landing di /admin.
   - Sidebar (boleh bg navy gelap dengan badge/accent "Admin" misal amber, biar beda dari instructor):
     - Dashboard (/admin)
     - Courses (/admin/courses — semua course, moderasi)
     - Users (/admin/users)
     - Transactions (/admin/transactions — placeholder kalau Fase 2 belum jalan)
     - Categories (/admin/categories — kelola kategori)
   - Top bar minimal: breadcrumb + avatar dropdown (Settings, Sign Out).
   - TIDAK ADA UI belajar/marketing apa pun.

5. SHARED SHELL PRIMITIVES (hindari duplikasi instructor vs admin):
   - Buat komponen reusable: src/components/shared/workspace-shell.tsx (sidebar + topbar generik),
     instructor & admin tinggal pass config nav items + accent. JANGAN copy-paste dua layout
     hampir identik (langgar anti-pattern duplicate).

6. 403 PAGE (src/app/forbidden/page.tsx atau handler):
   - On-brand, pesan jelas "Anda tidak memiliki akses ke halaman ini".
   - Link kembali ke role-home masing-masing (pakai getRoleHomePath).

7. ROLE SEED:
   - Pastikan ada user tiap role yang bisa login: student@example.com, instructor (punya password),
     admin@example.com. TIDAK ADA UI ganti role di sini (role management ada di Prompt N, admin-only).

TESTABILITY:
   - data-testid: "instructor-sidebar", "admin-sidebar", "workspace-topbar", "forbidden-page",
     "preview-course-button"
   - Test case RBAC + redirect: login student → buka /instructor → 403; login instructor →
     buka / atau /dashboard → ke-redirect ke /instructor; login admin → /admin masuk.

JANGAN:
   - JANGAN reuse navbar student (search, courses, beli, purchase history) di shell instructor/admin.
   - JANGAN biarkan instructor/admin mendarat di marketing homepage atau student dashboard.
   - JANGAN hardcode role check di tiap page — pakai middleware + helper requireRole().
   - JANGAN duplikasi layout instructor & admin — pakai workspace-shell primitive bersama.
   - JANGAN buat UI ganti role di sini.

Sebelum lapor selesai: lint + type-check + test + build hijau. Buat helper requireRole() +
getRoleHomePath() dengan unit test (role match → pass, mismatch → error; tiap role → path benar).
Verifikasi: login tiap role → mendarat di shell yang benar; instructor buka /dashboard → redirect
ke /instructor; student buka /instructor → 403; shell instructor/admin TIDAK menampilkan elemen
student (search/beli/purchase history/continue learning).
```

---

### Prompt K — Course CRUD

```
Build course management (create, edit, delete, publish) untuk instructor.

REQUIREMENT:

1. PAGE: My Courses (/instructor/courses):
   - List semua course MILIK instructor yang login (filter by instructorId dari session).
   - Tampilkan: cover/thumbnail, judul, status badge (DRAFT/PUBLISHED/ARCHIVED), jumlah
     enrollment, tanggal dibuat.
   - Filter by status (All / Draft / Published / Archived).
   - Tombol "Create New Course" prominent.
   - Aksi per course: Edit, Delete (dengan konfirmasi dialog), Publish/Unpublish toggle.

2. PAGE: Create Course (/instructor/courses/new):
   - Form:
     - Judul (required, 5-100 char)
     - Subtitle (optional, max 200 char)
     - Deskripsi (required, markdown, min 50 char — pakai textarea yang cukup besar,
       atau basic markdown editor kalau ada waktu)
     - Kategori (dropdown dari Category yang ada di DB)
     - Level (BEGINNER / INTERMEDIATE / ADVANCED)
     - Harga (number input IDR, 0 = free, min 0)
     - Bahasa (default "id")
     - Cover label (untuk 3D text cover — input singkat, misal "Next.js")
   - Slug auto-generate dari judul (slugify: lowercase, strip special char, hyphenate)
     + cek uniqueness. Bisa di-override manual.
   - Status default: DRAFT. Belum bisa langsung publish dari form create.
   - Validation: Zod schema di src/schemas/course.ts (shared client+server).
   - Server Action: createCourseAction(input) — validasi role INSTRUCTOR/ADMIN + input,
     set instructorId dari session. Lewat service layer.
   - Setelah berhasil → redirect ke /instructor/courses/[courseId]/edit (untuk lanjut
     isi lessons).

3. PAGE: Edit Course (/instructor/courses/[courseId]/edit):
   - Sama seperti form create, tapi prefilled.
   - OWNERSHIP CHECK: course.instructorId === session.user.id (atau ADMIN). Kalau bukan → 403.
   - Tombol "Simpan Perubahan" (update, tetap di halaman).
   - Section "Danger Zone" di bawah: Delete Course (dialog konfirmasi: ketik judul course
     untuk confirm, kayak GitHub delete repo).
   - Link ke lesson management: "Kelola Lessons →" (masuk Prompt L).

4. PUBLISH / UNPUBLISH:
   - Dari My Courses list ATAU dari edit page.
   - Validasi sebelum publish: course HARUS punya minimal 1 lesson (lecture). Kalau kosong →
     tampilkan pesan "Tambahkan minimal 1 lesson sebelum publish".
   - Publish: set status PUBLISHED, publishedAt = now (sekali, jangan update kalau republish).
   - Unpublish: set status DRAFT (publishedAt tetap, biar histori kapan pertama publish ada).
   - Archive: hanya ADMIN bisa archive (set ARCHIVED). Instructor tidak bisa archive
     course sendiri dari UI.

5. DELETE:
   - Soft check: kalau course punya enrollment > 0, JANGAN izinkan delete — tampilkan pesan
     "Course dengan siswa terdaftar tidak bisa dihapus". Ini penting (jangan sampai mahasiswa
     kehilangan akses karena instructor delete).
   - Kalau enrollment 0 → hard delete (cascade: sections, lectures, quiz, progress).

6. SERVICE LAYER (src/server/services/course.ts — extend yang sudah ada):
   - createCourse(data, instructorId)
   - updateCourse(courseId, data, userId) — cek ownership
   - deleteCourse(courseId, userId) — cek ownership + enrollment count
   - publishCourse(courseId, userId) — cek ownership + minimal 1 lesson (lecture)
   - unpublishCourse(courseId, userId)

TESTABILITY:
   - data-testid: "create-course-button", "course-form-title", "course-form-price",
     "course-form-submit", "course-status-badge", "publish-button", "unpublish-button",
     "delete-course-button", "delete-confirm-dialog", "delete-confirm-input"
   - Ownership check testable: instructor A edit course instructor B → 403

JANGAN:
   - JANGAN izinkan instructor edit/delete course milik instructor lain.
   - JANGAN izinkan delete course yang punya enrollment.
   - JANGAN izinkan publish course tanpa konten.
   - JANGAN terima instructorId dari client — selalu dari session.

Sebelum lapor selesai: lint + type-check + test + build hijau. Unit test untuk: createCourse
(happy path), publishCourse (tanpa content → error), deleteCourse (ada enrollment → error,
tanpa enrollment → sukses), ownership check (bukan pemilik → error). Verifikasi: create →
muncul di list → edit → publish (gagal kalau kosong) → full flow.
```

---

### Prompt L — Lesson Management (flat, tanpa section)

```
Build lesson management untuk instructor — FLAT LIST lecture di dalam course, TANPA section/bab.
Instructor tidak pernah berurusan dengan konsep "section".

KONTEKS SCHEMA: schema punya Course → Section → Lecture (Section mandatory). Untuk menyembunyikan
section dari instructor TANPA ubah schema: setiap course otomatis punya SATU "default section"
(dibuat di belakang layar saat course dibuat / saat lesson pertama ditambahkan). Semua lecture
masuk ke default section itu. Instructor hanya melihat flat list lecture.

REQUIREMENT:

1. PAGE: Lessons (/instructor/courses/[courseId]/lessons):
   - Accessible dari edit course page ("Kelola Lessons →").
   - OWNERSHIP CHECK: sama seperti edit course (instructorId === session, atau ADMIN).
   - Layout: flat list lecture dalam course, urut berdasarkan `order`. TIDAK ada UI section.

2. DEFAULT SECTION (tersembunyi):
   - Saat course dibuat (Prompt K) atau saat lesson pertama ditambahkan, pastikan ada 1 Section
     default untuk course itu (judul internal misal "Main" — tidak ditampilkan ke instructor).
   - Helper ensureDefaultSection(courseId) — idempotent, return sectionId. Semua addLecture
     pakai section ini.
   - Student-facing learn page: kalau course cuma punya 1 section default, render lecture sebagai
     flat list (jangan tampilkan header section "Main"). Kalau course dari seed punya banyak
     section (multi-bab), tetap render per section seperti biasa. (Seed lama tetap kompatibel.)

3. LESSON MANAGEMENT:
   - Add lesson: form / modal:
     - Judul (required)
     - Type: VIDEO / READING / QUIZ (radio/select)
     - Kalau VIDEO: input URL video (paste URL mp4 atau YouTube embed) + durationSeconds
       (number input dalam detik — atau helper "menit:detik" yang di-convert)
     - Kalau READING: textarea markdown (contentMd)
     - Kalau QUIZ: tidak ada input tambahan di sini — quiz diisi di quiz builder (Prompt M).
       Buat Quiz record kosong otomatis saat lecture QUIZ dibuat.
   - Edit lesson: modal/inline, field sama.
   - Delete lesson: konfirmasi. Kalau punya progress student → warning "X siswa punya progress
     di lesson ini" (tetap izinkan delete, progress jadi orphan, acceptable).
   - Urutan: tombol naik/turun (move up / move down) per lesson — BUKAN drag-and-drop.
     Update field `order` dua lecture yang bertukar dalam satu transaction. Simpel & mudah di-test.

4. SERVER ACTIONS (src/server/actions/lesson.ts):
   - ensureDefaultSection(courseId) — internal helper (service).
   - addLesson(courseId, data) — ownership check, masuk ke default section, auto-order = last.
     Kalau type QUIZ, auto-create Quiz record.
   - updateLesson(lectureId, data) — ownership.
   - deleteLesson(lectureId) — ownership.
   - moveLesson(lectureId, direction: "up"|"down") — ownership, tukar order dengan tetangga,
     dalam transaction.
   Semua lewat service layer (src/server/services/lesson.ts).

TESTABILITY:
   - data-testid: "add-lesson-button", "lesson-item", "lesson-type-select",
     "lesson-video-url-input", "lesson-reading-content", "delete-lesson-button",
     "move-lesson-up", "move-lesson-down"
   - Urutan persist setelah refresh (bukan cuma visual).

JANGAN:
   - JANGAN tampilkan konsep "section/bab" ke instructor.
   - JANGAN ubah schema (section tetap ada di DB, hanya disembunyikan dari UI).
   - JANGAN izinkan edit lessons course milik instructor lain.
   - JANGAN lupa auto-create Quiz record saat lesson QUIZ dibuat (Prompt M butuh Quiz untuk diisi).
   - JANGAN pakai drag-and-drop (cukup move up/down).

Sebelum lapor selesai: lint + type-check + test + build hijau. Unit test untuk:
ensureDefaultSection (idempotent — panggil 2x, section tetap 1), addLesson type QUIZ (Quiz
auto-created + masuk default section), moveLesson (order tertukar benar, di ujung tidak error),
ownership check. Verifikasi: tambah lesson (video+reading+quiz) → urutkan naik/turun → refresh
→ urutan persist → publish course → student bisa belajar (flat, tanpa header section).
```

---

### Prompt M — Quiz Builder

```
Build quiz builder — UI untuk instructor bikin/edit quiz + soal. Sebelumnya quiz hanya via seed.

KONTEKS: Saat instructor buat lesson type QUIZ di lesson management (Prompt L), Quiz record
sudah auto-created (kosong, tanpa soal). Quiz builder ini untuk mengisi quiz tersebut.

REQUIREMENT:

1. AKSES: dari lesson management (Prompt L), lesson type QUIZ punya link/tombol "Edit Quiz →"
   yang mengarah ke quiz builder.

2. PAGE: Quiz Builder (/instructor/courses/[courseId]/quiz/[quizId]):
   - OWNERSHIP CHECK: quiz milik course milik instructor yang login.
   - Header: judul quiz (editable inline), link back ke lessons.

3. QUIZ SETTINGS (card/section atas):
   - Title (editable)
   - Description (optional, textarea)
   - Passing score (number, 0-100, default 70)
   - Time limit (optional, dalam detik — helper input "menit" yang di-convert. Kosong = untimed.)
   - Tombol "Simpan Settings".

4. QUESTION MANAGEMENT (section bawah):
   - List soal yang sudah ada, ordered.
   - Add question: form/modal:
     - Type: MULTIPLE_CHOICE / TRUE_FALSE
     - Question text (required, textarea)
     - Options:
       - MULTIPLE_CHOICE: dynamic list (add/remove option, min 2, max 6). Tiap option: text +
         checkbox "jawaban benar" (bisa lebih dari 1). Minimal 1 option harus ditandai benar.
       - TRUE_FALSE: otomatis 2 option ("Benar", "Salah"), user pilih mana yang benar.
     - Explanation (optional, textarea — ditampilkan saat review setelah submit quiz).
   - Edit question: sama, prefilled.
   - Delete question: konfirmasi.
   - Reorder questions: tombol naik/turun (move up/down), sama pola seperti lesson management.

5. OPTION STORAGE:
   - Options disimpan sebagai JSON di QuizQuestion.options (sudah di schema: Json field).
     Format: [{ id: "opt_1", text: "..." }, { id: "opt_2", text: "..." }, ...]
   - correctAnswerIds: String[] — berisi id option yang benar.
   - Generate option id: `opt_{index}` atau cuid/nanoid pendek. Harus stabil (jangan
     re-generate saat edit, karena QuizAttempt.answers reference option id lama).

6. PREVIEW:
   - Tombol "Preview Quiz" → render quiz persis seperti yang student lihat (pakai komponen
     quiz engine dari Prompt H, tapi dalam mode read-only / tanpa submit ke server).
     Berguna untuk instructor cek tampilannya.

7. VALIDASI:
   - Publish course yang punya lecture QUIZ tapi quiz-nya 0 soal → warning (bisa di-enforce
     atau cuma warning, pilih satu — konsisten dengan publish validation di Prompt K).

8. SERVER ACTIONS (src/server/actions/quiz-builder.ts):
   - updateQuizSettings(quizId, data) — ownership check.
   - addQuestion(quizId, data) — ownership, auto-order.
   - updateQuestion(questionId, data) — ownership.
   - deleteQuestion(questionId) — ownership.
   - reorderQuestions(quizId, orderedIds[]) — ownership, batch.
   Semua lewat service layer (src/server/services/quiz-builder.ts — pisah dari quiz.ts
   yang sudah ada untuk student-side).

TESTABILITY:
   - data-testid: "quiz-settings-form", "passing-score-input", "time-limit-input",
     "add-question-button", "question-item", "question-type-select", "option-input",
     "correct-answer-checkbox", "delete-question-button", "preview-quiz-button",
     "explanation-input"
   - Option id stabil (jangan regenerate saat edit).

JANGAN:
   - JANGAN campur service quiz builder (instructor) dengan quiz engine (student) di file
     yang sama. Pisah: quiz-builder.ts (CRUD soal) vs quiz.ts (attempt + grading).
   - JANGAN izinkan edit quiz course milik instructor lain.
   - JANGAN regenerate option id saat update question (break existing attempts).

Sebelum lapor selesai: lint + type-check + test + build hijau. Unit test untuk:
addQuestion (happy path, option < 2 → error, 0 correct answer → error),
updateQuizSettings (passing score out of range → error). Verifikasi: buat quiz → tambah soal
→ preview → student ambil quiz → grading benar sesuai soal baru.
```

---

### Prompt N — Instructor Analytics + Admin Panel + Fase 4 Polish

```
Final piece Fase 4: instructor analytics dashboard dan admin moderation.

REQUIREMENT:

1. INSTRUCTOR DASHBOARD (/instructor):
   - Welcome + nama
   - Stats cards (top):
     - Total courses (milik instructor)
     - Total students enrolled (across all courses)
     - Total revenue (sum Transaction SUCCESS, format Rupiah) — kalau Fase 2 belum jalan,
       tampilkan Rp 0 atau hide card. Jangan error.
     - Average completion rate (across courses)
   - Chart: Enrollment trend 30 hari terakhir (line chart sederhana — pakai recharts atau
     chart.js via shadcn chart component). Kalau data kurang, tampilkan empty state.
   - List recent enrollments (5 terbaru): nama student, course, tanggal.

2. INSTRUCTOR COURSE ANALYTICS (/instructor/courses/[courseId]/analytics):
   - Accessible dari My Courses list (tombol "Analytics").
   - Stats: total enrolled, completion rate, average quiz score (kalau ada quiz).
   - Breakdown per section/lecture: berapa % student yang sampai lecture itu (funnel).
   - OWNERSHIP CHECK.

3. ADMIN PANEL:
   a) Dashboard (/admin):
      - Total users, total courses (by status), total transactions, total revenue.
   b) Course management (/admin/courses):
      - List SEMUA course (bukan cuma milik admin).
      - Filter by status, instructor, kategori.
      - Aksi: Archive course (set ARCHIVED — soft remove dari listing publik).
      - Aksi: Unarchive (set DRAFT).
      - JANGAN bisa delete dari admin (cegah accidental nuke — hanya instructor bisa delete
        course sendiri yang enrollment-nya 0).
   c) User management (/admin/users):
      - List semua user. Tampilkan: nama, email, role, enrolled count, joined date.
      - Aksi: change role (dropdown → STUDENT/INSTRUCTOR/ADMIN) dengan konfirmasi dialog.
        Ini satu-satunya cara ganti role dari UI. Server Action validasi: hanya ADMIN.
      - JANGAN bisa delete user dari UI (terlalu destructive, out of scope).

4. SERVICE LAYER:
   - src/server/services/analytics.ts — getInstructorStats, getCourseAnalytics, getAdminStats.
     Query aggregation (groupBy, count, avg). Perhatikan performa kalau data besar — tapi
     untuk skala portfolio ini, raw query lewat Prisma aggregation cukup.
   - src/server/services/admin.ts — archiveCourse, changeUserRole. Role check ADMIN.

5. POLISH FASE 4:
   - Navigasi: workspace-shell sidebar (dari Prompt J) active state sesuai halaman aktif.
   - Breadcrumb di topbar semua halaman instructor/admin.
   - Empty states yang informatif (belum ada course, belum ada enrollment, dll).
   - Metadata (title) semua halaman baru.
   - Mobile responsive: sidebar collapsible.

TESTABILITY:
   - data-testid: "instructor-stats-cards", "enrollment-chart", "recent-enrollments",
     "course-analytics-funnel", "admin-course-list", "admin-archive-button",
     "admin-user-list", "admin-role-dropdown", "admin-role-confirm-dialog"
   - RBAC: student akses /admin → 403. Instructor akses /admin → 403. Admin akses semua.

JANGAN:
   - JANGAN kasih instructor akses ke data course orang lain (analytics, edit, dll).
   - JANGAN kasih admin kemampuan delete course/user (terlalu destructive).
   - JANGAN crash kalau Transaction belum ada (Fase 2 belum jalan) — handle gracefully.

Sebelum lapor selesai: lint + type-check + test + build hijau. Unit test untuk:
changeUserRole (non-admin → error, admin → sukses, gak bisa downgrade diri sendiri → error),
archiveCourse (non-admin → error), getInstructorStats (return angka benar).
Verifikasi RBAC: login student → /instructor → 403; login instructor → /admin → 403;
login admin → /admin → masuk → bisa ganti role user → bisa archive course.
```

---

### Catatan: Mux di-drop

Video di platform ini menggunakan URL input (instructor paste link mp4 / YouTube embed).
Tidak ada upload file / transcoding. Keputusan ini final untuk scope portfolio — kalau suatu
hari mau upgrade, cukup ganti input URL jadi upload component + R2/Mux di belakangnya.
Field `Lecture.videoAssetId` dan `videoPlaybackId` di schema tetap ada (nullable) tapi tidak
dipakai untuk saat ini.
