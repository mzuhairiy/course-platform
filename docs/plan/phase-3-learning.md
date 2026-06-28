# Fase 3 — Learning Experience (Progress + Certificate + Quiz)

**Status: ✅ DONE** · Prompt F, G, H, I

> Menutup learning loop: video/reading → progress tracking → quiz → course completion → certificate → verifikasi publik.
> Tidak ada perubahan schema — `LectureProgress`, `Enrollment.completedAt`, `Quiz`, `QuizQuestion`, `QuizAttempt`, `Certificate` semua sudah ada di `docs/reference/schema.md`.

**Keputusan desain yang sudah dikunci:**
- **Navigasi lecture:** free navigation (tidak ada hard-lock antar materi). Gate yang meaningful ada di certificate (butuh 100% complete).
- **Quiz attempts:** unlimited.
- **Quiz reveal:** jawaban benar + explanation muncul setelah submit, bukan live.
- **Quiz timed:** engine support `timeLimit` (nullable), server-authoritative. Mayoritas untimed, minimal 1 timed untuk showcase.
- **Scoring:** all-or-nothing per soal, skor = (soal benar / total) × 100.

Aturan koding (anti-pattern, testability hooks) → `CLAUDE.md`.

---

### Prompt F — Progress Tracking

```
Build progress tracking untuk learning experience. Schema sudah mendukung
(LectureProgress, watchedSeconds, isCompleted) — JANGAN ubah schema.

KONTEKS NAVIGASI: free navigation — user boleh akses lecture mana saja (tidak ada hard-lock).
Progress di-track per lecture, percentage dihitung real-time.

REQUIREMENT:

1. DUMMY VIDEO:
   - Pakai SATU video dummy kecil (<2MB, durasi 10-15 detik) untuk semua VIDEO lecture.
   - Commit ke /public/sample-lecture.mp4. Kalau ffmpeg tersedia, generate clip sederhana
     (warna solid + teks "Sample Lecture" + counter detik). Kalau tidak, download satu klip
     CC kecil berdurasi ~10 detik. Pastikan ukuran kecil.
   - Update seed: semua VIDEO lecture pakai URL lokal /sample-lecture.mp4 (ganti URL Google
     bucket yang lama). durationSeconds disesuaikan dengan durasi dummy (mis. 12).

2. VIDEO PROGRESS:
   - Track watchedSeconds via event timeupdate (throttle update ke server ~setiap 5 detik
     + saat pause + saat ended, JANGAN tiap tick — hindari spam request).
   - Definisi COMPLETED: watched >= 90% durasi ATAU event 'ended'. Saat tercapai → set
     isCompleted = true, completedAt = now (idempotent, jangan flip-flop).
   - Resume: saat buka lecture, set currentTime video ke watchedSeconds terakhir.

3. READING PROGRESS:
   - Tombol "Tandai Selesai" → set isCompleted. (Opsional: auto-complete saat scroll ke bawah,
     tapi tombol tetap ada sebagai fallback dan untuk testability.)

4. QUIZ lecture (kalau ada di seed sebagai placeholder):
   - Belum ada quiz engine. Sediakan tombol "Tandai Selesai" manual sementara, ATAU
     kecualikan QUIZ dari perhitungan total. Pilih SATU pendekatan dan konsisten —
     dokumentasikan pilihan di kode (comment).
     (CATATAN: hack ini akan diganti oleh Prompt H — quiz lecture complete saat user PASSED.)

5. PERCENTAGE REAL-TIME:
   - Course progress = (jumlah lecture completed / total lecture yang dihitung) * 100, bulatkan.
   - Tampilkan di: sidebar learn page (progress bar + "X dari Y selesai"), course header,
     dan di dashboard / my-courses card (ganti placeholder progress Fase 1).
   - Update SEGERA setelah lecture selesai (revalidate path / optimistic update) — tanpa
     perlu refresh manual.
   - Indikator per lecture di sidebar: checkmark hijau kalau completed, indikator lecture aktif.

6. SERVER LAYER (src/server/services/progress.ts):
   - updateLectureProgress(userId, lectureId, watchedSeconds) — hitung isCompleted, upsert.
   - getCourseProgress(userId, courseId) — return { completed, total, percentage, perLecture }.
   - getResumeLecture(userId, courseId) — return lecture incomplete pertama (urut section.order
     lalu lecture.order); kalau semua complete, return lecture pertama.
   - Server Action di src/server/actions/progress.ts memanggil service. Ambil userId dari
     SESSION, jangan dari client. Validasi user enrolled di course tsb sebelum update.

7. CONTINUE LEARNING ROUTING:
   - Tombol "Continue Learning" (dashboard, my-courses, course detail saat enrolled) HARUS
     mengarah ke lecture INCOMPLETE pertama via getResumeLecture, bukan selalu lecture pertama.
   - Kalau semua lecture sudah complete → arahkan ke lecture pertama (mode review) ATAU
     tampilkan state completed. Pilih satu, konsisten.

TESTABILITY (wajib):
   - data-testid: "lecture-progress-bar", "course-progress-percentage", "lecture-complete-check",
     "mark-complete-button", "video-element"
   - Completion deterministic (threshold 90% tetap, bukan random).
   - Percentage muncul sebagai angka di DOM yang bisa di-assert.

JANGAN:
   - JANGAN spam server tiap timeupdate tick (throttle).
   - JANGAN terima userId dari client.
   - JANGAN izinkan update progress untuk course yang user belum enroll.

Sebelum lapor selesai: lint + type-check + test + build hijau. Unit test untuk
updateLectureProgress (belum complete → 50% watched, complete → 90%, idempotent saat sudah
complete) dan getCourseProgress (0%, sebagian, 100%). Verifikasi: nonton sampai habis →
checkmark muncul → percentage naik real-time tanpa refresh.
```

---

### Prompt G — Course Completion + Certificate PDF

```
Build course completion + certificate download. Model Certificate sudah ada di schema
(certificateNumber, issuedAt, pdfUrl) — JANGAN ubah schema.

REQUIREMENT:

1. COMPLETION LOGIC:
   - Saat course progress mencapai 100% (semua lecture completed), set Enrollment.completedAt = now
     (sekali saja, idempotent). Lakukan pengecekan ini di dalam flow updateLectureProgress
     (service layer) setelah lecture terakhir selesai.
   - Tampilkan state "Course Completed 🎉" di learn page + course header saat 100%.

2. CERTIFICATE ISSUANCE:
   - Certificate baru bisa diakses HANYA jika Enrollment.completedAt terisi (course 100% selesai).
     Kalau belum, tombol download disabled + helper text "Selesaikan semua materi untuk
     membuka sertifikat".
   - certificateNumber di-generate sekali saat pertama kali completed, format CERT-{YYYY}-{XXXXX}
     (XXXXX = 5 digit/alfanumerik unik). Simpan ke tabel Certificate (upsert by userId+courseId,
     unique). Reuse certificateNumber yang sama untuk download berikutnya (jangan generate ulang).

3. PDF GENERATION:
   - Pakai @react-pdf/renderer (server-side). Generate ON-DEMAND, tidak perlu simpan file ke
     storage (pdfUrl boleh tetap null untuk sekarang).
   - Route handler GET /api/certificates/[courseId]:
     - Verifikasi: user login, enrolled, completedAt terisi, certificate milik user tsb.
       Kalau tidak memenuhi → 403/404 (jangan bocorkan sertifikat orang lain).
     - Generate PDF, return sebagai download (Content-Disposition: attachment;
       filename="certificate-{course-slug}.pdf", Content-Type: application/pdf).
   - KONTEN PDF (layout tengah, rapi, landscape A4):
     - H1 bold: "Certificate of Completion"
       di bawahnya, kecil: certificateNumber (mis. "CERT-2026-A1B2C")
     - H3 bold + italic: Nama Student
     - Paragraf italic: "Telah menyelesaikan course {nama_course}"
     - Bagian bawah: Nama instruktur + "signature" instruktur berupa INISIAL nama
       (contoh: "Andi Pratama" → "AP"), render inisial dengan font script/italic besar
       sebagai tanda tangan, dengan garis di atas nama.
   - Styling sederhana tapi rapi: border tipis di tepi, warna navy untuk heading (sesuai theme),
     spacing lega. Jangan ramai.

4. UI:
   - Di learn page (saat completed) + course detail (saat user enrolled & completed) +
     dashboard: tampilkan tombol "Download Certificate".
   - Tombol memicu download dari route handler di atas (buka /api/certificates/[courseId]).
   - Loading state saat generate.

5. SERVICE LAYER (src/server/services/certificate.ts):
   - issueCertificateIfEligible(userId, courseId) — cek completedAt, upsert Certificate,
     return certificateNumber. Idempotent.
   - generateCertificatePdf(data) — return PDF buffer/stream. Pisahkan logic dari route
     supaya bisa di-test.

TESTABILITY (wajib):
   - data-testid: "download-certificate-button", "certificate-locked-message",
     "course-completed-banner"
   - certificateNumber deterministic setelah di-issue (tidak berubah tiap download).
   - Inisial signature deterministic dari nama instruktur.

JANGAN:
   - JANGAN izinkan download certificate kalau belum 100% complete.
   - JANGAN generate ulang certificateNumber yang sudah ada.
   - JANGAN bocorkan certificate milik user lain (cek ownership).
   - JANGAN simpan/expose data sensitif di nama file atau metadata PDF.

Sebelum lapor selesai: lint + type-check + test + build hijau. Unit test untuk:
issueCertificateIfEligible (belum complete → tidak issue, complete → issue + idempotent),
fungsi inisial signature ("Andi Pratama" → "AP", "Budi" → "B", handle nama 3 kata),
generateCertificatePdf (menghasilkan PDF non-kosong). Verifikasi end-to-end: selesaikan course
→ banner completed → download → PDF berisi data benar.
```

---

### Prompt H — Quiz Engine

```
Build quiz engine. Schema sudah lengkap (Quiz, QuizQuestion, QuizAttempt) — JANGAN ubah schema.
Ini menggantikan placeholder QUIZ lecture dari Prompt F (progress tracking).

KEPUTUSAN DESAIN (ikuti persis):
- Navigasi quiz: attempt UNLIMITED (tiap mulai = QuizAttempt baru, kecuali ada in-progress).
- Reveal jawaban: SETELAH submit (skor + review per soal + explanation), BUKAN live feedback.
- Timed: engine support timeLimit (nullable). Server adalah sumber kebenaran waktu, bukan client.
- Scoring: all-or-nothing per soal (untuk MULTIPLE_CHOICE dengan >1 jawaban benar, user harus
  pilih SET yang tepat — tidak ada partial credit). Skor = (soal benar / total soal) * 100.

REQUIREMENT:

1. STATE MACHINE (per attempt):
   - NOT_STARTED → tampil intro: judul, deskripsi, jumlah soal, passing score, time limit (kalau ada),
     riwayat attempt sebelumnya (skor + passed/failed + tanggal). Tombol "Mulai Quiz".
   - IN_PROGRESS → render soal, user jawab. QuizAttempt dibuat (startedAt, submittedAt null).
     - Cegah DUPLICATE in-progress: kalau sudah ada attempt dengan submittedAt null & belum expired,
       lanjutkan attempt itu (jangan buat baru).
   - SUBMITTED → submittedAt diisi, skor + passed dihitung SERVER-SIDE, tampil hasil + review.

2. QUESTION RENDERING:
   - MULTIPLE_CHOICE: radio kalau 1 jawaban benar, checkbox kalau >1 jawaban benar.
   - TRUE_FALSE: dua pilihan.
   - Tampilkan progress "Soal X dari Y". Boleh navigasi antar soal (next/prev) atau one-page —
     pilih one-page (semua soal dalam satu halaman) biar lebih simpel & mudah di-test.
   - Jawaban disimpan di client state selama mengerjakan; dikirim sekaligus saat submit.

3. KEAMANAN — KRITIS:
   - correctAnswerIds dan explanation TIDAK BOLEH dikirim ke client sebelum submit.
     Payload soal ke client hanya: id, type, question, options (tanpa flag mana yang benar), order.
     (Ini test surface penting: kebocoran kunci jawaban via network/API.)
   - Grading WAJIB server-side. Server terima { attemptId, answers: [{questionId, selectedIds}] },
     hitung skor sendiri. JANGAN terima skor dari client.
   - Validasi attempt milik user yang login (dari session), user enrolled di course-nya.

4. TIMED QUIZ:
   - Countdown di client berdasarkan (startedAt + timeLimit) dari server, bukan timer client murni.
   - Waktu habis → auto-submit jawaban yang sudah ada.
   - Server-side guard saat submit: kalau (now - startedAt) > timeLimit + grace 5 detik, hanya
     nilai jawaban yang masuk (atau tolak submit terlambat sesuai kebijakan) — JANGAN percaya
     bahwa submit datang tepat waktu hanya karena client bilang begitu.

5. HASIL & REVIEW (setelah submit):
   - Tampil skor (%), passed/failed (vs passingScore), badge.
   - Review per soal: jawaban user, jawaban benar, benar/salah, explanation.
   - Tombol "Coba Lagi" (mulai attempt baru) dan "Lanjut" (ke lecture berikutnya).

6. INTEGRASI PROGRESS (menutup hack placeholder dari Prompt F):
   - QUIZ lecture dianggap COMPLETED saat user PASSED quiz (skor >= passingScore) minimal sekali.
   - Saat passed pertama kali → set LectureProgress.isCompleted untuk lecture quiz tsb, lalu
     recompute course progress (panggil logic yang sudah ada). Hapus hack tombol manual /
     exclude-from-count yang dipakai sementara untuk QUIZ.
   - RENDERING DI LEARN PAGE: saat user navigate ke lecture bertipe QUIZ (via sidebar atau
     prev/next), area konten utama (yang biasanya video player) diganti dengan quiz engine
     inline — bukan halaman terpisah. Intro → soal → hasil semua tampil di area konten learn page.
     Prev/Next lecture tetap berfungsi normal di sekitarnya.

7. SEED:
   - Lengkapi quiz untuk lecture QUIZ placeholder yang sudah ada: 4-6 soal per quiz, mix
     MULTIPLE_CHOICE (termasuk minimal 1 soal multi-jawaban) & TRUE_FALSE, explanation terisi,
     passingScore wajar (mis. 60-70).
   - Minimal SATU quiz dibuat timed (timeLimit mis. 120 detik) untuk showcase, sisanya untimed.

8. SERVICE LAYER (src/server/services/quiz.ts):
   - startQuizAttempt(userId, quizId) — resume in-progress kalau ada & belum expired, else buat baru.
   - submitQuizAttempt(userId, attemptId, answers) — grade server-side, simpan score/passed/
     submittedAt, trigger update progress kalau passed. Idempotent (attempt yang sudah submitted
     tidak bisa di-submit ulang).
   - getQuizForAttempt(quizId) — return soal TANPA kunci jawaban (untuk client).
   - Server Actions di src/server/actions/quiz.ts memanggil service; userId dari session.

TESTABILITY (wajib):
   - data-testid: "quiz-intro", "start-quiz-button", "quiz-question", "quiz-option",
     "submit-quiz-button", "quiz-timer", "quiz-result", "quiz-score", "quiz-passed-badge",
     "quiz-review-item", "retry-quiz-button", "quiz-attempt-history"
   - Scoring deterministic. Timer berbasis server timestamp (deterministic, bukan drift client).

JANGAN:
   - JANGAN kirim correctAnswerIds/explanation ke client sebelum submit.
   - JANGAN terima skor dari client — selalu hitung di server.
   - JANGAN izinkan submit ulang attempt yang sudah submitted.
   - JANGAN percaya waktu submit dari client untuk timed quiz.
   - JANGAN izinkan akses quiz untuk course yang user belum enroll.

Sebelum lapor selesai: lint + type-check + test + build hijau. Unit test untuk:
- grading: all-correct → 100% passed, sebagian → skor benar, multi-jawaban all-or-nothing
  (kurang 1 → soal itu salah), kosong → 0%.
- submitQuizAttempt idempotent (submit 2x tidak ubah hasil / ditolak).
- in-progress resume (start 2x → attempt sama, bukan duplikat).
- timed: submit setelah expiry di-handle sesuai kebijakan.
- getQuizForAttempt TIDAK mengandung correctAnswerIds (assert tidak bocor).
Verifikasi end-to-end: mulai → jawab → submit → skor benar → review tampil → passed menandai
lecture quiz complete → course progress naik.
```

---

### Prompt I — Certificate Verification Page

```
Build halaman verifikasi sertifikat PUBLIK. Tidak ada perubahan schema — pakai
Certificate.certificateNumber (sudah @unique, format CERT-YYYY-XXXXX).

KONTEKS: ini melengkapi Prompt G. Sertifikat punya nomor unik yang bisa diverifikasi pihak
ketiga (mis. recruiter) tanpa login. Kontras dengan /api/certificates/[courseId] yang justru
PROTECTED — halaman ini publik tapi hanya mengungkap data minimal.

REQUIREMENT:

1. HALAMAN /verify (publik, tanpa auth):
   - Input nomor sertifikat + tombol "Verifikasi". Boleh juga /verify/[certificateNumber]
     untuk direct link (deep-linkable).
   - VALID → tampilkan: status valid (badge hijau), nama penerima, judul course, tanggal terbit,
     nama instruktur. JANGAN tampilkan email atau data sensitif lain.
   - INVALID / tidak ditemukan → pesan "Sertifikat tidak ditemukan" (jangan bocorkan apakah
     formatnya benar tapi tidak ada, atau formatnya salah — pesan seragam saja).
   - Sertakan link ke /verify di dalam PDF sertifikat (Prompt G) — mis. teks kecil
     "Verifikasi di {URL}/verify" dengan nomor tercantum.

2. SERVICE LAYER (src/server/services/certificate.ts):
   - verifyCertificate(certificateNumber) — return data minimal { valid, recipientName,
     courseTitle, issuedAt, instructorName } atau { valid: false }. Hanya field yang aman
     untuk publik. Validasi format input dulu (regex CERT-YYYY-XXXXX) sebelum query.

3. UX:
   - Input validation: format salah → pesan inline sebelum hit server.
   - Loading state saat verifikasi.
   - Halaman ringan, on-brand (navy/putih), bisa diakses tanpa login.

TESTABILITY (wajib):
   - data-testid: "verify-input", "verify-submit", "verify-result-valid",
     "verify-result-invalid", "verify-recipient-name", "verify-course-title"
   - Hasil deterministic untuk nomor yang sama.

JANGAN:
   - JANGAN ekspos email, userId, atau data sensitif di hasil verifikasi.
   - JANGAN bedakan pesan error antara "format salah" vs "tidak ada" (cegah enumeration).
   - JANGAN butuh auth untuk halaman ini.

Sebelum lapor selesai: lint + type-check + test + build hijau. Unit test untuk
verifyCertificate (nomor valid → data benar & minimal, nomor tidak ada → invalid,
format salah → invalid tanpa query DB). Verifikasi end-to-end: terbitkan sertifikat →
ambil nomornya → verifikasi di /verify → data tampil; nomor ngasal → invalid.
```

---

### Catatan edge/empty states (berlaku untuk F, G, H)

Handle saat membangun, jangan ditunda:
- Course tanpa lecture / section kosong → jangan crash, tampilkan empty state.
- Course 1 lecture → prev/next handle (tidak ada prev di pertama, tidak ada next di terakhir).
- Quiz tanpa soal → jangan bisa di-start, tampilkan pesan.
- Lecture quiz tapi Quiz belum ter-seed → fallback aman (jangan error).
