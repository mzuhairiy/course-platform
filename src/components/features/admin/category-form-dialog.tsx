"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/utils";
import { categoryFormSchema, type CategoryFormInput } from "@/schemas/category";
import {
  createCategoryAction,
  updateCategoryAction,
} from "@/server/actions/category";
import type { AdminCategoryRow } from "@/server/services/category";

const EMPTY_FORM: CategoryFormInput = { name: "", slug: "", description: "" };

function toDefaults(category?: AdminCategoryRow | null): CategoryFormInput {
  return {
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
  };
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode; null/undefined = add mode. */
  category?: AdminCategoryRow | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(category);
  const [slugTouched, setSlugTouched] = useState(isEdit);

  const form = useForm<CategoryFormInput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: EMPTY_FORM,
  });

  // Re-seed the form whenever the dialog (re)opens for a given category.
  useEffect(() => {
    if (open) {
      form.reset(toDefaults(category));
      setSlugTouched(Boolean(category));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category]);

  function onSubmit(values: CategoryFormInput) {
    startTransition(async () => {
      const result = isEdit
        ? await updateCategoryAction(category!.id, values)
        : await createCategoryAction(values);

      if (result.status === "error") {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            if (message) {
              form.setError(field as keyof CategoryFormInput, { message });
            }
          }
        } else {
          form.setError("root", { message: result.message });
        }
        return;
      }

      toast.success(<span data-testid="success-toast">{result.message}</span>);
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="category-form-dialog">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
          <DialogDescription>
            Kategori dipakai untuk mengelompokkan course.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            data-testid="category-form"
          >
            {form.formState.errors.root ? (
              <p
                role="alert"
                data-testid="category-form-error"
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {form.formState.errors.root.message}
              </p>
            ) : null}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="category-name-input"
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
                  <FormMessage data-testid="category-name-error" />
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
                      data-testid="category-slug-input"
                      {...field}
                      onChange={(e) => {
                        setSlugTouched(true);
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormMessage data-testid="category-slug-error" />
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
                      data-testid="category-description-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage data-testid="category-description-error" />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                data-testid="category-form-submit"
                disabled={isPending}
              >
                {isPending ? "Menyimpan…" : isEdit ? "Simpan" : "Tambah"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
