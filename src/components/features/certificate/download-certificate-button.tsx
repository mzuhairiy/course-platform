"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * Triggers an on-demand certificate download from
 * GET /api/certificates/[courseId]. Fetches the PDF as a blob so we can show an
 * explicit loading state while it generates, then saves it client-side.
 */
export function DownloadCertificateButton({
  courseId,
  courseSlug,
  disabled = false,
  className,
}: {
  courseId: string;
  courseSlug: string;
  disabled?: boolean;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (disabled || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/certificates/${courseId}`);
      if (!res.ok) {
        throw new Error("Sertifikat belum tersedia.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificate-${courseSlug}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengunduh sertifikat.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={handleDownload}
      disabled={disabled || loading}
      className={className}
      data-testid="download-certificate-button"
      data-loading={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Menyiapkan…
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Download Certificate
        </>
      )}
    </Button>
  );
}
