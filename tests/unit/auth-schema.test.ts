import { describe, expect, it } from "vitest";

import { signInSchema, signUpSchema } from "@/schemas/auth";

describe("signInSchema", () => {
  it("accepts a valid email + password", () => {
    expect(
      signInSchema.safeParse({ email: "a@b.com", password: "x" }).success,
    ).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(
      signInSchema.safeParse({ email: "not-an-email", password: "x" }).success,
    ).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(
      signInSchema.safeParse({ email: "a@b.com", password: "" }).success,
    ).toBe(false);
  });
});

describe("signUpSchema", () => {
  const valid = { name: "Jane", email: "a@b.com", password: "password123" };

  it("accepts valid input", () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a name shorter than 2 chars", () => {
    expect(signUpSchema.safeParse({ ...valid, name: "J" }).success).toBe(false);
  });

  it("rejects a password shorter than 8 chars", () => {
    expect(
      signUpSchema.safeParse({ ...valid, password: "short" }).success,
    ).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(signUpSchema.safeParse({ ...valid, email: "bad" }).success).toBe(
      false,
    );
  });
});
