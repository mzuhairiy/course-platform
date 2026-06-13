import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { pushMock, searchMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  searchMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/server/actions/search", () => ({
  searchCoursesAction: searchMock,
}));

import { SearchInput } from "@/components/features/search/search-input";

const RESULTS = [
  {
    id: "course_sql",
    slug: "sql-untuk-data-analyst",
    title: "SQL untuk Data Analyst",
    categoryName: "Data & Analytics",
  },
  {
    id: "course_excel",
    slug: "excel-analisis-bisnis",
    title: "Excel untuk Analisis Bisnis",
    categoryName: "Data & Analytics",
  },
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SearchInput", () => {
  it("renders inline (no dialog) and registers no Cmd+K shortcut", async () => {
    const user = userEvent.setup();
    render(<SearchInput />);

    expect(screen.getByTestId("search-input")).toBeInTheDocument();
    await user.keyboard("{Meta>}k{/Meta}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("does not search below 2 keystrokes", async () => {
    const user = userEvent.setup();
    render(<SearchInput />);

    await user.type(screen.getByTestId("search-input"), "s");
    await wait(400); // past the 300ms debounce
    expect(searchMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("search-results")).not.toBeInTheDocument();
  });

  it("debounces typing into one call and renders title + category in the dropdown", async () => {
    searchMock.mockResolvedValue(RESULTS);
    const user = userEvent.setup();
    render(<SearchInput />);

    await user.type(screen.getByTestId("search-input"), "sql");
    // Debounce still pending right after the last keystroke.
    expect(searchMock).not.toHaveBeenCalled();

    const items = await screen.findAllByTestId(
      "search-result-item",
      {},
      { timeout: 2000 },
    );
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("SQL untuk Data Analyst");
    expect(items[0]).toHaveTextContent("Data & Analytics");

    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(searchMock).toHaveBeenCalledWith("sql");
  });

  it("navigates to the first result with Enter", async () => {
    searchMock.mockResolvedValue(RESULTS);
    const user = userEvent.setup();
    render(<SearchInput />);

    await user.type(screen.getByTestId("search-input"), "sql");
    await screen.findAllByTestId("search-result-item", {}, { timeout: 2000 });

    await user.keyboard("{Enter}");
    expect(pushMock).toHaveBeenCalledWith("/courses/sql-untuk-data-analyst");
  });

  it("supports arrow-key navigation before Enter", async () => {
    searchMock.mockResolvedValue(RESULTS);
    const user = userEvent.setup();
    render(<SearchInput />);

    await user.type(screen.getByTestId("search-input"), "analisis");
    await screen.findAllByTestId("search-result-item", {}, { timeout: 2000 });

    await user.keyboard("{ArrowDown}{Enter}");
    expect(pushMock).toHaveBeenCalledWith("/courses/excel-analisis-bisnis");
  });

  it("shows the empty state and a view-all link to /courses", async () => {
    searchMock.mockResolvedValue([]);
    const user = userEvent.setup();
    render(<SearchInput />);

    await user.type(screen.getByTestId("search-input"), "zzz");

    const empty = await screen.findByTestId(
      "search-empty-state",
      {},
      { timeout: 2000 },
    );
    expect(empty).toHaveTextContent('Tidak ada hasil untuk "zzz"');
    expect(screen.getByTestId("search-view-all")).toHaveAttribute(
      "href",
      "/courses",
    );
  });

  it("links view-all to the listing with q when there are results", async () => {
    searchMock.mockResolvedValue(RESULTS);
    const user = userEvent.setup();
    render(<SearchInput />);

    await user.type(screen.getByTestId("search-input"), "sql");
    await screen.findAllByTestId("search-result-item", {}, { timeout: 2000 });

    expect(screen.getByTestId("search-view-all")).toHaveAttribute(
      "href",
      "/courses?q=sql",
    );
  });

  it("falls back to form submit (listing) when the dropdown is closed", async () => {
    const user = userEvent.setup();
    render(<SearchInput />);

    await user.type(screen.getByTestId("search-input"), "s{Enter}");
    expect(pushMock).toHaveBeenCalledWith("/courses?q=s");
  });
});
