import type { Metadata } from "next";

import { WorkspacePlaceholder } from "@/components/shared/workspace-placeholder";

export const metadata: Metadata = {
  title: "Categories · Admin",
};

export default function AdminCategoriesPage() {
  return (
    <WorkspacePlaceholder
      title="Categories"
      description="Kelola kategori course."
      testid="admin-categories"
    />
  );
}
