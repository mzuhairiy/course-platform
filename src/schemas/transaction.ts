import { z } from "zod";

import { TRANSACTION_STATUS_VALUES } from "@/config/transaction-status";
import { ORDER_ID_PATTERN } from "@/schemas/checkout";

export const ADMIN_NOTE_MAX = 200;

/** Payload aksi admin di halaman detail transaksi. */
export const adminTransactionStatusSchema = z.object({
  orderId: z.string().trim().regex(ORDER_ID_PATTERN, "Order ID tidak valid"),
  status: z.enum(TRANSACTION_STATUS_VALUES, { message: "Status tidak valid" }),
  note: z
    .string()
    .trim()
    .max(ADMIN_NOTE_MAX, `Catatan maksimal ${ADMIN_NOTE_MAX} karakter`)
    .optional(),
});

export type AdminTransactionStatusInput = z.infer<
  typeof adminTransactionStatusSchema
>;
