import { z } from "zod";

export const startQuizSchema = z.object({
  quizId: z.string().min(1),
});

export const submitQuizSchema = z.object({
  attemptId: z.string().min(1),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selectedIds: z.array(z.string().min(1)),
    }),
  ),
});

export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
