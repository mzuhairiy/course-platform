import { z } from "zod";

import { PAYMENT_METHOD_VALUES } from "@/config/payment";

/** Format order id yang dihasilkan generateOrderId(): ORD-{base36 ts}-{6 char}. */
export const ORDER_ID_PATTERN = /^ORD-[A-Z0-9]+-[A-Z0-9]{6}$/;

export const checkoutSchema = z.object({
  courseId: z.string().trim().min(1, "Course tidak valid"),
  paymentMethod: z.enum(PAYMENT_METHOD_VALUES, {
    message: "Pilih metode pembayaran",
  }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Hasil yang bisa dipilih user di payment simulator. */
export const PAYMENT_OUTCOMES = ["success", "cancel"] as const;

export const paymentSimulationSchema = z.object({
  orderId: z
    .string()
    .trim()
    .regex(ORDER_ID_PATTERN, "Order ID tidak valid"),
  outcome: z.enum(PAYMENT_OUTCOMES, { message: "Aksi tidak valid" }),
});

export type PaymentSimulationInput = z.infer<typeof paymentSimulationSchema>;
export type PaymentOutcome = PaymentSimulationInput["outcome"];
