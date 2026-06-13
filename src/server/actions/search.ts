"use server";

import { z } from "zod";

import {
  SEARCH_MAX_QUERY_LENGTH,
  SEARCH_MAX_RESULTS,
  SEARCH_MIN_QUERY_LENGTH,
} from "@/config/search";
import { searchPublishedCourses } from "@/server/services/course";

const searchQuerySchema = z
  .string()
  .trim()
  .min(SEARCH_MIN_QUERY_LENGTH)
  .max(SEARCH_MAX_QUERY_LENGTH);

export type SearchResultItem = {
  id: string;
  slug: string;
  title: string;
  categoryName: string | null;
};

export async function searchCoursesAction(
  rawQuery: string,
): Promise<SearchResultItem[]> {
  const parsed = searchQuerySchema.safeParse(rawQuery);
  if (!parsed.success) return [];

  const courses = await searchPublishedCourses(parsed.data, SEARCH_MAX_RESULTS);
  return courses.map((course) => ({
    id: course.id,
    slug: course.slug,
    title: course.title,
    categoryName: course.category?.name ?? null,
  }));
}
