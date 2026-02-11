"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileSignature } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface ProjectContractViewProps {
  projectId: string;
  userId: Id<"users">;
}

export function ProjectContractView({ projectId, userId }: ProjectContractViewProps) {
  const contractData = useQuery(api.contracts.queries.getContractForProject, {
    projectId,
    userId,
  });
  const signContract = useMutation(api.contracts.mutations.signContract);

  if (contractData === undefined) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (contractData === null) {
    return null;
  }

  const handleSign = async () => {
    try {
      const result = await signContract({ projectId, userId });
      if ((result as { alreadySigned?: boolean }).alreadySigned) {
        toast.info("You have already signed this contract.");
        return;
      }
      toast.success("Contract signed. A copy has been sent to your email.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to sign contract");
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="h-5 w-5" />
          {contractData.role === "client"
            ? "49GIG Client Project Agreement"
            : "49GIG Freelancer Project Agreement"}
        </CardTitle>
        <CardDescription>
          Project: {contractData.projectTitle}
          {contractData.hasSigned && contractData.signedAt && (
            <span className="block mt-1 text-primary">
              You signed on {new Date(contractData.signedAt).toLocaleDateString("en-US", { dateStyle: "long" })}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className="rounded-lg border bg-muted/30 p-6 max-h-[60vh] overflow-y-auto text-sm whitespace-pre-wrap font-[inherit]"
          style={{ fontFamily: "inherit" }}
        >
          {contractData.filledBody}
        </div>
        {!contractData.hasSigned ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              By clicking below, you agree to the terms above. Your name will be added as your signature and a copy will be sent to your email.
            </p>
            <Button
              onClick={handleSign}
              className="font-semibold text-base px-8 py-6"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: "italic" }}
            >
              Approve &amp; Sign
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            You have signed this contract. You can access the project details below.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
