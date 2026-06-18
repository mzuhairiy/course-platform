import { UserRole } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { LessonManager } from "@/components/features/lesson/lesson-manager";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import { FORBIDDEN_ROUTE } from "@/config/routes";
import { getCurrentUser } from "@/lib/auth";
import { getCourseOwnerMeta } from "@/server/services/course";
import { getLessonsForCourse } from "@/server/services/lesson";

export const metadata: Metadata = {
  title: "Lessons",
};

type PageProps = { params: { courseId: string } };

export default async function LessonsPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/sign-in?callbackUrl=/instructor/courses/${params.courseId}/lessons`);
  }

  const course = await getCourseOwnerMeta(params.courseId);
  if (!course) notFound();
  if (user.role !== UserRole.ADMIN && course.instructorId !== user.id) {
    redirect(FORBIDDEN_ROUTE);
  }

  const lessons = await getLessonsForCourse(params.courseId);

  return (
    <div className="mx-auto max-w-3xl space-y-6" data-testid="lessons-page">
      <header className="space-y-2">
        <Button asChild variant="link" size="sm" className="-ml-3 w-fit">
          <Link href={`/instructor/courses/${course.id}/edit`}>
            ← Kembali ke edit course
          </Link>
        </Button>
        <Heading as="h1" level="h1">
          Lessons
        </Heading>
        <Text variant="muted">{course.title}</Text>
      </header>

      <LessonManager courseId={course.id} lessons={lessons} />
    </div>
  );
}
