import type { CourseStatus } from "@prisma/client";

// Pure (no DB / no server-only) so it is unit-testable. Encapsulates the
// eligibility rules for enrolling in a free course.

export type FreeEnrollmentInput = {
  isLoggedIn: boolean;
  status: CourseStatus;
  price: number;
};

export type EnrollmentEvaluation =
  | { allowed: true }
  | { allowed: false; error: string };

export function evaluateFreeEnrollment(
  input: FreeEnrollmentInput,
): EnrollmentEvaluation {
  if (!input.isLoggedIn) {
    return { allowed: false, error: "Kamu harus sign in untuk enroll." };
  }
  if (input.status !== "PUBLISHED") {
    return { allowed: false, error: "Course tidak ditemukan." };
  }
  if (input.price > 0) {
    return { allowed: false, error: "Course ini berbayar — gunakan checkout." };
  }
  return { allowed: true };
}
