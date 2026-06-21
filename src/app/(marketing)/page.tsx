import { BadgeCheck, Clock, Zap } from "lucide-react";
import Link from "next/link";

import { CategoryCard } from "@/components/features/category/category-card";
import { CourseCard } from "@/components/features/course/course-card";
import { InstructorShowcase } from "@/components/features/instructor/instructor-showcase";
import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import { siteConfig } from "@/config/site";
import { getCategoriesWithCourseCount } from "@/server/services/category";
import { getFeaturedCourses } from "@/server/services/course";
import { getRatingsForCourseIds } from "@/server/services/review";
import { getShowcaseInstructors } from "@/server/services/instructor";

const valueProps = [
  {
    icon: Zap,
    title: "Belajar sesuai kecepatanmu",
    text: "Akses materi kapan saja, ulang sesering yang kamu mau. Tanpa tekanan jadwal.",
  },
  {
    icon: BadgeCheck,
    title: "Materi berkualitas",
    text: "Kurikulum terstruktur dari instruktur berpengalaman di bidangnya.",
  },
  {
    icon: Clock,
    title: "Akses selamanya",
    text: "Sekali enroll, materinya jadi milikmu. Belajar lagi kapan pun dibutuhkan.",
  },
];

export default async function HomePage() {
  const [categories, featuredCourses, instructors] = await Promise.all([
    getCategoriesWithCourseCount(),
    getFeaturedCourses(3),
    getShowcaseInstructors(),
  ]);
  const featuredRatings = await getRatingsForCourseIds(
    featuredCourses.map((c) => c.id),
  );

  return (
    <>
      <Section
        data-testid="hero-section"
        className="bg-primary text-primary-foreground"
      >
        <Container className="flex flex-col items-center gap-6 text-center">
          <Heading
            as="h1"
            level="display"
            className="max-w-3xl text-primary-foreground"
          >
            Belajar skill baru, sesuai kecepatanmu
          </Heading>
          <Text variant="lead" className="max-w-2xl text-primary-foreground/80">
            {siteConfig.description}
          </Text>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Button
              asChild
              size="lg"
              variant="link"
              className="text-base font-semibold text-primary-foreground hover:text-primary-foreground"
            >
              <Link href="/courses" data-testid="hero-cta-browse">
                Browse Courses
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="link"
              className="text-base text-primary-foreground/80 hover:text-primary-foreground"
            >
              <Link href="#how-it-works" data-testid="hero-cta-how">
                How it works
              </Link>
            </Button>
          </div>
        </Container>
      </Section>

      <Section data-testid="featured-courses-section" spacing="compact">
        <Container className="space-y-6">
          <Heading as="h2" level="h2">
            Featured courses
          </Heading>
          {featuredCourses.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  rating={featuredRatings.get(course.id)}
                />
              ))}
            </div>
          ) : (
            <Text variant="muted" data-testid="featured-empty">
              Belum ada course yang dipublikasikan.
            </Text>
          )}
        </Container>
      </Section>

      <Section data-testid="categories-section" spacing="compact">
        <Container className="space-y-6">
          <Heading as="h2" level="h2">
            Browse by category
          </Heading>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                name={category.name}
                slug={category.slug}
                courseCount={category._count.courses}
              />
            ))}
          </div>
        </Container>
      </Section>

      <Section
        id="how-it-works"
        data-testid="value-props-section"
        className="bg-surface"
      >
        <Container className="space-y-8">
          <Heading as="h2" level="h2" className="text-center">
            Kenapa belajar di sini
          </Heading>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {valueProps.map((prop) => (
              <div key={prop.title} className="space-y-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-background text-brand">
                  <prop.icon className="h-5 w-5" />
                </span>
                <Heading as="h3" level="h4">
                  {prop.title}
                </Heading>
                <Text variant="muted">{prop.text}</Text>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <InstructorShowcase instructors={instructors} />

      <Section data-testid="cta-section">
        <Container>
          <div className="flex flex-col items-center gap-6 rounded-lg border border-border bg-surface px-6 py-16 text-center">
            <Heading as="h2" level="h2" className="max-w-2xl">
              Siap mulai belajar?
            </Heading>
            <Text variant="lead" className="max-w-xl">
              Gabung gratis dan mulai kursus pertamamu hari ini.
            </Text>
            <Button asChild size="lg">
              <Link href="/sign-up" data-testid="cta-signup">
                Get started
              </Link>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
