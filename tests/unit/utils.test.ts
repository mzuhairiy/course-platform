import { describe, expect, it } from "vitest";

import { cn, getInitials, slugify } from "@/lib/utils";

// Trivial test to verify the Vitest setup runs and the `@/` alias resolves.
describe("cn (class name merge util)", () => {
  it("joins multiple class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("lets later Tailwind classes override conflicting earlier ones", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("ignores falsy values", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });
});

describe("getInitials", () => {
  it("takes the first two word initials", () => {
    expect(getInitials("Jane Doe")).toBe("JD");
  });

  it("handles a single word", () => {
    expect(getInitials("madonna")).toBe("M");
  });

  it("caps at two initials", () => {
    expect(getInitials("a b c")).toBe("AB");
  });

  it("returns the fallback for empty / null", () => {
    expect(getInitials(null)).toBe("U");
    expect(getInitials("")).toBe("U");
    expect(getInitials(undefined, "X")).toBe("X");
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates words", () => {
    expect(slugify("Belajar Next.js Dasar")).toBe("belajar-nextjs-dasar");
  });

  it("strips special characters and collapses separators", () => {
    expect(slugify("  Hello,   World!!  ")).toBe("hello-world");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("--React & Redux--")).toBe("react-redux");
  });
});
