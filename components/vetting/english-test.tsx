"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  getBrowserFingerprint,
  getClientIP,
  generateSessionId,
} from "@/lib/browser-fingerprint";
import { handleApiCall, getUserFriendlyError } from "@/lib/error-handling";
import { ErrorHandler } from "./error-handler";

interface EnglishTestProps {
  onComplete?: () => void;
}

type TestPhase = "grammar" | "comprehension" | "written" | "completed";

export function EnglishTest({ onComplete }: EnglishTestProps) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<TestPhase>("grammar");
  const [sessionId, setSessionId] = useState<string>("");
  const [startTime, setStartTime] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [suspiciousActivities, setSuspiciousActivities] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Grammar test state
  const [grammarQuestions, setGrammarQuestions] = useState<any[]>([]);
  const [grammarAnswers, setGrammarAnswers] = useState<Record<string, number>>({});
  const [grammarScore, setGrammarScore] = useState<number | null>(null);

  // Comprehension test state
  const [comprehensionPassage, setComprehensionPassage] = useState<any | null>(null);
  const [comprehensionAnswers, setComprehensionAnswers] = useState<Record<string, number>>({});
  const [comprehensionScore, setComprehensionScore] = useState<number | null>(null);

  // Written response state
  const [writtenResponse, setWrittenResponse] = useState<string>("");
  const [wordCount, setWordCount] = useState<number>(0);

  const getGrammarQuestions = useQuery(
    api.vetting.questions.getEnglishGrammarQuestions,
    phase === "grammar" && sessionId
      ? { count: 20, excludeIds: [] }
      : "skip"
  );

  const getComprehension = useQuery(
    api.vetting.questions.getEnglishComprehension,
    phase === "comprehension" && sessionId ? {} : "skip"
  );

  const submitEnglish = useMutation(api.vetting.mutations.submitEnglishProficiency);
  const trackActivity = useMutation(api.vetting.testSessions.trackTestActivity);
  const createSession = useMutation(api.vetting.testSessions.createTestSession);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fullscreenRef = useRef<boolean>(false);

  // Initialize test session
  useEffect(() => {
    if (phase === "grammar" && !sessionId && user?._id) {
      const initializeSession = async () => {
        try {
          const [fingerprint, ipAddress] = await Promise.all([
            getBrowserFingerprint(),
            getClientIP(),
          ]);
          
          const session = await createSession({
            testType: "english_grammar",
            browserFingerprint: fingerprint,
            ipAddress,
            userId: user._id,
          });
          
          setSessionId(session.sessionId);
          setStartTime(Date.now());
          setTimeRemaining(30 * 60); // 30 minutes for grammar

          // Request fullscreen
          requestFullscreen();
        } catch (error) {
          console.error("Failed to create test session:", error);
        }
      };
      
      initializeSession();
    }
  }, [phase, sessionId, user?._id, createSession]);

  // Load grammar questions
  useEffect(() => {
    if (getGrammarQuestions) {
      setGrammarQuestions(getGrammarQuestions);
    }
  }, [getGrammarQuestions]);

  // Load comprehension
  useEffect(() => {
    if (getComprehension) {
      setComprehensionPassage(getComprehension);
      if (phase === "comprehension") {
        setTimeRemaining(20 * 60); // 20 minutes for comprehension
      }
    }
  }, [getComprehension, phase]);

  // Timer
  useEffect(() => {
    if (timeRemaining > 0 && phase !== "completed") {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [timeRemaining, phase]);

  // Proctoring: Detect tab/window switches
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackSuspiciousActivity("tab_switch");
      }
    };

    const handleBlur = () => {
      trackSuspiciousActivity("window_blur");
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      trackSuspiciousActivity("copy_attempt");
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      trackSuspiciousActivity("paste_attempt");
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      trackSuspiciousActivity("right_click");
    };

    const handleFullscreenChange = () => {
      const isFull = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );
      setIsFullscreen(isFull);
      if (!isFull && phase !== "completed") {
        trackSuspiciousActivity("fullscreen_exit");
        // Re-request fullscreen
        setTimeout(() => requestFullscreen(), 100);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
    };
  }, [phase]);

  const requestFullscreen = async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      }
      setIsFullscreen(true);
    } catch (error) {
      console.error("Failed to enter fullscreen:", error);
    }
  };

  const trackSuspiciousActivity = async (activity: string) => {
    if (!suspiciousActivities.includes(activity)) {
      setSuspiciousActivities((prev) => [...prev, activity]);
      try {
        await trackActivity({
          sessionId,
          activity: activity as any,
          timestamp: Date.now(),
          userId: user?._id,
        });
      } catch (error) {
        console.error("Failed to track activity:", error);
      }
    }
  };

  const handleTimeUp = () => {
    if (phase === "grammar") {
      handleGrammarSubmit();
    } else if (phase === "comprehension") {
      handleComprehensionSubmit();
    } else if (phase === "written") {
      handleWrittenSubmit();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleGrammarSubmit = async () => {
    // Calculate score (in production, this would be done server-side)
    let correct = 0;
    grammarQuestions.forEach((q) => {
      if (grammarAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    const score = Math.round((correct / grammarQuestions.length) * 100);
    setGrammarScore(score);

    // Move to comprehension
    setPhase("comprehension");
    setTimeRemaining(20 * 60);
  };

  const handleComprehensionSubmit = async () => {
    // Calculate score
    let correct = 0;
    if (comprehensionPassage) {
      comprehensionPassage.questions.forEach((q: any) => {
        if (comprehensionAnswers[q.id] === q.correctAnswer) {
          correct++;
        }
      });
      const score = Math.round(
        (correct / comprehensionPassage.questions.length) * 100
      );
      setComprehensionScore(score);
    }

    // Move to written
    setPhase("written");
    setTimeRemaining(15 * 60); // 15 minutes for written
  };

  const handleWrittenSubmit = async () => {
    if (writtenResponse.trim().length < 100) {
      alert("Please write at least 100 words");
      return;
    }

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      const [fingerprint, ipAddress] = await Promise.all([
        getBrowserFingerprint(),
        getClientIP(),
      ]);

      await submitEnglish({
        grammarScore: grammarScore || 0,
        comprehensionScore: comprehensionScore || 0,
        writtenResponse,
        timeSpent,
        testSessionId: sessionId,
        browserFingerprint: fingerprint,
        ipAddress,
        userId: user?._id,
      });

      setPhase("completed");
      if (onComplete) {
        onComplete();
      }
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    }
  };

  const handleRetry = () => {
    setError(null);
    if (writtenResponse.trim().length >= 100) {
      handleWrittenSubmit();
    }
  };

  // Update word count
  useEffect(() => {
    const words = writtenResponse.trim().split(/\s+/).filter((w) => w.length > 0);
    setWordCount(words.length);
  }, [writtenResponse]);

  if (phase === "grammar") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Grammar Test</CardTitle>
              <CardDescription>Answer 20 grammar questions</CardDescription>
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
            title="Test Submission Error"
          />
          {suspiciousActivities.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Suspicious activity detected. Multiple violations may result in test
                disqualification.
              </AlertDescription>
            </Alert>
          )}

          <Progress
            value={
              (Object.keys(grammarAnswers).length / grammarQuestions.length) * 100
            }
          />

          <div className="space-y-6">
            {grammarQuestions.map((question, index) => (
              <div key={question.id} className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="font-semibold">{index + 1}.</span>
                  <p className="flex-1">{question.question}</p>
                </div>
                <RadioGroup
                  value={grammarAnswers[question.id]?.toString()}
                  onValueChange={(value) =>
                    setGrammarAnswers({
                      ...grammarAnswers,
                      [question.id]: parseInt(value),
                    })
                  }
                >
                  {question.options.map((option: string, optIndex: number) => (
                    <div key={optIndex} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={optIndex.toString()}
                        id={`${question.id}_${optIndex}`}
                      />
                      <Label
                        htmlFor={`${question.id}_${optIndex}`}
                        className="cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </div>

          <Button
            onClick={handleGrammarSubmit}
            disabled={Object.keys(grammarAnswers).length < grammarQuestions.length}
            className="w-full"
          >
            Submit Grammar Test
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === "comprehension") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reading Comprehension</CardTitle>
              <CardDescription>Read the passage and answer questions</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {comprehensionPassage && (
            <>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{comprehensionPassage.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {comprehensionPassage.wordCount} words
                  </p>
                </div>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line">{comprehensionPassage.passage}</p>
                </div>
              </div>

              <div className="space-y-6">
                {comprehensionPassage.questions.map((question: any, index: number) => (
                  <div key={question.id} className="space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold">{index + 1}.</span>
                      <p className="flex-1">{question.question}</p>
                    </div>
                    <RadioGroup
                      value={comprehensionAnswers[question.id]?.toString()}
                      onValueChange={(value) =>
                        setComprehensionAnswers({
                          ...comprehensionAnswers,
                          [question.id]: parseInt(value),
                        })
                      }
                    >
                      {question.options.map((option: string, optIndex: number) => (
                        <div key={optIndex} className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={optIndex.toString()}
                            id={`${question.id}_${optIndex}`}
                          />
                          <Label
                            htmlFor={`${question.id}_${optIndex}`}
                            className="cursor-pointer"
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleComprehensionSubmit}
                disabled={
                  Object.keys(comprehensionAnswers).length <
                  comprehensionPassage.questions.length
                }
                className="w-full"
              >
                Submit Comprehension Test
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  if (phase === "written") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Written Response</CardTitle>
              <CardDescription>
                Write a response to the prompt (minimum 100 words)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Prompt:</Label>
            <p className="text-sm text-muted-foreground">
              Describe a challenging project you worked on and how you overcame the
              obstacles. Explain what you learned from the experience and how it has
              influenced your approach to work.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="writtenResponse">Your Response:</Label>
              <span
                className={`text-sm ${
                  wordCount < 100 ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {wordCount} words {wordCount < 100 && "(minimum 100)"}
              </span>
            </div>
            <Textarea
              id="writtenResponse"
              value={writtenResponse}
              onChange={(e) => setWrittenResponse(e.target.value)}
              rows={12}
              placeholder="Write your response here..."
              className="resize-none"
            />
          </div>

          <Button
            onClick={handleWrittenSubmit}
            disabled={wordCount < 100}
            className="w-full"
          >
            Submit Written Response
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === "completed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            English Test Completed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Grammar Score:</p>
              <p className="text-2xl font-bold">{grammarScore}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Comprehension Score:</p>
              <p className="text-2xl font-bold">{comprehensionScore}%</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Your written response is being graded by AI. You will receive your final
              English proficiency score shortly.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
