import type { CourseStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

const LABELS: Record<CourseStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

const VARIANTS: Record<
  CourseStatus,
  "default" | "secondary" | "outline"
> = {
  DRAFT: "secondary",
  PUBLISHED: "default",
  ARCHIVED: "outline",
};

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  return (
    <Badge variant={VARIANTS[status]} data-testid="course-status-badge">
      {LABELS[status]}
    </Badge>
  );
}
