import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const headingVariants = cva(
  "scroll-m-20 font-semibold tracking-tight text-foreground",
  {
    variants: {
      level: {
        display: "text-5xl md:text-6xl",
        h1: "text-4xl md:text-5xl",
        h2: "text-3xl",
        h3: "text-2xl",
        h4: "text-xl",
      },
    },
    defaultVariants: {
      level: "h1",
    },
  },
);

type HeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface HeadingProps
  extends
    React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: HeadingElement;
}

export function Heading({
  as: Component = "h2",
  level,
  className,
  ...props
}: HeadingProps) {
  return (
    <Component
      className={cn(headingVariants({ level }), className)}
      {...props}
    />
  );
}

const textVariants = cva("", {
  variants: {
    variant: {
      lead: "text-lg leading-relaxed text-muted-foreground",
      body: "text-base leading-relaxed text-foreground",
      small: "text-sm text-foreground",
      muted: "text-sm text-muted-foreground",
      subtle: "text-sm text-subtle",
    },
  },
  defaultVariants: {
    variant: "body",
  },
});

type TextElement = "p" | "span" | "div";

interface TextProps
  extends
    React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {
  as?: TextElement;
}

export function Text({
  as: Component = "p",
  variant,
  className,
  ...props
}: TextProps) {
  return (
    <Component
      className={cn(textVariants({ variant }), className)}
      {...props}
    />
  );
}

export { headingVariants, textVariants };
