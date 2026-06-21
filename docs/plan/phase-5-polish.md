# Fase 5 — Polish (Search + Social + Notification)

**Status: ✅ DONE** (search via ad-hoc Prompt A; review, recommendation, email selesai)

Yang sudah dikerjakan:
- **Search & filter** — ad-hoc (Prompt A), sebelum fase ini.
- **Review & rating** — model `Review` baru (migration `add_review`). Service `src/server/services/review.ts` (enrollment-gated upsert, summary, ratings map). UI: rating di hero + reviews section + form (hanya enrolled) di course detail, + bintang di course card (listing & homepage). Actions `src/server/actions/review.ts`.
- **Recommendation** — `getRelatedCourses()` di `course.ts` (PUBLISHED kategori sama, exclude current, order by enrollment count); section "Course terkait" di course detail.
- **Email notification (Resend)** — `src/lib/email.ts` (REST fetch, **no-op tanpa `RESEND_API_KEY`**, tak pernah throw) + template murni `src/lib/email-templates.ts`. Trigger: enrollment confirmation (`enrollFreeCourseAction`) + course completion (`syncCourseCompletion`, sekali saat completedAt pertama di-stamp).

**Catatan ops:** email butuh `RESEND_API_KEY` + `EMAIL_FROM` di env untuk benar-benar mengirim; tanpa itu jadi no-op (aman untuk dev/CI). Pengiriman nyata belum diverifikasi end-to-end (butuh kredensial) — logika no-op/transport ada di unit test.
