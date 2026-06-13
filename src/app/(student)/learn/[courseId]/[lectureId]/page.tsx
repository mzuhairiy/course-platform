import { CourseStatus } from "@prisma/client";
import type { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CourseCompletedBanner } from "@/components/features/certificate/course-completed-banner";
import { LearnShell } from "@/components/features/video-player/learn-shell";
import { LearnSidebar } from "@/components/features/video-player/learn-sidebar";
import { LectureView } from "@/components/features/video-player/lecture-view";
import { Button } from "@/components/ui/button";
import { SIGN_IN_ROUTE } from "@/config/routes";
import { getCurrentUser } from "@/lib/auth";
import { getCourseForLearn } from "@/server/services/course";
import { findEnrollment } from "@/server/services/enrollment";
import { getCourseProgress } from "@/server/services/progress";
import { getQuizBundle } from "@/server/services/quiz";

export const metadata: Metadata = {
  title: "Learning",
};

type PageProps = { params: { courseId: string; lectureId: string } };

export default async function LearnPage({ params }: PageProps) {
  const { courseId, lectureId } = params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`${SIGN_IN_ROUTE}?callbackUrl=/learn/${courseId}/${lectureId}`);
  }

  const course = await getCourseForLearn(courseId);
  if (!course || course.status !== CourseStatus.PUBLISHED) {
    notFound();
  }

  // Access control: must be enrolled, otherwise back to the course detail page.
  const enrollment = await findEnrollment(user.id, courseId);
  if (!enrollment) {
    redirect(`/courses/${course.slug}`);
  }

  const lectures = course.sections.flatMap((section) => section.lectures);
  const index = lectures.findIndex((lecture) => lecture.id === lectureId);
  if (index === -1) {
    notFound();
  }

  const current = lectures[index];
  const prev = lectures[index - 1] ?? null;
  const next = lectures[index + 1] ?? null;

  const progress = await getCourseProgress(user.id, course.id);
  const completedLectureIds = Object.entries(progress.perLecture)
    .filter(([, value]) => value.completed)
    .map(([id]) => id);
  const currentProgress = progress.perLecture[current.id] ?? {
    completed: false,
    watchedSeconds: 0,
  };

  // For a QUIZ lecture, load the quiz (client-safe questions + attempt history).
  const nextHref = next ? `/learn/${course.id}/${next.id}` : null;
  const quizBundle =
    current.type === "QUIZ" ? await getQuizBundle(user.id, current.id) : null;
  const quizProps = quizBundle
    ? {
        quizId: quizBundle.quizId,
        title: quizBundle.title,
        description: quizBundle.description,
        passingScore: quizBundle.passingScore,
        timeLimit: quizBundle.timeLimit,
        questionCount: quizBundle.questionCount,
        questions: quizBundle.questions,
        attempts: quizBundle.attempts,
        nextHref,
      }
    : null;

  const sidebar = (
    <LearnSidebar
      courseId={course.id}
      courseSlug={course.slug}
      courseTitle={course.title}
      currentLectureId={current.id}
      completedLectureIds={completedLectureIds}
      progress={{
        completed: progress.completed,
        total: progress.total,
        percentage: progress.percentage,
      }}
      sections={course.sections.map((section) => ({
        id: section.id,
        title: section.title,
        lectures: section.lectures.map((lecture) => ({
          id: lecture.id,
          title: lecture.title,
          type: lecture.type,
        })),
      }))}
    />
  );

  return (
    <LearnShell sidebar={sidebar}>
      <div className="space-y-6">
        {progress.total > 0 && progress.percentage === 100 ? (
          <CourseCompletedBanner
            courseId={course.id}
            courseSlug={course.slug}
          />
        ) : null}

        <LectureView
          lecture={current}
          progress={currentProgress}
          quiz={quizProps}
        />

        <nav
          className="flex items-center justify-between border-t border-border pt-4"
          data-testid="lecture-nav"
        >
          {prev ? (
            <Button asChild variant="outline">
              <Link
                href={`/learn/${course.id}/${prev.id}`}
                data-testid="prev-lecture"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Link>
            </Button>
          ) : (
            <Button variant="outline" disabled data-testid="prev-lecture">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
          )}

          {next ? (
            <Button asChild>
              <Link
                href={`/learn/${course.id}/${next.id}`}
                data-testid="next-lecture"
              >
                Next Lecture
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button disabled data-testid="next-lecture">
              Next Lecture
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </nav>
      </div>
    </LearnShell>
  );
}
