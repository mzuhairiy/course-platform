"use client";

import Image from "next/image";
import Link from "next/link";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { Heading } from "@/components/ui/typography";
import { getInitials } from "@/lib/utils";
import type { ShowcaseInstructor } from "@/server/services/instructor";

// Shared positioning override so the nav buttons sit in the header row instead
// of overlaying the track (avoids clipping across breakpoints).
const NAV_BUTTON_CLASS =
  "static h-9 w-9 translate-y-0 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary";

export function InstructorShowcase({
  instructors,
}: {
  instructors: ShowcaseInstructor[];
}) {
  if (instructors.length === 0) return null;

  return (
    <Section
      data-testid="instructor-spotlight-section"
      className="bg-primary text-primary-foreground"
    >
      <Container>
        {/* Autoplay intentionally disabled: drag/arrow navigation only, so the
            carousel stays deterministic for automated tests. */}
        <Carousel
          data-testid="instructor-carousel"
          opts={{ align: "start" }}
          className="space-y-8"
        >
          <div className="flex items-center justify-between gap-4">
            <Heading
              as="h2"
              level="h2"
              className="text-primary-foreground"
            >
              Belajar dari instruktur terbaik
            </Heading>
            <div className="flex shrink-0 gap-2">
              <CarouselPrevious
                data-testid="carousel-prev"
                aria-label="Instruktur sebelumnya"
                className={NAV_BUTTON_CLASS}
              />
              <CarouselNext
                data-testid="carousel-next"
                aria-label="Instruktur berikutnya"
                className={NAV_BUTTON_CLASS}
              />
            </div>
          </div>

          <CarouselContent>
            {instructors.map((instructor) => {
              const courseCount = instructor._count.authoredCourses;
              return (
                <CarouselItem
                  key={instructor.id}
                  className="basis-[83.333%] sm:basis-1/2 lg:basis-1/4"
                >
                  <Link
                    href={`/courses?instructor=${instructor.id}`}
                    data-testid="instructor-card"
                    className="flex h-full flex-col items-center gap-3 rounded-lg border border-primary-foreground/10 bg-primary-foreground/5 p-6 text-center transition-colors hover:border-primary-foreground/30"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-primary-foreground/10">
                      {instructor.image ? (
                        <Image
                          src={instructor.image}
                          alt={instructor.name ?? ""}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xl font-semibold text-primary-foreground/70">
                          {getInitials(instructor.name)}
                        </div>
                      )}
                    </div>
                    <p className="font-semibold leading-tight">
                      {instructor.name}
                    </p>
                    {instructor.headline ? (
                      <p className="line-clamp-2 text-sm text-primary-foreground/70">
                        {instructor.headline}
                      </p>
                    ) : null}
                    <p
                      className="mt-auto text-sm font-medium text-primary-foreground/90"
                      data-testid="instructor-course-count"
                    >
                      {courseCount} course{courseCount === 1 ? "" : "s"}
                    </p>
                  </Link>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      </Container>
    </Section>
  );
}
