"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardBreadcrumb } from "@/components/dashboard/dashboard-breadcrumb";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isInitializing } = useAuth();
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
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Redirecting to verification...</p>
          </div>
        </div>
      );
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border backdrop-blur supports-backdrop-filter:bg-background/60 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center gap-2">
            <DashboardBreadcrumb />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6 md:p-8 lg:p-10">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

