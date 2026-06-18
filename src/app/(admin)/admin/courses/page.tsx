import { CourseStatus } from "@prisma/client";
import type { Metadata } from "next";

import { AdminCourseActions } from "@/components/features/admin/admin-course-actions";
import { CourseStatusBadge } from "@/components/features/course/course-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";
import { formatDate } from "@/lib/format";
import {
  getAdminCourses,
  getInstructorOptions,
  type AdminCourseFilters,
} from "@/server/services/admin";
import { getCategoryOptions } from "@/server/services/category";

export const metadata: Metadata = {
  title: "Courses · Admin",
};

const SELECT_CLASS =
  "h-9 rounded-md border border-input bg-background px-2 text-sm";

function parseStatus(value?: string): CourseStatus | undefined {
  return value && value in CourseStatus
    ? (value as CourseStatus)
    : undefined;
}

type PageProps = {
  searchParams: { status?: string; instructor?: string; category?: string };
};

export default async function AdminCoursesPage({ searchParams }: PageProps) {
  const filters: AdminCourseFilters = {
    status: parseStatus(searchParams.status),
    instructorId: searchParams.instructor || undefined,
    categoryId: searchParams.category || undefined,
  };

  const [courses, instructors, categories] = await Promise.all([
    getAdminCourses(filters),
    getInstructorOptions(),
    getCategoryOptions(),
  ]);

  return (
    <div className="space-y-6" data-testid="admin-courses">
      <header className="space-y-1">
        <Heading as="h1" level="h1">
          Courses
        </Heading>
        <Text variant="muted">Moderasi semua course di platform.</Text>
      </header>

      <form
        className="flex flex-wrap items-end gap-3"
        data-testid="admin-course-filters"
      >
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Status
          <select
            name="status"
            defaultValue={searchParams.status ?? ""}
            className={SELECT_CLASS}
            data-testid="filter-status"
          >
            <option value="">Semua</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Instructor
          <select
            name="instructor"
            defaultValue={searchParams.instructor ?? ""}
            className={SELECT_CLASS}
            data-testid="filter-instructor"
          >
            <option value="">Semua</option>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name ?? i.id}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Kategori
          <select
            name="category"
            defaultValue={searchParams.category ?? ""}
            className={SELECT_CLASS}
            data-testid="filter-category"
          >
            <option value="">Semua</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" size="sm" data-testid="apply-filters">
          Filter
        </Button>
      </form>

      {courses.length > 0 ? (
        <ul className="space-y-2" data-testid="admin-course-list">
          {courses.map((course) => (
            <li key={course.id}>
              <Card data-testid="admin-course-item">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold leading-tight">
                        {course.title}
                      </p>
                      <CourseStatusBadge status={course.status} />
                    </div>
                    <Text variant="muted" as="span" className="block text-sm">
                      {course.instructor.name ?? "—"} ·{" "}
                      {course.category?.name ?? "Tanpa kategori"} ·{" "}
                      {course._count.enrollments} siswa · {formatDate(course.createdAt)}
                    </Text>
                  </div>
                  <AdminCourseActions
                    courseId={course.id}
                    status={course.status}
                  />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <div
          className="rounded-lg border border-dashed border-border p-12 text-center"
          data-testid="admin-courses-empty"
        >
          <Text variant="muted">Tidak ada course untuk filter ini.</Text>
        </div>
      )}
    </div>
  );
}
