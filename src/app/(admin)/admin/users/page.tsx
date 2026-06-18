import type { Metadata } from "next";

import { AdminRoleControl } from "@/components/features/admin/admin-role-control";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getAdminUsers } from "@/server/services/admin";

export const metadata: Metadata = {
  title: "Users · Admin",
};

export default async function AdminUsersPage() {
  const [me, users] = await Promise.all([getCurrentUser(), getAdminUsers()]);

  return (
    <div className="space-y-6" data-testid="admin-users">
      <header className="space-y-1">
        <Heading as="h1" level="h1">
          Users
        </Heading>
        <Text variant="muted">{users.length} pengguna terdaftar.</Text>
      </header>

      <ul className="space-y-2" data-testid="admin-user-list">
        {users.map((user) => (
          <li key={user.id}>
            <Card data-testid="admin-user-item">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{user.name ?? "—"}</p>
                    <Badge variant="secondary">{user.role}</Badge>
                  </div>
                  <Text variant="muted" as="span" className="block text-sm">
                    {user.email} · {user._count.enrollments} enrolled · gabung{" "}
                    {formatDate(user.createdAt)}
                  </Text>
                </div>
                <AdminRoleControl
                  userId={user.id}
                  currentRole={user.role}
                  isSelf={user.id === me?.id}
                />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
