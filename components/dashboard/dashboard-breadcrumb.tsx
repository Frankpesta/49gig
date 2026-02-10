"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

/**
 * Dashboard Breadcrumb Component
 * Automatically generates breadcrumbs based on the current route
 */
export function DashboardBreadcrumb() {
  const pathname = usePathname();

  // Split pathname into segments
  const segments = pathname.split("/").filter(Boolean);

  // Build breadcrumb items
  const breadcrumbItems = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    const label = formatSegmentLabel(segment);

    return {
      href,
      label,
      isLast,
    };
  });

  // On mobile: show only Home + current page to avoid awkward wrapping
  const currentPageLabel =
    breadcrumbItems.length > 0
      ? breadcrumbItems[breadcrumbItems.length - 1]!.label
      : null;

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap overflow-hidden min-w-0">
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbLink asChild>
            <Link href="/dashboard" className="flex items-center gap-1">
              <Home className="h-4 w-4 shrink-0" />
              <span className="sr-only sm:not-sr-only">Dashboard</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbItems.length > 0 && <BreadcrumbSeparator className="shrink-0" />}
        {/* Mobile: only current page (avoids wrapping "Dashboard > Projects > Create") */}
        {currentPageLabel && (
          <BreadcrumbItem className="min-w-0 md:hidden">
            <BreadcrumbPage className="truncate block">{currentPageLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
        {/* Desktop: full trail */}
        {breadcrumbItems.map((item) => (
          <div key={item.href} className="hidden md:flex items-center shrink-0">
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage className="truncate max-w-[12rem]">{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href} className="truncate max-w-[8rem] inline-block">
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!item.isLast && <BreadcrumbSeparator />}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/**
 * Format segment label for display
 * Converts URL segments to readable labels
 */
function formatSegmentLabel(segment: string): string {
  // Handle special cases
  const labelMap: Record<string, string> = {
    dashboard: "Dashboard",
    projects: "Projects",
    messages: "Messages",
    payments: "Payments",
    profile: "Profile",
    settings: "Settings",
    opportunities: "Opportunities",
    disputes: "Disputes",
    users: "Users",
    analytics: "Analytics",
    audit: "Audit Logs",
    support: "Help & Support",
    create: "Create",
    edit: "Edit",
  };

  // Check if it's a known label
  if (labelMap[segment]) {
    return labelMap[segment];
  }

  // Convert kebab-case to Title Case
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}


