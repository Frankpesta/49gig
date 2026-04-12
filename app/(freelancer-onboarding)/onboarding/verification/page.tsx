"use client";

import { useState } from "react";
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

const VERIFICATION_FAILED_KEY = "verification_failed_message";

export default function OnboardingVerificationPage() {
  const { user, isAuthenticated } = useAuth();
  const verificationStatus = useQuery(
    api.vetting.queries.getVerificationStatus,
    isAuthenticated && user?._id ? { userId: user._id } : "skip"
  );
  const initializeVerification = useMutation(api.vetting.mutations.initializeVerification);
  const completeVerification = useMutation(api.vetting.mutations.completeVerification);
  const [submitting, setSubmitting] = useState(false);
  const [accountDeletedMessage, setAccountDeletedMessage] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(VERIFICATION_FAILED_KEY);
      if (stored) {
        sessionStorage.removeItem(VERIFICATION_FAILED_KEY);
        return stored;
      }
    }
    return null;
  });

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
  const router = useRouter();
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

  const steps = [
    {
      id: "english",
      name: "English Proficiency",
      description: "Complete English grammar, comprehension, and writing tests",
      completed: stepsCompleted.includes("english"),
      inProgress: currentStep === "english" && !stepsCompleted.includes("english"),
    },
    {
      id: "skills",
      name: "Skill Assessment",
      description: "Demonstrate your skills through tests and challenges",
      completed: stepsCompleted.includes("skills"),
      inProgress: currentStep === "skills" && !stepsCompleted.includes("skills"),
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
                  <strong>English proficiency</strong> — grammar, comprehension, and writing (minimum 50% each area)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <span>
                  <strong>Skill assessments</strong> — tailored to your profile (minimum 50%)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <span>
                  <strong>KYC</strong> — ID and proof of address (available once your overall score is 50%+)
                </span>
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              An admin will approve your account after tests and KYC are submitted. You&apos;ll get email updates at
              each step.
            </p>
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
              {vettingResult &&
                (vettingResult as { englishFailedAttempts?: number }).englishFailedAttempts &&
                (vettingResult as { englishFailedAttempts?: number }).englishFailedAttempts! > 0 &&
                currentStep === "english" && (
                  <Card className="rounded-xl border-amber-200 bg-amber-50/80 dark:bg-amber-950/20">
                    <CardContent className="p-4 text-sm">
                      <p className="font-medium text-amber-900 dark:text-amber-200">Retake your English test</p>
                      <p className="text-muted-foreground mt-1">
                        You have one more attempt. Complete the section below — questions may differ from your first try.
                      </p>
                    </CardContent>
                  </Card>
                )}
              {vettingResult &&
                (vettingResult as { skillsFailedAttempts?: number }).skillsFailedAttempts &&
                (vettingResult as { skillsFailedAttempts?: number }).skillsFailedAttempts! > 0 &&
                currentStep === "skills" && (
                  <Card className="rounded-xl border-amber-200 bg-amber-50/80 dark:bg-amber-950/20">
                    <CardContent className="p-4 text-sm">
                      <p className="font-medium text-amber-900 dark:text-amber-200">Retake your skill test</p>
                      <p className="text-muted-foreground mt-1">
                        You have one more attempt. Start the skill test below — you should see different questions than before.
                      </p>
                    </CardContent>
                  </Card>
                )}
              {canTakeTests && currentStep === "english" && !stepsCompleted.includes("english") && (
                <EnglishTest />
              )}
              {canTakeTests && currentStep === "skills" && !stepsCompleted.includes("skills") && user && (
                <SkillTestPathFlow />
              )}
              {canTakeTests &&
                stepsCompleted.includes("english") &&
                stepsCompleted.includes("skills") &&
                currentStep === "complete" && (
                  <Card className="rounded-xl">
                    <CardContent className="p-4 sm:p-5 space-y-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        When you&apos;re ready, submit your verification for review. You&apos;ll need KYC uploaded first
                        if you haven&apos;t already (50%+ overall required to submit KYC).
                      </p>
                      <Button
                        className="rounded-xl"
                        onClick={async () => {
                          setSubmitting(true);
                          setAccountDeletedMessage(null);
                          try {
                            const result = await completeVerification(user?._id ? { userId: user._id } : {});
                            if (result.accountDeleted) {
                              setAccountDeletedMessage(result.message ?? "Your account has been removed.");
                              setTimeout(() => router.push("/login"), 4000);
                            } else if (!result.success && result.message) {
                              sessionStorage.setItem(VERIFICATION_FAILED_KEY, result.message);
                              window.location.reload();
                            } else {
                              window.location.reload();
                            }
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
