"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DEFAULT_SORT, QUERY_KEYS, SORT_OPTIONS } from "@/lib/course-filters";

export function CourseSortDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get(QUERY_KEYS.sort) ?? DEFAULT_SORT;

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === DEFAULT_SORT) {
      params.delete(QUERY_KEYS.sort);
    } else {
      params.set(QUERY_KEYS.sort, next);
    }
    params.delete(QUERY_KEYS.page);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="course-sort" className="text-sm text-muted-foreground">
        Sort
      </label>
      <select
        id="course-sort"
        name={QUERY_KEYS.sort}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        data-testid="sort-select"
        className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
