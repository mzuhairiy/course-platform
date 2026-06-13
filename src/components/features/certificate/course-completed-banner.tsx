import { PartyPopper } from "lucide-react";

import { DownloadCertificateButton } from "@/components/features/certificate/download-certificate-button";

/**
 * Celebratory banner shown when a course reaches 100% completion, with a direct
 * call-to-action to download the certificate.
 */
export function CourseCompletedBanner({
  courseId,
  courseSlug,
}: {
  courseId: string;
  courseSlug: string;
}) {
  return (
    <div
      className="flex flex-col gap-4 rounded-lg border border-success/30 bg-success/10 p-5 sm:flex-row sm:items-center sm:justify-between"
      data-testid="course-completed-banner"
    >
      <div className="flex items-center gap-3">
        <PartyPopper className="h-6 w-6 shrink-0 text-success" />
        <div>
          <p className="font-semibold">Course Completed 🎉</p>
          <p className="text-sm text-muted-foreground">
            Selamat! Kamu telah menyelesaikan semua materi course ini.
          </p>
        </div>
      </div>
      <DownloadCertificateButton courseId={courseId} courseSlug={courseSlug} />
    </div>
  );
}
