export type NavItem = { title: string; href: string };

/** Primary navbar links (center). */
export const mainNav: NavItem[] = [
  { title: "Courses", href: "/courses" },
  { title: "About", href: "/about" },
];

/** Authenticated user dropdown items (Sign out is rendered separately). */
export const userNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "My Courses", href: "/my-courses" },
  { title: "Purchase History", href: "/purchase-history" },
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
