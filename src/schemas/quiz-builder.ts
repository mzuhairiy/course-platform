import { z } from "zod";

export const QUIZ_TITLE_MIN = 3;
export const QUIZ_TITLE_MAX = 150;
export const QUIZ_DESCRIPTION_MAX = 500;
export const PASSING_SCORE_MIN = 0;
export const PASSING_SCORE_MAX = 100;
export const QUESTION_OPTION_MIN = 2;
export const QUESTION_OPTION_MAX = 6;

export const QUESTION_TYPES = ["MULTIPLE_CHOICE", "TRUE_FALSE"] as const;
export type QuestionTypeValue = (typeof QUESTION_TYPES)[number];

const titleField = z
  .string()
  .trim()
  .min(QUIZ_TITLE_MIN, `Judul minimal ${QUIZ_TITLE_MIN} karakter`)
  .max(QUIZ_TITLE_MAX, `Judul maksimal ${QUIZ_TITLE_MAX} karakter`);
const descriptionField = z
  .string()
  .trim()
  .max(QUIZ_DESCRIPTION_MAX, `Deskripsi maksimal ${QUIZ_DESCRIPTION_MAX} karakter`);
const passingScoreField = z
  .number({ message: "Passing score harus berupa angka" })
  .int("Passing score harus bilangan bulat")
  .min(PASSING_SCORE_MIN, `Minimal ${PASSING_SCORE_MIN}`)
  .max(PASSING_SCORE_MAX, `Maksimal ${PASSING_SCORE_MAX}`);

/** Canonical settings shape stored in the DB (timeLimit in seconds). */
export const quizSettingsSchema = z.object({
  title: titleField,
  description: descriptionField,
  passingScore: passingScoreField,
  // seconds; undefined = untimed.
  timeLimit: z
    .number({ message: "Time limit harus berupa angka" })
    .int("Time limit harus bilangan bulat")
    .min(0, "Time limit tidak boleh negatif")
    .optional(),
});

export type QuizSettingsInput = z.infer<typeof quizSettingsSchema>;

/** Form shape: instructors enter the time limit in MINUTES (untimed = empty). */
export const quizSettingsFormSchema = z.object({
  title: titleField,
  description: descriptionField,
  passingScore: passingScoreField,
  timeLimitMinutes: z
    .number({ message: "Time limit harus berupa angka" })
    .int("Time limit harus bilangan bulat")
    .min(0, "Time limit tidak boleh negatif")
    .optional(),
});

export type QuizSettingsFormInput = z.infer<typeof quizSettingsFormSchema>;

export function settingsFormToInput(
  form: QuizSettingsFormInput,
): QuizSettingsInput {
  return {
    title: form.title,
    description: form.description,
    passingScore: form.passingScore,
    timeLimit:
      form.timeLimitMinutes != null ? form.timeLimitMinutes * 60 : undefined,
  };
}

export const questionOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().trim().min(1, "Teks opsi wajib diisi"),
});

export type QuestionOptionInput = z.infer<typeof questionOptionSchema>;

export const questionSchema = z
  .object({
    type: z.enum(QUESTION_TYPES, { message: "Tipe soal tidak valid" }),
    question: z.string().trim().min(1, "Pertanyaan wajib diisi"),
    explanation: z.string().trim(),
    options: z
      .array(questionOptionSchema)
      .min(QUESTION_OPTION_MIN, `Minimal ${QUESTION_OPTION_MIN} opsi`)
      .max(QUESTION_OPTION_MAX, `Maksimal ${QUESTION_OPTION_MAX} opsi`),
    correctAnswerIds: z
      .array(z.string())
      .min(1, "Tandai minimal 1 jawaban benar"),
  })
  .superRefine((data, ctx) => {
    const optionIds = new Set(data.options.map((o) => o.id));
    for (const id of data.correctAnswerIds) {
      if (!optionIds.has(id)) {
        ctx.addIssue({
          code: "custom",
          path: ["correctAnswerIds"],
          message: "Jawaban benar harus salah satu opsi",
        });
        break;
      }
    }
    if (data.type === "TRUE_FALSE") {
      if (data.options.length !== 2) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "True/False harus punya tepat 2 opsi",
        });
      }
      if (data.correctAnswerIds.length !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["correctAnswerIds"],
          message: "True/False hanya boleh 1 jawaban benar",
        });
      }
    }
  });

export type QuestionInput = z.infer<typeof questionSchema>;
