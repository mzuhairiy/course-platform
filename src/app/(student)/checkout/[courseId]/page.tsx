import { CourseStatus } from "@prisma/client";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";

import { CheckoutButton } from "@/components/features/checkout/checkout-button";
import { CourseCover } from "@/components/features/course/course-cover";
import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { Card, CardContent } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { getCheckoutCourse } from "@/server/services/course";
import { findEnrollment } from "@/server/services/enrollment";

export const metadata: Metadata = {
  title: "Checkout",
};

type PageProps = { params: { courseId: string } };

export default async function CheckoutPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/sign-in?callbackUrl=/checkout/${params.courseId}`);
  }

  const course = await getCheckoutCourse(params.courseId);
  if (!course || course.status !== CourseStatus.PUBLISHED) notFound();

  // Free course → use the normal enroll flow; already enrolled → go learn.
  if (course.price <= 0) redirect(`/courses/${course.slug}`);
  if (await findEnrollment(user.id, course.id)) {
    redirect(`/learn/${course.id}`);
  }

  return (
    <Section spacing="compact">
      <Container size="reading" className="space-y-6" data-testid="checkout-page">
        <Heading as="h1" level="h1">
          Checkout
        </Heading>

        <Card data-testid="order-summary">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-surface-muted sm:w-40">
              {course.thumbnailUrl ? (
                <Image
                  src={course.thumbnailUrl}
                  alt={course.title}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              ) : (
                <CourseCover
                  label={course.coverLabel ?? course.title}
                  seed={course.slug}
                />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-semibold leading-tight" data-testid="order-title">
                {course.title}
              </p>
              <Text variant="muted" as="span" className="block text-sm">
                {course.instructor.name}
              </Text>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <Text variant="muted" as="span">
                Harga
              </Text>
              <span>{formatPrice(course.price)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3 text-lg font-semibold">
              <span>Total</span>
              <span data-testid="order-total">{formatPrice(course.price)}</span>
            </div>
            <CheckoutButton courseId={course.id} />
          </CardContent>
        </Card>
      </Container>
    </Section>
  );
}
