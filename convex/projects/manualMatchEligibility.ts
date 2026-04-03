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

/**
 * Solo: status matching and nobody on the hire yet.
 * Team: status matching and at least one unfilled role (accepted match), or headcount below target when intake has no slot labels.
 */
export async function projectEligibleForAdminManualMatch(
  ctx: AnyCtx,
  project: Doc<"projects">
): Promise<boolean> {
  if (project.status !== "matching") return false;
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
