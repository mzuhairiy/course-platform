"use server";

import { redirect } from "next/navigation";

import { evaluateFreeEnrollment } from "@/lib/enrollment-rules";
import { getCurrentUser } from "@/lib/auth";
import { sendEnrollmentEmail } from "@/lib/email";
import { siteConfig } from "@/config/site";
import { getCourseEnrollmentTarget } from "@/server/services/course";
import { createEnrollment } from "@/server/services/enrollment";

export type EnrollResult = { error: string } | undefined;

export async function enrollFreeCourseAction(
  courseId: string,
): Promise<EnrollResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Kamu harus sign in untuk enroll." };
  }

  const course = await getCourseEnrollmentTarget(courseId);
  if (!course) {
    return { error: "Course tidak ditemukan." };
  }

  const evaluation = evaluateFreeEnrollment({
    isLoggedIn: true,
    status: course.status,
    price: course.price,
  });
  if (!evaluation.allowed) {
    return { error: evaluation.error };
  }

  const firstLectureId = course.sections[0]?.lectures[0]?.id ?? null;
  if (!firstLectureId) {
    return { error: "Course ini belum punya materi." };
  }

  await createEnrollment(user.id, courseId);

  // Best-effort enrollment email (no-op locally without RESEND_API_KEY; never
  // throws — see sendEmail). Awaited before the redirect that follows.
  if (user.email) {
    await sendEnrollmentEmail(user.email, {
      name: user.name ?? "there",
      courseTitle: course.title,
      courseUrl: `${siteConfig.url}/courses/${course.slug}`,
    });
  }

  // redirect() throws; must stay outside any try/catch.
  redirect(`/learn/${courseId}/${firstLectureId}`);
}
