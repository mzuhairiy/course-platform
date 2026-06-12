import ReactMarkdown from "react-markdown";

import { Heading, Text } from "@/components/ui/typography";
import type { LearnLecture } from "@/server/services/course";

// Fase 1 uses a public sample MP4 via a plain HTML5 <video>. Mux playback
// (lecture.videoPlaybackId) is wired in Fase 4.
const SAMPLE_VIDEO_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export function LectureView({ lecture }: { lecture: LearnLecture }) {
  return (
    <div className="space-y-4" data-testid="lecture-view">
      <Heading as="h1" level="h3" data-testid="lecture-title">
        {lecture.title}
      </Heading>

      {lecture.type === "VIDEO" ? (
        <video
          controls
          preload="metadata"
          src={lecture.videoUrl ?? SAMPLE_VIDEO_URL}
          className="aspect-video w-full rounded-lg border border-border bg-black"
          data-testid="video-player"
        >
          Browser kamu tidak mendukung tag video.
        </video>
      ) : null}

      {lecture.type === "READING" ? (
        <div
          className="prose prose-neutral max-w-none"
          data-testid="reading-content"
        >
          <ReactMarkdown>{lecture.contentMd ?? ""}</ReactMarkdown>
        </div>
      ) : null}

      {lecture.type === "QUIZ" ? (
        <div
          className="rounded-lg border border-dashed border-border p-12 text-center"
          data-testid="quiz-placeholder"
        >
          <Text variant="muted">Quiz akan tersedia di Fase 3.</Text>
        </div>
      ) : null}
    </div>
  );
}
