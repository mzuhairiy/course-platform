import Image from "next/image";
import Link from "next/link";

import { CourseCover } from "@/components/features/course/course-cover";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";
import { formatPrice } from "@/lib/format";
import type { CourseCardData } from "@/server/services/course";

export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      data-testid="course-card"
      className="group block h-full"
    >
      <Card className="flex h-full flex-col overflow-hidden transition-colors hover:border-border-strong">
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
        <CardHeader className="gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{course.level}</Badge>
            {course.category ? (
              <Badge variant="outline">{course.category.name}</Badge>
            ) : null}
          </div>
          <Heading as="h3" level="h4" className="line-clamp-2 text-lg">
            {course.title}
          </Heading>
        </CardHeader>
        <CardContent className="flex-1">
          <Text variant="muted" className="line-clamp-2">
            {course.subtitle ?? course.description}
          </Text>
        </CardContent>
        <CardFooter className="items-center justify-between">
          <Text variant="muted" as="span">
            {course.instructor.name}
          </Text>
          <span
            className="font-semibold text-foreground"
            data-testid="course-price"
          >
            {formatPrice(course.price)}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
