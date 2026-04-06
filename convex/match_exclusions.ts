import { Doc, Id } from "./_generated/dataModel";

/** Merge removed freelancer ids into the project's permanent exclusion list (this hire only). */
export function mergePermanentExclusions(
  existing: Id<"users">[] | undefined,
  toAdd: Id<"users">[]
): Id<"users">[] {
  const set = new Set<string>();
  for (const id of existing ?? []) set.add(String(id));
  for (const id of toAdd) set.add(String(id));
  return Array.from(set) as Id<"users">[];
}

/**
 * Who is removed from the hire when a dispute resolves for client favor or replacement,
 * before project matched fields are cleared (same rules as resolveDispute patches).
 */
export function freelancersRemovedForPermanentExclusion(
  project: Doc<"projects">,
  dispute: Doc<"disputes">
): Id<"users">[] {
  const isTeamProject = (project.matchedFreelancerIds?.length ?? 0) > 0;
  const isPartialTeam =
    isTeamProject &&
    dispute.disputedFreelancerIds &&
    dispute.disputedFreelancerIds.length > 0 &&
    dispute.disputedFreelancerIds.length < (project.matchedFreelancerIds?.length ?? 0);

  if (isPartialTeam && dispute.disputedFreelancerIds) {
    return [...dispute.disputedFreelancerIds];
  }
  const ids: Id<"users">[] = [];
  if (project.matchedFreelancerId) ids.push(project.matchedFreelancerId);
  if (project.matchedFreelancerIds) {
    for (const id of project.matchedFreelancerIds) {
      if (!ids.some((x) => String(x) === String(id))) ids.push(id);
    }
  }
  return ids;
}

export function isFreelancerPermanentlyExcluded(
  project: Doc<"projects">,
  freelancerId: string
): boolean {
  const list = project.permanentlyExcludedFreelancerIds;
  if (!list?.length) return false;
  return list.some((id) => String(id) === String(freelancerId));
}
