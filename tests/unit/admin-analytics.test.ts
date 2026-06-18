import { UserRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  courseCount,
  courseUpdate,
  userUpdate,
  enrollmentCount,
  enrollmentFindMany,
  transactionAggregate,
} = vi.hoisted(() => ({
  courseCount: vi.fn(),
  courseUpdate: vi.fn(),
  userUpdate: vi.fn(),
  enrollmentCount: vi.fn(),
  enrollmentFindMany: vi.fn(),
  transactionAggregate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    course: { count: courseCount, update: courseUpdate },
    user: { update: userUpdate },
    enrollment: { count: enrollmentCount, findMany: enrollmentFindMany },
    transaction: { aggregate: transactionAggregate },
  },
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));

import { ForbiddenError } from "@/lib/rbac";
import {
  archiveCourse,
  changeUserRole,
  SelfRoleChangeError,
  type AdminActor,
} from "@/server/services/admin";
import { getInstructorStats } from "@/server/services/analytics";

const admin: AdminActor = { id: "admin_1", role: UserRole.ADMIN };
const instructor: AdminActor = { id: "inst_1", role: UserRole.INSTRUCTOR };

beforeEach(() => {
  vi.clearAllMocks();
  courseUpdate.mockResolvedValue({ id: "c1" });
  userUpdate.mockResolvedValue({ id: "u1", role: UserRole.INSTRUCTOR });
});

describe("changeUserRole", () => {
  it("blocks a non-admin", async () => {
    await expect(
      changeUserRole("u2", UserRole.INSTRUCTOR, instructor),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it("lets an admin change another user's role", async () => {
    await changeUserRole("u2", UserRole.INSTRUCTOR, admin);

    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "u2" },
      data: { role: UserRole.INSTRUCTOR },
      select: { id: true, role: true },
    });
  });

  it("refuses to change one's own role", async () => {
    await expect(
      changeUserRole(admin.id, UserRole.STUDENT, admin),
    ).rejects.toBeInstanceOf(SelfRoleChangeError);
    expect(userUpdate).not.toHaveBeenCalled();
  });
});

describe("archiveCourse", () => {
  it("blocks a non-admin", async () => {
    await expect(archiveCourse("c1", instructor)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(courseUpdate).not.toHaveBeenCalled();
  });

  it("archives when admin", async () => {
    await archiveCourse("c1", admin);

    expect(courseUpdate.mock.calls[0][0].data.status).toBe("ARCHIVED");
  });
});

describe("getInstructorStats", () => {
  it("computes totals and completion rate", async () => {
    courseCount.mockResolvedValue(3);
    // total enrollments = 10; completed (where.completedAt set) = 4
    enrollmentCount.mockImplementation(({ where }) =>
      Promise.resolve(where.completedAt ? 4 : 10),
    );
    transactionAggregate.mockResolvedValue({ _sum: { amount: 500_000 } });
    enrollmentFindMany.mockResolvedValue([]); // recent + trend both empty

    const stats = await getInstructorStats("inst_1");

    expect(stats.totalCourses).toBe(3);
    expect(stats.totalStudents).toBe(10);
    expect(stats.totalRevenue).toBe(500_000);
    expect(stats.completionRate).toBe(40);
    expect(stats.trend).toHaveLength(30);
    expect(stats.recentEnrollments).toEqual([]);
  });

  it("treats no enrollments as 0% (no divide-by-zero)", async () => {
    courseCount.mockResolvedValue(0);
    enrollmentCount.mockResolvedValue(0);
    transactionAggregate.mockResolvedValue({ _sum: { amount: null } });
    enrollmentFindMany.mockResolvedValue([]);

    const stats = await getInstructorStats("inst_1");

    expect(stats.completionRate).toBe(0);
    expect(stats.totalRevenue).toBe(0);
  });
});
