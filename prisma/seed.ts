import bcrypt from "bcryptjs";

import { CourseStatus, PrismaClient, UserRole } from "@prisma/client";

import { CATEGORIES, COURSES, INSTRUCTORS } from "./seed-data";
import { generateCurriculum } from "./seed-curriculum";

const db = new PrismaClient();

// Known password for every seeded account so login is testable out of the box.
const SEED_PASSWORD = "Password123!";

const avatar = (email: string) => `https://i.pravatar.cc/150?u=${email}`;
const thumbnail = (slug: string) =>
  `https://picsum.photos/seed/${slug}/800/450`;

const STUDENTS = [
  { id: "user_student", email: "student@example.com", name: "John Student" },
  { id: "user_student_2", email: "student2@example.com", name: "Sari Belajar" },
];

// student@example.com keeps a couple of "legacy" enrollments (1 free, 1 paid).
const LEGACY_ENROLLMENTS = [
  { id: "enr_legacy_free", courseId: "course_nextjs_pemula" },
  { id: "enr_legacy_paid", courseId: "course_sql" },
];

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  // Reset content (idempotent). Deleting courses cascades sections, lectures,
  // enrollments, progress, and quizzes. Users are preserved (upserted below).
  await db.transaction.deleteMany();
  await db.certificate.deleteMany();
  await db.course.deleteMany();
  await db.category.deleteMany();

  for (const category of CATEGORIES) {
    await db.category.create({ data: category });
  }

  for (const instructor of INSTRUCTORS) {
    const data = {
      name: instructor.name,
      email: instructor.email,
      role: UserRole.INSTRUCTOR,
      bio: instructor.bio,
      image: avatar(instructor.email),
      password: passwordHash,
    };
    await db.user.upsert({
      where: { id: instructor.id },
      update: data,
      create: { id: instructor.id, ...data },
    });
  }

  for (const student of STUDENTS) {
    const data = {
      name: student.name,
      email: student.email,
      role: UserRole.STUDENT,
      image: avatar(student.email),
      password: passwordHash,
    };
    await db.user.upsert({
      where: { id: student.id },
      update: data,
      create: { id: student.id, ...data },
    });
  }

  const categoryIdBySlug = new Map(CATEGORIES.map((c) => [c.slug, c.id]));

  for (let index = 0; index < COURSES.length; index += 1) {
    const course = COURSES[index];
    const categoryId = categoryIdBySlug.get(course.categorySlug);
    if (!categoryId) {
      throw new Error(`Unknown category slug: ${course.categorySlug}`);
    }

    // Only PUBLISHED courses get a curriculum.
    const sections =
      course.status === CourseStatus.PUBLISHED
        ? generateCurriculum(course.slug, course.topic, index)
        : [];

    await db.course.create({
      data: {
        id: course.id,
        slug: course.slug,
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        level: course.level,
        price: course.price,
        status: course.status,
        publishedAt: course.publishedAt,
        thumbnailUrl: thumbnail(course.slug),
        categoryId,
        instructorId: course.instructorId,
        sections: sections.length
          ? {
              create: sections.map((section) => ({
                id: section.id,
                title: section.title,
                order: section.order,
                lectures: {
                  create: section.lectures.map((lecture) => ({
                    id: lecture.id,
                    title: lecture.title,
                    type: lecture.type,
                    order: lecture.order,
                    durationSeconds: lecture.durationSeconds,
                    contentMd: lecture.contentMd,
                    videoUrl: lecture.videoUrl,
                  })),
                },
              })),
            }
          : undefined,
      },
    });
  }

  for (const enrollment of LEGACY_ENROLLMENTS) {
    await db.enrollment.create({
      data: {
        id: enrollment.id,
        userId: "user_student",
        courseId: enrollment.courseId,
      },
    });
  }

  const [
    users,
    categories,
    courses,
    published,
    sections,
    lectures,
    enrollments,
  ] = await Promise.all([
    db.user.count(),
    db.category.count(),
    db.course.count(),
    db.course.count({ where: { status: CourseStatus.PUBLISHED } }),
    db.section.count(),
    db.lecture.count(),
    db.enrollment.count(),
  ]);

  console.log("Seed complete:", {
    users,
    categories,
    courses,
    published,
    sections,
    lectures,
    enrollments,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
