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
