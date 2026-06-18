import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EnrolledCourseCard } from "@/components/features/course/enrolled-course-card";
import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import { getCurrentUser } from "@/lib/auth";
import { getEnrolledCourses } from "@/server/services/enrollment";
import {
  getCourseProgress,
  getResumeLecture,
} from "@/server/services/progress";

export const metadata: Metadata = {
  title: "My Courses",
};

export default async function MyCoursesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in?callbackUrl=/my-courses");
  }

  const enrollments = await getEnrolledCourses(user.id);
  const [progressByCourse, resumeByCourse] = await Promise.all([
    Promise.all(
      enrollments.map((enrollment) =>
        getCourseProgress(user.id, enrollment.course.id),
      ),
    ),
    Promise.all(
      enrollments.map((enrollment) =>
        getResumeLecture(user.id, enrollment.course.id),
      ),
    ),
  ]);

  return (
    <Section spacing="compact">
      <Container className="space-y-6" data-testid="my-courses">
        <header className="space-y-1">
          <Heading as="h1" level="h1">
            My Courses
          </Heading>
          <Text variant="lead">
            {enrollments.length} enrolled course
            {enrollments.length === 1 ? "" : "s"}
          </Text>
        </header>

        {enrollments.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment, i) => (
              <EnrolledCourseCard
                key={enrollment.id}
                enrollment={enrollment}
                progress={progressByCourse[i]}
                resumeLectureId={resumeByCourse[i]}
              />
            ))}
          </div>
        ) : (
          <div
            className="space-y-3 rounded-lg border border-dashed border-border p-12 text-center"
            data-testid="my-courses-empty"
          >
            <Text variant="muted">Kamu belum enroll course apa pun.</Text>
            <Button asChild>
              <Link href="/courses" data-testid="my-courses-browse">
                Browse Courses
              </Link>
            </Button>
          </div>
        )}
      </Container>
    </Section>
  );
}
