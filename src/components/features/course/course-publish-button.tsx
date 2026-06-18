"use client";

import type { CourseStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  publishCourseAction,
  unpublishCourseAction,
} from "@/server/actions/course";

/**
 * Publish/Unpublish toggle shared by the course list and the edit page.
 * A publish attempt on an empty course surfaces the service error as a toast.
 */
export function CoursePublishButton({
  courseId,
  status,
  size = "sm",
}: {
  courseId: string;
  status: CourseStatus;
  size?: "sm" | "default";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isPublished = status === "PUBLISHED";

  function toggle() {
    startTransition(async () => {
      const result = isPublished
        ? await unpublishCourseAction(courseId)
        : await publishCourseAction(courseId);
      if (result?.status === "error") {
        toast.error(
          <span data-testid="course-action-error">{result.message}</span>,
        );
        return;
      }
      toast.success(<span data-testid="success-toast">{result?.message}</span>);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      size={size}
      variant={isPublished ? "outline" : "default"}
      disabled={isPending}
      data-testid={isPublished ? "unpublish-button" : "publish-button"}
      onClick={toggle}
    >
      {isPending ? "…" : isPublished ? "Unpublish" : "Publish"}
    </Button>
  );
}
