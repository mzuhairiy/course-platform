import { describe, expect, it } from "vitest";

import { buildBaseQuery, parseCourseFilters } from "@/lib/course-filters";

describe("parseCourseFilters", () => {
  it("returns defaults for empty params", () => {
    expect(parseCourseFilters({})).toEqual({
      categories: [],
      levels: [],
      price: "all",
      sort: "newest",
      page: 1,
    });
  });

  it("parses and validates provided filters", () => {
    const result = parseCourseFilters({
      category: "programming",
      level: ["BEGINNER", "BOGUS"],
      price: "free",
      sort: "price-asc",
      page: "3",
    });
    expect(result.categories).toEqual(["programming"]);
    expect(result.levels).toEqual(["BEGINNER"]); // invalid level dropped
    expect(result.price).toBe("free");
    expect(result.sort).toBe("price-asc");
    expect(result.page).toBe(3);
  });

  it("falls back on invalid sort / price / page", () => {
    const result = parseCourseFilters({
      sort: "bogus",
      price: "bogus",
      page: "0",
    });
    expect(result.sort).toBe("newest");
    expect(result.price).toBe("all");
    expect(result.page).toBe(1);
  });

  it("keeps repeated (array) category params", () => {
    expect(parseCourseFilters({ category: ["a", "b"] }).categories).toEqual([
      "a",
      "b",
    ]);
  });
});

describe("buildBaseQuery", () => {
  it("omits default values", () => {
    expect(
      buildBaseQuery({
        categories: [],
        levels: [],
        price: "all",
        sort: "newest",
        page: 1,
      }),
    ).toBe("");
  });

  it("serializes active filters but not the page", () => {
    const query = buildBaseQuery({
      categories: ["programming"],
      levels: ["BEGINNER"],
      price: "free",
      sort: "price-asc",
      page: 2,
    });
    const params = new URLSearchParams(query);
    expect(params.getAll("category")).toEqual(["programming"]);
    expect(params.getAll("level")).toEqual(["BEGINNER"]);
    expect(params.get("price")).toBe("free");
    expect(params.get("sort")).toBe("price-asc");
    expect(params.has("page")).toBe(false);
  });
});
