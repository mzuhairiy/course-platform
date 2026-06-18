import { CourseStatus, UserRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { courseCreate, courseFindUnique, courseUpdate, courseDelete } =
  vi.hoisted(() => ({
    courseCreate: vi.fn(),
    courseFindUnique: vi.fn(),
    courseUpdate: vi.fn(),
    courseDelete: vi.fn(),
  }));

vi.mock("@/lib/db", () => ({
  db: {
    course: {
      create: courseCreate,
      findUnique: courseFindUnique,
      update: courseUpdate,
      delete: courseDelete,
    },
  },
}));

// Keep @/lib/auth (NextAuth) out of the graph; rbac only needs getCurrentUser.
vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));

// react's server `cache()` is unavailable in the test runtime — course.ts wraps
// getCourseDetailBySlug in it at module load. Pass-through it.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: <T,>(fn: T) => fn };
});

import { ForbiddenError } from "@/lib/rbac";
import type { CourseFormInput } from "@/schemas/course";
import {
  CourseEmptyContentError,
  CourseHasEnrollmentsError,
  createCourse,
  deleteCourse,
  publishCourse,
  updateCourse,
  type CourseActor,
} from "@/server/services/course";

const OWNER = "inst_1";
const ownerActor: CourseActor = { id: OWNER, role: UserRole.INSTRUCTOR };
const strangerActor: CourseActor = { id: "inst_2", role: UserRole.INSTRUCTOR };
const adminActor: CourseActor = { id: "admin_1", role: UserRole.ADMIN };

const formInput: CourseFormInput = {
  title: "Belajar Testing",
  subtitle: "",
  description: "x".repeat(60),
  categoryId: "cat_1",
  level: "BEGINNER",
  price: 0,
  language: "id",
  coverLabel: "",
  slug: "belajar-testing",
};

beforeEach(() => {
  vi.clearAllMocks();
  courseCreate.mockResolvedValue({ id: "course_1" });
  courseUpdate.mockResolvedValue({ id: "course_1" });
  courseDelete.mockResolvedValue({ id: "course_1" });
});

describe("createCourse", () => {
  it("creates a DRAFT course owned by the given instructor", async () => {
    await createCourse(formInput, OWNER);

    const args = courseCreate.mock.calls[0][0];
    expect(args.data.instructorId).toBe(OWNER);
    expect(args.data.status).toBe(CourseStatus.DRAFT);
    expect(args.data.slug).toBe("belajar-testing");
    // Empty optional strings are stored as null, not "".
    expect(args.data.subtitle).toBeNull();
    expect(args.data.coverLabel).toBeNull();
  });
});

describe("publishCourse", () => {
  it("throws when the course has no lectures", async () => {
    courseFindUnique.mockResolvedValue({
      instructorId: OWNER,
      publishedAt: null,
      sections: [{ _count: { lectures: 0 } }],
    });

    await expect(publishCourse("course_1", ownerActor)).rejects.toBeInstanceOf(
      CourseEmptyContentError,
    );
    expect(courseUpdate).not.toHaveBeenCalled();
  });

  it("publishes and stamps publishedAt when content exists", async () => {
    courseFindUnique.mockResolvedValue({
      instructorId: OWNER,
      publishedAt: null,
      sections: [{ _count: { lectures: 2 } }],
    });

    await publishCourse("course_1", ownerActor);

    const args = courseUpdate.mock.calls[0][0];
    expect(args.data.status).toBe(CourseStatus.PUBLISHED);
    expect(args.data.publishedAt).toBeInstanceOf(Date);
  });

  it("keeps the original publishedAt on re-publish", async () => {
    const firstPublished = new Date("2026-01-01T00:00:00.000Z");
    courseFindUnique.mockResolvedValue({
      instructorId: OWNER,
      publishedAt: firstPublished,
      sections: [{ _count: { lectures: 1 } }],
    });

    await publishCourse("course_1", ownerActor);

    expect(courseUpdate.mock.calls[0][0].data.publishedAt).toBe(firstPublished);
  });
});

describe("deleteCourse", () => {
  it("refuses to delete a course that has enrollments", async () => {
    courseFindUnique.mockResolvedValue({
      instructorId: OWNER,
      _count: { enrollments: 3 },
    });

    await expect(deleteCourse("course_1", ownerActor)).rejects.toBeInstanceOf(
      CourseHasEnrollmentsError,
    );
    expect(courseDelete).not.toHaveBeenCalled();
  });

  it("deletes when there are no enrollments", async () => {
    courseFindUnique.mockResolvedValue({
      instructorId: OWNER,
      _count: { enrollments: 0 },
    });

    await deleteCourse("course_1", ownerActor);

    expect(courseDelete).toHaveBeenCalledWith({ where: { id: "course_1" } });
  });
});

describe("ownership", () => {
  it("blocks a non-owner instructor from updating", async () => {
    courseFindUnique.mockResolvedValue({ instructorId: OWNER });

    await expect(
      updateCourse("course_1", formInput, strangerActor),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(courseUpdate).not.toHaveBeenCalled();
  });

  it("lets an admin update any course", async () => {
    courseFindUnique.mockResolvedValue({ instructorId: OWNER });

    await updateCourse("course_1", formInput, adminActor);

    expect(courseUpdate).toHaveBeenCalledTimes(1);
  });
});
