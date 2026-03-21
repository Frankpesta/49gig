"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { FileSignature } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { getUserFriendlyError } from "@/lib/error-handling";
import { useAnalytics } from "@/hooks/use-analytics";

interface ProjectContractViewProps {
  projectId: string;
  userId: Id<"users">;
}

export function ProjectContractView({ projectId, userId }: ProjectContractViewProps) {
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const [agreed, setAgreed] = useState(false);
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
    if (!agreed) {
      toast.error("Please confirm you have read and agree to the agreement before signing.");
      return;
    }
    try {
      let signedAtIp: string | undefined;
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        signedAtIp = data.ip;
      } catch {
        // Ignore IP fetch failure
      }
      const signedAtUserAgent = typeof navigator !== "undefined" ? navigator.userAgent : undefined;
      const result = await signContract({
        projectId,
        userId,
        signedAtIp,
        signedAtUserAgent,
      });
      if ((result as { alreadySigned?: boolean }).alreadySigned) {
        toast.info("You have already signed this contract.");
        return;
      }
      trackEvent("sign_contract", { project_id: projectId, role: contractData.role });
      const emailed = (result as { emailedParties?: boolean }).emailedParties === true;
      if (emailed) {
        toast.success(
          "Contract fully signed. A final PDF has been emailed to you, the freelancer(s), and 49GIG."
        );
      } else {
        toast.success(
          "Signature saved. The contract PDF in your dashboard is updated. You’ll receive an email with the final signed copy once everyone has signed."
        );
      }
      if (contractData.role === "client") {
        router.push(`/dashboard/projects/${projectId}/payment`);
      }
    } catch (e) {
      toast.error(getUserFriendlyError(e) || "Failed to sign contract");
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
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <Checkbox
                checked={agreed}
                onCheckedChange={(v) => setAgreed(v === true)}
                className="mt-0.5 shrink-0"
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                I have read, understood, and agree to the 49GIG {contractData.role === "client" ? "Client" : "Freelancer"} Agreement.
              </span>
            </label>
            <p className="text-sm text-muted-foreground">
              By signing below, your name will be added as your signature and a copy will be sent to your email.
            </p>
            <Button
              onClick={handleSign}
              disabled={!agreed}
              className="font-semibold text-base px-8 py-6"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: "italic" }}
            >
              Sign manually
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
