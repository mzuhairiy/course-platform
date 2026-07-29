"use server";

import { CourseStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { toFieldErrors, type FieldErrors } from "@/lib/form-errors";
import {
  checkoutSchema,
  paymentSimulationSchema,
  type CheckoutInput,
  type PaymentSimulationInput,
} from "@/schemas/checkout";
import { getCourseEnrollmentTarget } from "@/server/services/course";
import { findEnrollment } from "@/server/services/enrollment";
import {
  applyPaymentOutcome,
  createPendingTransaction,
  findPendingTransaction,
  generateOrderId,
  updatePaymentMethod,
} from "@/server/services/transaction";

export type CheckoutResult =
  | { status: "success"; orderId: string }
  | {
      status: "error";
      message: string;
      fieldErrors?: FieldErrors;
      redirectTo?: string;
    };

/**
 * Start (or resume) checkout for a paid course: records a PENDING transaction
 * and hands the order id back so the UI can move to the status page. No payment
 * gateway is involved — settlement happens in simulatePaymentAction.
 *
 * Reuses an existing PENDING transaction so a double submit never creates two.
 */
export async function createCheckoutAction(
  input: CheckoutInput,
): Promise<CheckoutResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "Kamu harus login untuk checkout." };
  }

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Input tidak valid",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }
  const { courseId, paymentMethod } = parsed.data;

  const course = await getCourseEnrollmentTarget(courseId);
  if (!course || course.status !== CourseStatus.PUBLISHED) {
    return { status: "error", message: "Course tidak ditemukan." };
  }
  if (course.price <= 0) {
    return {
      status: "error",
      message: "Course ini gratis — gunakan enroll biasa.",
      redirectTo: `/courses/${course.slug}`,
    };
  }

  if (await findEnrollment(user.id, courseId)) {
    return {
      status: "error",
      message: "Kamu sudah terdaftar di course ini.",
      redirectTo: `/courses/${course.slug}`,
    };
  }

  const pending = await findPendingTransaction(user.id, courseId);
  if (pending) {
    // Resume the same order; the user may have picked a different method.
    if (pending.paymentMethod !== paymentMethod) {
      await updatePaymentMethod(pending.orderId, paymentMethod);
    }
    return { status: "success", orderId: pending.orderId };
  }

  const orderId = generateOrderId();
  await createPendingTransaction({
    userId: user.id,
    courseId,
    orderId,
    amount: course.price,
    paymentMethod,
  });

  revalidatePath("/purchase-history");
  return { status: "success", orderId };
}

export type SimulationResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string };

/**
 * Dummy payment simulator: settle or cancel a PENDING order. Ownership,
 * idempotency, and the settle+enroll atomicity all live in applyPaymentOutcome.
 */
export async function simulatePaymentAction(
  input: PaymentSimulationInput,
): Promise<SimulationResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "Kamu harus login." };
  }

  const parsed = paymentSimulationSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Input tidak valid" };
  }
  const { orderId, outcome } = parsed.data;

  const result = await applyPaymentOutcome(user.id, orderId, outcome);
  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  revalidatePath("/checkout/status");
  revalidatePath("/purchase-history");
  if (result.courseId) revalidatePath(`/learn/${result.courseId}`);

  return { status: "success", message: result.message };
}
