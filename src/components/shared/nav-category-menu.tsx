"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NavCategory } from "@/server/services/category";

export function NavCategoryMenu({ category }: { category: NavCategory }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="link"
          size="sm"
          className="text-primary-foreground/80 hover:text-primary-foreground hover:no-underline"
          data-testid={`nav-category-${category.slug}`}
        >
          {category.name}
          <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {category.courses.length > 0 ? (
          category.courses.map((course) => (
            <DropdownMenuItem key={course.id} asChild>
              <Link
                href={`/courses/${course.slug}`}
                data-testid={`nav-course-${course.slug}`}
                className="cursor-pointer"
              >
                {course.title}
              </Link>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuLabel className="font-normal text-muted-foreground">
            Belum ada course di kategori ini
          </DropdownMenuLabel>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href={`/courses?category=${category.slug}`}
            data-testid={`nav-category-all-${category.slug}`}
            className="cursor-pointer font-medium"
          >
            Lihat semua {category.name}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
