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
 * Records signature then schedules PDF regeneration and email.
 */
export const signContract = mutation({
  args: {
    projectId: v.string(),
    userId: v.optional(v.id("users")),
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
          { freelancerId: user._id, signedAt: now },
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
      details: { role: isClient ? "client" : "freelancer" },
      createdAt: now,
    });

    const apiModule = require("../_generated/api");
    await ctx.scheduler.runAfter(
      0,
      apiModule.internal.contracts.actions.regenerateContractPdfAndSend,
      { projectId }
    );

    return { success: true };
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
