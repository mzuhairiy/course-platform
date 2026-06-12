import Link from "next/link";

import { Button } from "@/components/ui/button";

export function CoursePagination({
  currentPage,
  totalPages,
  baseQuery,
}: {
  currentPage: number;
  totalPages: number;
  baseQuery: string;
}) {
  if (totalPages <= 1) return null;

  const makeHref = (page: number) => {
    const params = new URLSearchParams(baseQuery);
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    return query ? `/courses?${query}` : "/courses";
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      className="flex items-center justify-center gap-2"
      data-testid="pagination"
      aria-label="Pagination"
    >
      {currentPage > 1 ? (
        <Button asChild variant="outline" size="sm">
          <Link href={makeHref(currentPage - 1)} data-testid="pagination-prev">
            Previous
          </Link>
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled
          data-testid="pagination-prev"
        >
          Previous
        </Button>
      )}

      {pages.map((page) => (
        <Button
          key={page}
          asChild
          size="sm"
          variant={page === currentPage ? "default" : "outline"}
        >
          <Link
            href={makeHref(page)}
            data-testid={`pagination-page-${page}`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Link>
        </Button>
      ))}

      {currentPage < totalPages ? (
        <Button asChild variant="outline" size="sm">
          <Link href={makeHref(currentPage + 1)} data-testid="pagination-next">
            Next
          </Link>
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled
          data-testid="pagination-next"
        >
          Next
        </Button>
      )}
    </nav>
  );
}
