import { create } from "zustand";
import type { Id } from "@/convex/_generated/dataModel";

export type UserRole = "client" | "freelancer" | "moderator" | "admin";

export interface User {
  _id: Id<"users">;
  email: string;
  emailVerified: boolean;
  name: string;
  authProvider: "email" | "google" | "magic_link";
  role: UserRole;
  profile?: {
    // Client profile fields
    companyName?: string;
    companySize?: string;
    industry?: string;
    workEmail?: string;
    phoneNumber?: string;
    companyWebsite?: string;
    country?: string;
    // Freelancer profile fields
    bio?: string;
    skills?: string[];
    techField?: "development" | "data_science" | "technical_writing" | "design" | "other";
    experienceLevel?: "junior" | "mid" | "senior" | "expert";
    languagesWritten?: string[];
    hourlyRate?: number;
    availability?: "available" | "busy" | "unavailable";
    timezone?: string;
    portfolioUrl?: string;
  };
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  status: "active" | "suspended" | "deleted";
  createdAt: number;
  updatedAt: number;
}

interface AuthState {
  // User data
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitializing: (initializing: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  setInitializing: (initializing) => set({ isInitializing: initializing }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
    }),
}));


