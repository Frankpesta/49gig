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
  DollarSign,
  Mail,
  Wallet,
  CalendarCheck,
} from "lucide-react";
import type { UserRole } from "@/stores/authStore";

export type NavSection = "menu" | "general";

export interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  roles?: UserRole[];
  children?: NavItem[];
  section?: NavSection; // "menu" = main nav, "general" = settings/help
}

export const navigationItems: NavItem[] = [
  // Dashboard Home (All roles)
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    section: "menu",
    roles: ["client", "freelancer", "admin", "moderator"],
  },

  // Projects Section
  {
    title: "Projects",
    url: "/dashboard/projects",
    icon: FolderKanban,
    section: "menu",
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
    section: "menu",
    roles: ["client"],
  },

  // Chat (All roles)
  {
    title: "Messages",
    url: "/dashboard/chat",
    icon: MessageSquare,
    badge: 0, // Will be updated with real-time count
    section: "menu",
    roles: ["client", "freelancer", "admin", "moderator"],
  },

  // Wallet (Freelancers)
  {
    title: "Wallet",
    url: "/dashboard/wallet",
    icon: Wallet,
    section: "menu",
    roles: ["freelancer"],
  },

  // Monthly Approvals (Clients)
  {
    title: "Monthly Approvals",
    url: "/dashboard/monthly-approvals",
    icon: CalendarCheck,
    section: "menu",
    roles: ["client"],
  },

  // Transactions (All roles)
  {
    title: "Transactions",
    url: "/dashboard/transactions",
    icon: CreditCard,
    section: "menu",
    roles: ["client", "freelancer", "admin", "moderator"],
  },

  // Disputes
  {
    title: "Disputes",
    url: "/dashboard/disputes",
    icon: AlertCircle,
    section: "menu",
    roles: ["client", "freelancer", "moderator", "admin"],
  },

  // Moderator Dispute Management
  {
    title: "Dispute Management",
    url: "/dashboard/moderator/disputes",
    icon: AlertCircle,
    section: "menu",
    roles: ["moderator", "admin"],
  },

  // Admin & Moderator: User Management
  {
    title: "Users",
    url: "/dashboard/users",
    icon: Users,
    section: "menu",
    roles: ["admin", "moderator"],
  },

  // Admin & Moderator: Base rates by tech stack
  {
    title: "Pricing",
    url: "/dashboard/pricing",
    icon: DollarSign,
    section: "menu",
    roles: ["admin", "moderator"],
  },

  // Admin & Moderator: Contact Enquiries
  {
    title: "Enquiries",
    url: "/dashboard/enquiries",
    icon: Mail,
    section: "menu",
    roles: ["admin", "moderator"],
  },

  // Admin & Moderator: Notifications
  {
    title: "Notifications",
    url: "/dashboard/notifications",
    icon: Bell,
    section: "menu",
    roles: ["admin", "moderator"],
  },

  // Admin: Analytics
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
    section: "menu",
    roles: ["admin"],
  },

  // Admin: Audit Logs
  {
    title: "Audit Logs",
    url: "/dashboard/audit",
    icon: FileText,
    section: "menu",
    roles: ["admin"],
  },

  // Profile (All roles) - GENERAL
  {
    title: "Profile",
    url: "/dashboard/profile",
    icon: User,
    section: "general",
    roles: ["client", "freelancer", "admin", "moderator"],
  },

  // Settings (All roles) - GENERAL
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
    section: "general",
    roles: ["client", "freelancer", "admin", "moderator"],
  },

  // Notification History (All roles) - GENERAL
  {
    title: "Notification History",
    url: "/dashboard/notification-history",
    icon: Bell,
    section: "general",
    roles: ["client", "freelancer", "admin", "moderator"],
  },

  // Support (All roles) - GENERAL
  {
    title: "Help & Support",
    url: "/dashboard/support",
    icon: HelpCircle,
    section: "general",
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

/**
 * Get MENU section items (main navigation)
 */
export function getMenuItems(role: UserRole): NavItem[] {
  return getNavigationForRole(role).filter(
    (item) => item.section !== "general" && (!item.section || item.section === "menu")
  );
}

/**
 * Get GENERAL section items (settings, help, profile)
 */
export function getGeneralItems(role: UserRole): NavItem[] {
  return getNavigationForRole(role).filter((item) => item.section === "general");
}


