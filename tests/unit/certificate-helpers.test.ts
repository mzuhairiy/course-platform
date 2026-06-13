import { describe, expect, it } from "vitest";

import {
  CERTIFICATE_CODE_LENGTH,
  formatCertificateNumber,
  generateCertificateCode,
  signatureInitials,
} from "@/lib/certificate";

describe("signatureInitials", () => {
  it("uses the first letter of each word, uppercased", () => {
    expect(signatureInitials("Andi Pratama")).toBe("AP");
  });

  it("returns a single initial for a one-word name", () => {
    expect(signatureInitials("Budi")).toBe("B");
  });

  it("handles three-word names", () => {
    expect(signatureInitials("Sri Mulyani Indrawati")).toBe("SMI");
  });

  it("normalizes casing and extra whitespace", () => {
    expect(signatureInitials("  rina   wati  ")).toBe("RW");
  });

  it("returns empty string for a missing name", () => {
    expect(signatureInitials(null)).toBe("");
    expect(signatureInitials("")).toBe("");
  });
});

describe("formatCertificateNumber", () => {
  it("builds the CERT-{YYYY}-{CODE} format", () => {
    expect(formatCertificateNumber(2026, "A1B2C")).toBe("CERT-2026-A1B2C");
  });
});

describe("generateCertificateCode", () => {
  it("produces a code of the configured length", () => {
    expect(generateCertificateCode()).toHaveLength(CERTIFICATE_CODE_LENGTH);
  });

  it("is deterministic given a fixed random source", () => {
    // Always pick index 0 → "A" repeated (alphabet starts with 'A').
    const code = generateCertificateCode(4, () => 0);
    expect(code).toBe("AAAA");
  });

  it("only emits unambiguous characters (no 0/O/1/I)", () => {
    const code = generateCertificateCode(50);
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]+$/);
  });
});
