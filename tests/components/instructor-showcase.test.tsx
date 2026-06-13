import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InstructorShowcase } from "@/components/features/instructor/instructor-showcase";
import type { ShowcaseInstructor } from "@/server/services/instructor";

const INSTRUCTORS: ShowcaseInstructor[] = [
  {
    id: "user_instructor_13",
    name: "Reza Maulana",
    image: "https://api.dicebear.com/9.x/adventurer/png?seed=user_instructor_13",
    headline: "AI engineer | LLM apps & AI agents",
    expertise: { name: "AI & Machine Learning", slug: "ai-ml" },
    _count: { authoredCourses: 2 },
  },
  {
    id: "user_instructor_15",
    name: "Yoga Saputra",
    image: null,
    headline: "Application security engineer",
    expertise: { name: "Product & Engineering", slug: "product-engineering" },
    _count: { authoredCourses: 1 },
  },
];

describe("InstructorShowcase", () => {
  it("renders a carousel with one card per instructor", () => {
    render(<InstructorShowcase instructors={INSTRUCTORS} />);

    expect(screen.getByTestId("instructor-carousel")).toBeInTheDocument();
    expect(screen.getAllByTestId("instructor-card")).toHaveLength(2);
  });

  it("links each card to the course listing filtered by instructor id", () => {
    render(<InstructorShowcase instructors={INSTRUCTORS} />);

    const [first, second] = screen.getAllByTestId("instructor-card");
    expect(first).toHaveAttribute("href", "/courses?instructor=user_instructor_13");
    expect(first).toHaveTextContent("Reza Maulana");
    expect(first).toHaveTextContent("2 courses");
    expect(second).toHaveAttribute("href", "/courses?instructor=user_instructor_15");
    expect(second).toHaveTextContent("1 course");
  });

  it("renders prev/next navigation controls (no autoplay)", () => {
    render(<InstructorShowcase instructors={INSTRUCTORS} />);

    expect(screen.getByTestId("carousel-prev")).toBeInTheDocument();
    expect(screen.getByTestId("carousel-next")).toBeInTheDocument();
  });

  it("renders nothing when there are no instructors", () => {
    const { container } = render(<InstructorShowcase instructors={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
