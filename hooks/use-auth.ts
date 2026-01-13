// @ts-nocheck
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useState } from "react";

/**
 * Hook to get current user from Convex and sync with Zustand store
 * This should be used in components to sync auth state
 * Supports both Convex Auth and custom session tokens
 */
export function useAuth() {
  const { user, setUser, setInitializing } = useAuthStore();
  
  // Read session token synchronously on initial render to avoid race conditions
  // This ensures the token is available immediately for the query
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sessionToken");
    }
    return null;
  });
  
  // Listen for storage changes (e.g., after login on same page)
  useEffect(() => {
    const checkToken = () => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("sessionToken");
        setSessionToken((prevToken) => {
          if (token !== prevToken) {
            return token;
          }
          return prevToken;
        });
      }
    };
    
    // Check periodically for token changes
    const interval = setInterval(checkToken, 500);
    
    // Also listen to storage events (for cross-tab communication)
    window.addEventListener("storage", checkToken);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", checkToken);
    };
  }, []);

  // Try Convex Auth first (for OAuth flows)
  const currentUser = useQuery(api.users.queries.getCurrentUserProfile);

  // Try session token validation (for email/password login)
  // Note: TypeScript doesn't support dynamic property access with path slashes in type definitions
  // We need to use type assertion to access nested paths like "auth/queries"
  const sessionUser = useQuery(
    // @ts-expect-error - Dynamic path access for "auth/queries" requires type assertion
    api["auth/queries"].verifySession,
    sessionToken ? { sessionToken } : "skip"
  );

  // Sync user with Zustand store
  useEffect(() => {
    // Prefer Convex Auth user if available (for OAuth flows)
    if (currentUser !== undefined && currentUser !== null) {
      setUser(currentUser);
      setInitializing(false);
      return;
    }
    
    // If we have a session token, check it (for email/password login)
    if (sessionToken) {
      if (sessionUser !== undefined) {
        // Session query has completed
        if (sessionUser) {
          // User is authenticated via session token
          setUser(sessionUser);
          setInitializing(false);
        } else {
          // Session token is invalid
          setUser(null);
          setInitializing(false);
          // Clear invalid session token
          if (typeof window !== "undefined") {
            localStorage.removeItem("sessionToken");
          }
        }
      } else {
        // SessionUser is still loading - keep initializing true
        // Don't set initializing to false yet, wait for the query to complete
        setInitializing(true);
      }
      return;
    }
    
    // No session token - check Convex Auth
    if (currentUser === null) {
      // Convex Auth has returned null (no user)
      setUser(null);
      setInitializing(false);
    } else if (currentUser === undefined) {
      // Convex Auth is still loading
      setInitializing(true);
    }
  }, [currentUser, sessionUser, setUser, setInitializing, sessionToken]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading: currentUser === undefined && (sessionToken ? sessionUser === undefined : false),
    isInitializing: useAuthStore((state) => state.isInitializing),
  };
}

