"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReference } from "convex/server";
import { convexApiAny } from "@/lib/convex-api-runtime";

/** Mirrors `getActiveSessions` payload. */
export type ActiveSessionSummary = {
  _id: string;
  createdAt: number;
  lastRotatedAt: number;
  expiresAt: number;
  ipAddress?: string;
  userAgent?: string;
  rotationCount: number;
};

const rawAuthSessions = convexApiAny.auth.sessions as Record<string, unknown>;

const rotateSessionTokenMutation = rawAuthSessions.rotateSessionToken as unknown as FunctionReference<
  "mutation",
  "public",
  { refreshToken: string },
  { sessionToken: string; expiresAt: number; rotationCount: number }
>;

const getActiveSessionsQuery = rawAuthSessions.getActiveSessions as unknown as FunctionReference<
  "query",
  "public",
  Record<string, never>,
  ActiveSessionSummary[]
>;

/**
 * Hook to manage session token rotation
 * Automatically rotates tokens before they expire
 */
export function useSessionRotation() {
  const rotateToken = useMutation(rotateSessionTokenMutation);
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
          if (
            result &&
            typeof result === "object" &&
            "sessionToken" in result &&
            typeof (result as { sessionToken: unknown }).sessionToken ===
              "string" &&
            typeof window !== "undefined"
          ) {
            localStorage.setItem(
              "sessionToken",
              (result as { sessionToken: string }).sessionToken
            );
          }
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
  const sessions = useQuery(getActiveSessionsQuery);

  return {
    sessions: sessions ?? [],
    isLoading: sessions === undefined,
  };
}
