"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signUpAction } from "@/server/actions/auth";
import { signUpSchema, type SignUpInput } from "@/schemas/auth";

export function SignUpForm() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  function onSubmit(values: SignUpInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await signUpAction(values);
      if (result?.error) setServerError(result.error);
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        data-testid="sign-up-form"
        noValidate
      >
        {serverError && (
          <p
            role="alert"
            data-testid="sign-up-error"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {serverError}
          </p>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Nama lengkap"
                  autoComplete="name"
                  data-testid="sign-up-name"
                  {...field}
                />
              </FormControl>
              <FormMessage data-testid="sign-up-name-error" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  data-testid="sign-up-email"
                  {...field}
                />
              </FormControl>
              <FormMessage data-testid="sign-up-email-error" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  data-testid="sign-up-password"
                  {...field}
                />
              </FormControl>
              <FormMessage data-testid="sign-up-password-error" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
          data-testid="sign-up-submit"
        >
          {isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </Form>
  );
}
