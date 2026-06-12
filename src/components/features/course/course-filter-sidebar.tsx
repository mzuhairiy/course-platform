"use client";

import { SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { LEVEL_OPTIONS, PRICE_OPTIONS, QUERY_KEYS } from "@/lib/course-filters";
import { cn } from "@/lib/utils";

type Category = { name: string; slug: string };

export function CourseFilterSidebar({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const selectedCategories = searchParams.getAll(QUERY_KEYS.category);
  const selectedLevels = searchParams.getAll(QUERY_KEYS.level);
  const selectedPrice = searchParams.get(QUERY_KEYS.price) ?? "all";

  function commit(params: URLSearchParams) {
    params.delete(QUERY_KEYS.page); // any filter change resets to page 1
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  function toggleMulti(key: string, value: string, checked: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll(key);
    params.delete(key);
    const next = checked
      ? [...current, value]
      : current.filter((v) => v !== value);
    next.forEach((v) => params.append(key, v));
    commit(params);
  }

  function setPrice(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(QUERY_KEYS.price);
    } else {
      params.set(QUERY_KEYS.price, value);
    }
    commit(params);
  }

  const hasFilters =
    selectedCategories.length > 0 ||
    selectedLevels.length > 0 ||
    selectedPrice !== "all";

  return (
    <aside data-testid="course-filters">
      <Button
        variant="outline"
        className="mb-4 w-full lg:hidden"
        data-testid="filter-toggle"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <SlidersHorizontal className="mr-2 h-4 w-4" />
        Filters
      </Button>

      <div className={cn("space-y-6", open ? "block" : "hidden", "lg:block")}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Filters
          </h2>
          {hasFilters ? (
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground"
              data-testid="filter-clear"
              onClick={() => router.replace(pathname, { scroll: false })}
            >
              Clear
            </button>
          ) : null}
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Category</legend>
          {categories.map((category) => (
            <label
              key={category.slug}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                name={QUERY_KEYS.category}
                value={category.slug}
                checked={selectedCategories.includes(category.slug)}
                onChange={(event) =>
                  toggleMulti(
                    QUERY_KEYS.category,
                    category.slug,
                    event.target.checked,
                  )
                }
                className="h-4 w-4 accent-foreground"
                data-testid={`filter-category-${category.slug}`}
              />
              {category.name}
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Level</legend>
          {LEVEL_OPTIONS.map((level) => (
            <label
              key={level.value}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                name={QUERY_KEYS.level}
                value={level.value}
                checked={selectedLevels.includes(level.value)}
                onChange={(event) =>
                  toggleMulti(
                    QUERY_KEYS.level,
                    level.value,
                    event.target.checked,
                  )
                }
                className="h-4 w-4 accent-foreground"
                data-testid={`filter-level-${level.value.toLowerCase()}`}
              />
              {level.label}
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Price</legend>
          {PRICE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="radio"
                name={QUERY_KEYS.price}
                value={option.value}
                checked={selectedPrice === option.value}
                onChange={() => setPrice(option.value)}
                className="h-4 w-4 accent-foreground"
                data-testid={`filter-price-${option.value}`}
              />
              {option.label}
            </label>
          ))}
        </fieldset>
      </div>
    </aside>
  );
}
