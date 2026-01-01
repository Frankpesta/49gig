"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";

/**
 * Hook for OAuth authentication
 */
export function useOAuth() {
  const router = useRouter();
  const getGoogleAuthUrl = useAction(
    (api as any)["auth/oauth"].getGoogleAuthUrl
  );

  const signInWithGoogle = async (role?: "client" | "freelancer") => {
    try {
      // Generate state for CSRF protection
      const state = `state_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Get authorization URL
      const { authUrl } = await getGoogleAuthUrl({
        state,
        role,
      });

      // Store state in sessionStorage for verification
      sessionStorage.setItem("oauth_state", state);

      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error("Failed to initiate OAuth:", error);
      throw error;
    }
  };

  return {
    signInWithGoogle,
  };
}

