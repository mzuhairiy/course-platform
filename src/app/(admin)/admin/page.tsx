import type { Metadata } from "next";

import { StatCard } from "@/components/features/analytics/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";
import { formatPrice } from "@/lib/format";
import { getAdminStats } from "@/server/services/analytics";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <header className="space-y-1">
        <Heading as="h1" level="h1">
          Admin Dashboard
        </Heading>
        <Text variant="muted">Ringkasan seluruh platform.</Text>
      </header>

      <div
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        data-testid="admin-stats-cards"
      >
        <StatCard
          label="Total users"
          value={stats.totalUsers}
          testid="stat-users"
        />
        <StatCard
          label="Total transactions"
          value={stats.totalTransactions}
          testid="stat-transactions"
        />
        <StatCard
          label="Total revenue"
          value={formatPrice(stats.totalRevenue)}
          hint="Tersedia setelah Fase 2"
          testid="stat-revenue"
        />
        <StatCard
          label="Published courses"
          value={stats.coursesByStatus.PUBLISHED}
          testid="stat-published"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Courses per status</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-3 gap-4 text-center">
            <div data-testid="courses-draft">
              <dt className="text-sm text-muted-foreground">Draft</dt>
              <dd className="text-2xl font-semibold">
                {stats.coursesByStatus.DRAFT}
              </dd>
            </div>
            <div data-testid="courses-published">
              <dt className="text-sm text-muted-foreground">Published</dt>
              <dd className="text-2xl font-semibold">
                {stats.coursesByStatus.PUBLISHED}
              </dd>
            </div>
            <div data-testid="courses-archived">
              <dt className="text-sm text-muted-foreground">Archived</dt>
              <dd className="text-2xl font-semibold">
                {stats.coursesByStatus.ARCHIVED}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
