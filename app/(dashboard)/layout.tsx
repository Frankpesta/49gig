"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardBreadcrumb } from "@/components/dashboard/dashboard-breadcrumb";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { FreelancerChecklist } from "@/components/dashboard/freelancer-checklist";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { DashboardFooter } from "@/components/dashboard/dashboard-footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  
  // Get user profile to check role
  const userProfile = useQuery(
    api.users.queries.getCurrentUserProfile,
    isAuthenticated ? {} : "skip"
  );
  
  // Check if freelancer is verified
  const isVerified = useQuery(
    api.vetting.queries.isFreelancerVerified,
    isAuthenticated && userProfile?.role === "freelancer" ? {} : "skip"
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
    if (!userProfile || userProfile.role !== "freelancer") return;
    if (resumeInfo === undefined) return;
    // Verified freelancers can access dashboard and be matched without a resume
    if (isVerified?.verified) return;

    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
    const onResumeUpload = currentPath.startsWith("/resume-upload");
    const resumeStatus = resumeInfo?.resumeStatus;
    const hasUploaded =
      resumeStatus === "uploaded" ||
      resumeStatus === "processing" ||
      resumeStatus === "processed";

    if (!hasUploaded && !onResumeUpload) {
      router.replace("/resume-upload");
    }
  }, [isAuthenticated, isInitializing, isVerified, resumeInfo, router, userProfile]);

  // CRITICAL: Check if freelancer is verified - ENFORCE STRICTLY
  // This runs whenever auth state, user profile, or verification status changes
  useEffect(() => {
    // Early return if still initializing
    if (isInitializing) return;

    // If not authenticated, let the auth check handle it
    if (!isAuthenticated) return;

    // If user profile is still loading, wait
    if (userProfile === undefined) return;

    // Check if user is a freelancer
    if (userProfile?.role === "freelancer") {
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
  }, [isAuthenticated, isInitializing, userProfile, isVerified, router]);

  // Additional safeguard: Check on mount and when userProfile first loads
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;
    
    // This ensures we check immediately when userProfile becomes available
    if (
      !isInitializing &&
      isAuthenticated &&
      userProfile?.role === "freelancer" &&
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
  }, [userProfile?._id, isAuthenticated, isInitializing, isVerified, router, userProfile]);

  // Show loading state while initializing or checking verification
  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-200">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show loading state while checking verification for freelancers
  if (
    isAuthenticated &&
    userProfile?.role === "freelancer" &&
    isVerified === undefined
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-200">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Checking verification status...</p>
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
    userProfile?.role === "freelancer" &&
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
            <p className="text-sm text-muted-foreground">Redirecting to verification...</p>
          </div>
        </div>
      );
    }
  }

  return (
    <SidebarProvider className="overflow-hidden">
      <AppSidebar />
      <SidebarInset className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background">
        <header className="sticky top-0 z-40 flex h-14 sm:h-16 shrink-0 items-center justify-between gap-1 sm:gap-2 border-b border-border/50 bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/70 px-3 sm:px-4">
          <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4 hidden sm:block" />
            <nav className="flex-1 min-w-0 overflow-hidden">
              <DashboardBreadcrumb />
            </nav>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </header>
        <div className="dashboard-scroll relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {/* Ambient background for all dashboard pages */}
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -top-40 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-24 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,118,110,0.08),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.65),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.22),_transparent_65%)]" />
          </div>
          <div className="relative flex flex-1 flex-col gap-4 sm:gap-5 md:gap-6 p-3 sm:p-4 md:p-6 lg:p-8">
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

