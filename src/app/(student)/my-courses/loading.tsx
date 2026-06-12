import { CourseGridSkeleton } from "@/components/features/course/course-grid";
import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Section spacing="compact">
      <Container className="space-y-6" data-testid="loading">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-40" />
        </div>
        <CourseGridSkeleton />
      </Container>
    </Section>
  );
}
