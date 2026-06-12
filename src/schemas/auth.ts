import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Masukkan email yang valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama terlalu panjang"),
  email: z.email("Masukkan email yang valid"),
  // bcrypt only hashes the first 72 bytes, so cap the length too.
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password maksimal 72 karakter"),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
