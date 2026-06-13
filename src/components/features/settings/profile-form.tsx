"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { PRESET_AVATARS } from "@/config/avatars";
import { cn, getInitials } from "@/lib/utils";
import {
  PROFILE_BIO_MAX,
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/schemas/profile";
import { updateProfileAction } from "@/server/actions/profile";

type ProfileFormProps = {
  defaultValues: UpdateProfileInput;
  onDirtyChange?: (dirty: boolean) => void;
};

export function ProfileForm({ defaultValues, onDirtyChange }: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues,
    mode: "onChange",
  });

  const { isDirty, isValid } = form.formState;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const imageValue = form.watch("image");
  const nameValue = form.watch("name");
  const bioValue = form.watch("bio") ?? "";

  function onSubmit(values: UpdateProfileInput) {
    startTransition(async () => {
      const result = await updateProfileAction(values);
      if (result.status === "error") {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            if (message) {
              form.setError(field as keyof UpdateProfileInput, { message });
            }
          }
        } else {
          form.setError("root", { message: result.message });
        }
        return;
      }

      // Reset baseline to the saved values so the form is no longer "dirty".
      form.reset(values);
      toast.success(
        <span data-testid="success-toast">Profil berhasil diperbarui</span>,
      );
      // Re-render server layouts so the navbar picks up the new name/avatar.
      router.refresh();
    });
  }

  return (
    <Card data-testid="profile-card">
      <CardHeader>
        <CardTitle className="text-xl">Profil</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {form.formState.errors.root ? (
              <p
                role="alert"
                data-testid="profile-error"
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {form.formState.errors.root.message}
              </p>
            ) : null}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <Avatar
                className="h-20 w-20 shrink-0"
                data-testid="avatar-preview"
              >
                {imageValue ? (
                  <AvatarImage src={imageValue} alt={nameValue} />
                ) : null}
                <AvatarFallback className="bg-primary text-lg text-primary-foreground">
                  {getInitials(nameValue)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Avatar</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          inputMode="url"
                          placeholder="https://..."
                          autoComplete="off"
                          data-testid="avatar-url-input"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Tempel URL gambar, atau pilih salah satu preset.
                      </FormDescription>
                      <FormMessage data-testid="image-error" />
                    </FormItem>
                  )}
                />

                <div
                  className="flex flex-wrap gap-2"
                  data-testid="avatar-presets"
                >
                  {PRESET_AVATARS.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() =>
                        form.setValue("image", url, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      className={cn(
                        "h-12 w-12 overflow-hidden rounded-full border-2 transition-colors",
                        imageValue === url
                          ? "border-primary"
                          : "border-transparent hover:border-border",
                      )}
                      aria-label="Pilih avatar preset"
                      data-testid="avatar-preset-option"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="name-input"
                      autoComplete="name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage data-testid="name-error" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Bio</FormLabel>
                    <span
                      className="text-xs text-muted-foreground"
                      data-testid="bio-counter"
                    >
                      {bioValue.length}/{PROFILE_BIO_MAX}
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      data-testid="bio-input"
                      placeholder="Ceritakan sedikit tentang dirimu (opsional)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage data-testid="bio-error" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              data-testid="save-profile-button"
              disabled={!isDirty || !isValid || isPending}
            >
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
