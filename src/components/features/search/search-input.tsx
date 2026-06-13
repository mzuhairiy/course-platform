"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  SEARCH_DEBOUNCE_MS,
  SEARCH_MAX_QUERY_LENGTH,
  SEARCH_MIN_QUERY_LENGTH,
} from "@/config/search";
import { cn } from "@/lib/utils";
import {
  searchCoursesAction,
  type SearchResultItem,
} from "@/server/actions/search";

const PLACEHOLDER = "Apa yang ingin Anda pelajari?";

/**
 * Inline search with an anchored suggestions dropdown (combobox pattern).
 * No modal/overlay: focus stays in the input. Live search fires after
 * SEARCH_MIN_QUERY_LENGTH keystrokes, debounced by SEARCH_DEBOUNCE_MS.
 */
export function SearchInput({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const trimmed = query.trim();
  const isSearchable = trimmed.length >= SEARCH_MIN_QUERY_LENGTH;

  useEffect(() => {
    if (!isSearchable) {
      setResults([]);
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const items = await searchCoursesAction(trimmed);
        if (!cancelled) {
          setResults(items);
          setActiveIndex(0);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, isSearchable]);

  function navigate(href: string) {
    setIsOpen(false);
    router.push(href);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(
      trimmed ? `/courses?q=${encodeURIComponent(trimmed)}` : "/courses",
    );
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (!isOpen || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const active = results[activeIndex];
      if (active) navigate(`/courses/${active.slug}`);
    }
  }

  const viewAllHref = results.length
    ? `/courses?q=${encodeURIComponent(trimmed)}`
    : "/courses";

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      data-testid="search-form"
      className={cn("relative", className)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => {
          if (isSearchable) setIsOpen(true);
        }}
        onKeyDown={onKeyDown}
        placeholder={PLACEHOLDER}
        aria-label="Search courses"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls="search-results"
        aria-activedescendant={
          isOpen && results[activeIndex]
            ? `search-option-${activeIndex}`
            : undefined
        }
        autoComplete="off"
        maxLength={SEARCH_MAX_QUERY_LENGTH}
        data-testid="search-input"
        className="h-9 pl-9 text-foreground"
      />

      {isOpen ? (
        <div
          id="search-results"
          role="listbox"
          aria-label="Search suggestions"
          data-testid="search-results"
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md"
        >
          {isLoading ? (
            <p
              className="px-3 py-4 text-center text-sm text-muted-foreground"
              data-testid="loading"
            >
              Mencari...
            </p>
          ) : results.length > 0 ? (
            <ul className="py-1">
              {results.map((course, index) => (
                <li key={course.id}>
                  <Link
                    href={`/courses/${course.slug}`}
                    id={`search-option-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    data-testid="search-result-item"
                    className={cn(
                      "block px-3 py-2",
                      index === activeIndex && "bg-accent",
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="block truncate text-sm font-medium">
                      {course.title}
                    </span>
                    {course.categoryName ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {course.categoryName}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p
              className="px-3 py-4 text-center text-sm text-muted-foreground"
              data-testid="search-empty-state"
            >
              Tidak ada hasil untuk &quot;{trimmed}&quot;
            </p>
          )}

          {!isLoading ? (
            <Link
              href={viewAllHref}
              data-testid="search-view-all"
              className="block border-t border-border px-3 py-2 text-center text-sm font-medium hover:bg-accent"
              onClick={() => setIsOpen(false)}
            >
              {results.length
                ? `Lihat semua hasil untuk "${trimmed}"`
                : "Lihat semua courses"}
            </Link>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
