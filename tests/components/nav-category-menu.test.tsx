import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { NavCategoryMenu } from "@/components/shared/nav-category-menu";

const CATEGORY = {
  id: "cat_programming",
  name: "Programming",
  slug: "programming",
  courses: [
    {
      id: "course_1",
      title: "Next.js 14 untuk Pemula",
      slug: "next-js-14-untuk-pemula",
    },
    {
      id: "course_2",
      title: "TypeScript Mendalam",
      slug: "typescript-mendalam",
    },
  ],
};

describe("NavCategoryMenu", () => {
  it("opens on click and lists the category's courses as links", async () => {
    const user = userEvent.setup();
    render(<NavCategoryMenu category={CATEGORY} />);

    const trigger = screen.getByTestId("nav-category-programming");
    expect(trigger).toHaveTextContent("Programming");

    await user.click(trigger);

    const first = await screen.findByTestId(
      "nav-course-next-js-14-untuk-pemula",
    );
    expect(first).toHaveAttribute("href", "/courses/next-js-14-untuk-pemula");
    expect(
      screen.getByTestId("nav-course-typescript-mendalam"),
    ).toHaveAttribute("href", "/courses/typescript-mendalam");
    expect(screen.getByTestId("nav-category-all-programming")).toHaveAttribute(
      "href",
      "/courses?category=programming",
    );
  });

  it("is keyboard operable (Enter opens the menu)", async () => {
    const user = userEvent.setup();
    render(<NavCategoryMenu category={CATEGORY} />);

    await user.tab();
    expect(screen.getByTestId("nav-category-programming")).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(
      await screen.findByTestId("nav-course-next-js-14-untuk-pemula"),
    ).toBeInTheDocument();
  });
});
