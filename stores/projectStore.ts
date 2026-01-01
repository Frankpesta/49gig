import { create } from "zustand";
import type { Id } from "@/convex/_generated/dataModel";

export type ProjectStatus =
  | "draft"
  | "pending_funding"
  | "funded"
  | "matching"
  | "matched"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed";

export interface Project {
  _id: Id<"projects">;
  clientId: Id<"users">;
  intakeForm: {
    title: string;
    description: string;
    category: string;
    requiredSkills: string[];
    budget: number;
    timeline: string;
    deliverables: string[];
    additionalRequirements?: string;
  };
  status: ProjectStatus;
  matchedFreelancerId?: Id<"users">;
  matchedAt?: number;
  totalAmount: number;
  escrowedAmount: number;
  platformFee: number;
  currency: string;
  stripePaymentIntentId?: string;
  stripeCustomerId?: string;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
  client?: {
    _id: Id<"users">;
    name: string;
    email: string;
  };
  freelancer?: {
    _id: Id<"users">;
    name: string;
    email: string;
  };
}

export interface Milestone {
  _id: Id<"milestones">;
  projectId: Id<"projects">;
  title: string;
  description: string;
  order: number;
  amount: number;
  currency: string;
  status:
    | "pending"
    | "in_progress"
    | "submitted"
    | "approved"
    | "rejected"
    | "paid"
    | "disputed";
  dueDate: number;
  deliverables?: Array<{
    name: string;
    fileId?: Id<"_storage">;
    url?: string;
    submittedAt: number;
  }>;
  approvedBy?: Id<"users">;
  approvedAt?: number;
  rejectionReason?: string;
  submittedAt?: number;
  paidAt?: number;
  createdAt: number;
  updatedAt: number;
}

interface ProjectState {
  // Projects
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: Id<"projects">, updates: Partial<Project>) => void;
  setCurrentProject: (project: Project | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  setProjects: (projects) => set({ projects }),
  addProject: (project) =>
    set((state) => ({
      projects: [project, ...state.projects],
    })),
  updateProject: (projectId, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p._id === projectId ? { ...p, ...updates } : p
      ),
      currentProject:
        state.currentProject?._id === projectId
          ? { ...state.currentProject, ...updates }
          : state.currentProject,
    })),
  setCurrentProject: (project) => set({ currentProject: project }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

