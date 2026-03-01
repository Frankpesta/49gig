"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ProjectContractView } from "@/components/contracts/project-contract-view";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

function isValidConvexId(
  id: string | string[] | undefined
): id is Id<"projects"> {
  if (typeof id !== "string") return false;
  return /^[a-zA-Z][a-zA-Z0-9]*$/.test(id);
}

export default function ContractPage() {
  const params = useParams();
  const { user } = useAuth();
  const projectIdParam = params.projectId;
  const projectId = isValidConvexId(projectIdParam)
    ? (projectIdParam as Id<"projects">)
    : null;

  const project = useQuery(
    (api as any)["projects/queries"].getProject,
    user?._id && projectId ? { projectId, userId: user._id } : "skip"
  );

  if (!user) return null;

  if (!projectId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-lg font-semibold">Invalid Project</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              This project could not be found.
            </p>
            <Button asChild>
              <Link href="/dashboard/projects">Back to Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (project === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-lg font-semibold">Project not found</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              You don&apos;t have access to this project.
            </p>
            <Button asChild>
              <Link href="/dashboard/projects">Back to Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isClient = project.clientId === user._id;
  const hasSelected =
    project.selectedFreelancerId ||
    (project.selectedFreelancerIds && project.selectedFreelancerIds.length > 0);
  const hasMatched =
    project.matchedFreelancerId ||
    (project.matchedFreelancerIds && project.matchedFreelancerIds.length > 0);
  const canViewContract =
    isClient && (hasSelected || hasMatched);

  if (!canViewContract) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
            <h3 className="mb-2 text-lg font-semibold">Contract not available</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Select a freelancer first to view and sign the contract.
            </p>
            <Button asChild>
              <Link href={`/dashboard/projects/${projectId}/matches`}>
                Go to Matches
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/projects/${projectId}/matches`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold">Sign the contract</h1>
          <p className="text-sm text-muted-foreground">
            Review and sign the project agreement. Your signature will be added
            and a copy sent to your email and the freelancer&apos;s email.
          </p>
        </div>
      </div>
      <ProjectContractView projectId={projectId} userId={user._id} />
    </div>
  );
}
