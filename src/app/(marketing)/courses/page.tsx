import type { Metadata } from "next";
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
import { Heading, Text } from "@/components/ui/typography";
import {
  buildBaseQuery,
  parseCourseFilters,
  PER_PAGE,
  type CourseFilters,
} from "@/lib/course-filters";
import { getCategoriesWithCourseCount } from "@/server/services/category";
import { getCoursesWithCount } from "@/server/services/course";

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
  const categories = await getCategoriesWithCourseCount();

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
