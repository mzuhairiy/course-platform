"use client";

import type { LectureType } from "@prisma/client";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { DeleteLessonButton } from "@/components/features/lesson/delete-lesson-button";
import { LessonFormDialog } from "@/components/features/lesson/lesson-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/typography";
import { formatDuration } from "@/lib/format";
import { moveLessonAction } from "@/server/actions/lesson";
import type { LessonItem } from "@/server/services/lesson";

const LESSON_ICON: Record<LectureType, typeof PlayCircle> = {
  VIDEO: PlayCircle,
  READING: FileText,
  QUIZ: HelpCircle,
};

const TYPE_LABELS: Record<LectureType, string> = {
  VIDEO: "Video",
  READING: "Bacaan",
  QUIZ: "Quiz",
};

export function LessonManager({
  courseId,
  lessons,
}: {
  courseId: string;
  lessons: LessonItem[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LessonItem | null>(null);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(lesson: LessonItem) {
    setEditing(lesson);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4" data-testid="lesson-manager">
      <div className="flex items-center justify-between">
        <Text variant="muted" as="span" className="text-sm">
          {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
        </Text>
        <Button
          type="button"
          data-testid="add-lesson-button"
          onClick={openAdd}
        >
          Tambah Lesson
        </Button>
      </div>

      {lessons.length > 0 ? (
        <ul className="space-y-2" data-testid="lesson-list">
          {lessons.map((lesson, index) => (
            <li key={lesson.id}>
              <LessonRow
                courseId={courseId}
                lesson={lesson}
                isFirst={index === 0}
                isLast={index === lessons.length - 1}
                onEdit={() => openEdit(lesson)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div
          className="rounded-lg border border-dashed border-border p-12 text-center"
          data-testid="lessons-empty"
        >
          <Text variant="muted">
            Belum ada lesson. Tambahkan lesson pertama untuk bisa publish.
          </Text>
        </div>
      )}

      <LessonFormDialog
        courseId={courseId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lesson={editing}
      />
    </div>
  );
}

function LessonRow({
  courseId,
  lesson,
  isFirst,
  isLast,
  onEdit,
}: {
  courseId: string;
  lesson: LessonItem;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const Icon = LESSON_ICON[lesson.type];

  function move(direction: "up" | "down") {
    startTransition(async () => {
      const result = await moveLessonAction(courseId, lesson.id, direction);
      if (result.status === "error") {
        toast.error(
          <span data-testid="lesson-action-error">{result.message}</span>,
        );
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card data-testid="lesson-item">
      <CardContent className="flex items-center gap-3 p-3">
        <div className="flex flex-col">
          <button
            type="button"
            aria-label="Naikkan urutan"
            data-testid="move-lesson-up"
            disabled={isFirst || isPending}
            onClick={() => move("up")}
            className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Turunkan urutan"
            data-testid="move-lesson-down"
            disabled={isLast || isPending}
            onClick={() => move("down")}
            className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <Icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium" data-testid="lesson-title">
            {lesson.title}
          </p>
          <Text variant="muted" as="span" className="block text-xs">
            {TYPE_LABELS[lesson.type]}
            {lesson.type === "VIDEO" && lesson.durationSeconds
              ? ` · ${formatDuration(lesson.durationSeconds)}`
              : ""}
          </Text>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {lesson.type === "QUIZ" && lesson.quiz ? (
            <Button asChild variant="ghost" size="sm">
              <Link
                href={`/instructor/courses/${courseId}/quiz/${lesson.quiz.id}`}
                data-testid="edit-quiz-link"
              >
                Edit Quiz →
              </Link>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="edit-lesson-button"
            onClick={onEdit}
          >
            Edit
          </Button>
          <DeleteLessonButton
            courseId={courseId}
            lectureId={lesson.id}
            lessonTitle={lesson.title}
            progressCount={lesson._count.progress}
          />
        </div>
      </CardContent>
    </Card>
  );
}
