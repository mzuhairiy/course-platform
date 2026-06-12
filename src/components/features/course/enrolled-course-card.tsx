import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";
import type { EnrolledCourse } from "@/server/services/enrollment";

export function EnrolledCourseCard({
  enrollment,
}: {
  enrollment: EnrolledCourse;
}) {
  const { course } = enrollment;
  const firstLectureId = course.sections[0]?.lectures[0]?.id ?? null;
  const continueHref = firstLectureId
    ? `/learn/${course.id}/${firstLectureId}`
    : `/courses/${course.slug}`;

  return (
    <Card
      className="flex h-full flex-col overflow-hidden"
      data-testid="enrolled-course-card"
    >
      <div className="relative aspect-video w-full bg-surface-muted">
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        ) : null}
      </div>
      <CardHeader>
        <Heading as="h3" level="h4" className="line-clamp-2 text-lg">
          {course.title}
        </Heading>
        <Text variant="muted" as="span">
          {course.instructor.name}
        </Text>
      </CardHeader>
      <CardContent className="flex-1 space-y-1">
        {/* Progress is a placeholder until tracking lands in Fase 3. */}
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={0}
          aria-valuemin={0}
          aria-valuemax={100}
          data-testid="course-progress"
        >
          <div className="h-full w-0 bg-foreground" />
        </div>
        <Text variant="muted" as="span" className="text-xs">
          0% complete
        </Text>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" data-testid="continue-learning">
          <Link href={continueHref}>Continue Learning</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
