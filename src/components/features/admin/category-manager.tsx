"use client";

import { useState } from "react";

import { CategoryFormDialog } from "@/components/features/admin/category-form-dialog";
import { DeleteCategoryDialog } from "@/components/features/admin/delete-category-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/typography";
import type { AdminCategoryRow } from "@/server/services/category";

export function CategoryManager({
  categories,
}: {
  categories: AdminCategoryRow[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategoryRow | null>(null);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(category: AdminCategoryRow) {
    setEditing(category);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4" data-testid="category-manager">
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          data-testid="add-category-button"
          onClick={openAdd}
        >
          Tambah Kategori
        </Button>
      </div>

      {categories.length > 0 ? (
        <ul className="space-y-2" data-testid="admin-category-list">
          {categories.map((category) => (
            <li key={category.id}>
              <Card data-testid="admin-category-item">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-semibold leading-tight">
                      {category.name}
                    </p>
                    <Text variant="muted" as="span" className="block text-sm">
                      {category.slug} · {category._count.courses} course ·{" "}
                      {category._count.experts} expert
                    </Text>
                    {category.description ? (
                      <Text variant="muted" as="p" className="text-sm">
                        {category.description}
                      </Text>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      data-testid="edit-category-button"
                      onClick={() => openEdit(category)}
                    >
                      Edit
                    </Button>
                    <DeleteCategoryDialog
                      categoryId={category.id}
                      categoryName={category.name}
                    />
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <div
          className="rounded-lg border border-dashed border-border p-12 text-center"
          data-testid="admin-categories-empty"
        >
          <Text variant="muted">Belum ada kategori.</Text>
        </div>
      )}

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
      />
    </div>
  );
}
