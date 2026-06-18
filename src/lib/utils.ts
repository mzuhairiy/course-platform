import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * URL-safe slug: lowercase, ASCII alphanumerics + single hyphens, no leading/
 * trailing hyphen. Used to seed a course slug from its title (override-able).
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Up-to-two-letter initials from a name (or email), with a fallback. */
export function getInitials(name?: string | null, fallback = "U"): string {
  if (!name) return fallback;
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return initials || fallback;
}
