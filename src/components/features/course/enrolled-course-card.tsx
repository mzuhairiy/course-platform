import Image from "next/image";
import Link from "next/link";

import { DownloadCertificateButton } from "@/components/features/certificate/download-certificate-button";
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
  resumeLectureId,
}: {
  enrollment: EnrolledCourse;
  progress: { completed: number; total: number; percentage: number };
  resumeLectureId: string | null;
}) {
  const { course } = enrollment;
  const continueHref = resumeLectureId
    ? `/learn/${course.id}/${resumeLectureId}`
    : `/courses/${course.slug}`;
  const isCompleted = progress.total > 0 && progress.percentage === 100;

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
      <CardFooter className="flex-col gap-2">
        <Button
          asChild
          variant={isCompleted ? "outline" : "default"}
          className="w-full"
          data-testid="continue-learning"
        >
          <Link href={continueHref}>
            {isCompleted ? "Review Course" : "Continue Learning"}
          </Link>
        </Button>
        {isCompleted ? (
          <DownloadCertificateButton
            courseId={course.id}
            courseSlug={course.slug}
            className="w-full"
          />
        ) : null}
      </CardFooter>
    </Card>
  );
}
