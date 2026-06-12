import { CourseCard } from "@/components/features/course/course-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/typography";
import type { CourseCardData } from "@/server/services/course";

export function CourseGrid({ courses }: { courses: CourseCardData[] }) {
  if (courses.length === 0) {
    return (
      <div
        className="rounded-lg border border-dashed border-border p-12 text-center"
        data-testid="course-empty"
      >
        <Text variant="muted">
          Tidak ada course yang cocok dengan filter ini.
        </Text>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      data-testid="course-grid"
    >
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}

export function CourseGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      data-testid="course-grid-skeleton"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="space-y-3 rounded-lg border border-border p-4"
        >
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
