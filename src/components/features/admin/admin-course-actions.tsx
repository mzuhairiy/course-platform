"use client";

import type { CourseStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  archiveCourseAction,
  unarchiveCourseAction,
} from "@/server/actions/admin";

export function AdminCourseActions({
  courseId,
  status,
}: {
  courseId: string;
  status: CourseStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isArchived = status === "ARCHIVED";

  function run(action: () => Promise<{ status: string; message?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      toast.success(<span data-testid="success-toast">{result.message}</span>);
      router.refresh();
    });
  }

  if (isArchived) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="admin-unarchive-button"
        disabled={isPending}
        onClick={() => run(() => unarchiveCourseAction(courseId))}
      >
        Unarchive
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      data-testid="admin-archive-button"
      disabled={isPending}
      onClick={() => run(() => archiveCourseAction(courseId))}
    >
      Archive
    </Button>
  );
}
