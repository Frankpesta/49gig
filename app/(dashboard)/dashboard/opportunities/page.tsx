"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, FolderKanban } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Opportunities page for freelancers.
 * With client-selects-talent matching, freelancers no longer accept opportunities here.
 * Projects appear under Dashboard → Projects when a client selects them.
 * This page redirects or explains the flow.
 */
export default function OpportunitiesPage() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Please log in</p>
      </div>
    );
  }

  if (user.role !== "freelancer") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">This page is for freelancers</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold">How you get projects</h1>
        <p className="text-muted-foreground">
          Clients choose talent from their matches. When you’re selected, the project shows up in your Projects.
        </p>
      </div>

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
