"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { SIGN_IN_ROUTE } from "@/config/routes";
import { enrollFreeCourseAction } from "@/server/actions/enrollment";

type EnrollButtonProps = {
  courseId: string;
  slug: string;
  price: number;
  isLoggedIn: boolean;
  isEnrolled: boolean;
  firstLectureId: string | null;
};

export function EnrollButton({
  courseId,
  slug,
  price,
  isLoggedIn,
  isEnrolled,
  firstLectureId,
}: EnrollButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isFree = price <= 0;

  if (!isLoggedIn) {
    return (
      <Button asChild size="lg" className="w-full" data-testid="enroll-button">
        <Link href={`${SIGN_IN_ROUTE}?callbackUrl=/courses/${slug}`}>
          Sign in to enroll
        </Link>
      </Button>
    );
  }

  if (isEnrolled) {
    return (
      <Button asChild size="lg" className="w-full" data-testid="enroll-button">
        <Link href={`/learn/${courseId}/${firstLectureId ?? ""}`}>
          Continue Learning
        </Link>
      </Button>
    );
  }

  if (isFree) {
    return (
      <div className="space-y-2">
        <Button
          size="lg"
          className="w-full"
          data-testid="enroll-button"
          disabled={isPending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await enrollFreeCourseAction(courseId);
              if (result?.error) setError(result.error);
            });
          }}
        >
          {isPending ? "Enrolling..." : "Enroll for Free"}
        </Button>
        {error ? (
          <p
            role="alert"
            data-testid="enroll-error"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  // Paid course, not enrolled → go to checkout.
  return (
    <Button asChild size="lg" className="w-full" data-testid="enroll-button">
      <Link href={`/checkout/${courseId}`}>Buy for {formatPrice(price)}</Link>
    </Button>
  );
}
