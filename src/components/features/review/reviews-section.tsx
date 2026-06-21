import { ReviewForm } from "@/components/features/review/review-form";
import { StarRating } from "@/components/features/review/star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heading, Text } from "@/components/ui/typography";
import { formatDate } from "@/lib/format";
import { getInitials } from "@/lib/utils";
import type { CourseReview, RatingSummary } from "@/server/services/review";

export function ReviewsSection({
  courseId,
  courseSlug,
  summary,
  reviews,
  canReview,
  userReview,
}: {
  courseId: string;
  courseSlug: string;
  summary: RatingSummary;
  reviews: CourseReview[];
  /** Enrolled users may post/edit a review. */
  canReview: boolean;
  userReview?: { rating: number; comment: string | null } | null;
}) {
  return (
    <section className="space-y-4" data-testid="reviews-section">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Heading as="h2" level="h3">
          Reviews
        </Heading>
        {summary.count > 0 ? (
          <div className="flex items-center gap-2" data-testid="rating-summary">
            <StarRating value={summary.average} />
            <span className="text-sm font-medium" data-testid="rating-average">
              {summary.average.toFixed(1)}
            </span>
            <Text variant="muted" as="span" className="text-sm">
              ({summary.count} review{summary.count === 1 ? "" : "s"})
            </Text>
          </div>
        ) : (
          <Text variant="muted" as="span" className="text-sm">
            Belum ada review
          </Text>
        )}
      </div>

      {canReview ? (
        <ReviewForm
          courseId={courseId}
          courseSlug={courseSlug}
          existing={userReview}
        />
      ) : null}

      {reviews.length > 0 ? (
        <ul className="space-y-4" data-testid="review-list">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="space-y-1 border-b border-border pb-4 last:border-0"
              data-testid="review-item"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  {review.user.image ? (
                    <AvatarImage src={review.user.image} alt="" />
                  ) : null}
                  <AvatarFallback>
                    {getInitials(review.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {review.user.name ?? "Student"}
                  </p>
                  <StarRating value={review.rating} size={12} />
                </div>
                <Text variant="muted" as="span" className="text-xs">
                  {formatDate(review.createdAt)}
                </Text>
              </div>
              {review.comment ? (
                <p className="pl-11 text-sm">{review.comment}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
