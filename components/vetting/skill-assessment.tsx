"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Clock, Upload, Code, FileText, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  getBrowserFingerprint,
  getClientIP,
  generateSessionId,
} from "@/lib/browser-fingerprint";
import { handleApiCall, getUserFriendlyError } from "@/lib/error-handling";
import { ErrorHandler } from "./error-handler";
import { getCodingChallenge } from "@/convex/vetting/skillTestComplexity";

interface SkillAssessmentProps {
  skillName: string;
  experienceLevel: "junior" | "mid" | "senior" | "expert";
  assessmentType: "mcq" | "coding" | "portfolio";
  onComplete?: (score: number) => void;
}

export function SkillAssessment({
  skillName,
  experienceLevel,
  assessmentType,
  onComplete,
}: SkillAssessmentProps) {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);

  // MCQ state
  const [mcqQuestions, setMcqQuestions] = useState<any[]>([]);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});

  // Coding state
  const [codingChallenge, setCodingChallenge] = useState<any | null>(null);
  const [code, setCode] = useState<string>("");
  const [testResults, setTestResults] = useState<any[]>([]);

  // Portfolio state
  const [portfolioItems, setPortfolioItems] = useState<
    Array<{
      title: string;
      description: string;
      url?: string;
      file?: File;
    }>
  >([]);

  const getMCQQuestions = useQuery(
    api.vetting.questions.getSkillMCQQuestions,
    assessmentType === "mcq" && sessionId
      ? {
          skillName,
          experienceLevel,
          count: 15,
          excludeIds: [],
        }
      : "skip"
  );

  const submitSkillAssessment = useMutation(
    api.vetting.mutations.submitSkillAssessment
  );
  const executeCoding = useAction(api.vetting.actions.executeCodingChallenge);
  const scorePortfolio = useAction(api.vetting.portfolioScoring.scorePortfolio);
  const createSession = useMutation(api.vetting.testSessions.createTestSession);

  useEffect(() => {
    if (!sessionId && user?._id) {
      const initializeSession = async () => {
        try {
          const [fingerprint, ipAddress] = await Promise.all([
            getBrowserFingerprint(),
            getClientIP(),
          ]);

          const testTypeMap: Record<string, "skill_mcq" | "skill_coding" | "skill_portfolio"> = {
            mcq: "skill_mcq",
            coding: "skill_coding",
            portfolio: "skill_portfolio",
          };

          const session = await createSession({
            testType: testTypeMap[assessmentType],
            skillName,
            experienceLevel,
            browserFingerprint: fingerprint,
            ipAddress,
            userId: user._id,
          });

          setSessionId(session.sessionId);
          setStartTime(Date.now());

          // Set time limit based on assessment type and experience level
          if (assessmentType === "mcq") {
            const limits: Record<string, number> = {
              junior: 30 * 60,
              mid: 40 * 60,
              senior: 50 * 60,
              expert: 60 * 60,
            };
            setTimeRemaining(limits[experienceLevel] || 40 * 60);
          } else if (assessmentType === "coding") {
            const limits: Record<string, number> = {
              junior: 60 * 60,
              mid: 90 * 60,
              senior: 120 * 60,
              expert: 180 * 60,
            };
            setTimeRemaining(limits[experienceLevel] || 90 * 60);
          } else {
            setTimeRemaining(60 * 60); // 1 hour for portfolio
          }

          // Load coding challenge if needed
          if (assessmentType === "coding") {
            // Import and use the complexity system
            const { getCodingChallenge } = await import("@/convex/vetting/skillTestComplexity");
            const challenge = getCodingChallenge(experienceLevel, skillName);
            setCodingChallenge(challenge);
          }
        } catch (error) {
          console.error("Failed to create test session:", error);
        }
      };

      initializeSession();
    }
  }, [sessionId, assessmentType, experienceLevel, skillName, user?._id, createSession]);

  useEffect(() => {
    if (getMCQQuestions) {
      setMcqQuestions(getMCQQuestions);
    }
  }, [getMCQQuestions]);

  // Timer
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      const [fingerprint, ipAddress] = await Promise.all([
        getBrowserFingerprint(),
        getClientIP(),
      ]);

      if (assessmentType === "mcq") {
        // Calculate score
        let correct = 0;
        mcqQuestions.forEach((q) => {
          if (mcqAnswers[q.id] === q.correctAnswer) {
            correct++;
          }
        });
        const score = Math.round((correct / mcqQuestions.length) * 100);

        await submitSkillAssessment({
          skillId: `skill_${skillName}`,
          skillName,
          assessmentType: "mcq",
          score,
          timeSpent,
          testSessionId: sessionId,
          browserFingerprint: fingerprint,
          ipAddress,
          userId: user?._id,
        });

        if (onComplete) {
          onComplete(score);
        }
      } else if (assessmentType === "coding") {
        // Execute code and calculate score
        if (codingChallenge) {
          const results = await executeCoding({
            code,
            language: "javascript", // Would be determined by skill
            testCases: codingChallenge.testCases,
          });

          const score = Math.round(
            (results.passed / results.total) * 100
          );
          setTestResults(results.results);

          await handleApiCall(
            () =>
              submitSkillAssessment({
                skillId: `skill_${skillName}`,
                skillName,
                assessmentType: "coding",
                score,
                timeSpent,
                testSessionId: sessionId,
                codeSubmissions: [
                  {
                    code,
                    submittedAt: Date.now(),
                    testResults: results,
                  },
                ],
                browserFingerprint: fingerprint,
                ipAddress,
                userId: user?._id,
              }),
            {
              maxRetries: 2,
              retryDelay: 1000,
            }
          );

          if (onComplete) {
            onComplete(score);
          }
        }
      } else if (assessmentType === "portfolio") {
        // Score portfolio with AI (using action via mutation wrapper)
        const portfolioData = portfolioItems.map((item) => ({
          title: item.title,
          description: item.description,
          url: item.url,
          category: skillName.toLowerCase(),
          tags: [],
        }));

        // Score portfolio with AI using action with retry logic
        const portfolioScore = await handleApiCall(
          () =>
            scorePortfolio({
              portfolioItems: portfolioData,
              skillName,
              experienceLevel,
            }),
          {
            maxRetries: 2,
            retryDelay: 3000,
            exponentialBackoff: true,
          }
        );

        await handleApiCall(
          () =>
            submitSkillAssessment({
              skillId: `skill_${skillName}`,
              skillName,
              assessmentType: "portfolio",
              score: portfolioScore.score,
              timeSpent,
              testSessionId: sessionId,
              details: {
                portfolioItems: portfolioData,
                breakdown: portfolioScore.breakdown,
              },
              browserFingerprint: fingerprint,
              ipAddress,
              userId: user?._id,
            }),
          {
            maxRetries: 2,
            retryDelay: 1000,
          }
        );

        if (onComplete) {
          onComplete(portfolioScore.score);
        }
      }
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleSubmit();
  };

  const addPortfolioItem = () => {
    setPortfolioItems([
      ...portfolioItems,
      { title: "", description: "" },
    ]);
  };

  const removePortfolioItem = (index: number) => {
    setPortfolioItems(portfolioItems.filter((_, i) => i !== index));
  };

  const updatePortfolioItem = (
    index: number,
    field: "title" | "description" | "url",
    value: string
  ) => {
    const updated = [...portfolioItems];
    updated[index] = { ...updated[index], [field]: value };
    setPortfolioItems(updated);
  };

  if (assessmentType === "mcq") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{skillName} - MCQ Assessment</CardTitle>
              <CardDescription>
                Answer {mcqQuestions.length} questions ({experienceLevel} level)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ErrorHandler
            error={error}
            onRetry={handleRetry}
            onDismiss={() => setError(null)}
            title="Assessment Error"
          />
          <Progress
            value={(Object.keys(mcqAnswers).length / mcqQuestions.length) * 100}
          />

          <div className="space-y-6">
            {mcqQuestions.map((question, index) => (
              <div key={question.id} className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="font-semibold">{index + 1}.</span>
                  <p className="flex-1">{question.question}</p>
                </div>
                <div className="space-y-2">
                  {question.options.map((option: string, optIndex: number) => (
                    <label
                      key={optIndex}
                      className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-muted"
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={optIndex}
                        checked={mcqAnswers[question.id] === optIndex}
                        onChange={() =>
                          setMcqAnswers({
                            ...mcqAnswers,
                            [question.id]: optIndex,
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={Object.keys(mcqAnswers).length < mcqQuestions.length}
            className="w-full"
          >
            Submit Assessment
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (assessmentType === "coding") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{skillName} - Coding Challenge</CardTitle>
              <CardDescription>
                Complete the coding challenge ({experienceLevel} level)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ErrorHandler
            error={error}
            onRetry={handleRetry}
            onDismiss={() => setError(null)}
            title="Coding Challenge Error"
          />
          {codingChallenge && (
            <>
              <div className="space-y-2">
                <h3 className="font-semibold">{codingChallenge.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {codingChallenge.description}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Your Solution:</Label>
                <Textarea
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                  placeholder="Write your code here..."
                />
              </div>

              {testResults.length > 0 && (
                <div className="space-y-2">
                  <Label>Test Results:</Label>
                  <div className="space-y-2">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded border ${
                          result.passed
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {result.passed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Code className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-semibold">
                            Test {index + 1}: {result.passed ? "Passed" : "Failed"}
                          </span>
                        </div>
                        {!result.passed && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <p>Expected: {result.expectedOutput}</p>
                            <p>Got: {result.actualOutput}</p>
                            {result.error && <p className="text-red-600">{result.error}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (codingChallenge) {
                      const results = await executeCoding({
                        code,
                        language: "javascript",
                        testCases: codingChallenge.testCases,
                      });
                      setTestResults(results.results);
                    }
                  }}
                >
                  Run Tests
                </Button>
                <Button onClick={handleSubmit} className="flex-1">
                  Submit Solution
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  if (assessmentType === "portfolio") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{skillName} - Portfolio Assessment</CardTitle>
              <CardDescription>
                Upload your portfolio items for AI evaluation ({experienceLevel} level)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ErrorHandler
            error={error}
            onRetry={handleRetry}
            onDismiss={() => setError(null)}
            title="Portfolio Upload Error"
          />
          <div className="space-y-4">
            {portfolioItems.map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Portfolio Item {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePortfolioItem(index)}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      value={item.title}
                      onChange={(e) =>
                        updatePortfolioItem(index, "title", e.target.value)
                      }
                      placeholder="Project title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea
                      value={item.description}
                      onChange={(e) =>
                        updatePortfolioItem(index, "description", e.target.value)
                      }
                      placeholder="Describe the project, your role, technologies used, and results achieved"
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL (optional)</Label>
                    <Input
                      value={item.url || ""}
                      onChange={(e) =>
                        updatePortfolioItem(index, "url", e.target.value)
                      }
                      placeholder="https://example.com/project"
                      type="url"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>File Upload (optional)</Label>
                    <Input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const updated = [...portfolioItems];
                          updated[index] = { ...updated[index], file };
                          setPortfolioItems(updated);
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button variant="outline" onClick={addPortfolioItem} className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            Add Portfolio Item
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={portfolioItems.length === 0 || portfolioItems.some((item) => !item.title || !item.description)}
            className="w-full"
          >
            Submit Portfolio
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
