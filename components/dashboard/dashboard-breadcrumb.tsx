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
 * Features: Mobile-responsive, modern styling, smooth interactions
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
      <BreadcrumbList className="flex min-w-0 flex-nowrap items-center gap-1 text-sm">
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbLink asChild>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-md px-1.5 py-1 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              title="Go to Dashboard"
            >
              <Home className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only font-medium">Dashboard</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbItems.length > 0 && (
          <>
            {/* Mobile: only current page to avoid wrapping */}
            {currentPageLabel && (
              <>
                <BreadcrumbSeparator className="shrink-0 md:hidden [&>svg]:size-3.5" />
                <BreadcrumbItem className="min-w-0 md:hidden">
                  <BreadcrumbPage className="block truncate font-semibold text-foreground">
                    {currentPageLabel}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
            {/* Desktop: full trail */}
            {breadcrumbItems.map((item) => (
              <div key={item.href} className="hidden shrink-0 items-center gap-1 md:flex">
                <BreadcrumbSeparator className="[&>svg]:size-3.5" />
                <BreadcrumbItem>
                  {item.isLast ? (
                    <BreadcrumbPage className="max-w-[16rem] truncate font-semibold text-foreground">
                      {item.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link
                        href={item.href}
                        className="inline-block max-w-[10rem] truncate rounded-md px-1.5 py-1 font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                      >
                        {item.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </>
        )}
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


