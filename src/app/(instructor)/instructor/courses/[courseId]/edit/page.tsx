import { UserRole } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CourseForm } from "@/components/features/course/course-form";
import { CoursePublishButton } from "@/components/features/course/course-publish-button";
import { CourseStatusBadge } from "@/components/features/course/course-status-badge";
import { DeleteCourseDialog } from "@/components/features/course/delete-course-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";
import { FORBIDDEN_ROUTE } from "@/config/routes";
import { getCurrentUser } from "@/lib/auth";
import { getCategoryOptions } from "@/server/services/category";
import { getCourseForEdit } from "@/server/services/course";
import type { CourseFormInput } from "@/schemas/course";

export const metadata: Metadata = {
  title: "Edit Course",
};

type PageProps = { params: { courseId: string } };

export default async function EditCoursePage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?callbackUrl=/instructor/courses/${params.courseId}/edit`);

  const course = await getCourseForEdit(params.courseId);
  if (!course) notFound();

  // Ownership: only the owning instructor (or any ADMIN) may edit.
  if (user.role !== UserRole.ADMIN && course.instructorId !== user.id) {
    redirect(FORBIDDEN_ROUTE);
  }

  const categories = await getCategoryOptions();
  const hasEnrollments = course._count.enrollments > 0;

  const defaultValues: CourseFormInput = {
    title: course.title,
    subtitle: course.subtitle ?? "",
    description: course.description,
    categoryId: course.categoryId ?? "",
    level: course.level,
    price: course.price,
    language: course.language,
    coverLabel: course.coverLabel ?? "",
    slug: course.slug,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8" data-testid="edit-course">
      <header className="space-y-3">
        <Button asChild variant="link" size="sm" className="-ml-3 w-fit">
          <Link href="/instructor/courses">← Kembali ke My Courses</Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Heading as="h1" level="h1">
              Edit Course
            </Heading>
            <CourseStatusBadge status={course.status} />
          </div>
          <div className="flex items-center gap-2">
            <CoursePublishButton courseId={course.id} status={course.status} />
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/instructor/courses/${course.id}/lessons`}
                data-testid="manage-lessons-link"
              >
                Kelola Lessons →
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <CourseForm
        mode="edit"
        courseId={course.id}
        categories={categories}
        defaultValues={defaultValues}
      />

      <Card className="border-destructive/40" data-testid="danger-zone">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <Text variant="body" className="font-medium">
              Hapus course ini
            </Text>
            <Text variant="muted" as="span" className="block text-sm">
              {hasEnrollments
                ? "Course punya siswa terdaftar — tidak bisa dihapus."
                : "Permanen. Section & lecture ikut terhapus."}
            </Text>
          </div>
          <DeleteCourseDialog
            courseId={course.id}
            courseTitle={course.title}
            triggerVariant="destructive"
            triggerLabel="Delete Course"
          />
        </CardContent>
      </Card>
    </div>
  );
}
