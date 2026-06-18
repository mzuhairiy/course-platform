import { UserRole } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { getRoleHomePath } from "@/config/roles";

describe("getRoleHomePath", () => {
  it("sends a student to /dashboard", () => {
    expect(getRoleHomePath(UserRole.STUDENT)).toBe("/dashboard");
  });

  it("sends an instructor to /instructor", () => {
    expect(getRoleHomePath(UserRole.INSTRUCTOR)).toBe("/instructor");
  });

  it("sends an admin to /admin", () => {
    expect(getRoleHomePath(UserRole.ADMIN)).toBe("/admin");
  });

  it("defaults unknown/null/undefined to the student dashboard", () => {
    expect(getRoleHomePath(null)).toBe("/dashboard");
    expect(getRoleHomePath(undefined)).toBe("/dashboard");
    expect(getRoleHomePath("SOMETHING_ELSE")).toBe("/dashboard");
  });
});
