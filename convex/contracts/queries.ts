import { query, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";
import { getCurrentUser } from "../auth";
import {
  CLIENT_AGREEMENT_SECTIONS,
  FREELANCER_AGREEMENT_SECTIONS,
  getClientAgreementFilled,
  getFreelancerAgreementFilled,
} from "./content";

export const getContractContext = internalQuery({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      return null;
    }

    const project = await ctx.db.get(match.projectId);
    const client = project ? await ctx.db.get(project.clientId) : null;
    const freelancer = await ctx.db.get(match.freelancerId);

    if (!project || !client || !freelancer) {
      return null;
    }

    return {
      match: match as Doc<"matches">,
      project: project as Doc<"projects">,
      client: client as Doc<"users">,
      freelancer: freelancer as Doc<"users">,
    };
  },
});

/**
 * Get contract display data for in-app view.
 * Returns agreement sections and sign state for the current user (client or matched freelancer).
 */
export const getContractForProject = query({
  args: {
    projectId: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const projectId = ctx.db.normalizeId("projects", args.projectId);
    if (!projectId) return null;

    const user = args.userId
      ? await ctx.db.get(args.userId)
      : await getCurrentUser(ctx);
    if (!user || user.status !== "active") return null;

    const project = await ctx.db.get(projectId);
    if (!project) return null;

    const isClient = project.clientId === user._id;
    const isMatchedFreelancer =
      project.matchedFreelancerId === user._id ||
      (project.matchedFreelancerIds && project.matchedFreelancerIds.includes(user._id));

    if (!isClient && !isMatchedFreelancer) return null;

    const client = await ctx.db.get(project.clientId);
    const effectiveDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let freelancerNames = "";
    if (project.matchedFreelancerId) {
      const f = await ctx.db.get(project.matchedFreelancerId);
      freelancerNames = f?.name || "Freelancer";
    }
    if (project.matchedFreelancerIds && project.matchedFreelancerIds.length > 0) {
      const names = await Promise.all(
        project.matchedFreelancerIds.map((id) => ctx.db.get(id))
      );
      freelancerNames = names.map((u) => u?.name || "Freelancer").join(", ");
    }

    const clientName = client?.name || "Client";
    const hasClientSigned = !!project.clientContractSignedAt;
    const hasFreelancerSigned = isClient
      ? false
      : project.freelancerContractSignatures?.some(
          (s) => s.freelancerId === user._id
        ) ?? false;

    if (isClient) {
      return {
        role: "client" as const,
        sections: CLIENT_AGREEMENT_SECTIONS,
        filledBody: getClientAgreementFilled(
          clientName,
          freelancerNames,
          effectiveDate
        ),
        hasSigned: hasClientSigned,
        signedAt: project.clientContractSignedAt ?? undefined,
        projectTitle: project.intakeForm.title,
        clientName,
        freelancerNames,
        effectiveDate,
      };
    }

    return {
      role: "freelancer" as const,
      sections: FREELANCER_AGREEMENT_SECTIONS,
      filledBody: getFreelancerAgreementFilled(
        user.name || "Freelancer",
        effectiveDate
      ),
      hasSigned: hasFreelancerSigned,
      signedAt: project.freelancerContractSignatures?.find(
        (s) => s.freelancerId === user._id
      )?.signedAt,
      projectTitle: project.intakeForm.title,
      freelancerName: user.name || "Freelancer",
      effectiveDate,
    };
  },
});

/**
 * Internal: get project, client, and all matched freelancers for contract PDF generation.
 */
export const getProjectContractParties = internalQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;
    const client = await ctx.db.get(project.clientId);
    if (!client) return null;
    const freelancers: Doc<"users">[] = [];
    if (project.matchedFreelancerId) {
      const f = await ctx.db.get(project.matchedFreelancerId);
      if (f) freelancers.push(f);
    }
    if (project.matchedFreelancerIds?.length) {
      for (const id of project.matchedFreelancerIds) {
        const f = await ctx.db.get(id);
        if (f) freelancers.push(f);
      }
    }
    return {
      project: project as Doc<"projects">,
      client: client as Doc<"users">,
      freelancers,
    };
  },
});
