import { Container } from "@/components/shared/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div data-testid="loading">
      <div className="border-b border-border bg-surface">
        <Container className="space-y-4 py-10">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
        </Container>
      </div>
      <Container className="py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          <div className="order-last space-y-4 lg:order-first">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="order-first h-80 w-full lg:order-last" />
        </div>
      </Container>
    </div>
  );
}
