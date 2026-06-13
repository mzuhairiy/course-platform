import Image from "next/image";
import Link from "next/link";

import { CourseCover } from "@/components/features/course/course-cover";
import { CourseProgressBar } from "@/components/features/course/course-progress-bar";
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
  progress,
}: {
  enrollment: EnrolledCourse;
  progress: { completed: number; total: number; percentage: number };
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
      {course.thumbnailUrl ? (
        <div className="relative aspect-video w-full bg-surface-muted">
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        </div>
      ) : (
        <CourseCover
          label={course.coverLabel ?? course.title}
          seed={course.slug}
        />
      )}
      <CardHeader>
        <Heading as="h3" level="h4" className="line-clamp-2 text-lg">
          {course.title}
        </Heading>
        <Text variant="muted" as="span">
          {course.instructor.name}
        </Text>
      </CardHeader>
      <CardContent className="flex-1" data-testid="course-progress">
        <CourseProgressBar
          completed={progress.completed}
          total={progress.total}
          percentage={progress.percentage}
        />
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" data-testid="continue-learning">
          <Link href={continueHref}>Continue Learning</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
