import { CourseStatus } from "@prisma/client";
import { Check } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CertificateSection } from "@/components/features/certificate/certificate-section";
import { CourseCompletedBanner } from "@/components/features/certificate/course-completed-banner";
import { CourseCurriculum } from "@/components/features/course/course-curriculum";
import { CourseProgressBar } from "@/components/features/course/course-progress-bar";
import { EnrollCard } from "@/components/features/course/enroll-card";
import { Container } from "@/components/shared/container";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heading, Text } from "@/components/ui/typography";
import { getInitials } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import {
  getCourseDetailBySlug,
  getRelatedCourses,
  type CourseDetail,
} from "@/server/services/course";
import { findEnrollment } from "@/server/services/enrollment";
import {
  getCourseProgress,
  getResumeLecture,
} from "@/server/services/progress";
import {
  getCourseRatingSummary,
  getCourseReviews,
  getUserReview,
} from "@/server/services/review";
import { CourseCard } from "@/components/features/course/course-card";
import { ReviewsSection } from "@/components/features/review/reviews-section";
import { StarRating } from "@/components/features/review/star-rating";

type PageProps = { params: { slug: string } };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const course = await getCourseDetailBySlug(params.slug);
  // Also bail here so the route returns a real 404 status: when only the page
  // component calls notFound() but generateMetadata resolves, Next responds 200.
  if (!course || course.status !== CourseStatus.PUBLISHED) {
    notFound();
  }
  return {
    title: course.title,
    description: course.subtitle ?? course.description.slice(0, 160),
  };
}

function sumDuration(sections: CourseDetail["sections"]) {
  return sections.reduce(
    (total, section) =>
      total +
      section.lectures.reduce((sum, l) => sum + (l.durationSeconds ?? 0), 0),
    0,
  );
}

export default async function CourseDetailPage({ params }: PageProps) {
  const course = await getCourseDetailBySlug(params.slug);
  if (!course || course.status !== CourseStatus.PUBLISHED) {
    notFound();
  }

  const user = await getCurrentUser();
  const isEnrolled = user
    ? Boolean(await findEnrollment(user.id, course.id))
    : false;
  const courseProgress =
    user && isEnrolled ? await getCourseProgress(user.id, course.id) : null;

  const firstLectureId = course.sections[0]?.lectures[0]?.id ?? null;
  // When enrolled, "Continue Learning" jumps to the first incomplete lecture
  // rather than always restarting from the top.
  const resumeLectureId =
    user && isEnrolled
      ? await getResumeLecture(user.id, course.id)
      : firstLectureId;
  const totalLectures = course.sections.reduce(
    (sum, section) => sum + section.lectures.length,
    0,
  );
  const totalDuration = sumDuration(course.sections);

  // Fase 5: reviews + recommendations.
  const [ratingSummary, reviews, relatedCourses, userReview] =
    await Promise.all([
      getCourseRatingSummary(course.id),
      getCourseReviews(course.id),
      getRelatedCourses(course.id, course.category?.id ?? null),
      user && isEnrolled ? getUserReview(user.id, course.id) : null,
    ]);

  return (
    <article data-testid="course-detail">
      <div
        className="border-b border-border bg-surface"
        data-testid="course-hero"
      >
        <Container className="space-y-4 py-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{course.level}</Badge>
            <Badge variant="outline">{course.language.toUpperCase()}</Badge>
            {course.category ? (
              <Badge variant="outline">{course.category.name}</Badge>
            ) : null}
          </div>
          <Heading as="h1" level="h1" className="max-w-3xl">
            {course.title}
          </Heading>
          {course.subtitle ? (
            <Text variant="lead" className="max-w-2xl">
              {course.subtitle}
            </Text>
          ) : null}
          {ratingSummary.count > 0 ? (
            <div
              className="flex items-center gap-2 pt-1"
              data-testid="hero-rating"
            >
              <StarRating value={ratingSummary.average} />
              <span className="text-sm font-medium">
                {ratingSummary.average.toFixed(1)}
              </span>
              <Text variant="muted" as="span" className="text-sm">
                ({ratingSummary.count})
              </Text>
            </div>
          ) : null}
          <div className="flex items-center gap-3 pt-2">
            <Avatar className="h-9 w-9">
              {course.instructor.image ? (
                <AvatarImage
                  src={course.instructor.image}
                  alt={course.instructor.name ?? ""}
                />
              ) : null}
              <AvatarFallback>
                {getInitials(course.instructor.name)}
              </AvatarFallback>
            </Avatar>
            <Text variant="muted" as="span">
              {course.instructor.name}
            </Text>
          </div>
          {courseProgress ? (
            <div
              className="max-w-md space-y-4 pt-2"
              data-testid="course-header-progress"
            >
              <CourseProgressBar
                completed={courseProgress.completed}
                total={courseProgress.total}
                percentage={courseProgress.percentage}
              />
              {courseProgress.total > 0 &&
              courseProgress.percentage === 100 ? (
                <CourseCompletedBanner
                  courseId={course.id}
                  courseSlug={course.slug}
                />
              ) : (
                <CertificateSection
                  courseId={course.id}
                  courseSlug={course.slug}
                  completed={false}
                />
              )}
            </div>
          ) : null}
        </Container>
      </div>

      <Container className="py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          <aside className="order-first lg:order-last">
            <div className="lg:sticky lg:top-20">
              <EnrollCard
                courseId={course.id}
                slug={course.slug}
                title={course.title}
                thumbnailUrl={course.thumbnailUrl}
                coverLabel={course.coverLabel}
                price={course.price}
                level={course.level}
                totalLectures={totalLectures}
                totalDurationSeconds={totalDuration}
                updatedAt={course.updatedAt}
                isLoggedIn={Boolean(user)}
                isEnrolled={isEnrolled}
                firstLectureId={resumeLectureId}
              />
            </div>
          </aside>

          <div className="order-last space-y-10 lg:order-first">
            <section className="space-y-3" data-testid="course-description">
              <Heading as="h2" level="h3">
                Description
              </Heading>
              <Text variant="body">{course.description}</Text>
            </section>

            {/* Section titles double as the "chapters" overview — only useful
                for multi-section seed courses. Single default-section courses
                hide it (their internal "Main" title must never show). */}
            {course.sections.length > 1 ? (
              <section className="space-y-3" data-testid="what-you-learn">
                <Heading as="h2" level="h3">
                  What you&apos;ll learn
                </Heading>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {course.sections.map((section) => (
                    <li key={section.id} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span className="text-sm">{section.title}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section
              className="space-y-3"
              data-testid="course-curriculum-section"
            >
              <Heading as="h2" level="h3">
                Curriculum
              </Heading>
              <Text variant="muted">
                {course.sections.length} section
                {course.sections.length === 1 ? "" : "s"} · {totalLectures}{" "}
                lecture{totalLectures === 1 ? "" : "s"}
              </Text>
              <CourseCurriculum sections={course.sections} />
            </section>

            <section className="space-y-3" data-testid="instructor-bio">
              <Heading as="h2" level="h3">
                Instructor
              </Heading>
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  {course.instructor.image ? (
                    <AvatarImage
                      src={course.instructor.image}
                      alt={course.instructor.name ?? ""}
                    />
                  ) : null}
                  <AvatarFallback>
                    {getInitials(course.instructor.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{course.instructor.name}</p>
                  <Text variant="muted" as="span">
                    Instructor
                  </Text>
                </div>
              </div>
              {course.instructor.bio ? (
                <Text variant="muted">{course.instructor.bio}</Text>
              ) : null}
            </section>

            <ReviewsSection
              courseId={course.id}
              courseSlug={course.slug}
              summary={ratingSummary}
              reviews={reviews}
              canReview={Boolean(user && isEnrolled)}
              userReview={userReview}
            />

            {relatedCourses.length > 0 ? (
              <section className="space-y-3" data-testid="related-courses">
                <Heading as="h2" level="h3">
                  Course terkait
                </Heading>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedCourses.map((related) => (
                    <CourseCard key={related.id} course={related} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </Container>
    </article>
  );
}
