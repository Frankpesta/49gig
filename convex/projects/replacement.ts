import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";
import type { FunctionReference } from "convex/server";
import { resolveTargetTeamSize } from "../../lib/budget-calculator";
import { getRoleLabelsForProjectIntake } from "../../lib/team-slots";

const api = require("../_generated/api") as {
  api: { notifications: { actions: { sendSystemNotification: unknown } } };
};

/** Clear replacement UX flags once a new freelancer (or team) is matched again. */
export function clearReplacementFlowFieldsOnProject(
  basePatch: Record<string, unknown>
) {
  basePatch.replacementMatchingAt = undefined;
  basePatch.replacementFlowDisputeId = undefined;
}

/**
 * Apply moderator "replacement" dispute outcome: remove prior freelancer(s), reset matches & billing cycles,
 * invalidate contract, and queue fresh matching. Idempotent per dispute id.
 */
export const applyFreelancerReplacementInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
    disputeId: v.id("disputes"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return { applied: false, reason: "project_not_found" as const };
    }

    if (project.replacementFlowDisputeId === args.disputeId) {
      return { applied: false, reason: "already_applied" as const };
    }

    if (project.status !== "matching") {
      return { applied: false, reason: "not_matching" as const };
    }

    const now = Date.now();
    const formerFreelancerIds: Doc<"users">["_id"][] = [];
    if (project.matchedFreelancerId) {
      formerFreelancerIds.push(project.matchedFreelancerId);
    }
    if (project.matchedFreelancerIds?.length) {
      for (const id of project.matchedFreelancerIds) {
        if (!formerFreelancerIds.includes(id)) {
          formerFreelancerIds.push(id);
        }
      }
    }

    const matchRows = await ctx.db
      .query("matches")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const m of matchRows) {
      await ctx.db.delete(m._id);
    }

    const cycles = await ctx.db
      .query("monthlyBillingCycles")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const c of cycles) {
      await ctx.db.delete(c._id);
    }

    const intake = project.intakeForm;
    const isTeam = intake.hireType === "team";
    const targetHeadcount = isTeam
      ? resolveTargetTeamSize(intake.teamMemberCount, intake.teamSize)
      : 0;
    const allRoleLabels = isTeam ? getRoleLabelsForProjectIntake(intake) : [];

    const teamFields = isTeam
      ? {
          pendingTeamMemberSlots: targetHeadcount,
          rolesAwaitingMatch:
            allRoleLabels.length > 0 ? allRoleLabels : undefined,
          awaitingMatch: true,
          awaitingMatchSince: now,
        }
      : {
          pendingTeamMemberSlots: undefined,
          rolesAwaitingMatch: undefined,
          awaitingMatch: true,
          awaitingMatchSince: now,
        };

    await ctx.db.patch(args.projectId, {
      matchedFreelancerId: undefined,
      matchedFreelancerIds: undefined,
      matchedAt: undefined,
      selectedFreelancerId: undefined,
      selectedFreelancerIds: undefined,
      contractFileId: undefined,
      contractGeneratedAt: undefined,
      contractSignedAt: undefined,
      clientContractSignedAt: undefined,
      clientContractSignedAtIp: undefined,
      clientContractSignedAtUserAgent: undefined,
      freelancerContractSignatures: undefined,
      contractFullyExecutedEmailedAt: undefined,
      replacementMatchingAt: now,
      replacementFlowDisputeId: args.disputeId,
      ...teamFields,
      updatedAt: now,
    });

    await ctx.db.insert("auditLogs", {
      action: "freelancer_replacement_applied",
      actionType: "dispute",
      actorId: project.clientId,
      actorRole: "system",
      targetType: "project",
      targetId: args.projectId,
      details: {
        disputeId: args.disputeId,
        formerFreelancerIds,
      },
      createdAt: now,
    });

    const sendSystemNotification = api.api.notifications.actions
      .sendSystemNotification as unknown as FunctionReference<"action", "internal">;

    const title = project.intakeForm.title;
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [project.clientId],
      title: "Choose a replacement freelancer",
      message: `A moderator approved a freelancer replacement for “${title}”. Review new matches — your escrow balance is unchanged.`,
      type: "dispute",
      data: { projectId: args.projectId, disputeId: args.disputeId },
    });

    for (const fid of formerFreelancerIds) {
      await ctx.scheduler.runAfter(0, sendSystemNotification, {
        userIds: [fid],
        title: "Removed from hire",
        message: `You have been removed from “${title}” following a dispute resolution. You no longer have access to this hire.`,
        type: "dispute",
        data: { projectId: args.projectId, disputeId: args.disputeId },
      });
    }

    return {
      applied: true as const,
      isTeam,
      formerFreelancerCount: formerFreelancerIds.length,
    };
  },
});
