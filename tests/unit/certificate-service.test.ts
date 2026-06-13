import { beforeEach, describe, expect, it, vi } from "vitest";

const { enrollmentFindUnique, certificateFindUnique, certificateCreate } =
  vi.hoisted(() => ({
    enrollmentFindUnique: vi.fn(),
    certificateFindUnique: vi.fn(),
    certificateCreate: vi.fn(),
  }));

vi.mock("@/lib/db", () => ({
  db: {
    enrollment: { findUnique: enrollmentFindUnique },
    certificate: {
      findUnique: certificateFindUnique,
      create: certificateCreate,
    },
  },
}));

import {
  generateCertificatePdf,
  issueCertificateIfEligible,
} from "@/server/services/certificate";

beforeEach(() => {
  vi.clearAllMocks();
  certificateCreate.mockImplementation(({ data }) =>
    Promise.resolve({ id: "cert_1", issuedAt: new Date(), ...data }),
  );
});

describe("issueCertificateIfEligible", () => {
  it("does not issue when the user is not enrolled", async () => {
    enrollmentFindUnique.mockResolvedValue(null);

    const result = await issueCertificateIfEligible("user_1", "course_1");

    expect(result).toBeNull();
    expect(certificateCreate).not.toHaveBeenCalled();
  });

  it("does not issue when the course is not yet complete", async () => {
    enrollmentFindUnique.mockResolvedValue({ completedAt: null });

    const result = await issueCertificateIfEligible("user_1", "course_1");

    expect(result).toBeNull();
    expect(certificateCreate).not.toHaveBeenCalled();
  });

  it("issues a numbered certificate once the course is complete", async () => {
    enrollmentFindUnique.mockResolvedValue({
      completedAt: new Date("2026-06-13T00:00:00.000Z"),
    });
    certificateFindUnique.mockResolvedValue(null);

    const result = await issueCertificateIfEligible("user_1", "course_1");

    expect(certificateCreate).toHaveBeenCalledTimes(1);
    expect(result?.certificateNumber).toMatch(/^CERT-2026-[A-HJ-NP-Z2-9]{5}$/);
    expect(result?.userId).toBe("user_1");
    expect(result?.courseId).toBe("course_1");
  });

  it("is idempotent: reuses the existing certificate number", async () => {
    enrollmentFindUnique.mockResolvedValue({
      completedAt: new Date("2026-06-13T00:00:00.000Z"),
    });
    const existing = {
      id: "cert_existing",
      userId: "user_1",
      courseId: "course_1",
      certificateNumber: "CERT-2026-ABCDE",
    };
    certificateFindUnique.mockResolvedValue(existing);

    const result = await issueCertificateIfEligible("user_1", "course_1");

    expect(result).toBe(existing);
    expect(certificateCreate).not.toHaveBeenCalled();
  });
});

describe("generateCertificatePdf", () => {
  it("renders a non-empty PDF buffer", async () => {
    const buffer = await generateCertificatePdf({
      studentName: "Andi Pratama",
      courseName: "Belajar QA dari Nol",
      certificateNumber: "CERT-2026-ABCDE",
      instructorName: "Sri Mulyani",
    });

    expect(buffer.length).toBeGreaterThan(0);
    // PDF files start with the "%PDF" magic header.
    expect(buffer.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });
});
