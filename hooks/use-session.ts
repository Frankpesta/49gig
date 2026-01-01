"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Hook to manage session token rotation
 * Automatically rotates tokens before they expire
 */
export function useSessionRotation() {
  const rotateToken = useMutation(
    (api as any)["auth/sessions"].rotateSessionToken
  );
  const refreshTokenRef = useRef<string | null>(null);
  const rotationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set refresh token (called after login)
  const setRefreshToken = (token: string) => {
    refreshTokenRef.current = token;
    startRotation();
  };

  // Start automatic token rotation
  const startRotation = () => {
    // Clear existing interval
    if (rotationIntervalRef.current) {
      clearInterval(rotationIntervalRef.current);
    }

    // Rotate token every 50 minutes (before 1 hour expiry)
    rotationIntervalRef.current = setInterval(async () => {
      if (refreshTokenRef.current) {
        try {
          const result = await rotateToken({
            refreshToken: refreshTokenRef.current,
          });
          // Token rotated successfully
          // Store new session token if needed
          console.log("Session token rotated");
        } catch (error) {
          console.error("Failed to rotate token:", error);
          // Token rotation failed - user may need to re-authenticate
          if (refreshTokenRef.current) {
            refreshTokenRef.current = null;
          }
        }
      }
    }, 50 * 60 * 1000); // 50 minutes
  };

  // Stop rotation
  const stopRotation = () => {
    if (rotationIntervalRef.current) {
      clearInterval(rotationIntervalRef.current);
      rotationIntervalRef.current = null;
    }
    refreshTokenRef.current = null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRotation();
    };
  }, []);

  return {
    setRefreshToken,
    startRotation,
    stopRotation,
  };
}

/**
 * Hook to get active sessions
 */
export function useActiveSessions() {
  const sessions = useQuery(
    (api as any)["auth/sessions"].getActiveSessions
  );

  return {
    sessions: sessions || [],
    isLoading: sessions === undefined,
  };
}

