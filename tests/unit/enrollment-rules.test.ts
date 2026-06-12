import { describe, expect, it } from "vitest";

import { evaluateFreeEnrollment } from "@/lib/enrollment-rules";

describe("evaluateFreeEnrollment", () => {
  it("blocks when the user is not logged in", () => {
    const result = evaluateFreeEnrollment({
      isLoggedIn: false,
      status: "PUBLISHED",
      price: 0,
    });
    expect(result.allowed).toBe(false);
  });

  it("blocks a non-published course", () => {
    const result = evaluateFreeEnrollment({
      isLoggedIn: true,
      status: "DRAFT",
      price: 0,
    });
    expect(result.allowed).toBe(false);
  });

  it("blocks a paid course", () => {
    const result = evaluateFreeEnrollment({
      isLoggedIn: true,
      status: "PUBLISHED",
      price: 299000,
    });
    expect(result.allowed).toBe(false);
  });

  it("allows a logged-in user for a free, published course", () => {
    const result = evaluateFreeEnrollment({
      isLoggedIn: true,
      status: "PUBLISHED",
      price: 0,
    });
    expect(result.allowed).toBe(true);
  });
});
