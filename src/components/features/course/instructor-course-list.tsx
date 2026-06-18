import Image from "next/image";
import Link from "next/link";

import { CoursePublishButton } from "@/components/features/course/course-publish-button";
import { CourseStatusBadge } from "@/components/features/course/course-status-badge";
import { DeleteCourseDialog } from "@/components/features/course/delete-course-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/typography";
import { formatDate, formatPrice } from "@/lib/format";
import { getInitials } from "@/lib/utils";
import type { InstructorCourseListItem } from "@/server/services/course";

export function InstructorCourseList({
  courses,
}: {
  courses: InstructorCourseListItem[];
}) {
  return (
    <ul className="space-y-3" data-testid="instructor-course-list">
      {courses.map((course) => (
        <li key={course.id}>
          <CourseRow course={course} />
        </li>
      ))}
    </ul>
  );
}

function CourseRow({ course }: { course: InstructorCourseListItem }) {
  return (
    <Card data-testid="instructor-course-item">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-surface-muted">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-semibold text-muted-foreground">
              {getInitials(course.coverLabel ?? course.title)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold leading-tight" data-testid="course-title">
              {course.title}
            </p>
            <CourseStatusBadge status={course.status} />
          </div>
          <Text variant="muted" as="span" className="block text-sm">
            {course.category?.name ?? "Tanpa kategori"} · {formatPrice(course.price)}
          </Text>
          <Text variant="muted" as="span" className="block text-xs">
            <span data-testid="course-enrollment-count">
              {course._count.enrollments}
            </span>{" "}
            siswa · dibuat {formatDate(course.createdAt)}
          </Text>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link
              href={`/instructor/courses/${course.id}/edit`}
              data-testid="edit-course-link"
            >
              Edit
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link
              href={`/instructor/courses/${course.id}/analytics`}
              data-testid="analytics-course-link"
            >
              Analytics
            </Link>
          </Button>
          <CoursePublishButton courseId={course.id} status={course.status} />
          <DeleteCourseDialog
            courseId={course.id}
            courseTitle={course.title}
          />
        </div>
      </CardContent>
    </Card>
  );
}
