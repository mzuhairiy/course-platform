"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  LESSON_TYPES,
  lessonSchema,
  type LessonInput,
  type LessonType,
} from "@/schemas/lesson";
import {
  addLessonAction,
  updateLessonAction,
} from "@/server/actions/lesson";
import type { LessonItem } from "@/server/services/lesson";

const TYPE_LABELS: Record<LessonType, string> = {
  VIDEO: "Video",
  READING: "Bacaan",
  QUIZ: "Quiz",
};

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

function toDefaults(lesson?: LessonItem | null): LessonInput {
  return {
    title: lesson?.title ?? "",
    type: lesson?.type ?? "VIDEO",
    videoUrl: lesson?.videoUrl ?? "",
    durationSeconds: lesson?.durationSeconds ?? undefined,
    contentMd: lesson?.contentMd ?? "",
  };
}

export function LessonFormDialog({
  courseId,
  open,
  onOpenChange,
  lesson,
}: {
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode; null/undefined = add mode. */
  lesson?: LessonItem | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(lesson);

  const form = useForm<LessonInput>({
    resolver: zodResolver(lessonSchema),
    defaultValues: toDefaults(lesson),
  });

  // Re-seed the form whenever the dialog (re)opens for a given lesson.
  useEffect(() => {
    if (open) form.reset(toDefaults(lesson));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lesson]);

  const type = form.watch("type");

  function onSubmit(values: LessonInput) {
    startTransition(async () => {
      const result = isEdit
        ? await updateLessonAction(courseId, lesson!.id, values)
        : await addLessonAction(courseId, values);

      if (result.status === "error") {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            if (message) {
              form.setError(field as keyof LessonInput, { message });
            }
          }
        } else {
          form.setError("root", { message: result.message });
        }
        return;
      }

      toast.success(<span data-testid="success-toast">{result.message}</span>);
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="lesson-form-dialog">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Lesson" : "Tambah Lesson"}</DialogTitle>
          <DialogDescription>
            Lesson berupa video, bacaan, atau quiz.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            data-testid="lesson-form"
          >
            {form.formState.errors.root ? (
              <p
                role="alert"
                data-testid="lesson-form-error"
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {form.formState.errors.root.message}
              </p>
            ) : null}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul</FormLabel>
                  <FormControl>
                    <Input data-testid="lesson-title-input" {...field} />
                  </FormControl>
                  <FormMessage data-testid="lesson-title-error" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe</FormLabel>
                  <FormControl>
                    <select
                      className={SELECT_CLASS}
                      data-testid="lesson-type-select"
                      {...field}
                    >
                      {LESSON_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage data-testid="lesson-type-error" />
                </FormItem>
              )}
            />

            {type === "VIDEO" ? (
              <>
                <FormField
                  control={form.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Video</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          inputMode="url"
                          placeholder="https://… (mp4 atau YouTube embed)"
                          data-testid="lesson-video-url-input"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage data-testid="lesson-video-url-error" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="durationSeconds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durasi (detik)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          data-testid="lesson-duration-input"
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : e.target.valueAsNumber,
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage data-testid="lesson-duration-error" />
                    </FormItem>
                  )}
                />
              </>
            ) : null}

            {type === "READING" ? (
              <FormField
                control={form.control}
                name="contentMd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konten (markdown)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={8}
                        data-testid="lesson-reading-content"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage data-testid="lesson-reading-content-error" />
                  </FormItem>
                )}
              />
            ) : null}

            {type === "QUIZ" ? (
              <FormDescription>
                Soal quiz diisi di quiz builder setelah lesson dibuat.
              </FormDescription>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                data-testid="lesson-form-submit"
                disabled={isPending}
              >
                {isPending ? "Menyimpan…" : isEdit ? "Simpan" : "Tambah"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
