import type { CourseLevel } from "@prisma/client";

// Type-only Prisma import above keeps this module client-safe (no @prisma/client
// in the browser bundle). Shared by the server page and the client filter UI.

export const QUERY_KEYS = {
  category: "category",
  level: "level",
  price: "price",
  sort: "sort",
  page: "page",
} as const;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
] as const;
export type SortValue = (typeof SORT_OPTIONS)[number]["value"];
export const DEFAULT_SORT: SortValue = "newest";

export const LEVEL_OPTIONS: { value: CourseLevel; label: string }[] = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

export const PRICE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
] as const;
export type PriceValue = (typeof PRICE_OPTIONS)[number]["value"];

export const PER_PAGE = 9;

export type CourseFilters = {
  categories: string[];
  levels: CourseLevel[];
  price: PriceValue;
  sort: SortValue;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function parseCourseFilters(searchParams: SearchParams): CourseFilters {
  const validLevels = new Set<string>(LEVEL_OPTIONS.map((l) => l.value));
  const levels = toArray(searchParams[QUERY_KEYS.level]).filter(
    (value): value is CourseLevel => validLevels.has(value),
  );

  const sortRaw = searchParams[QUERY_KEYS.sort];
  const sort = SORT_OPTIONS.some((o) => o.value === sortRaw)
    ? (sortRaw as SortValue)
    : DEFAULT_SORT;

  const priceRaw = searchParams[QUERY_KEYS.price];
  const price = PRICE_OPTIONS.some((o) => o.value === priceRaw)
    ? (priceRaw as PriceValue)
    : "all";

  const pageRaw = Number(searchParams[QUERY_KEYS.page]);
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  return {
    categories: toArray(searchParams[QUERY_KEYS.category]),
    levels,
    price,
    sort,
    page,
  };
}

/** Serializes filters (minus page) so pagination links can preserve them. */
export function buildBaseQuery(filters: CourseFilters): string {
  const params = new URLSearchParams();
  filters.categories.forEach((c) => params.append(QUERY_KEYS.category, c));
  filters.levels.forEach((l) => params.append(QUERY_KEYS.level, l));
  if (filters.price !== "all") params.set(QUERY_KEYS.price, filters.price);
  if (filters.sort !== DEFAULT_SORT) params.set(QUERY_KEYS.sort, filters.sort);
  return params.toString();
}
