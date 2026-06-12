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

export function CourseCurriculum({ sections }: { sections: Section[] }) {
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
              {section.lectures.map((lecture) => {
                const Icon = LECTURE_ICON[lecture.type];
                return (
                  <li
                    key={lecture.id}
                    className="flex items-center gap-3"
                    data-testid="curriculum-lecture"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1">{lecture.title}</span>
                    {lecture.durationSeconds ? (
                      <span className="text-muted-foreground">
                        {formatDuration(lecture.durationSeconds)}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
