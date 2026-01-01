/**
 * Navigation Configuration for 49GIG Dashboard
 * Role-based navigation items
 */

import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  User,
  Settings,
  CreditCard,
  Users,
  Shield,
  FileText,
  BarChart3,
  Bell,
  HelpCircle,
  Briefcase,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { UserRole } from "@/stores/authStore";

export interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  roles?: UserRole[];
  children?: NavItem[];
}

export const navigationItems: NavItem[] = [
  // Dashboard Home (All roles)
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["client", "freelancer", "admin", "moderator"],
  },

  // Projects Section
  {
    title: "Projects",
    url: "/dashboard/projects",
    icon: FolderKanban,
    roles: ["client", "freelancer", "admin"],
    children: [
      {
        title: "All Projects",
        url: "/dashboard/projects",
        icon: FolderKanban,
      },
      {
        title: "Active",
        url: "/dashboard/projects?status=active",
        icon: CheckCircle2,
      },
      {
        title: "Completed",
        url: "/dashboard/projects?status=completed",
        icon: CheckCircle2,
      },
    ],
  },

  // Client-specific: Create Project
  {
    title: "Create Project",
    url: "/dashboard/projects/create",
    icon: Briefcase,
    roles: ["client"],
  },

  // Freelancer-specific: Opportunities
  {
    title: "Opportunities",
    url: "/dashboard/opportunities",
    icon: Briefcase,
    roles: ["freelancer"],
  },

  // Chat (All roles)
  {
    title: "Messages",
    url: "/dashboard/messages",
    icon: MessageSquare,
    badge: 0, // Will be updated with real-time count
    roles: ["client", "freelancer", "admin", "moderator"],
  },

  // Transactions (All roles)
  {
    title: "Transactions",
    url: "/dashboard/transactions",
    icon: CreditCard,
    roles: ["client", "freelancer", "admin", "moderator"],
  },

  // Disputes
  {
    title: "Disputes",
    url: "/dashboard/disputes",
    icon: AlertCircle,
    roles: ["client", "freelancer", "moderator", "admin"],
  },

  // Admin & Moderator: User Management
  {
    title: "Users",
    url: "/dashboard/users",
    icon: Users,
    roles: ["admin", "moderator"],
  },

  // Admin: Analytics
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
    roles: ["admin"],
  },

  // Admin: Audit Logs
  {
    title: "Audit Logs",
    url: "/dashboard/audit",
    icon: FileText,
    roles: ["admin"],
  },

  // Profile (All roles)
  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: User,
    roles: ["client", "freelancer", "admin", "moderator"],
  },

  // Settings (All roles)
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
    roles: ["client", "freelancer", "admin", "moderator"],
  },

  // Support (All roles)
  {
    title: "Help & Support",
    url: "/dashboard/support",
    icon: HelpCircle,
    roles: ["client", "freelancer", "admin", "moderator"],
  },
];

/**
 * Get navigation items filtered by user role
 */
export function getNavigationForRole(role: UserRole): NavItem[] {
  return navigationItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  );
}

/**
 * Get main navigation items (no children) for a role
 */
export function getMainNavigation(role: UserRole): NavItem[] {
  return getNavigationForRole(role).filter((item) => !item.children);
}

/**
 * Get navigation groups (items with children) for a role
 */
export function getNavigationGroups(role: UserRole): NavItem[] {
  return getNavigationForRole(role).filter((item) => item.children);
}


