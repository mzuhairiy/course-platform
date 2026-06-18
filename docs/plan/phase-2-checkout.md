# Fase 2 — Checkout & Midtrans

**Status: ⏳ TODO (ditunda — dikerjakan setelah Fase 3 learning)** · Prompt 11–15

> > Prasyarat: Fase 1 selesai dan stable. Pakai **Midtrans Sandbox** dulu (production nanti).
> > Paste satu per satu, sama disiplinnya kayak Fase 1.

> Prasyarat: daftar akun Midtrans Sandbox, siapkan Server Key + Client Key. Webhook lokal butuh ngrok / Midtrans simulator.

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
