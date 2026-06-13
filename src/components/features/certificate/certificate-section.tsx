import { Award } from "lucide-react";

import { DownloadCertificateButton } from "@/components/features/certificate/download-certificate-button";

/**
 * Certificate access panel. The download button is enabled only once the course
 * is complete; otherwise it's disabled with a helper message explaining how to
 * unlock it.
 */
export function CertificateSection({
  courseId,
  courseSlug,
  completed,
}: {
  courseId: string;
  courseSlug: string;
  completed: boolean;
}) {
  return (
    <div
      className="space-y-2 rounded-lg border border-border p-4"
      data-testid="certificate-section"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <Award className="h-4 w-4 text-primary" />
        Sertifikat
      </div>
      <DownloadCertificateButton
        courseId={courseId}
        courseSlug={courseSlug}
        disabled={!completed}
        className="w-full"
      />
      {!completed ? (
        <p
          className="text-xs text-muted-foreground"
          data-testid="certificate-locked-message"
        >
          Selesaikan semua materi untuk membuka sertifikat.
        </p>
      ) : null}
    </div>
  );
}
