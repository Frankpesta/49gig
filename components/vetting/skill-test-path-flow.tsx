"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CodeEditor } from "./code-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Code, FileQuestion, Loader2, CheckCircle2, ChevronLeft, ChevronRight, Play, Upload, Clock } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { ErrorHandler } from "./error-handler";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const SKILL_TEST_DURATION_MS = 30 * 60 * 1000; // 30 minutes

function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const LANGUAGES = [
  "javascript",
  "python",
  "typescript",
  "java",
  "cpp",
  "csharp",
  "go",
  "rust",
  "php",
  "ruby",
];

export function SkillTestPathFlow() {
  const { user } = useAuth();
  const userId = user?._id;

  const session = useQuery(
    api.vetting.queries.getSkillTestSession,
    userId ? { userId } : "skip"
  );

  const startSkillTest = useAction(api.vetting.skillTestSession.startSkillTest);
  const submitMcqAnswers = useMutation(api.vetting.mutations.submitMcqAnswers);
  const submitCodingSubmission = useMutation(api.vetting.mutations.submitCodingSubmission);
  const setSessionPortfolioScore = useMutation(api.vetting.mutations.setSessionPortfolioScore);
  const executeCoding = useAction(api.vetting.actions.executeCodingChallenge);
  const scorePortfolio = useAction(api.vetting.portfolioScoring.scorePortfolio);

  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Coding state
  const [codingIndex, setCodingIndex] = useState(0);
  const [code, setCode] = useState("");
  const [runResult, setRunResult] = useState<{ passed: number; total: number; results?: any[] } | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  const [submitCodingLoading, setSubmitCodingLoading] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState("javascript");

  // MCQ state
  const [mcqIndex, setMcqIndex] = useState(0);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [submitMcqLoading, setSubmitMcqLoading] = useState(false);

  // Portfolio state (for portfolio_mcq path)
  const [portfolioItems, setPortfolioItems] = useState<Array<{ title: string; description: string; url?: string }>>([
    { title: "", description: "" },
  ]);
  const [portfolioSubmitting, setPortfolioSubmitting] = useState(false);

  // 30-minute timer (all steps)
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number | null>(null);
  const [timeUp, setTimeUp] = useState(false);
  const autoSubmittedRef = useRef(false);
  useEffect(() => {
    if (!session?.expiresAt || session.status === "completed") return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((session.expiresAt! - Date.now()) / 1000));
      setTimeRemainingSeconds(remaining);
      if (remaining <= 0) setTimeUp(true);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session?.expiresAt, session?.status]);

  // Render timer bar for active steps (portfolio, coding, mcq)
  const showTimer =
    session &&
    session.status !== "completed" &&
    (session.status === "portfolio_review" || session.status === "coding" || session.status === "mcq");
  const timerBar =
    showTimer && timeRemainingSeconds !== null ? (
      <div
        className={`flex items-center justify-between rounded-lg border px-4 py-2 text-sm ${
          timeRemainingSeconds <= 60 ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30" : "bg-muted/50"
        }`}
      >
        <span className="flex items-center gap-2 font-medium">
          <Clock className="h-4 w-4" />
          Time remaining: {formatTimeRemaining(timeRemainingSeconds)}
        </span>
        <span className="text-muted-foreground">30 min total for all steps</span>
      </div>
    ) : null;

  const codingPrompts = useQuery(
    api.vetting.queries.getCodingPromptsForSession,
    session?.status === "coding" && session?._id && userId
      ? { sessionId: session._id, userId }
      : "skip"
  );

  const mcqQuestions = useQuery(
    api.vetting.queries.getMcqQuestionsForSession,
    session?.status === "mcq" && session?._id && userId
      ? { sessionId: session._id, userId }
      : "skip"
  );

  // Initialize code from prompt starterCode when prompt changes
  useEffect(() => {
    if (codingPrompts && codingPrompts.length > 0 && codingIndex < codingPrompts.length) {
      const p = codingPrompts[codingIndex];
      setCode(p.starterCode ?? "");
    }
  }, [codingPrompts, codingIndex]);

  // Auto-submit MCQ when time runs out (once)
  useEffect(() => {
    if (
      !userId ||
      !session ||
      session.status !== "mcq" ||
      !timeUp ||
      autoSubmittedRef.current ||
      !session._id
    )
      return;
    const answers = Object.entries(mcqAnswers).map(([questionId, selectedOptionIndex]) => ({
      questionId: questionId as Id<"vettingMcqQuestions">,
      selectedOptionIndex,
    }));
    if (answers.length === 0) return;
    autoSubmittedRef.current = true;
    submitMcqAnswers({ sessionId: session._id, answers, userId })
      .then(() => window.location.reload())
      .catch(() => {});
  }, [timeUp, session?.status, session?._id, mcqAnswers, userId, submitMcqAnswers]);

  if (!userId) return null;

  const handleStartTest = async () => {
    setError(null);
    setStarting(true);
    try {
      await startSkillTest({ userId });
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setStarting(false);
    }
  };

  // No session yet: show start button
  if (session === undefined) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Skill assessment</CardTitle>
          <CardDescription>
            Start the skill test. Questions are generated from your profile (category and skills).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ErrorHandler error={error} onRetry={handleStartTest} onDismiss={() => setError(null)} title="Error" />
          {error?.message?.includes("Complete your profile") && (
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/profile">Go to Profile to complete setup</Link>
            </Button>
          )}
          <Button onClick={handleStartTest} disabled={starting} className="w-full">
            {starting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting…
              </>
            ) : (
              "Start skill test"
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Portfolio step (portfolio_mcq path) — 30% of final score
  if (session.status === "portfolio_review" && session._id) {
    const handlePortfolioSubmit = async () => {
      const items = portfolioItems.filter((i) => i.title.trim() && i.description.trim());
      if (items.length === 0) {
        setError(new Error("Add at least one portfolio item with title and description."));
        return;
      }
      setPortfolioSubmitting(true);
      setError(null);
      try {
        const result = await scorePortfolio({
          portfolioItems: items.map((i) => ({
            title: i.title,
            description: i.description,
            url: i.url,
            category: session.categoryId ?? "data_analytics",
            tags: [],
          })),
          skillName: session.categoryId ?? "Skills",
          experienceLevel: session.experienceLevel ?? "mid",
        });
        await setSessionPortfolioScore({
          sessionId: session._id,
          portfolioScore: result.score,
          userId,
        });
        window.location.reload();
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setPortfolioSubmitting(false);
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Portfolio (30% of skill score)
          </CardTitle>
          <CardDescription>
            Add 1–5 portfolio items. They will be AI-assessed. Then you’ll take 50 MCQ (70% of score).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {timerBar}
          {timeUp && (
            <div className="rounded-lg border border-amber-500 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm font-medium text-amber-800 dark:text-amber-200">
              Time&apos;s up. Submit what you have to continue to MCQ, or your session may expire.
            </div>
          )}
          <ErrorHandler error={error} onRetry={() => setError(null)} onDismiss={() => setError(null)} title="Error" />
          {portfolioItems.map((item, idx) => (
            <div key={idx} className="space-y-2 rounded-lg border p-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Item {idx + 1}</span>
                {portfolioItems.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPortfolioItems((p) => p.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <Input
                placeholder="Title"
                value={item.title}
                onChange={(e) =>
                  setPortfolioItems((p) =>
                    p.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x))
                  )
                }
              />
              <Textarea
                placeholder="Description (role, tech, results)"
                value={item.description}
                onChange={(e) =>
                  setPortfolioItems((p) =>
                    p.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x))
                  )
                }
                rows={3}
              />
              <Input
                placeholder="URL (optional)"
                value={item.url ?? ""}
                onChange={(e) =>
                  setPortfolioItems((p) =>
                    p.map((x, i) => (i === idx ? { ...x, url: e.target.value || undefined } : x))
                  )
                }
              />
            </div>
          ))}
          {portfolioItems.length < 5 && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setPortfolioItems((p) => [...p, { title: "", description: "" }])}
            >
              Add item
            </Button>
          )}
          <Button
            onClick={handlePortfolioSubmit}
            disabled={portfolioSubmitting || timeUp}
            className="w-full"
          >
            {portfolioSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {timeUp ? "Time's up" : "Continue to MCQ"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Coding step
  if (session.status === "coding" && codingPrompts && codingPrompts.length > 0) {
    const prompt = codingPrompts[codingIndex];
    const isLast = codingIndex >= codingPrompts.length - 1;

    const handleRunCode = async () => {
      if (!prompt?.testCases || prompt.testCases.length === 0) {
        setError(new Error("No test cases for this challenge."));
        return;
      }
      setRunLoading(true);
      setError(null);
      try {
        const result = await executeCoding({
          code,
          language: codeLanguage,
          testCases: prompt.testCases,
        });
        setRunResult(result);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setRunLoading(false);
      }
    };

    const handleSubmitCoding = async () => {
      if (!session._id || !prompt) return;
      setSubmitCodingLoading(true);
      setError(null);
      try {
        await submitCodingSubmission({
          sessionId: session._id,
          promptId: prompt._id as Id<"vettingCodingPrompts">,
          code,
          runResult: runResult ?? undefined,
          userId,
        });
        setRunResult(null);
        setCode("");
        if (isLast) {
          setCodingIndex(0);
        } else {
          setCodingIndex((i) => i + 1);
        }
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setSubmitCodingLoading(false);
      }
    };

    return (
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Coding challenge {codingIndex + 1} of {codingPrompts.length}
              </CardTitle>
              <CardDescription>
                {session.selectedLanguage} · {session.experienceLevel}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {timerBar && <div className="px-4 pt-3">{timerBar}</div>}
          {timeUp && (
            <div className="mx-4 rounded-lg border border-amber-500 bg-amber-50 dark:bg-amber-950/30 px-4 py-2 text-sm font-medium text-amber-800 dark:text-amber-200">
              Time&apos;s up. Submit your current solution to continue.
            </div>
          )}
          <ErrorHandler error={error} onRetry={() => setError(null)} onDismiss={() => setError(null)} title="Error" />
          <div className="border-b bg-card px-4 py-4">
            <h3 className="font-semibold">{prompt.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{prompt.description}</p>
          </div>
          <div className="px-4 py-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase">Your solution</Label>
            <div className="mt-2">
              <Select value={codeLanguage} onValueChange={setCodeLanguage}>
                <SelectTrigger className="w-40 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <CodeEditor
              value={code}
              onChange={setCode}
              language={codeLanguage}
              height={320}
              className="mt-2 ring-1 ring-border rounded-md"
            />
          </div>
          <div className="flex items-center justify-between gap-2 border-t bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunCode}
                disabled={runLoading || !prompt.testCases?.length || timeUp}
              >
                {runLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Run tests
              </Button>
              {runResult && (
                <span className="text-sm text-muted-foreground">
                  {runResult.passed}/{runResult.total} passed
                </span>
              )}
            </div>
            <Button onClick={handleSubmitCoding} disabled={submitCodingLoading || timeUp}>
              {submitCodingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {timeUp ? "Time's up" : isLast ? "Finish coding & go to MCQ" : "Submit & next challenge"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // MCQ step (50 questions)
  if (session.status === "mcq" && mcqQuestions && mcqQuestions.length > 0) {
    const total = mcqQuestions.length;
    const current = mcqQuestions[mcqIndex];
    const answered = Object.keys(mcqAnswers).length;

    const handleSubmitMcq = async () => {
      if (!session._id) return;
      setSubmitMcqLoading(true);
      setError(null);
      try {
        const answers = Object.entries(mcqAnswers).map(([questionId, selectedOptionIndex]) => ({
          questionId: questionId as Id<"vettingMcqQuestions">,
          selectedOptionIndex,
        }));
        await submitMcqAnswers({
          sessionId: session._id,
          answers,
          userId,
        });
        window.location.reload();
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setSubmitMcqLoading(false);
      }
    };

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileQuestion className="h-5 w-5" />
                Multiple choice (50 questions)
              </CardTitle>
              <CardDescription>
                Question {mcqIndex + 1} of {total} · {answered} answered
              </CardDescription>
            </div>
          </div>
          {timerBar}
          <Progress value={(answered / total) * 100} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {timeUp && (
            <div className="rounded-lg border border-amber-500 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm font-medium text-amber-800 dark:text-amber-200">
              Time&apos;s up. Your answers are being submitted automatically.
            </div>
          )}
          <ErrorHandler error={error} onRetry={() => setError(null)} onDismiss={() => setError(null)} title="Error" />
          <div className="space-y-4">
            <p className="font-medium">{current.questionText}</p>
            <div className="space-y-2">
              {current.options.map((opt: string, optIndex: number) => (
                <label
                  key={optIndex}
                  className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border hover:bg-muted/50 ${mcqAnswers[current._id] === optIndex ? "border-primary bg-primary/5" : ""}`}
                >
                  <input
                    type="radio"
                    name={current._id}
                    checked={mcqAnswers[current._id] === optIndex}
                    onChange={() =>
                      setMcqAnswers((prev) => ({ ...prev, [current._id]: optIndex }))
                    }
                    className="w-4 h-4"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMcqIndex((i) => Math.max(0, i - 1))}
                disabled={mcqIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMcqIndex((i) => Math.min(total - 1, i + 1))}
                disabled={mcqIndex === total - 1}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={handleSubmitMcq}
              disabled={answered < total || submitMcqLoading || timeUp}
            >
              {submitMcqLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {timeUp ? "Time's up" : "Submit assessment"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Completed
  if (session.status === "completed") {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="py-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <div>
              <p className="font-semibold">Skill test complete</p>
              <p className="text-sm text-muted-foreground">
                {session.mcqScore != null ? `Your score: ${session.mcqScore}%` : "You can submit verification below."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading coding or mcq data
  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </CardContent>
    </Card>
  );
}
