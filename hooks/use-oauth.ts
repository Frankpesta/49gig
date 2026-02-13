"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";

// Avoid "Type instantiation is excessively deep" - auth/oauth API path triggers deep inference
const getGoogleAuthUrlRef = api["auth/oauth"].getGoogleAuthUrl;

/**
 * Hook for OAuth authentication
 */
export function useOAuth() {
  const router = useRouter();
  const getGoogleAuthUrl = useAction(getGoogleAuthUrlRef);

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

