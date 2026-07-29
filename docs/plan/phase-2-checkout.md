# Fase 2 — Checkout (Dummy Payment)

**Status: ✅ DONE** · Prompt 11–15 (di-rescope)

> **Keputusan (major change):** payment gateway **Midtrans di-drop**. Effort integrasi + maintenance akun sandbox + ngrok buat webhook lokal nggak sebanding nilainya buat portfolio QA. Checkout disimulasikan penuh di server, tapi **transaksinya tetap tercatat di database** seperti pembayaran sungguhan.
>
> Yang hilang cuma HTTP call ke gateway. Yang tetap ada dan tetap jadi bahan test: state machine transaksi, idempotensi, ownership check, atomicity settle+enroll, dan anti-forgery status page. Lihat `docs/adr/0001-tech-stack.md`.

---

## Yang dibangun

### Alur (2 langkah)

```
/courses/[slug]  →  [Buy for Rp ...]
        ↓
/checkout/[courseId]
   Order summary + pilih metode pembayaran (dummy)
   [Bayar Sekarang]  →  Transaction PENDING tersimpan
        ↓
/checkout/status?order_id=ORD-...
   Status PENDING → Payment Simulator:
     [Bayar Berhasil]     → SUCCESS + Enrollment (satu DB transaction)
     [Batalkan Pembayaran] → CANCELLED
        ↓
   Status SUCCESS → [Mulai Belajar] → /learn/[courseId]/[lectureId]
```

Transaksi PENDING bisa dilanjutkan kapan saja lewat **Purchase History → "Lanjutkan pembayaran"**.

### File

| File | Isi |
|---|---|
| `src/config/payment.ts` | Daftar metode pembayaran dummy (`bank_transfer`, `e_wallet`, `credit_card`) + label |
| `src/schemas/checkout.ts` | `checkoutSchema`, `paymentSimulationSchema`, `ORDER_ID_PATTERN` |
| `src/server/services/transaction.ts` | `generateOrderId`, CRUD transaksi, `applyPaymentOutcome` (inti logic, HTTP-free) |
| `src/server/actions/checkout.ts` | `createCheckoutAction`, `simulatePaymentAction` |
| `src/app/(student)/checkout/[courseId]/page.tsx` | Order summary + form metode pembayaran |
| `src/app/(student)/checkout/status/page.tsx` | Status transaksi (dari DB) + payment simulator |
| `src/components/features/checkout/checkout-form.tsx` | Client form (radio metode + submit) |
| `src/components/features/checkout/payment-simulator.tsx` | Tombol settle / cancel |
| `tests/unit/transaction-service.test.ts` | Unit test `applyPaymentOutcome` + schema |

### Aturan yang di-enforce di `applyPaymentOutcome`

1. **Ownership** — query di-scope ke `{ orderId, userId }`. Order orang lain = not found, bukan sekadar hidden.
2. **Idempotent** — settle kedua kali di order yang sudah SUCCESS = no-op, enrollment nggak dobel.
3. **State machine** — hanya PENDING yang boleh berubah. CANCELLED/EXPIRED nggak bisa dibuka lagi; user harus checkout ulang.
4. **Atomicity** — update transaksi + create enrollment dalam satu `db.$transaction`. Order lunas nggak mungkin tanpa akses.
5. **Anti-forgery** — status page baca status dari DB, bukan dari query param. `order_id` cuma buat lookup.
6. **No double order** — `createCheckoutAction` reuse transaksi PENDING yang sudah ada untuk user+course yang sama.

### Testability hooks

`checkout-page` · `order-summary` · `order-title` · `order-total` · `checkout-form` · `payment-method-{value}` · `pay-now-button` · `checkout-error` · `dummy-payment-note` · `loading` · `checkout-status` · `status-success` · `status-pending` · `status-failed` · `payment-simulator` · `simulate-success-button` · `simulate-cancel-button` · `simulator-error` · `transaction-detail` · `detail-order-id` · `detail-payment-method` · `detail-status` · `detail-amount` · `start-learning-button` · `retry-payment-button` · `purchase-history` · `transaction-row` · `continue-payment-link` · `purchase-history-empty`

Radio metode pembayaran punya `name="paymentMethod"`.

---

## Yang sengaja TIDAK dibangun

- **Webhook** (`/api/webhooks/midtrans`) — dihapus. Tanpa gateway nggak ada yang manggil.
- **Snap.js popup / client key** — dihapus, termasuk semua env var `MIDTRANS_*`.
- **Status polling** — nggak perlu; state berubah cuma karena aksi user, jadi deterministik (sesuai aturan testability di `CLAUDE.md`).
- **FAILED / EXPIRED / REFUNDED** — enum-nya masih ada di schema, tapi belum ada alur yang menghasilkannya. Kalau nanti butuh (misal simulasi expiry), tambahin outcome baru di `PAYMENT_OUTCOMES`.

---

## Acceptance criteria — ✅ semua tercapai

- ✅ Full flow: browse paid course → checkout → simulasi bayar → otomatis enrolled → bisa nonton
- ✅ Transaksi tercatat di DB dengan orderId, amount, metode, status, `paidAt`
- ✅ Settle idempotent; enrollment nggak dobel
- ✅ Status page nggak bisa dipalsukan lewat query param, nggak bocorin order user lain
- ✅ Transaksi PENDING bisa dilanjutkan, klik dobel nggak bikin order kedua
- ✅ Unit test transaction logic hijau
- ✅ lint + type-check + test + build hijau
