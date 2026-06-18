import "server-only";

import { CourseStatus, TransactionStatus } from "@prisma/client";

import { db } from "@/lib/db";

export type EnrollmentTrendPoint = { date: string; count: number };

export type InstructorStats = {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  completionRate: number; // 0..100
  trend: EnrollmentTrendPoint[];
  recentEnrollments: {
    id: string;
    studentName: string;
    courseTitle: string;
    enrolledAt: Date;
  }[];
};

const TREND_DAYS = 30;

/** YYYY-MM-DD in UTC, for deterministic day bucketing. */
function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Last `TREND_DAYS` day buckets (oldest→newest), seeded to 0. */
function emptyTrend(now: Date): EnrollmentTrendPoint[] {
  const points: EnrollmentTrendPoint[] = [];
  for (let i = TREND_DAYS - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    points.push({ date: dayKey(d), count: 0 });
  }
  return points;
}

export async function getInstructorStats(
  instructorId: string,
): Promise<InstructorStats> {
  const now = new Date();
  const since = new Date(now);
  since.setUTCDate(since.getUTCDate() - (TREND_DAYS - 1));
  since.setUTCHours(0, 0, 0, 0);

  const enrolledWhere = { course: { instructorId } };

  const [
    totalCourses,
    totalStudents,
    completedCount,
    revenue,
    recent,
    trendRows,
  ] = await Promise.all([
    db.course.count({ where: { instructorId } }),
    db.enrollment.count({ where: enrolledWhere }),
    db.enrollment.count({
      where: { ...enrolledWhere, completedAt: { not: null } },
    }),
    db.transaction.aggregate({
      where: { course: { instructorId }, status: TransactionStatus.SUCCESS },
      _sum: { amount: true },
    }),
    db.enrollment.findMany({
      where: enrolledWhere,
      orderBy: { enrolledAt: "desc" },
      take: 5,
      select: {
        id: true,
        enrolledAt: true,
        user: { select: { name: true } },
        course: { select: { title: true } },
      },
    }),
    db.enrollment.findMany({
      where: { ...enrolledWhere, enrolledAt: { gte: since } },
      select: { enrolledAt: true },
    }),
  ]);

  const buckets = new Map(emptyTrend(now).map((p) => [p.date, 0]));
  for (const row of trendRows) {
    const key = dayKey(row.enrolledAt);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const trend = Array.from(buckets, ([date, count]) => ({ date, count }));

  const completionRate =
    totalStudents === 0
      ? 0
      : Math.round((completedCount / totalStudents) * 100);

  return {
    totalCourses,
    totalStudents,
    totalRevenue: revenue._sum.amount ?? 0,
    completionRate,
    trend,
    recentEnrollments: recent.map((e) => ({
      id: e.id,
      studentName: e.user.name ?? "Student",
      courseTitle: e.course.title,
      enrolledAt: e.enrolledAt,
    })),
  };
}

export type LectureFunnelPoint = {
  lectureId: string;
  title: string;
  reached: number;
  reachedPct: number; // 0..100
};

export type CourseAnalytics = {
  totalEnrolled: number;
  completionRate: number;
  avgQuizScore: number | null; // null = course has no quiz attempts
  funnel: LectureFunnelPoint[];
};

export async function getCourseAnalytics(
  courseId: string,
): Promise<CourseAnalytics> {
  const [totalEnrolled, completedCount, lectures, attemptAgg] =
    await Promise.all([
      db.enrollment.count({ where: { courseId } }),
      db.enrollment.count({ where: { courseId, completedAt: { not: null } } }),
      db.lecture.findMany({
        where: { section: { courseId } },
        orderBy: [{ section: { order: "asc" } }, { order: "asc" }],
        select: {
          id: true,
          title: true,
          _count: { select: { progress: true } },
        },
      }),
      db.quizAttempt.aggregate({
        where: { quiz: { lecture: { section: { courseId } } } },
        _avg: { score: true },
      }),
    ]);

  const completionRate =
    totalEnrolled === 0 ? 0 : Math.round((completedCount / totalEnrolled) * 100);

  const funnel: LectureFunnelPoint[] = lectures.map((l) => ({
    lectureId: l.id,
    title: l.title,
    reached: l._count.progress,
    reachedPct:
      totalEnrolled === 0
        ? 0
        : Math.round((l._count.progress / totalEnrolled) * 100),
  }));

  return {
    totalEnrolled,
    completionRate,
    avgQuizScore:
      attemptAgg._avg.score == null ? null : Math.round(attemptAgg._avg.score),
    funnel,
  };
}

export type AdminStats = {
  totalUsers: number;
  coursesByStatus: Record<CourseStatus, number>;
  totalTransactions: number;
  totalRevenue: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const [totalUsers, grouped, totalTransactions, revenue] = await Promise.all([
    db.user.count(),
    db.course.groupBy({ by: ["status"], _count: { _all: true } }),
    db.transaction.count(),
    db.transaction.aggregate({
      where: { status: TransactionStatus.SUCCESS },
      _sum: { amount: true },
    }),
  ]);

  const coursesByStatus: Record<CourseStatus, number> = {
    DRAFT: 0,
    PUBLISHED: 0,
    ARCHIVED: 0,
  };
  for (const row of grouped) {
    coursesByStatus[row.status] = row._count._all;
  }

  return {
    totalUsers,
    coursesByStatus,
    totalTransactions,
    totalRevenue: revenue._sum.amount ?? 0,
  };
}
