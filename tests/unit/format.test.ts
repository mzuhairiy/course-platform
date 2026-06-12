import { describe, expect, it } from "vitest";

import { formatDuration, formatPrice } from "@/lib/format";

describe("formatPrice", () => {
  it("renders 0 as Free", () => {
    expect(formatPrice(0)).toBe("Free");
  });

  it("renders negatives as Free", () => {
    expect(formatPrice(-100)).toBe("Free");
  });

  it("formats a Rupiah amount", () => {
    expect(formatPrice(299000)).toMatch(/Rp\s*299\.000/);
  });
});

describe("formatDuration", () => {
  it("returns an em dash for 0 / null", () => {
    expect(formatDuration(0)).toBe("—");
    expect(formatDuration(null)).toBe("—");
  });

  it("formats whole minutes", () => {
    expect(formatDuration(300)).toBe("5m");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(3660)).toBe("1h 1m");
  });

  it("formats sub-minute durations as seconds", () => {
    expect(formatDuration(20)).toBe("20s");
  });
});
