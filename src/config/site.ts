export const siteConfig = {
  name: "CoursePlatform",
  description:
    "Platform kursus online self-paced — belajar skill baru dengan kecepatanmu sendiri.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  links: {
    twitter: "https://twitter.com/example",
    github: "https://github.com/example/course-platform",
  },
} as const;

export type SiteConfig = typeof siteConfig;

/**
 * #090b28 ≈ hsl(236 63% 10%) — keep in sync with --primary in globals.css.
 * Only for surfaces that cannot read CSS variables (OG image, favicon).
 */
export const BRAND_NAVY_HEX = "#090b28";
