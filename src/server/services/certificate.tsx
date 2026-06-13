import "server-only";

import { randomInt } from "node:crypto";

import { Prisma } from "@prisma/client";
import { renderToBuffer } from "@react-pdf/renderer";

import {
  formatCertificateNumber,
  generateCertificateCode,
} from "@/lib/certificate";
import { db } from "@/lib/db";
import {
  CertificateDocument,
  type CertificateData,
} from "@/server/services/certificate-document";

const MAX_NUMBER_ATTEMPTS = 5;

/**
 * Issue (or reuse) the completion certificate for a learner+course. Eligible
 * only when the enrollment is 100% complete (completedAt set). Idempotent: the
 * certificateNumber is generated exactly once and reused on every later call.
 * Returns null when the learner is not enrolled or hasn't completed the course.
 */
export async function issueCertificateIfEligible(
  userId: string,
  courseId: string,
) {
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { completedAt: true },
  });
  if (!enrollment?.completedAt) return null;

  const existing = await db.certificate.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing) return existing;

  const year = enrollment.completedAt.getFullYear();

  // Create with a fresh number; retry on the (rare) number collision, and treat
  // a userId+courseId race as "already issued" by reusing the winner's row.
  for (let attempt = 0; attempt < MAX_NUMBER_ATTEMPTS; attempt += 1) {
    const certificateNumber = formatCertificateNumber(
      year,
      generateCertificateCode(undefined, randomInt),
    );
    try {
      return await db.certificate.create({
        data: { userId, courseId, certificateNumber },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const target = (error.meta?.target as string[] | undefined) ?? [];
        // Lost the race on (userId, courseId): the certificate now exists.
        if (target.includes("userId") || target.includes("courseId")) {
          const winner = await db.certificate.findUnique({
            where: { userId_courseId: { userId, courseId } },
          });
          if (winner) return winner;
        }
        // Otherwise the random number clashed; loop and try a new one.
        continue;
      }
      throw error;
    }
  }

  throw new Error("Gagal membuat nomor sertifikat unik. Coba lagi.");
}

/** Render the certificate PDF to a buffer. Pure function of its input data. */
export function generateCertificatePdf(
  data: CertificateData,
): Promise<Buffer> {
  return renderToBuffer(<CertificateDocument {...data} />);
}
