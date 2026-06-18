# Fase 1B — Content Seeding

**Status: ✅ DONE** · Prompt 16

> > Tujuan: bikin platform keliatan "hidup" dan production-ready dengan konten fiktif tapi believable.
> > Konten masuk via seed script (belum ada instructor UI — itu Fase 4).
> > Data yang kaya ini juga penting buat fase testing nanti (filter combination, pagination, search butuh variasi data).

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
