"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Upload, ShieldCheck, User, IdCard } from "lucide-react";
import { useRouter } from "next/navigation";

interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  href?: string;
  icon: React.ReactNode;
}

export function FreelancerChecklist() {
  const { user } = useAuth();
  const router = useRouter();

  const resumeInfo = useQuery(
    (api as any).resume.queries.getFreelancerResume,
    user?._id ? { freelancerId: user._id, requesterId: user._id } : "skip"
  );

  const vettingSnap = useQuery(
    api.vetting.queries.getVerificationStatus,
    user?._id ? { userId: user._id } : "skip"
  );

  if (!user || user.role !== "freelancer") {
    return null;
  }

  const platformApproved = vettingSnap?.verificationStatus === "approved";
  const kycApproved = vettingSnap?.kycStatus === "approved";
  const fullyApproved = platformApproved && kycApproved;

  const hasCoreProfile =
    !!user.profile?.techField && (user.profile?.skills?.length ?? 0) > 0;

  const checklistItems: ChecklistItem[] = [
    {
      id: "resume",
      label: "Upload resume",
      description: fullyApproved
        ? "Optional — your application is approved."
        : "Helps pre-fill your profile from your CV.",
      completed: resumeInfo?.resumeStatus === "processed" || fullyApproved,
      href: "/resume-upload",
      icon: <Upload className="h-4 w-4" />,
    },
    {
      id: "verification",
      label: "Platform verification",
      description: "Tests and admin approval of your application.",
      completed: platformApproved,
      href: "/onboarding/verification",
      icon: <ShieldCheck className="h-4 w-4" />,
    },
    {
      id: "kyc",
      label: "Identity verification (KYC)",
      description: "Government ID and proof of address.",
      completed: kycApproved,
      href: "/onboarding/verification",
      icon: <IdCard className="h-4 w-4" />,
    },
    {
      id: "profile",
      label: "Profile basics",
      description:
        "Category and skills from onboarding. Add a bio anytime on your profile.",
      completed: fullyApproved || hasCoreProfile,
      href: "/dashboard/profile",
      icon: <User className="h-4 w-4" />,
    },
  ];

  const incompleteItems = checklistItems.filter((item) => !item.completed);
  const allComplete = incompleteItems.length === 0;

  if (allComplete) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
          <CardTitle className="text-lg font-semibold text-amber-900 dark:text-amber-100">
            Complete your onboarding
          </CardTitle>
        </div>
        <CardDescription className="text-amber-800 dark:text-amber-200">
          Finish these steps so you can be matched with clients once your account is fully approved.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {checklistItems.map((item) => (
            <div
              key={item.id}
              className={`flex flex-col gap-1 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                item.completed
                  ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
                  : "border-amber-200 bg-white dark:border-amber-800 dark:bg-background"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    item.completed
                      ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                      : "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400"
                  }`}
                >
                  {item.completed ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    item.icon
                  )}
                </div>
                <div>
                  <span
                    className={`font-medium ${
                      item.completed
                        ? "text-green-900 dark:text-green-100 line-through"
                        : "text-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-prose">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
              {!item.completed && item.href && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900 sm:ml-3"
                  onClick={() => router.push(item.href!)}
                >
                  Complete
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className="pt-2 text-xs text-amber-700 dark:text-amber-300">
          {incompleteItems.length === 1
            ? "1 step remaining"
            : `${incompleteItems.length} steps remaining`}
        </div>
      </CardContent>
    </Card>
  );
}
