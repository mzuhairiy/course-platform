import { CourseGridSkeleton } from "@/components/features/course/course-grid";
import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Section spacing="compact">
      <Container className="space-y-10" data-testid="loading">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:max-w-md">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <CourseGridSkeleton count={3} />
      </Container>
    </Section>
  );
}
