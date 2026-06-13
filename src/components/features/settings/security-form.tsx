"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/schemas/profile";
import { changePasswordAction } from "@/server/actions/profile";

const EMPTY: ChangePasswordInput = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function SecurityForm({
  onDirtyChange,
}: {
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY,
    mode: "onChange",
  });

  const { isDirty } = form.formState;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  function onSubmit(values: ChangePasswordInput) {
    startTransition(async () => {
      const result = await changePasswordAction(values);
      if (result.status === "error") {
        if (result.fieldErrors) {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            if (message) {
              form.setError(field as keyof ChangePasswordInput, { message });
            }
          }
        } else {
          form.setError("root", { message: result.message });
        }
        return;
      }

      form.reset(EMPTY);
      onDirtyChange?.(false);
      toast.success(
        <span data-testid="success-toast">Password berhasil diubah</span>,
      );
    });
  }

  return (
    <Card data-testid="security-card">
      <CardHeader>
        <CardTitle className="text-xl">Keamanan</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {form.formState.errors.root ? (
              <p
                role="alert"
                data-testid="security-error"
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {form.formState.errors.root.message}
              </p>
            ) : null}

            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Saat Ini</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      data-testid="current-password-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage data-testid="current-password-error" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Baru</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      data-testid="new-password-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage data-testid="new-password-error" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konfirmasi Password Baru</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      data-testid="confirm-password-input"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage data-testid="confirm-password-error" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              variant="secondary"
              data-testid="change-password-button"
              disabled={!isDirty || isPending}
            >
              {isPending ? "Mengubah..." : "Ubah Password"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
