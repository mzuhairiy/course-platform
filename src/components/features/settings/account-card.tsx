import type { UserRole } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ROLE_LABELS: Record<UserRole, string> = {
  STUDENT: "Student",
  INSTRUCTOR: "Instructor",
  ADMIN: "Admin",
};

export function AccountCard({
  email,
  role,
}: {
  email: string;
  role: UserRole;
}) {
  return (
    <Card data-testid="account-card">
      <CardHeader>
        <CardTitle className="text-xl">Akun</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="account-email">Email</Label>
          <Input
            id="account-email"
            type="email"
            value={email}
            readOnly
            disabled
            data-testid="email-readonly"
          />
          <p className="text-sm text-muted-foreground">
            Hubungi support untuk mengubah email.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Role</Label>
          <div>
            <Badge variant="secondary" data-testid="account-role">
              {ROLE_LABELS[role]}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
