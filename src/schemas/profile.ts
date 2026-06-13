import { z } from "zod";

export const PROFILE_NAME_MIN = 2;
export const PROFILE_NAME_MAX = 60;
export const PROFILE_BIO_MAX = 300;
export const PASSWORD_MIN = 8;
// bcrypt only hashes the first 72 bytes, so cap the length too.
export const PASSWORD_MAX = 72;

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(PROFILE_NAME_MIN, `Nama minimal ${PROFILE_NAME_MIN} karakter`)
    .max(PROFILE_NAME_MAX, `Nama maksimal ${PROFILE_NAME_MAX} karakter`),
  // Optional: empty string means "no bio".
  bio: z
    .string()
    .trim()
    .max(PROFILE_BIO_MAX, `Bio maksimal ${PROFILE_BIO_MAX} karakter`),
  // Optional: empty string means "no avatar"; otherwise must be a URL.
  image: z
    .url("URL gambar tidak valid")
    .max(2048, "URL gambar terlalu panjang")
    .or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
    newPassword: z
      .string()
      .min(PASSWORD_MIN, `Password baru minimal ${PASSWORD_MIN} karakter`)
      .max(PASSWORD_MAX, `Password maksimal ${PASSWORD_MAX} karakter`),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
