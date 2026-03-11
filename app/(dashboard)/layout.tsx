"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DashboardFooter } from "@/components/dashboard/dashboard-footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSessionToken(localStorage.getItem("sessionToken"));
    }
  }, [isAuthenticated]);

  // Get user profile to check role (from useAuth user or profile query)
  const userProfile = useQuery(
    api.users.queries.getCurrentUserProfile,
    isAuthenticated ? {} : "skip"
  );
  const effectiveUser = user || userProfile;
  
  // Check if freelancer is verified (supports session token for email/password users)
  const isVerified = useQuery(
    api.vetting.queries.isFreelancerVerified,
    isAuthenticated && (effectiveUser?.role === "freelancer" || userProfile?.role === "freelancer")
      ? { sessionToken: sessionToken ?? undefined, userId: effectiveUser?._id }
      : "skip"
  );

  // Resume status for freelancers
  const resumeInfo = useQuery(
    (api as any).resume.queries.getFreelancerResume,
    isAuthenticated && (userProfile?._id || user?._id) && (userProfile?.role === "freelancer" || user?.role === "freelancer")
      ? {
          freelancerId: (userProfile?._id || user?._id)!,
          requesterId: (userProfile?._id || user?._id)!,
        }
      : "skip"
  );

  useEffect(() => {
    // Only redirect if we've finished initializing and user is definitely not authenticated
    // Give Convex time to establish auth state after login
    if (!isInitializing && !isAuthenticated) {
      // Add a delay to prevent race conditions with auth state
      // This gives time for the session token to be verified
      const timeoutId = setTimeout(() => {
        // Double-check authentication state before redirecting
        const token = typeof window !== "undefined" ? localStorage.getItem("sessionToken") : null;
        if (!token) {
          router.push("/login");
        }
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, isInitializing, router]);

  // Enforce resume upload only for *unverified* freelancers (verified can use dashboard and be matched without resume)
  useEffect(() => {
    if (!isAuthenticated || isInitializing) return;
    if (!effectiveUser || effectiveUser.role !== "freelancer") return;
    if (resumeInfo === undefined) return;
    // Verified freelancers can access dashboard and be matched without a resume
    if (isVerified?.verified) return;

    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
    const onResumeUpload = currentPath.startsWith("/resume-upload");
    const onVerificationPage = currentPath.startsWith("/verification");
    const resumeStatus = resumeInfo?.resumeStatus;
    const hasUploaded =
      resumeStatus === "uploaded" ||
      resumeStatus === "processing" ||
      resumeStatus === "processed";

    if (!hasUploaded && !onResumeUpload && !onVerificationPage) {
      router.replace("/resume-upload");
    }
  }, [isAuthenticated, isInitializing, isVerified, resumeInfo, router, effectiveUser]);

  // CRITICAL: Check if freelancer is verified - ENFORCE STRICTLY
  // This runs whenever auth state, user profile, or verification status changes
  useEffect(() => {
    // Early return if still initializing
    if (isInitializing) return;

    // If not authenticated, let the auth check handle it
    if (!isAuthenticated) return;

    // If user profile is still loading, wait (use effectiveUser from useAuth when profile is null)
    if (effectiveUser === undefined && userProfile === undefined) return;

    // Check if user is a freelancer
    if (effectiveUser?.role === "freelancer" || userProfile?.role === "freelancer") {
      // Only require resume before verification check for unverified freelancers (verified can use dashboard without resume)
      if (!isVerified?.verified && resumeInfo && resumeInfo.resumeStatus !== "processed") {
        return;
      }
      // Only check path on client side
      if (typeof window === "undefined") return;
      
      const currentPath = window.location.pathname;
      const isOnVerificationPage = currentPath.startsWith("/verification");

      // If verification status is still loading, don't redirect yet
      // The loading state will be shown
      if (isVerified === undefined) {
        return;
      }

      // If not verified, ALWAYS redirect to verification page
      if (!isVerified.verified) {
        // Only redirect if not already on verification page
        if (!isOnVerificationPage) {
          // Use replace to prevent back button from going to dashboard
          router.replace("/verification");
          return;
        }
      }
    }
  }, [isAuthenticated, isInitializing, userProfile, effectiveUser, isVerified, router]);

  // Additional safeguard: Check on mount and when userProfile first loads
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;
    
    // This ensures we check immediately when userProfile becomes available
    if (
      !isInitializing &&
      isAuthenticated &&
      (effectiveUser?.role === "freelancer" || userProfile?.role === "freelancer") &&
      resumeInfo &&
      resumeInfo.resumeStatus === "processed" &&
      isVerified !== undefined &&
      !isVerified.verified
    ) {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/verification")) {
        router.replace("/verification");
      }
    }
  }, [userProfile?._id, effectiveUser?._id, isAuthenticated, isInitializing, isVerified, router, userProfile, effectiveUser]);

  // Show loading state while initializing or checking verification
  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-200">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading</p>
        </div>
      </div>
    );
  }

  // Show loading state while checking verification for freelancers
  if (
    isAuthenticated &&
    (effectiveUser?.role === "freelancer" || userProfile?.role === "freelancer") &&
    isVerified === undefined
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-200">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render dashboard
  if (!isAuthenticated) {
    return null;
  }

  // If freelancer is not verified, don't render dashboard content
  // (they should be redirected, but this is a safeguard)
  // BUT: Allow rendering if already on verification page
  if (
    (effectiveUser?.role === "freelancer" || userProfile?.role === "freelancer") &&
    isVerified !== undefined &&
    !isVerified.verified
  ) {
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
    const isOnVerificationPage = currentPath.startsWith("/verification");
    
    // If on verification page, allow it to render (don't block it)
    if (isOnVerificationPage) {
      // Allow verification page to render
    } else {
      // Still loading redirect, show loading state
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4 animate-in fade-in duration-200">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading</p>
          </div>
        </div>
      );
    }
  }

  return (
    <SidebarProvider className="overflow-hidden">
      <AppSidebar />
      <SidebarInset className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
        <DashboardHeader />
        <div className="dashboard-scroll relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {/* Lively, vibrant background orbs (reference style) */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 right-0 h-96 w-96 rounded-full bg-primary/18 blur-3xl" />
            <div className="absolute -bottom-20 left-0 h-80 w-80 rounded-full bg-secondary/25 blur-3xl" />
            <div className="absolute left-1/2 top-1/4 h-72 w-72 -translate-x-1/2 rounded-full bg-secondary/12 blur-3xl" />
            <div className="absolute right-1/4 top-2/3 h-48 w-48 rounded-full bg-primary/10 blur-2xl" />
            <div className="absolute left-1/4 bottom-1/4 h-40 w-40 rounded-full bg-secondary/15 blur-2xl" />
          </div>
          <div className="relative flex flex-1 flex-col gap-4 p-3 sm:gap-5 sm:p-4 md:gap-6 md:p-6 lg:p-8">
            <div className="dashboard-content mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 sm:gap-5 md:gap-6">
              {children}
            </div>
          </div>
        </div>
        <DashboardFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}

