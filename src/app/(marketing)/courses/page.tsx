import { X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CourseFilterSidebar } from "@/components/features/course/course-filter-sidebar";
import {
  CourseGrid,
  CourseGridSkeleton,
} from "@/components/features/course/course-grid";
import { CoursePagination } from "@/components/features/course/course-pagination";
import { CourseSortDropdown } from "@/components/features/course/course-sort-dropdown";
import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import {
  buildBaseQuery,
  parseCourseFilters,
  PER_PAGE,
  type CourseFilters,
} from "@/lib/course-filters";
import { getCategoriesWithCourseCount } from "@/server/services/category";
import { getCoursesWithCount } from "@/server/services/course";
import { getInstructorName } from "@/server/services/instructor";

export const metadata: Metadata = {
  title: "Browse Courses",
};

async function CourseResults({ filters }: { filters: CourseFilters }) {
  const { courses, total } = await getCoursesWithCount(filters);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-8" data-testid="course-results">
      <Text variant="muted" data-testid="course-count">
        {total} course{total === 1 ? "" : "s"} found
      </Text>
      <CourseGrid courses={courses} />
      <CoursePagination
        currentPage={filters.page}
        totalPages={totalPages}
        baseQuery={buildBaseQuery(filters)}
      />
    </div>
  );
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = parseCourseFilters(searchParams);
  const [categories, instructor] = await Promise.all([
    getCategoriesWithCourseCount(),
    filters.instructor ? getInstructorName(filters.instructor) : null,
  ]);

  // Clear keyword only; keep the other active filters in the URL.
  const clearedQuery = buildBaseQuery({ ...filters, q: "" });
  const clearHref = clearedQuery ? `/courses?${clearedQuery}` : "/courses";

  // Clear instructor only; keep the other active filters in the URL.
  const instructorClearedQuery = buildBaseQuery({ ...filters, instructor: "" });
  const instructorClearHref = instructorClearedQuery
    ? `/courses?${instructorClearedQuery}`
    : "/courses";

  return (
    <Section spacing="compact">
      <Container className="space-y-8">
        <header className="space-y-2" data-testid="courses-header">
          <Heading as="h1" level="h1">
            Browse Courses
          </Heading>
          <Text variant="lead">
            Temukan course yang cocok buat kamu — filter berdasarkan kategori,
            level, dan harga.
          </Text>
          {filters.q ? (
            <div
              className="flex items-center gap-3 pt-2"
              data-testid="search-results-header"
            >
              <Text variant="body">
                Hasil untuk{" "}
                <span className="font-semibold">&quot;{filters.q}&quot;</span>
              </Text>
              <Button asChild variant="outline" size="sm">
                <Link href={clearHref} data-testid="search-clear">
                  <X className="mr-1 h-3.5 w-3.5" />
                  Clear
                </Link>
              </Button>
            </div>
          ) : null}
          {instructor ? (
            <div
              className="flex items-center gap-3 pt-2"
              data-testid="instructor-filter-header"
            >
              <Text variant="body">
                Course oleh{" "}
                <span className="font-semibold">{instructor.name}</span>
              </Text>
              <Button asChild variant="outline" size="sm">
                <Link
                  href={instructorClearHref}
                  data-testid="instructor-filter-clear"
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Clear
                </Link>
              </Button>
            </div>
          ) : null}
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          <CourseFilterSidebar
            categories={categories.map((c) => ({
              name: c.name,
              slug: c.slug,
            }))}
          />

          <div className="space-y-6">
            <div className="flex items-center justify-end">
              <CourseSortDropdown />
            </div>

            <Suspense
              key={JSON.stringify(filters)}
              fallback={<CourseGridSkeleton />}
            >
              <CourseResults filters={filters} />
            </Suspense>
          </div>
        </div>
      </Container>
    </Section>
  );
}
