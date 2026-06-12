export type NavItem = { title: string; href: string };

/** Primary navbar links (center). */
export const mainNav: NavItem[] = [
  { title: "Courses", href: "/courses" },
  { title: "About", href: "/about" },
];

/** Categories dropdown. Static for now; wired to the DB filter in Prompt 7. */
export const categoryNav: NavItem[] = [
  { title: "Programming", href: "/courses?category=programming" },
  { title: "Design", href: "/courses?category=design" },
  { title: "Business", href: "/courses?category=business" },
];

/** Authenticated user dropdown items (Sign out is rendered separately). */
export const userNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "My Courses", href: "/my-courses" },
  { title: "Settings", href: "/settings" },
];

/** Footer link columns (Brand column is rendered separately). */
export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Learn",
    items: [
      { title: "Browse Courses", href: "/courses" },
      { title: "Categories", href: "/courses" },
    ],
  },
  {
    title: "Company",
    items: [
      { title: "About", href: "/about" },
      { title: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    items: [
      { title: "Privacy", href: "/privacy" },
      { title: "Terms", href: "/terms" },
    ],
  },
];
