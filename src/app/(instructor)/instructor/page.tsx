import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EnrollmentChart } from "@/components/features/analytics/enrollment-chart";
import { StatCard } from "@/components/features/analytics/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import { getInstructorStats } from "@/server/services/analytics";

export const metadata: Metadata = {
  title: "Instructor Dashboard",
};

export default async function InstructorDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?callbackUrl=/instructor");

  const stats = await getInstructorStats(user.id);

  return (
    <div className="space-y-6" data-testid="instructor-dashboard">
      <header className="space-y-1">
        <Heading as="h1" level="h1">
          Halo, {user.name ?? "Instructor"}
        </Heading>
        <Text variant="muted">Ringkasan performa course Anda.</Text>
      </header>

      <div
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        data-testid="instructor-stats-cards"
      >
        <StatCard
          label="Total courses"
          value={stats.totalCourses}
          testid="stat-total-courses"
        />
        <StatCard
          label="Total students"
          value={stats.totalStudents}
          testid="stat-total-students"
        />
        <StatCard
          label="Total revenue"
          value={formatPrice(stats.totalRevenue)}
          hint="Tersedia setelah Fase 2"
          testid="stat-total-revenue"
        />
        <StatCard
          label="Completion rate"
          value={`${stats.completionRate}%`}
          testid="stat-completion-rate"
        />
      </div>

      <section className="space-y-3">
        <Heading as="h2" level="h3">
          Tren Enrollment (30 hari)
        </Heading>
        <EnrollmentChart data={stats.trend} />
      </section>

      <Card data-testid="recent-enrollments">
        <CardHeader>
          <CardTitle className="text-lg">Enrollment terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentEnrollments.length > 0 ? (
            <ul className="divide-y divide-border">
              {stats.recentEnrollments.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                  data-testid="recent-enrollment-item"
                >
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{e.studentName}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {e.courseTitle}
                    </span>
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {formatDate(e.enrolledAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Text variant="muted">Belum ada enrollment.</Text>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
