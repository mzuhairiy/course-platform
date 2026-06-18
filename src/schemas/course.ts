import { z } from "zod";

export const COURSE_TITLE_MIN = 5;
export const COURSE_TITLE_MAX = 100;
export const COURSE_SUBTITLE_MAX = 200;
export const COURSE_DESCRIPTION_MIN = 50;
export const COURSE_COVER_LABEL_MAX = 40;
export const COURSE_SLUG_MAX = 100;
export const COURSE_PRICE_MAX = 100_000_000; // Rp 100jt sanity cap

// Mirror of Prisma's CourseLevel — kept as literals so this schema stays
// client-safe (importing @prisma/client into client bundles is undesirable).
export const COURSE_LEVELS = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
] as const;

/** lowercase, alphanumeric words joined by single hyphens. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const courseFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(COURSE_TITLE_MIN, `Judul minimal ${COURSE_TITLE_MIN} karakter`)
    .max(COURSE_TITLE_MAX, `Judul maksimal ${COURSE_TITLE_MAX} karakter`),
  // Optional: empty string means "no subtitle".
  subtitle: z
    .string()
    .trim()
    .max(COURSE_SUBTITLE_MAX, `Subtitle maksimal ${COURSE_SUBTITLE_MAX} karakter`),
  description: z
    .string()
    .trim()
    .min(
      COURSE_DESCRIPTION_MIN,
      `Deskripsi minimal ${COURSE_DESCRIPTION_MIN} karakter`,
    ),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  level: z.enum(COURSE_LEVELS, { message: "Level tidak valid" }),
  // The form feeds a real number via valueAsNumber (NaN when the field is
  // empty, which fails this check with the message below).
  price: z
    .number({ message: "Harga harus berupa angka" })
    .int("Harga harus bilangan bulat")
    .min(0, "Harga tidak boleh negatif")
    .max(COURSE_PRICE_MAX, "Harga terlalu besar"),
  language: z
    .string()
    .trim()
    .min(2, "Bahasa wajib diisi")
    .max(10, "Kode bahasa terlalu panjang"),
  // Optional: empty string means "use the course title on the 3D cover".
  coverLabel: z
    .string()
    .trim()
    .max(COURSE_COVER_LABEL_MAX, `Cover label maksimal ${COURSE_COVER_LABEL_MAX} karakter`),
  slug: z
    .string()
    .trim()
    .min(1, "Slug wajib diisi")
    .max(COURSE_SLUG_MAX, `Slug maksimal ${COURSE_SLUG_MAX} karakter`)
    .regex(SLUG_PATTERN, "Slug hanya huruf kecil, angka, dan tanda hubung"),
});

export type CourseFormInput = z.infer<typeof courseFormSchema>;
