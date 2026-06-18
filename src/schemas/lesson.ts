import { z } from "zod";

export const LESSON_TITLE_MIN = 3;
export const LESSON_TITLE_MAX = 150;

// Mirror of Prisma's LectureType — literals keep this schema client-safe.
export const LESSON_TYPES = ["VIDEO", "READING", "QUIZ"] as const;
export type LessonType = (typeof LESSON_TYPES)[number];

export const lessonSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(LESSON_TITLE_MIN, `Judul minimal ${LESSON_TITLE_MIN} karakter`)
      .max(LESSON_TITLE_MAX, `Judul maksimal ${LESSON_TITLE_MAX} karakter`),
    type: z.enum(LESSON_TYPES, { message: "Tipe tidak valid" }),
    // Only meaningful for VIDEO; validated conditionally below.
    videoUrl: z.string().trim(),
    durationSeconds: z
      .number({ message: "Durasi harus berupa angka" })
      .int("Durasi harus bilangan bulat")
      .min(0, "Durasi tidak boleh negatif")
      .optional(),
    // Only meaningful for READING.
    contentMd: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "VIDEO") {
      if (!data.videoUrl) {
        ctx.addIssue({
          code: "custom",
          path: ["videoUrl"],
          message: "URL video wajib diisi",
        });
      } else if (!/^https?:\/\/.+/i.test(data.videoUrl)) {
        ctx.addIssue({
          code: "custom",
          path: ["videoUrl"],
          message: "URL video tidak valid",
        });
      }
      if (data.durationSeconds == null || Number.isNaN(data.durationSeconds)) {
        ctx.addIssue({
          code: "custom",
          path: ["durationSeconds"],
          message: "Durasi wajib diisi untuk video",
        });
      }
    }
    if (data.type === "READING" && !data.contentMd.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["contentMd"],
        message: "Konten wajib diisi untuk lesson bacaan",
      });
    }
  });

export type LessonInput = z.infer<typeof lessonSchema>;
