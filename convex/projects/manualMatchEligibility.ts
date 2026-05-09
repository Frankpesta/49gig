import type { Doc } from "../_generated/dataModel";
import type { DataModel } from "../_generated/dataModel";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { resolveTargetTeamSize } from "../../lib/budget-calculator";
import { getRoleLabelsForProjectIntake } from "../../lib/team-slots";

type AnyCtx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;

export function matchedHeadcount(project: Doc<"projects">): number {
  const idsLen = project.matchedFreelancerIds?.length ?? 0;
  if (idsLen > 0) return idsLen;
  return project.matchedFreelancerId ? 1 : 0;
}

export function isTeamProject(project: Doc<"projects">): boolean {
  return project.intakeForm.hireType === "team";
}

/** Role slot labels that do not yet have an *accepted* match (team hires). */
export async function openTeamRoleLabelsForProject(
  ctx: AnyCtx,
  project: Doc<"projects">
): Promise<string[]> {
  const labels = getRoleLabelsForProjectIntake(project.intakeForm);
  if (labels.length === 0) return [];
  const rows = await ctx.db
    .query("matches")
    .withIndex("by_project", (q) => q.eq("projectId", project._id))
    .collect();
  const filled = new Set(
    rows
      .filter((m) => m.status === "accepted" && m.teamRole)
      .map((m) => m.teamRole as string)
  );
  return labels.filter((l) => !filled.has(l));
}

/** Statuses where admin manual matching is meaningful (pre–in_progress pipeline). */
export const MANUAL_MATCH_PROJECT_STATUSES = [
  "draft",
  "pending_funding",
  "funded",
  "matching",
  "awaiting_freelancer",
  "disputed",
] as const;

export type ManualMatchProjectStatus = (typeof MANUAL_MATCH_PROJECT_STATUSES)[number];

export function isManualMatchProjectStatus(
  status: string
): status is ManualMatchProjectStatus {
  return (MANUAL_MATCH_PROJECT_STATUSES as readonly string[]).includes(status);
}

/**
 * Listed when the hire is still in the matching pipeline:
 * - `awaitingMatch` is true (pre- or post-funding queue; same idea as getProjectsAwaitingMatch), or
 * - status is already `matching` (e.g. partial team) even if the flag was cleared.
 *
 * Slot rules: single hire has no one matched yet; team has an open role (no accepted match) or headcount below target.
 */
export async function projectEligibleForAdminManualMatch(
  ctx: AnyCtx,
  project: Doc<"projects">
): Promise<boolean> {
  if (!isManualMatchProjectStatus(project.status)) {
    return false;
  }

  if (project.status === "disputed") {
    const rematching =
      project.awaitingMatch === true ||
      project.replacementMatchingAt != null ||
      matchedHeadcount(project) === 0;
    if (!rematching) {
      return false;
    }
  } else if (project.status === "funded") {
    if (project.awaitingMatch === false && matchedHeadcount(project) > 0) {
      return false;
    }
  } else if (
    project.status === "draft" ||
    project.status === "pending_funding"
  ) {
    if (project.awaitingMatch === false) {
      return false;
    }
  }

  if (!isTeamProject(project)) {
    return matchedHeadcount(project) === 0;
  }
  const target = resolveTargetTeamSize(
    project.intakeForm.teamMemberCount,
    project.intakeForm.teamSize
  );
  const n = matchedHeadcount(project);
  const openLabels = await openTeamRoleLabelsForProject(ctx, project);
  if (openLabels.length > 0) return true;
  return n < target;
}
