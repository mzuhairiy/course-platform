import type { Metadata } from "next";
import Link from "next/link";

import { CourseForm } from "@/components/features/course/course-form";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import { getCategoryOptions } from "@/server/services/category";

export const metadata: Metadata = {
  title: "Create Course",
};

export default async function CreateCoursePage() {
  const categories = await getCategoryOptions();

  return (
    <div className="mx-auto max-w-3xl space-y-6" data-testid="create-course">
      <header className="space-y-2">
        <Button asChild variant="link" size="sm" className="-ml-3 w-fit">
          <Link href="/instructor/courses">← Kembali ke My Courses</Link>
        </Button>
        <Heading as="h1" level="h1">
          Create Course
        </Heading>
        <Text variant="muted">
          Buat course baru sebagai DRAFT, lalu isi kurikulumnya.
        </Text>
      </header>

      <CourseForm mode="create" categories={categories} />
    </div>
  );
}
