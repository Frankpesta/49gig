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
import { AuthBranding, AuthMobileLogo } from "@/components/auth/auth-branding";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { CheckCircle2, FileText, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";

export default function ResumeUploadPage() {
  const router = useRouter();
  const { user, isAuthenticated, isInitializing } = useAuth();
  const profile = useQuery(
    // @ts-ignore dynamic path cast for generated types
    (api as any).users.queries.getCurrentUserProfile
  );
  const resumeInfo = useQuery(
    // @ts-ignore dynamic path cast for generated types
    (api as any).resume.queries.getFreelancerResume,
    user?._id || profile?._id
      ? {
          freelancerId: (user?._id || profile?._id)!,
          requesterId: (user?._id || profile?._id)!,
        }
      : "skip"
  );
  const getUploadUrl = useAction(
    // @ts-ignore resume endpoints not in generated types yet
    (api as any).resume.actions.getResumeUploadUrl
  );
  const completeUpload = useMutation(
    // @ts-ignore resume endpoints not in generated types yet
    (api as any).resume.mutations.completeResumeUpload
  );
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Cooldown + status helpers
  const now = Date.now();
  const cooldownMs = resumeInfo?.resumeCanReuploadAt
    ? resumeInfo.resumeCanReuploadAt - now
    : 0;
  const isCooldown = cooldownMs > 0;
  const cooldownDays = Math.ceil(cooldownMs / (1000 * 60 * 60 * 24));

  useEffect(() => {
    // Wait for auth to initialize
    if (isInitializing) return;

    // Check authentication - use both user from useAuth and profile query
    const currentUser = user || profile;
    
    // If not authenticated after initialization, redirect to login
    if (!isAuthenticated && !isInitializing && currentUser === null) {
      // Check if there's a session token as a fallback
      const hasToken = typeof window !== "undefined" && localStorage.getItem("sessionToken");
      if (!hasToken) {
        router.replace("/login");
      }
      return;
    }

    // If authenticated but not a freelancer, route to dashboard
    if (currentUser && currentUser.role !== "freelancer") {
      router.replace("/dashboard");
    }
  }, [user, profile, isAuthenticated, isInitializing, router]);

  useEffect(() => {
    // If already uploaded or processed, skip this step
    const status = resumeInfo?.resumeStatus;
    const hasUploaded =
      status === "uploaded" ||
      status === "processing" ||
      status === "processed";
    if (hasUploaded) {
      router.replace("/verification");
    }
  }, [resumeInfo?.resumeStatus, router]);

  // Show loading state while auth is initializing or profile is loading
  if (isInitializing || (profile === undefined && user === undefined)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading resume upload...</p>
        </div>
      </div>
    );
  }

  // Get current user (prefer user from useAuth, fallback to profile)
  const currentUser = user || profile;

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

      // 1) Get signed upload URL from Convex
      // Pass session token if available (for email/password auth)
      const sessionToken = typeof window !== "undefined" ? localStorage.getItem("sessionToken") : null;
      const { url } = await getUploadUrl({ sessionToken: sessionToken || undefined });

      // 2) Upload the PDF directly to Convex storage
      const uploadRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file");
      }

      const { storageId } = await uploadRes.json();
      if (!storageId) {
        throw new Error("Upload did not return storageId");
      }

      // 3) Finalize in Convex (stores metadata and builds placeholder bio)
      // Pass session token if available (for email/password auth)
      await completeUpload({
        fileId: storageId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        sessionToken: sessionToken || undefined,
      });

      // Clear pending flag since upload is complete
      localStorage.removeItem("pending_resume_upload");
      setSuccess(true);

      // After successful upload, redirect to verification process
      setTimeout(() => {
        router.replace("/verification");
      }, 800);
    } catch (err: any) {
      setError(err?.message || "Failed to upload resume.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen relative bg-linear-to-br from-background via-primary/5 to-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-16 top-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 bottom-10 h-96 w-96 rounded-full bg-secondary/15 blur-3xl" />
      </div>

      <AuthBranding />

      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 relative">
        <div className="mx-auto w-full max-w-2xl space-y-10">
          <AuthMobileLogo />

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Step 1 of 3 · Resume Upload
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    1
                  </span>
                  <span className="font-medium text-foreground">Resume</span>
                </div>
                <div className="h-px w-8 bg-border" />
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold">
                    2
                  </span>
                  <span>Verification</span>
                </div>
                <div className="h-px w-8 bg-border" />
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold">
                    3
                  </span>
                  <span>Dashboard</span>
                </div>
              </div>
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                  Show us your best work.
                </h1>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  Upload your resume to generate a professional bio and accelerate verification. We’ll parse only what’s needed for your profile.
                </p>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  PDF only, max 10MB
                </div>
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Bio generated automatically
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Secure and private storage
                </div>
              </div>
            </div>

            <Card className="shadow-2xl border-border/50 bg-background/90 backdrop-blur-xl">
              <CardHeader className="space-y-2 px-6 pt-6 pb-4">
                <CardTitle className="text-xl font-semibold">
                  Resume Upload
                </CardTitle>
                <CardDescription>
                  Upload a PDF to continue. We’ll enrich your profile automatically.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleUpload}>
                <CardContent className="space-y-5 px-6 pb-6 pt-0">
                  {error && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  {resumeInfo && (
                    <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">Status</span>
                        <span className="uppercase text-xs tracking-wide text-primary">
                          {resumeInfo.resumeStatus || "not_uploaded"}
                        </span>
                      </div>
                      {resumeInfo.resumeStatus === "processing" && (
                        <p className="mt-1 text-xs">
                          We’re parsing your resume. This usually takes a few seconds.
                        </p>
                      )}
                      {isCooldown && (
                        <p className="mt-1 text-xs text-amber-600">
                          Reupload available in about {cooldownDays} day(s).
                        </p>
                      )}
                    </div>
                  )}
                  {success && (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
                      Resume uploaded successfully. Redirecting to verification...
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label htmlFor="resume" className="text-sm font-medium text-foreground">
                      PDF file
                    </Label>
                    <label
                      htmlFor="resume"
                      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-center transition ${
                        isUploading || isCooldown ? "opacity-60 cursor-not-allowed" : "hover:border-primary/40 hover:bg-primary/5"
                      }`}
                    >
                      <UploadCloud className="h-6 w-6 text-primary" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {file ? "Replace file" : "Drag & drop or click to upload"}
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
                      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs text-muted-foreground">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="truncate">{file.name}</span>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Tip: Include a concise summary, key skills, and top projects. We’ll build your bio from this.
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="pt-5 pb-6 px-6 border-t">
                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium"
                    disabled={isUploading || isCooldown}
                  >
                    {isUploading ? "Uploading..." : "Upload & Continue"}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {resumeInfo?.resumeStatus === "processed" && resumeInfo?.resumeBio && (
              <Card className="border-border/50 bg-background/90 shadow-xl">
                <CardHeader className="space-y-1 px-6 pt-6 pb-4">
                  <CardTitle className="text-lg font-semibold">Bio Preview</CardTitle>
                  <CardDescription>
                    This is generated from your resume and is read‑only.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground leading-relaxed">
                    {resumeInfo.resumeBio}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

