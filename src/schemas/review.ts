import { z } from "zod";

export const REVIEW_RATING_MIN = 1;
export const REVIEW_RATING_MAX = 5;
export const REVIEW_COMMENT_MAX = 1000;

export const reviewSchema = z.object({
  rating: z
    .number({ message: "Rating wajib diisi" })
    .int()
    .min(REVIEW_RATING_MIN, "Beri rating 1–5 bintang")
    .max(REVIEW_RATING_MAX, "Beri rating 1–5 bintang"),
  comment: z
    .string()
    .trim()
    .max(REVIEW_COMMENT_MAX, `Komentar maksimal ${REVIEW_COMMENT_MAX} karakter`),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
