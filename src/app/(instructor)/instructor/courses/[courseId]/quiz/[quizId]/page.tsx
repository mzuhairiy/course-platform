import { UserRole } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { QuestionsSection } from "@/components/features/quiz-builder/questions-section";
import { QuizSettingsForm } from "@/components/features/quiz-builder/quiz-settings-form";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import { FORBIDDEN_ROUTE } from "@/config/routes";
import { getCurrentUser } from "@/lib/auth";
import { getQuizForBuilder } from "@/server/services/quiz-builder";
import type { QuizSettingsFormInput } from "@/schemas/quiz-builder";

export const metadata: Metadata = {
  title: "Quiz Builder",
};

type PageProps = { params: { courseId: string; quizId: string } };

export default async function QuizBuilderPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/sign-in?callbackUrl=/instructor/courses/${params.courseId}/quiz/${params.quizId}`,
    );
  }

  const quiz = await getQuizForBuilder(params.quizId);
  // The quiz must exist and actually belong to the course in the URL.
  if (!quiz || quiz.lecture.section.courseId !== params.courseId) {
    notFound();
  }

  // Ownership: only the owning instructor (or any ADMIN).
  if (
    user.role !== UserRole.ADMIN &&
    quiz.lecture.section.course.instructorId !== user.id
  ) {
    redirect(FORBIDDEN_ROUTE);
  }

  const settingsDefaults: QuizSettingsFormInput = {
    title: quiz.title,
    description: quiz.description ?? "",
    passingScore: quiz.passingScore,
    timeLimitMinutes:
      quiz.timeLimit != null ? Math.round(quiz.timeLimit / 60) : undefined,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8" data-testid="quiz-builder">
      <header className="space-y-2">
        <Button asChild variant="link" size="sm" className="-ml-3 w-fit">
          <Link href={`/instructor/courses/${params.courseId}/lessons`}>
            ← Kembali ke Lessons
          </Link>
        </Button>
        <Heading as="h1" level="h1">
          Quiz Builder
        </Heading>
        <Text variant="muted">{quiz.lecture.section.course.title}</Text>
      </header>

      <QuizSettingsForm
        courseId={params.courseId}
        quizId={quiz.id}
        defaultValues={settingsDefaults}
      />

      <QuestionsSection
        courseId={params.courseId}
        quizId={quiz.id}
        questions={quiz.questions}
      />
    </div>
  );
}
