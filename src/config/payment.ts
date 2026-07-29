/**
 * Dummy payment config. Platform ini TIDAK pakai payment gateway — checkout
 * disimulasikan penuh di server (lihat src/server/services/transaction.ts),
 * tapi transaksinya tetap tercatat di DB seperti pembayaran sungguhan.
 *
 * `value` disimpan apa adanya di Transaction.paymentMethod.
 */

export const PAYMENT_METHOD_VALUES = [
  "bank_transfer",
  "e_wallet",
  "credit_card",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHOD_VALUES)[number];

export type PaymentMethodOption = {
  value: PaymentMethod;
  label: string;
  description: string;
};

export const PAYMENT_METHODS: readonly PaymentMethodOption[] = [
  {
    value: "bank_transfer",
    label: "Transfer Bank",
    description: "BCA / Mandiri / BNI — virtual account",
  },
  {
    value: "e_wallet",
    label: "E-Wallet",
    description: "GoPay / OVO / DANA",
  },
  {
    value: "credit_card",
    label: "Kartu Kredit",
    description: "Visa / Mastercard",
  },
];

export const DEFAULT_PAYMENT_METHOD: PaymentMethod = "bank_transfer";

/** Label untuk ditampilkan; fallback ke raw value kalau metodenya tak dikenal. */
export function paymentMethodLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value;
}
