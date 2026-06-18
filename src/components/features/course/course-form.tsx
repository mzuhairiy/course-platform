"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { cn, slugify } from "@/lib/utils";
import {
  COURSE_LEVELS,
  courseFormSchema,
  type CourseFormInput,
} from "@/schemas/course";
import type { CategoryOption } from "@/server/services/category";
import {
  createCourseAction,
  updateCourseAction,
} from "@/server/actions/course";

const LEVEL_LABELS: Record<(typeof COURSE_LEVELS)[number], string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

// Mirror the Input field styling for native selects (very automation-friendly).
const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

export const EMPTY_COURSE_FORM: CourseFormInput = {
  title: "",
  subtitle: "",
  description: "",
  categoryId: "",
  level: "BEGINNER",
  price: 0,
  language: "id",
  coverLabel: "",
  slug: "",
};

type CourseFormProps = {
  mode: "create" | "edit";
  categories: CategoryOption[];
  defaultValues?: CourseFormInput;
  courseId?: string;
};

export function CourseForm({
  mode,
  categories,
  defaultValues = EMPTY_COURSE_FORM,
  courseId,
}: CourseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Once the instructor edits the slug by hand (or we're editing an existing
  // course), stop auto-deriving it from the title.
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  const form = useForm<CourseFormInput>({
    resolver: zodResolver(courseFormSchema),
    defaultValues,
    mode: "onTouched",
  });

  function onSubmit(values: CourseFormInput) {
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createCourseAction(values)
          : await updateCourseAction(courseId as string, values);

      // On create success the action redirects, so only errors return here.
      if (result?.status === "error") {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            if (message) {
              form.setError(field as keyof CourseFormInput, { message });
            }
          }
        } else {
          form.setError("root", { message: result.message });
        }
        return;
      }

      if (result?.status === "success") {
        form.reset(values);
        toast.success(
          <span data-testid="success-toast">{result.message}</span>,
        );
        router.refresh();
      }
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        data-testid="course-form"
      >
        {form.formState.errors.root ? (
          <p
            role="alert"
            data-testid="course-form-error"
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
                <Input
                  data-testid="course-form-title"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    if (!slugTouched) {
                      form.setValue("slug", slugify(e.target.value), {
                        shouldValidate: true,
                      });
                    }
                  }}
                />
              </FormControl>
              <FormMessage data-testid="course-form-title-error" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subtitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subtitle</FormLabel>
              <FormControl>
                <Input
                  data-testid="course-form-subtitle"
                  placeholder="Ringkasan singkat (opsional)"
                  {...field}
                />
              </FormControl>
              <FormMessage data-testid="course-form-subtitle-error" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input
                  data-testid="course-form-slug"
                  {...field}
                  onChange={(e) => {
                    setSlugTouched(true);
                    field.onChange(e);
                  }}
                />
              </FormControl>
              <FormDescription>
                Otomatis dari judul; bisa diubah manual.
              </FormDescription>
              <FormMessage data-testid="course-form-slug-error" />
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
                  data-testid="course-form-description"
                  rows={8}
                  placeholder="Jelaskan course ini (mendukung markdown)"
                  {...field}
                />
              </FormControl>
              <FormMessage data-testid="course-form-description-error" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategori</FormLabel>
                <FormControl>
                  <select
                    className={SELECT_CLASS}
                    data-testid="course-form-category"
                    {...field}
                  >
                    <option value="">Pilih kategori…</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage data-testid="course-form-category-error" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Level</FormLabel>
                <FormControl>
                  <select
                    className={SELECT_CLASS}
                    data-testid="course-form-level"
                    {...field}
                  >
                    {COURSE_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {LEVEL_LABELS[level]}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage data-testid="course-form-level-error" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Harga (IDR)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    inputMode="numeric"
                    data-testid="course-form-price"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={Number.isNaN(field.value) ? "" : field.value}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormDescription>0 = gratis.</FormDescription>
                <FormMessage data-testid="course-form-price-error" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bahasa</FormLabel>
                <FormControl>
                  <Input data-testid="course-form-language" {...field} />
                </FormControl>
                <FormMessage data-testid="course-form-language-error" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="coverLabel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover label</FormLabel>
              <FormControl>
                <Input
                  data-testid="course-form-cover-label"
                  placeholder='Teks untuk cover 3D, misal "Next.js" (opsional)'
                  {...field}
                />
              </FormControl>
              <FormMessage data-testid="course-form-cover-label-error" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          data-testid="course-form-submit"
          disabled={isPending}
          className={cn(isPending && "opacity-80")}
        >
          {isPending
            ? "Menyimpan…"
            : mode === "create"
              ? "Buat Course"
              : "Simpan Perubahan"}
        </Button>
      </form>
    </Form>
  );
}
