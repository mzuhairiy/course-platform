"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { COMPLETION_THRESHOLD } from "@/lib/progress";
import { saveVideoProgressAction } from "@/server/actions/progress";

// Throttle server writes: persist watched position at most once per interval
// (plus on pause/ended) instead of on every timeupdate tick.
const SAVE_INTERVAL_MS = 5000;

export function VideoLecture({
  lectureId,
  src,
  durationSeconds,
  initialWatchedSeconds,
  initialCompleted,
}: {
  lectureId: string;
  src: string;
  durationSeconds: number | null;
  initialWatchedSeconds: number;
  initialCompleted: boolean;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedAtRef = useRef(0);
  const completedRef = useRef(initialCompleted);
  const [completed, setCompleted] = useState(initialCompleted);

  // Resume: seek to the last watched position once metadata is available.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || initialWatchedSeconds <= 0) return;

    const seek = () => {
      const max = Number.isFinite(video.duration) ? video.duration : Infinity;
      // Don't drop the learner right at the very end.
      if (initialWatchedSeconds < max - 1) {
        video.currentTime = initialWatchedSeconds;
      }
    };
    if (video.readyState >= 1) {
      seek();
    } else {
      video.addEventListener("loadedmetadata", seek, { once: true });
      return () => video.removeEventListener("loadedmetadata", seek);
    }
  }, [initialWatchedSeconds]);

  async function persist(watchedSeconds: number) {
    const result = await saveVideoProgressAction({
      lectureId,
      watchedSeconds: Math.max(0, Math.floor(watchedSeconds)),
    });
    // When completion is first reached, refresh server components so the
    // sidebar checkmark, course header, and percentage update without a manual
    // reload.
    if (
      result.status === "success" &&
      result.isCompleted &&
      !completedRef.current
    ) {
      completedRef.current = true;
      setCompleted(true);
      router.refresh();
    }
  }

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;

    const now = Date.now();
    if (now - lastSavedAtRef.current >= SAVE_INTERVAL_MS) {
      lastSavedAtRef.current = now;
      void persist(video.currentTime);
    }
  }

  function handlePause() {
    const video = videoRef.current;
    if (!video) return;
    lastSavedAtRef.current = Date.now();
    void persist(video.currentTime);
  }

  function handleEnded() {
    // Report the full duration so the server marks it completed deterministically.
    lastSavedAtRef.current = Date.now();
    void persist(durationSeconds ?? videoRef.current?.duration ?? 0);
  }

  return (
    <div className="space-y-3">
      <video
        ref={videoRef}
        controls
        preload="metadata"
        playsInline
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onPause={handlePause}
        onEnded={handleEnded}
        className="aspect-video w-full rounded-lg border border-border bg-black"
        data-testid="video-element"
      >
        Browser kamu tidak mendukung tag video.
      </video>

      <p
        className="text-sm text-muted-foreground"
        data-testid="video-completion-status"
      >
        {completed
          ? "✓ Lecture selesai"
          : `Tonton ${Math.round(
              COMPLETION_THRESHOLD * 100,
            )}% untuk menyelesaikan lecture ini.`}
      </p>
    </div>
  );
}
