"use client";

import { Check, RotateCcw, X } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heading, Text } from "@/components/ui/typography";
import type { QuizResult } from "@/server/services/quiz";
import { cn } from "@/lib/utils";

function OptionRow({
  text,
  isCorrect,
  isSelected,
}: {
  text: string;
  isCorrect: boolean;
  isSelected: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border p-2 text-sm",
        isCorrect
          ? "border-success/40 bg-success/10"
          : isSelected
            ? "border-destructive/40 bg-destructive/10"
            : "border-border",
      )}
    >
      {isCorrect ? (
        <Check className="h-4 w-4 shrink-0 text-success" />
      ) : isSelected ? (
        <X className="h-4 w-4 shrink-0 text-destructive" />
      ) : (
        <span className="h-4 w-4 shrink-0" />
      )}
      <span>{text}</span>
      {isSelected ? (
        <span className="ml-auto text-xs text-muted-foreground">
          jawabanmu
        </span>
      ) : null}
    </div>
  );
}

export function QuizResultView({
  result,
  onRetry,
  retrying,
  nextHref,
}: {
  result: QuizResult;
  onRetry: () => void;
  retrying: boolean;
  nextHref: string | null;
}) {
  return (
    <div className="space-y-6" data-testid="quiz-result">
      <div className="space-y-3 rounded-lg border border-border p-6 text-center">
        <Text variant="muted" as="span">
          Skor kamu
        </Text>
        <p className="text-5xl font-bold tracking-tight" data-testid="quiz-score">
          {result.score}%
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge
            variant={result.passed ? "default" : "destructive"}
            data-testid="quiz-passed-badge"
            data-passed={result.passed}
          >
            {result.passed ? "Lulus" : "Belum Lulus"}
          </Badge>
          <Text variant="muted" as="span">
            {result.correctCount} dari {result.total} benar · passing{" "}
            {result.passingScore}%
          </Text>
        </div>
        {result.late ? (
          <Text variant="muted" as="span">
            Catatan: jawaban dikirim setelah waktu habis.
          </Text>
        ) : null}
      </div>

      <div className="space-y-4">
        <Heading as="h3" level="h4">
          Review
        </Heading>
        {result.review.map((item, i) => (
          <div
            key={item.questionId}
            className="space-y-3 rounded-lg border border-border p-4"
            data-testid="quiz-review-item"
            data-correct={item.isCorrect}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">
                {i + 1}. {item.question}
              </p>
              <Badge variant={item.isCorrect ? "default" : "destructive"}>
                {item.isCorrect ? "Benar" : "Salah"}
              </Badge>
            </div>
            <div className="space-y-2">
              {item.options.map((option) => (
                <OptionRow
                  key={option.id}
                  text={option.text}
                  isCorrect={item.correctAnswerIds.includes(option.id)}
                  isSelected={item.selectedIds.includes(option.id)}
                />
              ))}
            </div>
            {item.explanation ? (
              <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                {item.explanation}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          disabled={retrying}
          data-testid="retry-quiz-button"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Coba Lagi
        </Button>
        {nextHref ? (
          <Button asChild data-testid="quiz-next-lecture">
            <Link href={nextHref}>Lanjut</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
