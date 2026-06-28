"use server";

import { CourseStatus } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth";
import { createSnapTransaction } from "@/lib/midtrans";
import { getCourseEnrollmentTarget } from "@/server/services/course";
import { findEnrollment } from "@/server/services/enrollment";
import {
  createPendingTransaction,
  findPendingTransaction,
  generateOrderId,
  saveMidtransToken,
} from "@/server/services/transaction";

export type CheckoutResult =
  | {
      status: "success";
      orderId: string;
      token: string | null;
      /** false when Midtrans isn't configured (skeleton/no-op mode). */
      configured: boolean;
    }
  | { status: "error"; message: string; redirectTo?: string };

/**
 * Start (or resume) checkout for a paid course. Creates a PENDING transaction
 * and asks Midtrans for a Snap token. Reuses an existing PENDING transaction so
 * a double click never creates two. In skeleton mode (no server key) the token
 * is null and `configured` is false — the UI shows a "not configured" state.
 */
export async function createCheckoutAction(
  courseId: string,
): Promise<CheckoutResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "Kamu harus login untuk checkout." };
  }

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

  const enrolled = await findEnrollment(user.id, courseId);
  if (enrolled) {
    return {
      status: "error",
      message: "Kamu sudah terdaftar di course ini.",
      redirectTo: `/learn/${courseId}`,
    };
  }

  // Reuse an active PENDING transaction to avoid duplicates on double submit.
  const pending = await findPendingTransaction(user.id, courseId);
  const orderId = pending?.orderId ?? generateOrderId();
  if (!pending) {
    await createPendingTransaction({
      userId: user.id,
      courseId,
      orderId,
      amount: course.price,
    });
  }

  const snap = await createSnapTransaction({
    orderId,
    grossAmount: course.price,
    customer: { first_name: user.name ?? "Student", email: user.email ?? "" },
    items: [
      { id: course.id, name: course.title, price: course.price, quantity: 1 },
    ],
  });

  if (snap.token) {
    await saveMidtransToken(orderId, snap.token);
  }

  return {
    status: "success",
    orderId,
    token: snap.token,
    configured: !snap.skipped,
  };
}
