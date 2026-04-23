"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Clock, AlertCircle, Loader2, Mail } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { EnglishTest } from "@/components/vetting/english-test";
import { SkillTestPathFlow } from "@/components/vetting/skill-test-path-flow";
import { KycStep } from "@/components/vetting/kyc-step";
import { useRouter } from "next/navigation";

/** Matches backend copy when weighted score stays below threshold after all attempts (see completeVerification). */
const WEIGHTED_FAILURE_RESUME_COPY =
  "Unfortunately you did not meet our minimum weighted score (50% across English and skills) after completing every attempt. You cannot join 49GIG as a freelancer at this time. Keep practicing your craft — when you're ready, you're welcome to try again in the future.";

export default function OnboardingVerificationPage() {
  const { user, isAuthenticated } = useAuth();
  const verificationStatus = useQuery(
    api.vetting.queries.getVerificationStatus,
    isAuthenticated && user?._id ? { userId: user._id } : "skip"
  );
  const initializeVerification = useMutation(api.vetting.mutations.initializeVerification);
  const completeVerification = useMutation(api.vetting.mutations.completeVerification);
  const [submitting, setSubmitting] = useState(false);
  const [accountDeletedMessage, setAccountDeletedMessage] = useState<string | null>(null);
  const [weightedFailureNotice, setWeightedFailureNotice] = useState<string | null>(null);
  /** Until Convex subscription returns weightedFailureScheduledFor, keep countdown from submit response. */
  const [weightedLocalDeadline, setWeightedLocalDeadline] = useState<number | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (verificationStatus?.vettingResult?.weightedFailureScheduledFor != null) {
      setWeightedLocalDeadline(null);
    }
  }, [verificationStatus?.vettingResult?.weightedFailureScheduledFor]);

  if (verificationStatus === undefined) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading</p>
        </div>
      </div>
    );
  }

  if (verificationStatus === null) {
    return (
      <div className="mx-auto max-w-lg">
        <Card className="rounded-2xl border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              This flow is only for freelancer accounts. Please sign in with a freelancer account.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { verificationStatus: status, vettingResult, kycStatus } = verificationStatus;
  const stepsCompleted = vettingResult?.stepsCompleted || [];
  const currentStep = vettingResult?.currentStep || "english";
  const vettingComplete = stepsCompleted.includes("english") && stepsCompleted.includes("skills");
  const kycComplete = kycStatus === "approved";
  const canTakeTests =
    (status === "in_progress" || vettingResult?.status === "pending") &&
    vettingResult &&
    !["pending_admin", "approved", "rejected"].includes(vettingResult.status);

  if (status === "approved" && vettingResult?.status === "approved" && kycComplete) {
    router.replace("/dashboard");
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const awaitingAdminAfterKyc =
    vettingComplete &&
    kycStatus === "pending_review" &&
    status === "pending_review" &&
    vettingResult?.status !== "rejected";

  const weightedRemovalDeadline =
    vettingResult?.weightedTerminationJobScheduled && vettingResult.weightedFailureScheduledFor != null
      ? vettingResult.weightedFailureScheduledFor
      : weightedLocalDeadline;

  const weightedRemovalPending =
    weightedRemovalDeadline != null && weightedRemovalDeadline > Date.now();

  if (weightedRemovalPending && weightedRemovalDeadline != null) {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-8">
        <WeightedFailureFinalization
          deadlineMs={weightedRemovalDeadline}
          bodyText={weightedFailureNotice ?? WEIGHTED_FAILURE_RESUME_COPY}
        />
      </div>
    );
  }

  if (awaitingAdminAfterKyc) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">You&apos;re almost there</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Your tests and KYC are submitted. Our team is reviewing your application.
          </p>
        </div>
        <Card className="rounded-2xl border-primary/20 bg-card/80 shadow-md backdrop-blur-sm">
          <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-center text-xl">Signup under review</CardTitle>
            <CardDescription className="text-center text-base leading-relaxed">
              We&apos;ll email you as soon as the review is complete. You don&apos;t need to do anything else right
              now.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 pb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span>Check your inbox (and spam) for updates from us.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const englishAttemptRound = (vettingResult as { englishAttemptRound?: number } | null | undefined)
    ?.englishAttemptRound ?? 0;
  const skillsAttemptRound = (vettingResult as { skillsAttemptRound?: number } | null | undefined)
    ?.skillsAttemptRound ?? 0;
  const englishRetakeAvailableAt =
    (vettingResult as { englishRetakeAvailableAt?: number } | null | undefined)?.englishRetakeAvailableAt;
  const skillsRetakeAvailableAt =
    (vettingResult as { skillsRetakeAvailableAt?: number } | null | undefined)?.skillsRetakeAvailableAt;
  const englishOnLastAttempt = englishAttemptRound >= 1 && !stepsCompleted.includes("english");
  const skillsOnLastAttempt = skillsAttemptRound >= 1 && !stepsCompleted.includes("skills");

  const steps = [
    {
      id: "english",
      name: "English Proficiency",
      description: "Complete English grammar, comprehension, and writing tests",
      completed: stepsCompleted.includes("english"),
      inProgress: currentStep === "english" && !stepsCompleted.includes("english"),
      attemptLabel: !stepsCompleted.includes("english")
        ? `Attempt ${englishAttemptRound + 1} of 2`
        : undefined,
      lastAttempt: englishOnLastAttempt,
    },
    {
      id: "skills",
      name: "Skill Assessment",
      description: "Demonstrate your skills through tests and challenges",
      completed: stepsCompleted.includes("skills"),
      inProgress: currentStep === "skills" && !stepsCompleted.includes("skills"),
      attemptLabel: !stepsCompleted.includes("skills")
        ? `Attempt ${skillsAttemptRound + 1} of 2`
        : undefined,
      lastAttempt: skillsOnLastAttempt,
    },
    {
      id: "kyc",
      name: "ID & Address Verification (KYC)",
      description:
        "Upload government-issued ID and a recent utility bill or similar (not older than 3 months)",
      completed: kycComplete,
      inProgress:
        vettingComplete &&
        !kycComplete &&
        (kycStatus === "not_submitted" ||
          kycStatus === "pending_review" ||
          kycStatus === "id_rejected" ||
          kycStatus === "address_rejected"),
      attemptLabel: undefined,
      lastAttempt: false,
    },
  ];

  const progress = Math.round((steps.filter((s) => s.completed).length / steps.length) * 100);

  const handleInitialize = async () => {
    try {
      await initializeVerification(user?._id ? { userId: user._id } : {});
    } catch (error) {
      console.error("Failed to initialize verification:", error);
    }
  };

  if (status === "not_started" || !vettingResult) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Verify your profile</h1>
          <p className="text-muted-foreground">
            Complete a short process so clients know they can trust your skills.
          </p>
        </div>
        <Card className="rounded-2xl border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>What you&apos;ll do</CardTitle>
            <CardDescription>Three steps — most people finish in under an hour.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <span>
                  <strong>English proficiency</strong> — grammar, comprehension, and writing. You need a 50% average across the three to pass.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <span>
                  <strong>Skill assessments</strong> — tailored to your profile. You need a 50% average across your skill tests to pass.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <span>
                  <strong>KYC</strong> — ID and proof of address (available once your weighted score is 50%+)
                </span>
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              An admin will approve your account after tests and KYC are submitted. You&apos;ll get email updates at
              each step.
            </p>
            <div className="rounded-xl border border-amber-300/60 bg-amber-50/70 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-200">
              <p className="font-medium">One retake per area</p>
              <p className="text-amber-900/80 dark:text-amber-200/80 mt-1">
                If you fall below 50% on a section you get a single retake. Falling below 50% on the retake closes
                your account for this cycle.
              </p>
            </div>
            <Button onClick={handleInitialize} size="lg" className="w-full rounded-xl">
              Start verification
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center sm:text-left space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Verification</h1>
        <p className="text-sm text-muted-foreground">Complete every step to unlock the freelancer dashboard.</p>
      </div>

      <Card className="rounded-2xl border-border/80 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Your progress</CardTitle>
              <CardDescription>Finish tests, then submit KYC for admin approval.</CardDescription>
            </div>
            <Badge
              variant={
                status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary"
              }
              className="w-fit"
            >
              {status === "approved"
                ? "Approved"
                : status === "rejected"
                  ? "Rejected"
                  : status === "pending_review"
                    ? "Pending review"
                    : "In progress"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {vettingResult.overallScore > 0 && (
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Weighted score (preview)</span>
                <span className="text-2xl font-bold">{vettingResult.overallScore}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                English 30% + skills 70%. KYC is reviewed separately by an admin.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {steps.map((step) => (
              <Card
                key={step.id}
                className={
                  step.inProgress ? "border-primary/40 ring-2 ring-primary/15 rounded-xl" : "rounded-xl"
                }
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 mt-0.5">
                      {step.completed ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : step.inProgress ? (
                        <Clock className="h-6 w-6 text-primary animate-pulse" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold">{step.name}</h3>
                        {step.completed && (
                          <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 shrink-0">
                            Done
                          </Badge>
                        )}
                        {step.inProgress && (
                          <Badge variant="outline" className="bg-primary/10 shrink-0">
                            In progress
                          </Badge>
                        )}
                        {!step.completed && step.attemptLabel && (
                          <Badge
                            variant="outline"
                            className={
                              step.lastAttempt
                                ? "shrink-0 border-destructive/50 bg-destructive/10 text-destructive"
                                : "shrink-0 bg-muted"
                            }
                          >
                            {step.attemptLabel}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{step.description}</p>
                      {step.id === "english" && vettingResult.englishProficiency.overallScore && (
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">Score: </span>
                          <span className="font-medium">{vettingResult.englishProficiency.overallScore}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {vettingResult.fraudFlags && vettingResult.fraudFlags.length > 0 && (
            <Card className="border-destructive rounded-xl">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2 text-base">
                  <AlertCircle className="h-5 w-5" />
                  Flags for review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {vettingResult.fraudFlags.map(
                    (
                      flag: NonNullable<Doc<"vettingResults">["fraudFlags"]>[number],
                      index: number
                    ) => (
                      <li key={index} className="text-sm">
                        <Badge variant="destructive" className="mr-2">
                          {flag.severity}
                        </Badge>
                        {flag.description}
                      </li>
                    )
                  )}
                </ul>
              </CardContent>
            </Card>
          )}

          {status === "pending_review" && vettingResult?.status === "pending_admin" && !kycComplete && (
            <Alert className="rounded-xl border-primary/30 bg-primary/5">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm leading-relaxed">
                Your tests passed the automated checks. Complete <strong>KYC</strong> below, then submit for admin
                approval.
              </AlertDescription>
            </Alert>
          )}

          {status === "pending_review" && vettingResult?.status === "flagged" && (
            <Alert className="rounded-xl border-amber-500/40 bg-amber-500/5">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm leading-relaxed">
                Your submission needs a manual review. Complete any open KYC steps below if applicable.
              </AlertDescription>
            </Alert>
          )}

          {(canTakeTests || ((status === "in_progress" || status === "pending_review") && vettingComplete)) && (
            <div className="space-y-6">
              {englishOnLastAttempt && currentStep === "english" && (
                <Card className="rounded-xl border-destructive/50 bg-destructive/5">
                  <CardContent className="p-4 text-sm">
                    <p className="font-semibold text-destructive">Last attempt on your English test</p>
                    <p className="text-muted-foreground mt-1 leading-relaxed">
                      You need an average of at least 50% across grammar, comprehension, and writing. If you score below
                      50% again, your account will be closed for this cycle. Questions may differ from your first try.
                    </p>
                  </CardContent>
                </Card>
              )}
              {skillsOnLastAttempt && currentStep === "skills" && (
                <Card className="rounded-xl border-destructive/50 bg-destructive/5">
                  <CardContent className="p-4 text-sm">
                    <p className="font-semibold text-destructive">Last attempt on your skill test</p>
                    <p className="text-muted-foreground mt-1 leading-relaxed">
                      You need an average of at least 50% across your skill assessments. If you score below 50% again,
                      your account will be closed for this cycle.
                    </p>
                  </CardContent>
                </Card>
              )}
              {canTakeTests &&
                currentStep === "english" &&
                !stepsCompleted.includes("english") &&
                (englishOnLastAttempt && englishRetakeAvailableAt ? (
                  <RetakeCooldownCard
                    title="English retake cooling down"
                    retakeAvailableAt={englishRetakeAvailableAt}
                    body="Take a short break. Come back in an hour to start your retake — the clock below shows exactly when you can begin."
                  >
                    <EnglishTest />
                  </RetakeCooldownCard>
                ) : (
                  <EnglishTest />
                ))}
              {canTakeTests &&
                currentStep === "skills" &&
                !stepsCompleted.includes("skills") &&
                user &&
                (skillsOnLastAttempt && skillsRetakeAvailableAt ? (
                  <RetakeCooldownCard
                    title="Skill-test retake cooling down"
                    retakeAvailableAt={skillsRetakeAvailableAt}
                    body="Take a short break. Come back in an hour to start your retake — the clock below shows exactly when you can begin."
                  >
                    <SkillTestPathFlow />
                  </RetakeCooldownCard>
                ) : (
                  <SkillTestPathFlow />
                ))}
              {canTakeTests &&
                stepsCompleted.includes("english") &&
                stepsCompleted.includes("skills") &&
                currentStep === "complete" && (
                  <Card className="rounded-xl">
                    <CardContent className="p-4 sm:p-5 space-y-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        When you&apos;re ready, submit your verification for review. You&apos;ll need KYC uploaded first
                        if you haven&apos;t already (your weighted score must be 50%+ to submit KYC).
                      </p>
                      {(englishAttemptRound >= 1 || skillsAttemptRound >= 1) && (
                        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm">
                          <p className="font-medium text-destructive">Heads up — this is your last attempt</p>
                          <p className="text-muted-foreground mt-1 leading-relaxed">
                            You&apos;ve already retaken the
                            {englishAttemptRound >= 1 && skillsAttemptRound >= 1
                              ? " English and skill sections"
                              : englishAttemptRound >= 1
                                ? " English section"
                                : " skill section"}
                            . If any section is below 50% or your overall weighted score is below 50% when you submit,
                            your account will be closed for this cycle.
                          </p>
                        </div>
                      )}
                      <Button
                        className="rounded-xl"
                        onClick={async () => {
                          setSubmitting(true);
                          setAccountDeletedMessage(null);
                          try {
                            const result = await completeVerification(user?._id ? { userId: user._id } : {});
                            const r = result as {
                              weightedFailurePending?: boolean;
                              countdownSeconds?: number;
                              message?: string;
                            };
                            if (r.weightedFailurePending) {
                              if (r.message) setWeightedFailureNotice(r.message);
                              setWeightedLocalDeadline(Date.now() + (r.countdownSeconds ?? 15) * 1000);
                            } else if (result.accountDeleted) {
                              setAccountDeletedMessage(result.message ?? "Your account has been removed.");
                              setTimeout(() => router.push("/login"), 4000);
                            } else if (!result.success && result.message) {
                              setAccountDeletedMessage(result.message);
                            }
                            // The Convex subscription on getVerificationStatus refreshes the UI.
                          } catch (e) {
                            console.error(e);
                          } finally {
                            setSubmitting(false);
                          }
                        }}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit for review"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              {vettingComplete && user?._id && !kycComplete && <KycStep userId={user._id} />}
            </div>
          )}

          {accountDeletedMessage && (
            <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">Not quite there yet</p>
                    <p className="text-sm text-muted-foreground mt-1">{accountDeletedMessage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {status === "rejected" && (
            <Card className="border-destructive rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Verification rejected</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Please contact support if you need help reapplying.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function WeightedFailureFinalization({
  deadlineMs,
  bodyText,
}: {
  deadlineMs: number;
  bodyText: string;
}) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const remainingSec = Math.max(0, Math.ceil((deadlineMs - now) / 1000));

  useEffect(() => {
    if (remainingSec <= 0) {
      router.replace("/login");
    }
  }, [remainingSec, router]);

  return (
    <Card className="rounded-2xl border-destructive/40 bg-destructive/5 shadow-sm">
      <CardHeader>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15">
          <XCircle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-center text-xl">Unable to meet verification requirements</CardTitle>
        <CardDescription className="text-center text-base leading-relaxed">
          Your weighted assessment score did not reach our minimum bar after all attempts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pb-8">
        <p className="text-sm text-muted-foreground leading-relaxed">{bodyText}</p>
        <div className="rounded-xl border border-destructive/30 bg-background/80 p-4 text-center space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Closing your account in
          </p>
          <p className="font-mono text-3xl font-semibold tabular-nums text-destructive">{remainingSec}s</p>
          <p className="text-xs text-muted-foreground leading-relaxed pt-1">
            We&apos;ll send you the same follow-up email as for other unsuccessful attempts, then remove your account
            from the platform.
          </p>
        </div>
        {remainingSec <= 0 && (
          <p className="text-center text-sm text-muted-foreground">Redirecting…</p>
        )}
      </CardContent>
    </Card>
  );
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Gates a test UI behind the 1-hour retake cooldown. Ticks every second while
 * locked, then renders `children` once `retakeAvailableAt` has passed.
 */
function RetakeCooldownCard({
  title,
  body,
  retakeAvailableAt,
  children,
}: {
  title: string;
  body: string;
  retakeAvailableAt: number;
  children: React.ReactNode;
}) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (now >= retakeAvailableAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [now, retakeAvailableAt]);

  if (now >= retakeAvailableAt) {
    return <>{children}</>;
  }

  const remainingMs = retakeAvailableAt - now;
  const availableAtLabel = new Date(retakeAvailableAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card className="rounded-xl border-amber-300/60 bg-amber-50/80 dark:bg-amber-950/20">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-amber-900 dark:text-amber-200">{title}</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{body}</p>
          </div>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border border-amber-300/50 bg-background/70 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted-foreground">Time remaining</span>
          <span className="font-mono text-lg font-semibold tabular-nums text-amber-900 dark:text-amber-200">
            {formatCountdown(remainingMs)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Your retake unlocks at about {availableAtLabel}.
        </p>
      </CardContent>
    </Card>
  );
}
