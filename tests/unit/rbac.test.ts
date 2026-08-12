import { UserRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentUser } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser }));

import { ForbiddenError, hasRole, requireRole, resolveLiveRole } from "@/lib/rbac";

const sessionUser = (role: UserRole) => ({
  id: "user_1",
  name: "Test",
  email: "test@example.com",
  role,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("hasRole", () => {
  it("is true when the role is in the allowed list", () => {
    expect(hasRole(UserRole.INSTRUCTOR, [UserRole.INSTRUCTOR, UserRole.ADMIN])).toBe(
      true,
    );
  });

  it("is false for a role outside the allowed list", () => {
    expect(hasRole(UserRole.STUDENT, [UserRole.INSTRUCTOR, UserRole.ADMIN])).toBe(
      false,
    );
  });

  it("is false for null/undefined", () => {
    expect(hasRole(null, [UserRole.ADMIN])).toBe(false);
    expect(hasRole(undefined, [UserRole.ADMIN])).toBe(false);
  });
});

describe("requireRole", () => {
  it("returns the user when the role matches", async () => {
    getCurrentUser.mockResolvedValue(sessionUser(UserRole.INSTRUCTOR));

    const user = await requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN);

    expect(user.id).toBe("user_1");
  });

  it("matches when one of several allowed roles is held (ADMIN on instructor gate)", async () => {
    getCurrentUser.mockResolvedValue(sessionUser(UserRole.ADMIN));

    await expect(
      requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN),
    ).resolves.toMatchObject({ role: UserRole.ADMIN });
  });

  it("throws ForbiddenError when the role does not match", async () => {
    getCurrentUser.mockResolvedValue(sessionUser(UserRole.STUDENT));

    await expect(requireRole(UserRole.INSTRUCTOR)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("throws ForbiddenError when there is no session", async () => {
    getCurrentUser.mockResolvedValue(null);

    await expect(requireRole(UserRole.ADMIN)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});

describe("resolveLiveRole", () => {
  it("prefers the freshly-read DB role over the stale token role (BUG-002: revoke)", () => {
    expect(resolveLiveRole(UserRole.INSTRUCTOR, UserRole.STUDENT)).toBe(
      UserRole.STUDENT,
    );
  });

  it("also picks up a promotion the token doesn't know about yet (BUG-002: grant)", () => {
    expect(resolveLiveRole(UserRole.STUDENT, UserRole.INSTRUCTOR)).toBe(
      UserRole.INSTRUCTOR,
    );
  });

  it("falls back to the token role when the DB lookup finds no user", () => {
    expect(resolveLiveRole(UserRole.ADMIN, null)).toBe(UserRole.ADMIN);
    expect(resolveLiveRole(UserRole.ADMIN, undefined)).toBe(UserRole.ADMIN);
  });
});
