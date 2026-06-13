import { describe, expect, it } from "vitest";

import { buildBaseQuery, parseCourseFilters } from "@/lib/course-filters";

describe("parseCourseFilters", () => {
  it("returns defaults for empty params", () => {
    expect(parseCourseFilters({})).toEqual({
      q: "",
      categories: [],
      levels: [],
      price: "all",
      instructor: "",
      sort: "newest",
      page: 1,
    });
  });

  it("parses the instructor filter (first value, trimmed)", () => {
    expect(parseCourseFilters({ instructor: "  user_instructor_13  " }).instructor).toBe(
      "user_instructor_13",
    );
    expect(parseCourseFilters({ instructor: ["a", "b"] }).instructor).toBe("a");
    expect(parseCourseFilters({}).instructor).toBe("");
  });

  it("parses and trims the q keyword", () => {
    expect(parseCourseFilters({ q: "  sql  " }).q).toBe("sql");
  });

  it("takes the first q value when repeated and caps the length", () => {
    expect(parseCourseFilters({ q: ["react", "vue"] }).q).toBe("react");
    expect(parseCourseFilters({ q: "x".repeat(150) }).q).toHaveLength(100);
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
        q: "",
        categories: [],
        levels: [],
        price: "all",
        instructor: "",
        sort: "newest",
        page: 1,
      }),
    ).toBe("");
  });

  it("serializes active filters (including q + instructor) but not the page", () => {
    const query = buildBaseQuery({
      q: "api testing",
      categories: ["programming"],
      levels: ["BEGINNER"],
      price: "free",
      instructor: "user_instructor_13",
      sort: "price-asc",
      page: 2,
    });
    const params = new URLSearchParams(query);
    expect(params.get("q")).toBe("api testing");
    expect(params.getAll("category")).toEqual(["programming"]);
    expect(params.getAll("level")).toEqual(["BEGINNER"]);
    expect(params.get("price")).toBe("free");
    expect(params.get("instructor")).toBe("user_instructor_13");
    expect(params.get("sort")).toBe("price-asc");
    expect(params.has("page")).toBe(false);
  });
});
