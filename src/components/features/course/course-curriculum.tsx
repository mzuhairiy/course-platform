"use client";

import type { LectureType } from "@prisma/client";
import { FileText, HelpCircle, PlayCircle } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatDuration } from "@/lib/format";

type Lecture = {
  id: string;
  title: string;
  type: LectureType;
  durationSeconds: number | null;
};

type Section = {
  id: string;
  title: string;
  lectures: Lecture[];
};

const LECTURE_ICON: Record<LectureType, typeof PlayCircle> = {
  VIDEO: PlayCircle,
  READING: FileText,
  QUIZ: HelpCircle,
};

function LectureRow({ lecture }: { lecture: Lecture }) {
  const Icon = LECTURE_ICON[lecture.type];
  return (
    <li className="flex items-center gap-3" data-testid="curriculum-lecture">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="flex-1">{lecture.title}</span>
      {lecture.durationSeconds ? (
        <span className="text-muted-foreground">
          {formatDuration(lecture.durationSeconds)}
        </span>
      ) : null}
    </li>
  );
}

export function CourseCurriculum({ sections }: { sections: Section[] }) {
  // Courses authored via the instructor lesson manager have a single hidden
  // "default" section — render them flat (no section header). Multi-section
  // seed courses keep the per-section accordion.
  if (sections.length <= 1) {
    const lectures = sections[0]?.lectures ?? [];
    return (
      <ul
        className="space-y-2 rounded-lg border border-border p-4"
        data-testid="curriculum"
      >
        {lectures.map((lecture) => (
          <LectureRow key={lecture.id} lecture={lecture} />
        ))}
      </ul>
    );
  }

  return (
    <Accordion
      type="multiple"
      defaultValue={sections.map((section) => section.id)}
      className="rounded-lg border border-border px-4"
      data-testid="curriculum"
    >
      {sections.map((section) => (
        <AccordionItem
          key={section.id}
          value={section.id}
          data-testid="curriculum-section"
        >
          <AccordionTrigger data-testid={`curriculum-section-${section.id}`}>
            <span className="text-left">
              {section.title}
              <span className="ml-2 font-normal text-muted-foreground">
                ({section.lectures.length})
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-2">
              {section.lectures.map((lecture) => (
                <LectureRow key={lecture.id} lecture={lecture} />
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
