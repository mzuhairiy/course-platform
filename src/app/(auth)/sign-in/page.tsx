import type { Metadata } from "next";
import Link from "next/link";

import { SignInForm } from "@/components/features/auth/sign-in-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SIGN_UP_ROUTE } from "@/config/routes";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-muted px-4 py-12"
      data-testid="sign-in-page"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to continue learning.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignInForm callbackUrl={searchParams.callbackUrl} />
          <p className="text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link
              href={SIGN_UP_ROUTE}
              className="font-medium text-foreground underline-offset-4 hover:underline"
              data-testid="link-sign-up"
            >
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
