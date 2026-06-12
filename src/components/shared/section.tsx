import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const sectionVariants = cva("w-full", {
  variants: {
    spacing: {
      default: "py-12 md:py-16 lg:py-24",
      compact: "py-8 md:py-12",
      none: "",
    },
  },
  defaultVariants: {
    spacing: "default",
  },
});

interface SectionProps
  extends
    React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {}

export function Section({ spacing, className, ...props }: SectionProps) {
  return (
    <section
      className={cn(sectionVariants({ spacing }), className)}
      {...props}
    />
  );
}
