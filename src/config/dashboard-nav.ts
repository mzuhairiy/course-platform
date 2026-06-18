/**
 * Workspace sidebar nav config. Icons are referenced by string key (not the
 * lucide component itself) so these stay plain serializable objects — the
 * Server Component layouts pass them to the client `WorkspaceShell`, which
 * resolves the key to an icon. Passing the component function directly would
 * break the server→client boundary.
 */
export type DashboardNavIcon =
  | "dashboard"
  | "my-courses"
  | "create"
  | "courses"
  | "users"
  | "transactions"
  | "categories";

export type DashboardNavItem = {
  title: string;
  href: string;
  icon: DashboardNavIcon;
};

/** Instructor workspace sidebar (`/instructor/*`). */
export const instructorNav: DashboardNavItem[] = [
  { title: "Dashboard", href: "/instructor", icon: "dashboard" },
  { title: "My Courses", href: "/instructor/courses", icon: "my-courses" },
  { title: "Create Course", href: "/instructor/courses/new", icon: "create" },
];

/** Admin console sidebar (`/admin/*`). */
export const adminNav: DashboardNavItem[] = [
  { title: "Dashboard", href: "/admin", icon: "dashboard" },
  { title: "Courses", href: "/admin/courses", icon: "courses" },
  { title: "Users", href: "/admin/users", icon: "users" },
  { title: "Transactions", href: "/admin/transactions", icon: "transactions" },
  { title: "Categories", href: "/admin/categories", icon: "categories" },
];
