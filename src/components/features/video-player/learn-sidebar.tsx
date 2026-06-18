"use client";

import type { LectureType } from "@prisma/client";
import { CheckCircle2, FileText, HelpCircle, PlayCircle } from "lucide-react";
import Link from "next/link";

import { CertificateSection } from "@/components/features/certificate/certificate-section";
import { CourseProgressBar } from "@/components/features/course/course-progress-bar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

type Lecture = { id: string; title: string; type: LectureType };
type Section = { id: string; title: string; lectures: Lecture[] };

type Progress = { completed: number; total: number; percentage: number };

const LECTURE_ICON: Record<LectureType, typeof PlayCircle> = {
  VIDEO: PlayCircle,
  READING: FileText,
  QUIZ: HelpCircle,
};

function LectureLink({
  lecture,
  courseId,
  active,
  isDone,
}: {
  lecture: Lecture;
  courseId: string;
  active: boolean;
  isDone: boolean;
}) {
  const Icon = LECTURE_ICON[lecture.type];
  return (
    <li>
      <Link
        href={`/learn/${courseId}/${lecture.id}`}
        aria-current={active ? "page" : undefined}
        data-testid="sidebar-lecture"
        data-active={active}
        data-completed={isDone}
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
          active
            ? "bg-accent font-medium text-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        {isDone ? (
          <CheckCircle2
            className="h-4 w-4 shrink-0 text-green-600"
            data-testid="lecture-complete-check"
            aria-label="Selesai"
          />
        ) : (
          <Icon className="h-4 w-4 shrink-0" />
        )}
        <span className="flex-1">{lecture.title}</span>
      </Link>
    </li>
  );
}

export function LearnSidebar({
  courseId,
  courseSlug,
  courseTitle,
  sections,
  currentLectureId,
  completedLectureIds,
  progress,
}: {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  sections: Section[];
  currentLectureId: string;
  completedLectureIds: string[];
  progress: Progress;
}) {
  const completed = new Set(completedLectureIds);
  const activeSection = sections.find((section) =>
    section.lectures.some((lecture) => lecture.id === currentLectureId),
  );
  // Single (default) section → flat list, no "Main" header. Multi-section seed
  // courses keep the per-section accordion.
  const isFlat = sections.length <= 1;

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

      <CourseProgressBar
        completed={progress.completed}
        total={progress.total}
        percentage={progress.percentage}
      />

      {isFlat ? (
        <ul
          className="space-y-1 rounded-lg border border-border p-2"
          data-testid="lecture-list"
        >
          {(sections[0]?.lectures ?? []).map((lecture) => (
            <LectureLink
              key={lecture.id}
              lecture={lecture}
              courseId={courseId}
              active={lecture.id === currentLectureId}
              isDone={completed.has(lecture.id)}
            />
          ))}
        </ul>
      ) : (
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
                  {section.lectures.map((lecture) => (
                    <LectureLink
                      key={lecture.id}
                      lecture={lecture}
                      courseId={courseId}
                      active={lecture.id === currentLectureId}
                      isDone={completed.has(lecture.id)}
                    />
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <CertificateSection
        courseId={courseId}
        courseSlug={courseSlug}
        completed={progress.total > 0 && progress.percentage === 100}
      />
    </div>
  );
}
