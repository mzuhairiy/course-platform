import type { Metadata } from "next";

import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Heading, Text } from "@/components/ui/typography";

import { StyleGuideDemos } from "./demos";

export const metadata: Metadata = {
  title: "Style Guide",
};

const swatches: { label: string; className: string }[] = [
  { label: "background", className: "bg-background" },
  { label: "foreground", className: "bg-foreground" },
  { label: "primary", className: "bg-primary" },
  { label: "secondary", className: "bg-secondary" },
  { label: "muted", className: "bg-muted" },
  { label: "accent", className: "bg-accent" },
  { label: "brand", className: "bg-brand" },
  { label: "surface", className: "bg-surface" },
  { label: "surface-muted", className: "bg-surface-muted" },
  { label: "success", className: "bg-success" },
  { label: "warning", className: "bg-warning" },
  { label: "destructive", className: "bg-destructive" },
];

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4" data-testid={`block-${title.toLowerCase()}`}>
      <Heading as="h2" level="h3">
        {title}
      </Heading>
      {children}
      <Separator className="mt-8" />
    </div>
  );
}

export default function StyleGuidePage() {
  return (
    <main className="bg-background" data-testid="style-guide">
      <Section>
        <Container className="space-y-12">
          <div className="space-y-2">
            <Heading as="h1" level="h1">
              Style Guide
            </Heading>
            <Text variant="lead">
              Design system foundation — typography, colors, and base
              components.
            </Text>
          </div>

          <Block title="Typography">
            <div className="space-y-3">
              <Heading as="h2" level="display">
                Display heading
              </Heading>
              <Heading as="h2" level="h1">
                Heading 1
              </Heading>
              <Heading as="h3" level="h2">
                Heading 2
              </Heading>
              <Heading as="h4" level="h3">
                Heading 3
              </Heading>
              <Heading as="h5" level="h4">
                Heading 4
              </Heading>
              <Text variant="lead">
                Lead — a slightly larger intro paragraph.
              </Text>
              <Text variant="body">
                Body — the default paragraph style with relaxed line height.
              </Text>
              <Text variant="muted">Muted — secondary supporting text.</Text>
              <Text variant="subtle">Subtle — the lightest text tone.</Text>
              <code className="font-mono text-sm">
                font-mono: const x = 42;
              </code>
            </div>
          </Block>

          <Block title="Colors">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {swatches.map((s) => (
                <div key={s.label} className="space-y-1.5">
                  <div
                    className={`h-16 w-full rounded-md border border-border ${s.className}`}
                  />
                  <Text variant="muted" as="span">
                    {s.label}
                  </Text>
                </div>
              ))}
            </div>
          </Block>

          <Block title="Buttons">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button disabled>Disabled</Button>
            </div>
          </Block>

          <Block title="Badges">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </Block>

          <Block title="Form">
            <div className="max-w-sm space-y-2">
              <Label htmlFor="demo-email">Email</Label>
              <Input
                id="demo-email"
                name="demo-email"
                type="email"
                placeholder="you@example.com"
              />
              <Text variant="muted">
                Focus the input to see the accent ring.
              </Text>
            </div>
          </Block>

          <Block title="Card">
            <Card className="max-w-sm">
              <CardHeader>
                <CardTitle>Card title</CardTitle>
                <CardDescription>Card description goes here.</CardDescription>
              </CardHeader>
              <CardContent>
                <Text variant="body">
                  Cards use a subtle border and surface background.
                </Text>
              </CardContent>
              <CardFooter className="gap-2">
                <Button size="sm">Action</Button>
                <Button size="sm" variant="outline">
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          </Block>

          <Block title="Avatar & Skeleton">
            <div className="flex items-center gap-6">
              <Avatar>
                <AvatarFallback>CP</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </Block>

          <Block title="Interactive">
            <StyleGuideDemos />
          </Block>
        </Container>
      </Section>
    </main>
  );
}
