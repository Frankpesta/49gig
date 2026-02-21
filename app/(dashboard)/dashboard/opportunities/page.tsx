"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, FolderKanban } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";

/**
 * Opportunities page for freelancers.
 * With client-selects-talent matching, freelancers no longer accept opportunities here.
 * Projects appear under Dashboard → Projects when a client selects them.
 * This page redirects or explains the flow.
 */
export default function OpportunitiesPage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <DashboardEmptyState icon={Briefcase} title="Please log in" />;
  }

  if (user.role !== "freelancer") {
    return <DashboardEmptyState icon={Briefcase} title="This page is for freelancers" />;
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="How you get projects"
        description="Clients choose talent from their matches. When you are selected, the project appears in Projects."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            No need to accept opportunities
          </CardTitle>
          <CardDescription>
            We match you to projects based on your profile and skills. Clients review matched talent and select who they want. Once a client selects you, the project appears under Projects and you can proceed to payment and work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard/projects" className="inline-flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              View my projects
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
