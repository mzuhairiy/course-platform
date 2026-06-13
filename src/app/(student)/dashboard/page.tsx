import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EnrolledCourseCard } from "@/components/features/course/enrolled-course-card";
import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";
import { getCurrentUser } from "@/lib/auth";
import {
  getEnrolledCourses,
  getEnrollmentStats,
} from "@/server/services/enrollment";
import { getCourseProgress } from "@/server/services/progress";

export const metadata: Metadata = {
  title: "Dashboard",
};

function StatCard({
  label,
  value,
  testid,
}: {
  label: string;
  value: number;
  testid: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-3xl font-semibold" data-testid={testid}>
          {value}
        </p>
        <Text variant="muted" as="span">
          {label}
        </Text>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in?callbackUrl=/dashboard");
  }

  const [enrollments, stats] = await Promise.all([
    getEnrolledCourses(user.id, 3),
    getEnrollmentStats(user.id),
  ]);
  const progressByCourse = await Promise.all(
    enrollments.map((enrollment) =>
      getCourseProgress(user.id, enrollment.course.id),
    ),
  );

  return (
    <Section spacing="compact">
      <Container className="space-y-10" data-testid="dashboard">
        <header className="space-y-1">
          <Heading as="h1" level="h1">
            Halo, {user.name ?? "there"}
          </Heading>
          <Text variant="lead">Lanjutkan progres belajarmu.</Text>
        </header>

        <div className="grid grid-cols-2 gap-4 sm:max-w-md">
          <StatCard
            label="Enrolled"
            value={stats.total}
            testid="stat-enrolled"
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            testid="stat-completed"
          />
        </div>

        <section className="space-y-4" data-testid="continue-learning-section">
          <div className="flex items-center justify-between">
            <Heading as="h2" level="h3">
              Continue Learning
            </Heading>
            <Button asChild variant="link">
              <Link href="/my-courses" data-testid="link-my-courses">
                View all
              </Link>
            </Button>
          </div>

          {enrollments.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {enrollments.map((enrollment, i) => (
                <EnrolledCourseCard
                  key={enrollment.id}
                  enrollment={enrollment}
                  progress={progressByCourse[i]}
                />
              ))}
            </div>
          ) : (
            <div
              className="rounded-lg border border-dashed border-border p-12 text-center"
              data-testid="dashboard-empty"
            >
              <Text variant="muted">
                Kamu belum enroll course apa pun. Mulai dari katalog kami.
              </Text>
            </div>
          )}
        </section>

        <section
          className="space-y-3 rounded-lg border border-border bg-surface p-8 text-center"
          data-testid="browse-more-section"
        >
          <Heading as="h2" level="h3">
            Mau belajar hal baru?
          </Heading>
          <Text variant="muted">Jelajahi semua course yang tersedia.</Text>
          <Button asChild>
            <Link href="/courses" data-testid="browse-more">
              Browse More Courses
            </Link>
          </Button>
        </section>
      </Container>
    </Section>
  );
}
