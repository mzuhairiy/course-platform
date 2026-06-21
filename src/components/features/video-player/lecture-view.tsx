import ReactMarkdown from "react-markdown";

import {
  QuizLecture,
  type QuizLectureProps,
} from "@/components/features/quiz/quiz-lecture";
import { MarkCompleteButton } from "@/components/features/video-player/mark-complete-button";
import { VideoLecture } from "@/components/features/video-player/video-lecture";
import { Heading, Text } from "@/components/ui/typography";
import type { PerLectureProgress } from "@/server/services/progress";
import type { LearnLecture } from "@/server/services/course";

// Fallback if a VIDEO lecture somehow has no URL (all seeded lectures use the
// local sample clip). Video is plain URL input — Mux was dropped.
const SAMPLE_VIDEO_URL = "/sample-lecture.mp4";

export function LectureView({
  lecture,
  progress,
  quiz,
}: {
  lecture: LearnLecture;
  progress: PerLectureProgress;
  quiz?: QuizLectureProps | null;
}) {
  return (
    <div className="space-y-4" data-testid="lecture-view">
      <Heading as="h1" level="h3" data-testid="lecture-title">
        {lecture.title}
      </Heading>

      {lecture.type === "VIDEO" ? (
        <VideoLecture
          lectureId={lecture.id}
          src={lecture.videoUrl ?? SAMPLE_VIDEO_URL}
          durationSeconds={lecture.durationSeconds}
          initialWatchedSeconds={progress.watchedSeconds}
          initialCompleted={progress.completed}
        />
      ) : null}

      {lecture.type === "READING" ? (
        <div className="space-y-6">
          <div
            className="prose prose-neutral max-w-none"
            data-testid="reading-content"
          >
            <ReactMarkdown>{lecture.contentMd ?? ""}</ReactMarkdown>
          </div>
          <MarkCompleteButton
            lectureId={lecture.id}
            initialCompleted={progress.completed}
          />
        </div>
      ) : null}

      {lecture.type === "QUIZ" ? (
        quiz ? (
          // QUIZ lectures are completed by PASSING the quiz (handled server-side
          // in submitQuizAttempt → markLectureComplete), not a manual button.
          <QuizLecture {...quiz} />
        ) : (
          <div
            className="rounded-lg border border-dashed border-border p-12 text-center"
            data-testid="quiz-placeholder"
          >
            <Text variant="muted">Quiz belum tersedia untuk lecture ini.</Text>
          </div>
        )
      ) : null}
    </div>
  );
}
