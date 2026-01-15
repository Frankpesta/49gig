import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

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
