import Image from "next/image";

import { EnrollButton } from "@/components/features/course/enroll-button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatDuration, formatPrice } from "@/lib/format";

type EnrollCardProps = {
  courseId: string;
  slug: string;
  title: string;
  thumbnailUrl: string | null;
  price: number;
  level: string;
  totalLectures: number;
  totalDurationSeconds: number;
  updatedAt: Date;
  isLoggedIn: boolean;
  isEnrolled: boolean;
  firstLectureId: string | null;
};

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

export function EnrollCard(props: EnrollCardProps) {
  return (
    <Card className="overflow-hidden" data-testid="enroll-card">
      <div className="relative aspect-video w-full bg-surface-muted">
        {props.thumbnailUrl ? (
          <Image
            src={props.thumbnailUrl}
            alt={props.title}
            fill
            sizes="360px"
            className="object-cover"
          />
        ) : null}
      </div>
      <CardContent className="space-y-4 pt-6">
        <p className="text-2xl font-semibold" data-testid="enroll-price">
          {formatPrice(props.price)}
        </p>

        <EnrollButton
          courseId={props.courseId}
          slug={props.slug}
          price={props.price}
          isLoggedIn={props.isLoggedIn}
          isEnrolled={props.isEnrolled}
          firstLectureId={props.firstLectureId}
        />

        <dl className="space-y-2 border-t border-border pt-4 text-sm">
          <MetaRow label="Lectures" value={String(props.totalLectures)} />
          <MetaRow
            label="Duration"
            value={formatDuration(props.totalDurationSeconds)}
          />
          <MetaRow label="Level" value={props.level} />
          <MetaRow label="Last updated" value={formatDate(props.updatedAt)} />
        </dl>
      </CardContent>
    </Card>
  );
}
