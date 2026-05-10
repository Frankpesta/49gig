import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import type { FunctionReference } from "convex/server";
import { resolveTargetTeamSize } from "../../lib/budget-calculator";
import { clearReplacementFlowFieldsOnProject } from "../projects/replacement";

const api = require("../_generated/api") as {
  api: {
    contracts: { actions: { generateAndSendContract: unknown } };
    notifications: { actions: { sendSystemNotification: unknown } };
  };
};

const internalAny = require("../_generated/api").internal as {
  projects: {
    actions: { sendMatchSuccessEmails: FunctionReference<"action", "internal"> };
  };
};

/**
 * Close extra pending client-selected rows for the same freelancer (duplicate seat / legacy).
 * Keeps the row where the freelancer already accepted; mirrors accept-flow cleanup.
 */
async function rejectDuplicatePendingSameFreelancerRows(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  now: number
): Promise<void> {
  const rows = await ctx.db
    .query("matches")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();
  const active = rows.filter(
    (m) =>
      m.clientAction === "accepted" &&
      (m.status === "pending" || m.status === "accepted")
  );
  const byFreelancer = new Map<string, Doc<"matches">[]>();
  for (const m of active) {
    const key = String(m.freelancerId);
    const list = byFreelancer.get(key) ?? [];
    list.push(m);
    byFreelancer.set(key, list);
  }
  for (const group of byFreelancer.values()) {
    if (group.length < 2) continue;
    const winner = group.find((m) => m.freelancerAction === "accepted");
    if (!winner) continue;
    for (const m of group) {
      if (m._id === winner._id) continue;
      if (m.status === "pending" && m.freelancerAction == null) {
        await ctx.db.patch(m._id, {
          status: "rejected",
          freelancerAction: "rejected",
          freelancerActionAt: now,
          updatedAt: now,
          freelancerRejectionReason:
            "Automatically closed: duplicate match row (reconcile).",
        });
      }
    }
  }
}

type ReconcileSkip =
  | "project_not_found"
  | "not_team_hire"
  | "wrong_status"
  | "no_client_selections"
  | "pending_freelancer_response"
  | "partial_team_awaiting_client"
  | "team_size_mismatch";

type ReconcileResult =
  | { ok: true; contractMatchId: Id<"matches"> }
  | { ok: false; reason: ReconcileSkip; detail?: string };

/**
 * If a team hire is stuck in `awaiting_freelancer` but every active client-selected match is
 * freelancer-accepted and the roster matches target headcount, advance to `matched` and schedule
 * the same side-effects as `respondToMatchAsFreelancer` (contracts, notifications).
 */
async function tryReconcileTeamAwaitingFreelancer(
  ctx: MutationCtx,
  projectId: Id<"projects">
): Promise<ReconcileResult> {
  const project = await ctx.db.get(projectId);
  if (!project) {
    return { ok: false, reason: "project_not_found" };
  }
  if (project.intakeForm.hireType !== "team") {
    return { ok: false, reason: "not_team_hire" };
  }
  if (project.status !== "awaiting_freelancer") {
    return {
      ok: false,
      reason: "wrong_status",
      detail: project.status,
    };
  }

  const now = Date.now();
  await rejectDuplicatePendingSameFreelancerRows(ctx, projectId, now);

  const allProjectMatches = await ctx.db
    .query("matches")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .collect();

  const clientAcceptedMatches = allProjectMatches.filter(
    (m) =>
      m.clientAction === "accepted" &&
      (m.status === "pending" || m.status === "accepted")
  );

  if (clientAcceptedMatches.length === 0) {
    return { ok: false, reason: "no_client_selections" };
  }

  const allFreelancerAccepted = clientAcceptedMatches.every(
    (m) => m.freelancerAction === "accepted"
  );
  if (!allFreelancerAccepted) {
    return { ok: false, reason: "pending_freelancer_response" };
  }

  const slotsRemain = (project.pendingTeamMemberSlots ?? 0) > 0;
  const awaitingMoreClientPicks = project.awaitingMatch === true && slotsRemain;
  if (awaitingMoreClientPicks) {
    return { ok: false, reason: "partial_team_awaiting_client" };
  }

  const mergedIds = [
    ...new Set(clientAcceptedMatches.map((m) => m.freelancerId)),
  ];
  const targetHeadcount = resolveTargetTeamSize(
    project.intakeForm.teamMemberCount,
    project.intakeForm.teamSize
  );
  if (mergedIds.length !== targetHeadcount) {
    return {
      ok: false,
      reason: "team_size_mismatch",
      detail: `expected ${targetHeadcount}, got ${mergedIds.length}`,
    };
  }

  const primaryMatch = clientAcceptedMatches
    .filter((m) => m.freelancerAction === "accepted")
    .sort((a, b) => a._creationTime - b._creationTime)[0];
  if (!primaryMatch) {
    return { ok: false, reason: "pending_freelancer_response" };
  }

  const sendSystemNotification = api.api.notifications.actions
    .sendSystemNotification as unknown as FunctionReference<"action", "internal">;

  const teamFinalPatch: Record<string, unknown> = {
    matchedFreelancerIds: mergedIds,
    status: "matched",
    matchedAt: project.matchedAt ?? now,
    updatedAt: now,
  };
  clearReplacementFlowFieldsOnProject(teamFinalPatch);
  await ctx.db.patch(projectId, teamFinalPatch as never);

  for (const m of allProjectMatches) {
    if (m._id === primaryMatch._id) continue;
    if (mergedIds.includes(m.freelancerId)) continue;
    if (m.status === "rejected") continue;
    await ctx.db.patch(m._id, { status: "rejected", updatedAt: now });
  }

  await ctx.db.insert("auditLogs", {
    action: "team_match_reconciled",
    actionType: "system",
    actorId: project.clientId,
    actorRole: "client",
    targetType: "project",
    targetId: projectId,
    details: {
      projectId,
      contractMatchId: primaryMatch._id,
      mergedFreelancerIds: mergedIds,
    },
    createdAt: now,
  });

  await ctx.scheduler.runAfter(0, sendSystemNotification, {
    userIds: [project.clientId],
    title: "Freelancer confirmed",
    message: `Your selected freelancer(s) have accepted the opportunity for "${project.intakeForm.title}". Contract generation is starting.`,
    type: "match",
    data: { matchId: primaryMatch._id, projectId },
  });

  await ctx.scheduler.runAfter(0, internalAny.projects.actions.sendMatchSuccessEmails, {
    projectId,
  });
  const generateAndSendContract = api.api.contracts.actions
    .generateAndSendContract as unknown as FunctionReference<"action">;
  await ctx.scheduler.runAfter(0, generateAndSendContract, {
    matchId: primaryMatch._id,
  });

  return { ok: true, contractMatchId: primaryMatch._id };
}

/**
 * One-shot repair: reconcile a single team project stuck after duplicate `matches` rows blocked completion.
 * Run from Convex dashboard: `internal.matching.internalMutations.reconcileTeamMatchStateForProjectInternal`.
 */
export const reconcileTeamMatchStateForProjectInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args): Promise<{
    outcome: "fixed" | "skipped";
    projectId: Id<"projects">;
    reason?: string;
    detail?: string;
    contractMatchId?: Id<"matches">;
  }> => {
    const result = await tryReconcileTeamAwaitingFreelancer(ctx, args.projectId);
    if (result.ok) {
      return {
        outcome: "fixed",
        projectId: args.projectId,
        contractMatchId: result.contractMatchId,
      };
    }
    return {
      outcome: "skipped",
      projectId: args.projectId,
      reason: result.reason,
      detail: result.detail,
    };
  },
});

/**
 * Scan `awaiting_freelancer` hires and fix team projects that qualify (cap to avoid long runs).
 */
export const reconcileStuckTeamMatchesBatchInternal = internalMutation({
  args: {
    maxProjects: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cap = Math.min(100, Math.max(1, args.maxProjects ?? 50));
    const candidates = await ctx.db
      .query("projects")
      .withIndex("by_status", (q) => q.eq("status", "awaiting_freelancer"))
      .take(500);

    const teamAwaiting = candidates
      .filter((p) => p.intakeForm.hireType === "team")
      .slice(0, cap);

    const fixedProjectIds: Id<"projects">[] = [];
    const skipped: { projectId: Id<"projects">; reason: string; detail?: string }[] =
      [];

    for (const p of teamAwaiting) {
      const result = await tryReconcileTeamAwaitingFreelancer(ctx, p._id);
      if (result.ok) {
        fixedProjectIds.push(p._id);
      } else {
        skipped.push({
          projectId: p._id,
          reason: result.reason,
          detail: result.detail,
        });
      }
    }

    return {
      processed: teamAwaiting.length,
      fixedCount: fixedProjectIds.length,
      fixedProjectIds,
      skipped,
    };
  },
});
