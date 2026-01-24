"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthTwoColumnLayout } from "@/components/auth/auth-two-column-layout";
import { resumeUploadFeatures } from "@/components/auth/auth-icons";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { FileText, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

const authCardClass =
  "rounded-xl border border-border/60 bg-card shadow-lg";

export default function ResumeUploadPage() {
  const router = useRouter();
  const { user, isAuthenticated, isInitializing } = useAuth();
  const profile = useQuery(
    (api as any).users.queries.getCurrentUserProfile
  );
  const resumeInfo = useQuery(
    (api as any).resume.queries.getFreelancerResume,
    user?._id || profile?._id
      ? {
          freelancerId: (user?._id || profile?._id)!,
          requesterId: (user?._id || profile?._id)!,
        }
      : "skip"
  );
  const getUploadUrl = useAction(
    (api as any).resume.actions.getResumeUploadUrl
  );
  const completeUpload = useMutation(
    (api as any).resume.mutations.completeResumeUpload
  );
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const now = Date.now();
  const cooldownMs = resumeInfo?.resumeCanReuploadAt
    ? resumeInfo.resumeCanReuploadAt - now
    : 0;
  const isCooldown = cooldownMs > 0;
  const cooldownDays = Math.ceil(cooldownMs / (1000 * 60 * 60 * 24));

  useEffect(() => {
    if (isInitializing) return;
    const currentUser = user || profile;

    if (!isAuthenticated && !isInitializing && currentUser === null) {
      const hasToken =
        typeof window !== "undefined" &&
        localStorage.getItem("sessionToken");
      if (!hasToken) router.replace("/login");
      return;
    }

    if (currentUser && currentUser.role !== "freelancer") {
      router.replace("/dashboard");
    }
  }, [user, profile, isAuthenticated, isInitializing, router]);

  useEffect(() => {
    const status = resumeInfo?.resumeStatus;
    const hasUploaded =
      status === "uploaded" ||
      status === "processing" ||
      status === "processed";
    if (hasUploaded) router.replace("/verification");
  }, [resumeInfo?.resumeStatus, router]);

  if (isInitializing || (profile === undefined && user === undefined)) {
    return (
      <AuthTwoColumnLayout
        leftTitle="Resume upload"
        leftDescription="Upload your resume to generate a professional bio and accelerate verification."
        features={resumeUploadFeatures}
        heading="Loading…"
        subline="Please wait."
      >
        <Card className={authCardClass}>
          <CardContent className="flex flex-col items-center justify-center gap-3 px-4 py-12 sm:px-6 lg:px-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Loading resume upload…
            </p>
          </CardContent>
        </Card>
      </AuthTwoColumnLayout>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      setFile(null);
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError("File is too large. Max size is 10MB.");
      setFile(null);
      return;
    }
    setError("");
    setFile(selected);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (isCooldown) {
      setError(
        `Reupload not yet allowed. Please wait about ${cooldownDays} day(s).`
      );
      return;
    }
    if (!file) {
      setError("Please select a PDF file to upload.");
      return;
    }

    try {
      setIsUploading(true);
      const sessionToken =
        typeof window !== "undefined"
          ? localStorage.getItem("sessionToken")
          : null;
      const { url } = await getUploadUrl({
        sessionToken: sessionToken || undefined,
      });

      const uploadRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload file");

      const { storageId } = await uploadRes.json();
      if (!storageId) throw new Error("Upload did not return storageId");

      await completeUpload({
        fileId: storageId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        sessionToken: sessionToken || undefined,
      });

      localStorage.removeItem("pending_resume_upload");
      setSuccess(true);
      setTimeout(() => router.replace("/verification"), 800);
    } catch (err: any) {
      setError(err?.message || "Failed to upload resume.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AuthTwoColumnLayout
      leftTitle="Show us your best work."
      leftDescription="Upload your resume to generate a professional bio and accelerate verification. We&apos;ll parse only what&apos;s needed for your profile."
      features={resumeUploadFeatures}
      badge="Step 1 of 3 · Resume upload"
      heading="Resume upload"
      subline="Upload a PDF to continue. We&apos;ll enrich your profile automatically."
    >
      <div className="space-y-6">
        {/* Step indicator – responsive, wraps on narrow screens */}
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 text-xs text-muted-foreground",
            "sm:gap-3"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
              1
            </span>
            <span className="font-medium text-foreground">Resume</span>
          </div>
          <div className="hidden h-px w-6 bg-border sm:block" aria-hidden />
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground">
              2
            </span>
            <span>Verification</span>
          </div>
          <div className="hidden h-px w-6 bg-border sm:block" aria-hidden />
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground">
              3
            </span>
            <span>Dashboard</span>
          </div>
        </div>

        <Card className={authCardClass}>
          <form onSubmit={handleUpload}>
            <CardHeader className="space-y-2 px-4 pt-6 pb-4 sm:px-6 lg:px-8 sm:pt-8 sm:pb-6">
              <CardTitle className="text-xl font-semibold sm:text-2xl">
                Upload your resume
              </CardTitle>
              <CardDescription>
                PDF only · up to 10MB. We&apos;ll build your bio from this.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-4 pb-6 pt-0 sm:px-6 lg:px-8 sm:pb-8">
              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive sm:p-4">
                  {error}
                </div>
              )}
              {resumeInfo && (
                <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">
                      Status
                    </span>
                    <span className="text-xs font-medium uppercase tracking-wide text-primary">
                      {resumeInfo.resumeStatus || "not_uploaded"}
                    </span>
                  </div>
                  {resumeInfo.resumeStatus === "processing" && (
                    <p className="mt-1 text-xs">
                      We&apos;re parsing your resume. This usually takes a few
                      seconds.
                    </p>
                  )}
                  {isCooldown && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
                      Reupload available in about {cooldownDays} day(s).
                    </p>
                  )}
                </div>
              )}
              {success && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 sm:p-4">
                  Resume uploaded successfully. Redirecting…
                </div>
              )}

              <div className="space-y-3">
                <Label
                  htmlFor="resume"
                  className="text-sm font-medium text-foreground"
                >
                  PDF file
                </Label>
                <label
                  htmlFor="resume"
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-center transition sm:py-8",
                    (isUploading || isCooldown) &&
                      "cursor-not-allowed opacity-60",
                    !(isUploading || isCooldown) &&
                      "hover:border-primary/40 hover:bg-primary/5"
                  )}
                >
                  <UploadCloud className="h-6 w-6 shrink-0 text-primary sm:h-8 sm:w-8" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {file
                        ? "Replace file"
                        : "Drag & drop or click to upload"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF only · up to 10MB
                    </p>
                  </div>
                </label>
                <Input
                  id="resume"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  disabled={isUploading || isCooldown}
                  className="hidden"
                />
                {file && (
                  <div className="flex items-center gap-2 overflow-hidden rounded-lg border border-border/60 bg-background px-3 py-2 text-xs text-muted-foreground">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 truncate">{file.name}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tip: Include a concise summary, key skills, and top projects.
                  We&apos;ll build your bio from this.
                </p>
              </div>
            </CardContent>
            <CardFooter className="border-t px-4 pb-6 pt-5 sm:px-6 lg:px-8 sm:pb-8">
              <Button
                type="submit"
                className="h-11 w-full rounded-lg text-base font-medium"
                disabled={isUploading || isCooldown}
              >
                {isUploading ? "Uploading…" : "Upload & continue"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {resumeInfo?.resumeStatus === "processed" &&
          resumeInfo?.resumeBio && (
            <Card className={authCardClass}>
              <CardHeader className="space-y-1 px-4 pt-6 pb-4 sm:px-6 lg:px-8 sm:pt-8 sm:pb-6">
                <CardTitle className="text-lg font-semibold sm:text-xl">
                  Bio preview
                </CardTitle>
                <CardDescription>
                  Generated from your resume (read‑only).
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-6 sm:px-6 lg:px-8 sm:pb-8">
                <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
                  {resumeInfo.resumeBio}
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    </AuthTwoColumnLayout>
  );
}
