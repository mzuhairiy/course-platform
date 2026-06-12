import type { Metadata } from "next";
import Link from "next/link";

import { SignUpForm } from "@/components/features/auth/sign-up-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SIGN_IN_ROUTE } from "@/config/routes";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignUpPage() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-muted px-4 py-12"
      data-testid="sign-up-page"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            Start learning in minutes. It&apos;s free.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignUpForm />
          <p className="text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link
              href={SIGN_IN_ROUTE}
              className="font-medium text-foreground underline-offset-4 hover:underline"
              data-testid="link-sign-in"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
