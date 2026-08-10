import { z } from "zod";

export const CATEGORY_NAME_MIN = 2;
export const CATEGORY_NAME_MAX = 50;
export const CATEGORY_SLUG_MAX = 60;
export const CATEGORY_DESCRIPTION_MAX = 200;

/** lowercase, alphanumeric words joined by single hyphens. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(CATEGORY_NAME_MIN, `Nama minimal ${CATEGORY_NAME_MIN} karakter`)
    .max(CATEGORY_NAME_MAX, `Nama maksimal ${CATEGORY_NAME_MAX} karakter`),
  slug: z
    .string()
    .trim()
    .min(1, "Slug wajib diisi")
    .max(CATEGORY_SLUG_MAX, `Slug maksimal ${CATEGORY_SLUG_MAX} karakter`)
    .regex(SLUG_PATTERN, "Slug hanya huruf kecil, angka, dan tanda hubung"),
  // Optional: empty string means "no description".
  description: z
    .string()
    .trim()
    .max(
      CATEGORY_DESCRIPTION_MAX,
      `Deskripsi maksimal ${CATEGORY_DESCRIPTION_MAX} karakter`,
    ),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;
