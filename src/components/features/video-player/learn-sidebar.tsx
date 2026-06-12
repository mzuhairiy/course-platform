"use client";

import type { LectureType } from "@prisma/client";
import { FileText, HelpCircle, PlayCircle } from "lucide-react";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

type Lecture = { id: string; title: string; type: LectureType };
type Section = { id: string; title: string; lectures: Lecture[] };

const LECTURE_ICON: Record<LectureType, typeof PlayCircle> = {
  VIDEO: PlayCircle,
  READING: FileText,
  QUIZ: HelpCircle,
};

export function LearnSidebar({
  courseId,
  courseSlug,
  courseTitle,
  sections,
  currentLectureId,
}: {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  sections: Section[];
  currentLectureId: string;
}) {
  const activeSection = sections.find((section) =>
    section.lectures.some((lecture) => lecture.id === currentLectureId),
  );

  return (
    <div className="space-y-4" data-testid="learn-sidebar">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Course
        </p>
        <Link
          href={`/courses/${courseSlug}`}
          className="font-semibold leading-tight hover:underline"
          data-testid="sidebar-course-title"
        >
          {courseTitle}
        </Link>
      </div>

      <Accordion
        type="multiple"
        defaultValue={
          activeSection
            ? [activeSection.id]
            : sections.map((section) => section.id)
        }
        className="rounded-lg border border-border px-3"
      >
        {sections.map((section) => (
          <AccordionItem
            key={section.id}
            value={section.id}
            data-testid="sidebar-section"
          >
            <AccordionTrigger className="text-left text-sm">
              {section.title}
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-1">
                {section.lectures.map((lecture) => {
                  const Icon = LECTURE_ICON[lecture.type];
                  const active = lecture.id === currentLectureId;
                  return (
                    <li key={lecture.id}>
                      <Link
                        href={`/learn/${courseId}/${lecture.id}`}
                        aria-current={active ? "page" : undefined}
                        data-testid="sidebar-lecture"
                        data-active={active}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                          active
                            ? "bg-accent font-medium text-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{lecture.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
