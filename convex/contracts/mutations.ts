import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";

export const storeContract = internalMutation({
  args: {
    projectId: v.id("projects"),
    contractFileId: v.id("_storage"),
    actorId: v.id("users"),
    actorRole: v.union(
      v.literal("client"),
      v.literal("freelancer"),
      v.literal("moderator"),
      v.literal("admin"),
      v.literal("system")
    ),
    matchId: v.id("matches"),
    freelancerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.projectId, {
      contractFileId: args.contractFileId,
      contractGeneratedAt: now,
      contractSignedAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      action: "contract_generated",
      actionType: "system",
      actorId: args.actorId,
      actorRole: args.actorRole,
      targetType: "project",
      targetId: args.projectId,
      details: {
        matchId: args.matchId,
        freelancerId: args.freelancerId,
        contractFileId: args.contractFileId,
      },
      createdAt: now,
    });
  },
});

/**
 * Client or matched freelancer signs the project contract.
 * Records signature then schedules PDF regeneration. Emails all parties only when
 * the contract is fully executed (client + every matched freelancer signed);
 * intermediate signatures update the stored PDF without sending duplicate emails.
 */
export const signContract = mutation({
  args: {
    projectId: v.string(),
    userId: v.optional(v.id("users")),
    signedAtIp: v.optional(v.string()),
    signedAtUserAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const projectId = ctx.db.normalizeId("projects", args.projectId);
    if (!projectId) throw new Error("Invalid project ID");

    const user = args.userId
      ? await ctx.db.get(args.userId)
      : await getCurrentUser(ctx);
    if (!user || user.status !== "active") throw new Error("Not authenticated");

    const project = await ctx.db.get(projectId);
    if (!project) throw new Error("Project not found");

    const isClient = project.clientId === user._id;
    const isFreelancer =
      project.matchedFreelancerId === user._id ||
      (project.matchedFreelancerIds &&
        project.matchedFreelancerIds.includes(user._id));

    if (!isClient && !isFreelancer) throw new Error("Not authorized to sign this contract");

    const now = Date.now();

    if (isClient) {
      if (project.clientContractSignedAt) {
        return { alreadySigned: true };
      }
      await ctx.db.patch(projectId, {
        clientContractSignedAt: now,
        clientContractSignedAtIp: args.signedAtIp,
        clientContractSignedAtUserAgent: args.signedAtUserAgent,
        updatedAt: now,
      });
    } else {
      const existing = project.freelancerContractSignatures ?? [];
      if (existing.some((s) => s.freelancerId === user._id)) {
        return { alreadySigned: true };
      }
      await ctx.db.patch(projectId, {
        freelancerContractSignatures: [
          ...existing,
          {
            freelancerId: user._id,
            signedAt: now,
            signedAtIp: args.signedAtIp,
            signedAtUserAgent: args.signedAtUserAgent,
          },
        ],
        updatedAt: now,
      });
    }

    await ctx.db.insert("auditLogs", {
      action: "contract_signed",
      actionType: "system",
      actorId: user._id,
      actorRole: user.role,
      targetType: "project",
      targetId: projectId,
      details: {
        role: isClient ? "client" : "freelancer",
        accountId: user._id,
        timestamp: now,
        ip: args.signedAtIp,
        userAgent: args.signedAtUserAgent,
      },
      createdAt: now,
    });

    const updatedProject = await ctx.db.get(projectId);
    if (!updatedProject) {
      return { success: true };
    }

    const clientSigned = !!updatedProject.clientContractSignedAt;
    const freelancerIds = updatedProject.matchedFreelancerId
      ? [updatedProject.matchedFreelancerId]
      : updatedProject.matchedFreelancerIds ?? [];
    const signatures = updatedProject.freelancerContractSignatures ?? [];
    const allFreelancersSigned =
      freelancerIds.length > 0 &&
      freelancerIds.every((fid) =>
        signatures.some((s) => s.freelancerId === fid)
      );
    const fullyExecuted = clientSigned && allFreelancersSigned;

    const apiModule = require("../_generated/api");
    await ctx.scheduler.runAfter(
      0,
      apiModule.internal.contracts.actions.regenerateContractPdfAndSend,
      { projectId, sendEmails: fullyExecuted }
    );

    // When both parties have signed and project is still "matched", transition to in_progress
    if (project.status === "matched" && fullyExecuted) {
      await ctx.db.patch(projectId, {
        status: "in_progress",
        startedAt: updatedProject.startedAt ?? now,
        updatedAt: now,
      });
      await ctx.db.insert("auditLogs", {
        action: "project_status_updated",
        actionType: "system",
        actorId: user._id,
        actorRole: user.role,
        targetType: "project",
        targetId: projectId,
        details: { oldStatus: "matched", newStatus: "in_progress", reason: "contract_fully_signed" },
        createdAt: now,
      });
      // Ensure monthly cycles exist (idempotent; creates if missing, e.g. for projects that skipped payment flow)
      await ctx.scheduler.runAfter(
        0,
        apiModule.internal.monthlyBillingCycles.mutations.autoCreateMonthlyCyclesInternal,
        { projectId }
      );
      // Process upfront release when freelancer signs - run after cycles exist (500ms delay)
      await ctx.scheduler.runAfter(
        500,
        apiModule.internal.monthlyBillingCycles.mutations.processUpfrontReleaseForProjectInternal,
        { projectId }
      );
    }

    return { success: true, emailedParties: fullyExecuted };
  },
});

/**
 * Internal: update project's stored contract file (after regenerating PDF with signatures).
 */
export const updateContractFile = internalMutation({
  args: {
    projectId: v.id("projects"),
    contractFileId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      contractFileId: args.contractFileId,
      contractGeneratedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
