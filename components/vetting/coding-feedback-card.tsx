"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, ChevronDown, CheckCircle2, AlertTriangle } from "lucide-react";

export type CodingFeedbackChallenge = {
  title: string;
  passedCases: number;
  totalCases: number;
  failureTypes?: string[];
  coaching: string;
};

export type CodingFeedback = {
  generatedAt: number;
  attemptRound: number;
  isFinal: boolean;
  overallSummary: string;
  challenges: CodingFeedbackChallenge[];
};

/**
 * Shows AI coaching feedback after a coding-test failure. Never reveals expected
 * outputs — only how many cases passed and constructive guidance on what to improve.
 */
export function CodingFeedbackCard({ feedback }: { feedback: CodingFeedback }) {
  const [open, setOpen] = useState(true);

  if (!feedback?.challenges?.length) return null;

  return (
    <Card className="rounded-xl border-amber-500/40 bg-amber-50/60 dark:bg-amber-950/20">
      <CardContent className="p-4 sm:p-5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-start justify-between gap-3 text-left"
          aria-expanded={open}
        >
          <span className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
              <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </span>
            <span>
              <span className="block font-semibold text-foreground">
                Feedback on your coding test
              </span>
              <span className="mt-0.5 block text-sm text-muted-foreground leading-relaxed">
                {feedback.overallSummary}
              </span>
            </span>
          </span>
          <ChevronDown
            className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="mt-4 space-y-3">
            {feedback.challenges.map((c, i) => {
              const allPassed = c.totalCases > 0 && c.passedCases === c.totalCases;
              return (
                <div
                  key={i}
                  className="rounded-lg border border-border/80 bg-background/80 p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm text-foreground">{c.title}</p>
                    <span
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        allPassed
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {allPassed ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      )}
                      {c.totalCases > 0
                        ? `${c.passedCases}/${c.totalCases} tests`
                        : "Did not pass"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {c.coaching}
                  </p>
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground">
              This feedback is meant to help you improve. It never reveals the expected test
              answers.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
