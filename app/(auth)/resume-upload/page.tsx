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
    (user?._id || profile?._id) ? { freelancerId: (user?._id || profile?._id) } : "skip"
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
    // If already processed, skip this step
    if (resumeInfo?.resumeStatus === "processed") {
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
      const { url } = await getUploadUrl({});

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
      await completeUpload({
        fileId: storageId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
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
        <div className="absolute -left-16 top-10 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-0 bottom-10 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <AuthBranding />

      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 relative">
        <div className="mx-auto w-full max-w-md space-y-10">
          <AuthMobileLogo />

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Step 1: Upload your resume (PDF)
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Upload your resume
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              We’ll extract key details to build your professional bio. After upload, you’ll continue to the verification process.
            </p>
          </div>

          <Card className="shadow-2xl border-border/50 bg-background/80 backdrop-blur-xl">
            <CardHeader className="space-y-2 px-8 pt-8 pb-6">
              <CardTitle className="text-2xl font-heading font-semibold">
                Resume Upload
              </CardTitle>
              <CardDescription>
                Upload a PDF (max 10MB). Parsing and profile enrichment will follow.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleUpload}>
              <CardContent className="space-y-6 px-8 pb-8 pt-0">
                {error && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
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
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">
                    Resume uploaded successfully. Redirecting to verification...
                  </div>
                )}

                <div className="space-y-3">
                  <Label htmlFor="resume" className="text-sm font-medium">
                    PDF file
                  </Label>
                  <Input
                    id="resume"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    disabled={isUploading || isCooldown}
                    className="h-11 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-border file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/15"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Include a concise summary, key skills, and top projects. We’ll build your bio from this.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="pt-8 pb-8 px-8 border-t">
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
        </div>
      </div>
    </div>
  );
}

