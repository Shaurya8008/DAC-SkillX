"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Question = { question: string; options: string[] };
type QuizPayload = { skill: string; token: string; questions: Question[] };
type GradeResult = { correct: number; total: number; score: number; passed: boolean };

export function SkillQuiz({ skill, onClose, onVerified }: { skill: string; onClose: () => void; onVerified: () => void }) {
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<GradeResult | null>(null);

  const { data: quiz, isLoading } = useQuery<QuizPayload>({
    queryKey: ["quiz", skill],
    queryFn: async () => {
      const res = await fetch(`/api/quiz?skill=${encodeURIComponent(skill)}`);
      if (!res.ok) throw new Error("Failed to load quiz");
      return res.json();
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!quiz) throw new Error("Quiz not loaded");
      const res = await fetch("/api/profile/verify-skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill, answers, token: quiz.token }),
      });
      if (!res.ok) throw new Error("Failed to grade quiz");
      return res.json() as Promise<GradeResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.passed) onVerified();
    },
  });

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="text-base">Diagnostic quiz — {skill}</CardTitle>
        <CardDescription>5 questions. Score 60%+ to get this skill verified.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading questions…</p>}

        {quiz?.questions.map((q, qi) => (
          <div key={qi} className="space-y-2">
            <p className="text-sm font-medium">
              {qi + 1}. {q.question}
            </p>
            <div className="flex flex-col gap-1.5">
              {q.options.map((opt, oi) => (
                <button
                  key={oi}
                  type="button"
                  disabled={!!result}
                  onClick={() =>
                    setAnswers((prev) => {
                      const next = [...prev];
                      next[qi] = oi;
                      return next;
                    })
                  }
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-left text-sm transition-colors",
                    answers[qi] === oi ? "border-primary bg-primary/10" : "border-input hover:bg-muted"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}

        {result ? (
          <div className="space-y-2">
            <p className={cn("text-sm font-medium", result.passed ? "text-primary" : "text-destructive")}>
              {result.correct}/{result.total} correct — {result.passed ? "Skill verified!" : "Not verified this time."}
            </p>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={() => submit.mutate()}
              disabled={submit.isPending || !quiz || answers.length !== quiz.questions.length}
            >
              {submit.isPending ? "Grading…" : "Submit answers"}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
