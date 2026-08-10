import type { Metadata } from "next";

import { CategoryManager } from "@/components/features/admin/category-manager";
import { Heading, Text } from "@/components/ui/typography";
import { getAdminCategories } from "@/server/services/category";

export const metadata: Metadata = {
  title: "Categories · Admin",
};

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div className="space-y-6" data-testid="admin-categories">
      <header className="space-y-1">
        <Heading as="h1" level="h1">
          Categories
        </Heading>
        <Text variant="muted">{categories.length} kategori course.</Text>
      </header>

      <CategoryManager categories={categories} />
    </div>
  );
}
