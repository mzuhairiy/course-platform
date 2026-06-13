import { describe, expect, it } from "vitest";

import { gradeQuiz } from "@/lib/quiz";

const QUESTIONS = [
  { id: "q1", correctAnswerIds: ["a"] }, // single answer
  { id: "q2", correctAnswerIds: ["a", "c"] }, // multi answer
  { id: "q3", correctAnswerIds: ["true"] }, // true/false
];

describe("gradeQuiz", () => {
  it("scores 100% and counts every question when all are correct", () => {
    const result = gradeQuiz(QUESTIONS, [
      { questionId: "q1", selectedIds: ["a"] },
      { questionId: "q2", selectedIds: ["a", "c"] },
      { questionId: "q3", selectedIds: ["true"] },
    ]);

    expect(result.score).toBe(100);
    expect(result.correctCount).toBe(3);
    expect(result.total).toBe(3);
    expect(result.perQuestion.every((p) => p.isCorrect)).toBe(true);
  });

  it("computes a partial score (rounded) for a partial answer set", () => {
    const result = gradeQuiz(QUESTIONS, [
      { questionId: "q1", selectedIds: ["a"] }, // correct
      { questionId: "q2", selectedIds: ["a"] }, // missing one → wrong
      { questionId: "q3", selectedIds: ["false"] }, // wrong
    ]);

    // 1 of 3 correct → 33%.
    expect(result.correctCount).toBe(1);
    expect(result.score).toBe(33);
  });

  it("is all-or-nothing: a multi-answer question missing one option is wrong", () => {
    const result = gradeQuiz(
      [{ id: "q2", correctAnswerIds: ["a", "c"] }],
      [{ questionId: "q2", selectedIds: ["a"] }],
    );
    expect(result.perQuestion[0].isCorrect).toBe(false);
    expect(result.score).toBe(0);
  });

  it("is all-or-nothing: extra selected option is also wrong", () => {
    const result = gradeQuiz(
      [{ id: "q2", correctAnswerIds: ["a", "c"] }],
      [{ questionId: "q2", selectedIds: ["a", "b", "c"] }],
    );
    expect(result.perQuestion[0].isCorrect).toBe(false);
  });

  it("ignores selection order", () => {
    const result = gradeQuiz(
      [{ id: "q2", correctAnswerIds: ["a", "c"] }],
      [{ questionId: "q2", selectedIds: ["c", "a"] }],
    );
    expect(result.perQuestion[0].isCorrect).toBe(true);
  });

  it("scores 0% when no answers are submitted", () => {
    const result = gradeQuiz(QUESTIONS, []);
    expect(result.score).toBe(0);
    expect(result.correctCount).toBe(0);
    expect(result.perQuestion.every((p) => !p.isCorrect)).toBe(true);
  });
});
