"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { EnglishTest } from "@/components/vetting/english-test";
import { SkillSelection } from "@/components/vetting/skill-selection";
import { useRouter } from "next/navigation";

export default function VerificationPage() {
  const { user, isAuthenticated } = useAuth();
  const verificationStatus = useQuery(
    api.vetting.queries.getVerificationStatus,
    isAuthenticated && user?._id ? { userId: user._id } : "skip"
  );
  const initializeVerification = useMutation(api.vetting.mutations.initializeVerification);
  const completeVerification = useMutation(api.vetting.mutations.completeVerification);
  const [submitting, setSubmitting] = useState(false);
  const [accountDeletedMessage, setAccountDeletedMessage] = useState<string | null>(null);

  // Check if query is still loading (undefined) vs returned null (not a freelancer/not authenticated)
  if (verificationStatus === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading verification status...</p>
        </div>
      </div>
    );
  }

  // If query returned null, user is not a freelancer or not authenticated
  if (verificationStatus === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="container mx-auto max-w-4xl py-8">
          <Card>
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                This page is only available for freelancers. Please ensure the following:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <p className="text-muted-foreground mb-2">
                  Please ensure:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>You are logged in</li>
                  <li>Your account role is set to &quot;freelancer&quot;</li>
                  <li>Your account status is &quot;active&quot;</li>
                </ul>
              </div>
              <div className="text-sm space-y-2">
                <p className="font-medium">Debug Information:</p>
                <p className="text-muted-foreground">
                  Authenticated: {isAuthenticated ? "Yes" : "No"}
                </p>
                {user && (
                  <>
                    <p className="text-muted-foreground">
                      User Role: {user.role || "Not set"}
                    </p>
                    <p className="text-muted-foreground">
                      User Status: {user.status || "Not set"}
                    </p>
                    <p className="text-muted-foreground">
                      User Email: {user.email || "Not set"}
                    </p>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                If you believe this is an error, please contact support or check your account settings.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { verificationStatus: status, vettingResult } = verificationStatus;
  const stepsCompleted = vettingResult?.stepsCompleted || [];
  const currentStep = vettingResult?.currentStep || "english";
  const router = useRouter();

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
  ];

  const progress = (stepsCompleted.length / steps.length) * 100;

  const handleInitialize = async () => {
    try {
      // Pass userId if available (for session token auth)
      await initializeVerification(user?._id ? { userId: user._id } : {});
    } catch (error) {
      console.error("Failed to initialize verification:", error);
    }
  };

  if (status === "not_started" || !vettingResult) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Freelancer Verification</CardTitle>
            <CardDescription>
              Complete the verification process to start using the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Verification Requirements</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>English proficiency test (grammar, comprehension, writing) — minimum 50%</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>Skill assessments for your chosen skills — minimum 50%</span>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground">
                You must score at least 50% in both to continue. Otherwise your account will be removed from the platform.
              </p>
            </div>
            <Button onClick={handleInitialize} size="lg" className="w-full">
              Start Verification Process
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Verification Status</CardTitle>
              <CardDescription>
                Complete all steps to get verified and start using the platform
              </CardDescription>
            </div>
            <Badge
              variant={
                status === "approved"
                  ? "default"
                  : status === "rejected"
                  ? "destructive"
                  : "secondary"
              }
            >
              {status === "approved"
                ? "Approved"
                : status === "rejected"
                ? "Rejected"
                : status === "pending_review"
                ? "Pending Review"
                : "In Progress"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Overall Score */}
          {vettingResult.overallScore > 0 && (
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Overall Score</span>
                <span className="text-2xl font-bold">{vettingResult.overallScore}%</span>
              </div>
            </div>
          )}

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step) => (
              <Card key={step.id} className={step.inProgress ? "border-primary" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      {step.completed ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : step.inProgress ? (
                        <Clock className="h-6 w-6 text-primary animate-spin" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{step.name}</h3>
                        {step.completed && (
                          <Badge variant="outline" className="bg-green-50">
                            Completed
                          </Badge>
                        )}
                        {step.inProgress && (
                          <Badge variant="outline" className="bg-primary/10">
                            In Progress
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {step.description}
                      </p>
                      {step.id === "english" &&
                        vettingResult.englishProficiency.overallScore && (
                          <div className="mt-2 text-sm">
                            <span className="text-muted-foreground">Score: </span>
                            <span className="font-medium">
                              {vettingResult.englishProficiency.overallScore}%
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Fraud Flags Warning */}
          {vettingResult.fraudFlags && vettingResult.fraudFlags.length > 0 && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Verification Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Your verification has been flagged for review. Please contact support.
                </p>
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

          {/* Step Components */}
          {status === "in_progress" && (
            <div className="space-y-6">
              {currentStep === "english" && !stepsCompleted.includes("english") && (
                <EnglishTest
                  onComplete={() => {
                    // Refresh verification status
                    window.location.reload();
                  }}
                />
              )}
              {currentStep === "skills" && !stepsCompleted.includes("skills") && user && (
                <SkillSelection
                  skills={user.profile?.skills || []}
                  experienceLevel={
                    (user.profile?.experienceLevel as "junior" | "mid" | "senior" | "expert") ||
                    "mid"
                  }
                  completedAssessments={
                    vettingResult?.skillAssessments?.map((sa) => ({
                      skillId: sa.skillId,
                      skillName: sa.skillName,
                      score: sa.score,
                    })) || []
                  }
                  onAssessmentComplete={(skillName, score) => {
                    // Assessment completed, refresh to update status
                    window.location.reload();
                  }}
                />
              )}
              {/* Submit verification when both steps are done */}
              {stepsCompleted.includes("english") &&
                stepsCompleted.includes("skills") &&
                currentStep === "complete" && (
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        You have completed the English proficiency and skill assessments. Submit your verification for review.
                      </p>
                      <Button
                        onClick={async () => {
                          setSubmitting(true);
                          try {
                            const result = await completeVerification(
                              user?._id ? { userId: user._id } : {}
                            );
                            if (result.accountDeleted) {
                              setAccountDeletedMessage(result.message ?? "Your account has been removed.");
                              setTimeout(() => router.push("/login"), 4000);
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
                          "Submit verification"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
            </div>
          )}

          {/* Account deleted (failed minimum scores) */}
          {accountDeletedMessage && (
            <Card className="border-destructive">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-destructive">We&apos;re sorry</p>
                    <p className="text-sm text-muted-foreground mt-1">{accountDeletedMessage}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Redirecting you to the login page...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {status === "rejected" && (
            <Card className="border-destructive">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">
                      Verification Rejected
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your verification has been rejected. Please contact support for more
                      information.
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

