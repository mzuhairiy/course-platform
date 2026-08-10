import { UserRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  categoryCreate,
  categoryUpdate,
  categoryDelete,
  categoryFindUnique,
} = vi.hoisted(() => ({
  categoryCreate: vi.fn(),
  categoryUpdate: vi.fn(),
  categoryDelete: vi.fn(),
  categoryFindUnique: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    category: {
      create: categoryCreate,
      update: categoryUpdate,
      delete: categoryDelete,
      findUnique: categoryFindUnique,
    },
  },
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));

import { ForbiddenError } from "@/lib/rbac";
import type { AdminActor } from "@/server/services/admin";
import {
  categorySlugExists,
  CategoryInUseError,
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/server/services/category";

const admin: AdminActor = { id: "admin_1", role: UserRole.ADMIN };
const instructor: AdminActor = { id: "inst_1", role: UserRole.INSTRUCTOR };

const formInput = { name: "Programming", slug: "programming", description: "" };

beforeEach(() => {
  vi.clearAllMocks();
  categoryCreate.mockResolvedValue({ id: "cat_1" });
  categoryUpdate.mockResolvedValue({ id: "cat_1" });
  categoryDelete.mockResolvedValue({ id: "cat_1" });
});

describe("createCategory", () => {
  it("blocks a non-admin", async () => {
    await expect(createCategory(formInput, instructor)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(categoryCreate).not.toHaveBeenCalled();
  });

  it("creates the category with a null description when empty", async () => {
    await createCategory(formInput, admin);

    expect(categoryCreate).toHaveBeenCalledWith({
      data: { name: "Programming", slug: "programming", description: null },
      select: { id: true },
    });
  });
});

describe("updateCategory", () => {
  it("blocks a non-admin", async () => {
    await expect(
      updateCategory("cat_1", formInput, instructor),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(categoryUpdate).not.toHaveBeenCalled();
  });

  it("updates when admin", async () => {
    await updateCategory("cat_1", formInput, admin);
    expect(categoryUpdate).toHaveBeenCalledWith({
      where: { id: "cat_1" },
      data: { name: "Programming", slug: "programming", description: null },
      select: { id: true },
    });
  });
});

describe("deleteCategory", () => {
  it("blocks a non-admin", async () => {
    await expect(deleteCategory("cat_1", instructor)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(categoryDelete).not.toHaveBeenCalled();
  });

  it("blocks delete when still referenced by courses or experts", async () => {
    categoryFindUnique.mockResolvedValue({
      _count: { courses: 2, experts: 1 },
    });

    await expect(deleteCategory("cat_1", admin)).rejects.toBeInstanceOf(
      CategoryInUseError,
    );
    expect(categoryDelete).not.toHaveBeenCalled();
  });

  it("deletes when unused", async () => {
    categoryFindUnique.mockResolvedValue({ _count: { courses: 0, experts: 0 } });

    await deleteCategory("cat_1", admin);

    expect(categoryDelete).toHaveBeenCalledWith({
      where: { id: "cat_1" },
      select: { id: true },
    });
  });
});

describe("categorySlugExists", () => {
  it("is false when no category has the slug", async () => {
    categoryFindUnique.mockResolvedValue(null);
    expect(await categorySlugExists("new-slug")).toBe(false);
  });

  it("is true when a different category has the slug", async () => {
    categoryFindUnique.mockResolvedValue({ id: "cat_2" });
    expect(await categorySlugExists("taken-slug", "cat_1")).toBe(true);
  });

  it("is false when the slug belongs to the category being edited", async () => {
    categoryFindUnique.mockResolvedValue({ id: "cat_1" });
    expect(await categorySlugExists("own-slug", "cat_1")).toBe(false);
  });
});
