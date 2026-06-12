import { BookOpen, Briefcase, Code, Palette } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/typography";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  programming: Code,
  design: Palette,
  business: Briefcase,
};

type CategoryCardProps = {
  name: string;
  slug: string;
  courseCount: number;
};

export function CategoryCard({ name, slug, courseCount }: CategoryCardProps) {
  const Icon = CATEGORY_ICONS[slug] ?? BookOpen;

  return (
    <Link
      href={`/courses?category=${slug}`}
      data-testid="category-card"
      className="group"
    >
      <Card className="flex h-full flex-col items-start gap-3 p-6 transition-colors hover:border-border-strong">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-muted text-foreground">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-medium">{name}</p>
          <Text variant="muted" as="span">
            {courseCount} course{courseCount === 1 ? "" : "s"}
          </Text>
        </div>
      </Card>
    </Link>
  );
}
