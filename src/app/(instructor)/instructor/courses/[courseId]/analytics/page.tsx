import { UserRole } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { StatCard } from "@/components/features/analytics/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";
import { FORBIDDEN_ROUTE } from "@/config/routes";
import { getCurrentUser } from "@/lib/auth";
import { getCourseAnalytics } from "@/server/services/analytics";
import { getCourseOwnerMeta } from "@/server/services/course";

export const metadata: Metadata = {
  title: "Course Analytics",
};

type PageProps = { params: { courseId: string } };

export default async function CourseAnalyticsPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/sign-in?callbackUrl=/instructor/courses/${params.courseId}/analytics`);
  }

  const course = await getCourseOwnerMeta(params.courseId);
  if (!course) notFound();
  if (user.role !== UserRole.ADMIN && course.instructorId !== user.id) {
    redirect(FORBIDDEN_ROUTE);
  }

  const analytics = await getCourseAnalytics(params.courseId);

  return (
    <div className="mx-auto max-w-3xl space-y-6" data-testid="course-analytics">
      <header className="space-y-2">
        <Button asChild variant="link" size="sm" className="-ml-3 w-fit">
          <Link href="/instructor/courses">← Kembali ke My Courses</Link>
        </Button>
        <Heading as="h1" level="h1">
          Analytics
        </Heading>
        <Text variant="muted">{course.title}</Text>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total enrolled"
          value={analytics.totalEnrolled}
          testid="stat-enrolled"
        />
        <StatCard
          label="Completion rate"
          value={`${analytics.completionRate}%`}
          testid="stat-completion"
        />
        <StatCard
          label="Avg quiz score"
          value={analytics.avgQuizScore == null ? "—" : `${analytics.avgQuizScore}%`}
          hint={analytics.avgQuizScore == null ? "Belum ada attempt" : undefined}
          testid="stat-quiz-score"
        />
      </div>

      <Card data-testid="course-analytics-funnel">
        <CardHeader>
          <CardTitle className="text-lg">
            Funnel lesson (% siswa yang menjangkau)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.funnel.length > 0 ? (
            <ul className="space-y-3">
              {analytics.funnel.map((point) => (
                <li
                  key={point.lectureId}
                  className="space-y-1"
                  data-testid="funnel-row"
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 flex-1 truncate">
                      {point.title}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {point.reached} · {point.reachedPct}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${point.reachedPct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Text variant="muted">Belum ada lesson.</Text>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
