import { CourseStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { InstructorCourseList } from "@/components/features/course/instructor-course-list";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { getInstructorCourses } from "@/server/services/course";

export const metadata: Metadata = {
  title: "My Courses",
};

// URL filter state (deep-linkable + testable). undefined = "All".
const STATUS_FILTERS = [
  { value: undefined, label: "All", key: "all" },
  { value: CourseStatus.DRAFT, label: "Draft", key: "draft" },
  { value: CourseStatus.PUBLISHED, label: "Published", key: "published" },
  { value: CourseStatus.ARCHIVED, label: "Archived", key: "archived" },
] as const;

function parseStatus(value?: string): CourseStatus | undefined {
  const match = STATUS_FILTERS.find(
    (f) => f.value && f.key === value?.toLowerCase(),
  );
  return match?.value;
}

type PageProps = { searchParams: { status?: string } };

export default async function InstructorCoursesPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?callbackUrl=/instructor/courses");

  const activeStatus = parseStatus(searchParams.status);
  const courses = await getInstructorCourses(user.id, activeStatus);

  return (
    <div className="space-y-6" data-testid="instructor-courses">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Heading as="h1" level="h1">
            My Courses
          </Heading>
          <Text variant="muted">Kelola course yang Anda buat.</Text>
        </div>
        <Button asChild data-testid="create-course-button">
          <Link href="/instructor/courses/new">Create New Course</Link>
        </Button>
      </header>

      <nav
        className="flex flex-wrap gap-2"
        aria-label="Filter status"
        data-testid="course-status-filter"
      >
        {STATUS_FILTERS.map((filter) => {
          const isActive =
            filter.value === activeStatus ||
            (filter.value === undefined && activeStatus === undefined);
          const href = filter.value
            ? `/instructor/courses?status=${filter.key}`
            : "/instructor/courses";
          return (
            <Link
              key={filter.key}
              href={href}
              aria-current={isActive ? "page" : undefined}
              data-testid={`course-filter-${filter.key}`}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {courses.length > 0 ? (
        <InstructorCourseList courses={courses} />
      ) : (
        <div
          className="rounded-lg border border-dashed border-border p-12 text-center"
          data-testid="instructor-courses-empty"
        >
          <Text variant="muted">
            Belum ada course di sini. Mulai dengan membuat course baru.
          </Text>
        </div>
      )}
    </div>
  );
}
