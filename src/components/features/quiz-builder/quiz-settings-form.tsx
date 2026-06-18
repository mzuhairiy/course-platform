"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  quizSettingsFormSchema,
  settingsFormToInput,
  type QuizSettingsFormInput,
} from "@/schemas/quiz-builder";
import { updateQuizSettingsAction } from "@/server/actions/quiz-builder";

type NumberFieldProps = {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
};

/** number input that yields `undefined` when cleared (not NaN). */
function numberFieldProps(field: NumberFieldProps) {
  return {
    value: field.value ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      field.onChange(
        e.target.value === "" ? undefined : e.target.valueAsNumber,
      ),
  };
}

export function QuizSettingsForm({
  courseId,
  quizId,
  defaultValues,
}: {
  courseId: string;
  quizId: string;
  defaultValues: QuizSettingsFormInput;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<QuizSettingsFormInput>({
    resolver: zodResolver(quizSettingsFormSchema),
    defaultValues,
  });

  function onSubmit(values: QuizSettingsFormInput) {
    startTransition(async () => {
      const result = await updateQuizSettingsAction(
        courseId,
        quizId,
        settingsFormToInput(values),
      );
      if (result.status === "error") {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            if (message) {
              form.setError(field as keyof QuizSettingsFormInput, { message });
            }
          }
        } else {
          form.setError("root", { message: result.message });
        }
        return;
      }
      toast.success(<span data-testid="success-toast">{result.message}</span>);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pengaturan Quiz</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            data-testid="quiz-settings-form"
          >
            {form.formState.errors.root ? (
              <p
                role="alert"
                data-testid="quiz-settings-error"
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
                    <Input data-testid="quiz-title-input" {...field} />
                  </FormControl>
                  <FormMessage data-testid="quiz-title-error" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Opsional"
                      data-testid="quiz-description-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage data-testid="quiz-description-error" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="passingScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passing score (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        inputMode="numeric"
                        data-testid="passing-score-input"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        {...numberFieldProps(field)}
                      />
                    </FormControl>
                    <FormMessage data-testid="passing-score-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeLimitMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time limit (menit)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        placeholder="Kosong = tanpa batas"
                        data-testid="time-limit-input"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        {...numberFieldProps(field)}
                      />
                    </FormControl>
                    <FormDescription>Kosongkan untuk untimed.</FormDescription>
                    <FormMessage data-testid="time-limit-error" />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              data-testid="save-quiz-settings"
              disabled={isPending}
            >
              {isPending ? "Menyimpan…" : "Simpan Settings"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
