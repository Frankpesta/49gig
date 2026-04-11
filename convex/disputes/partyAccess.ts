import type { Doc, Id } from "../_generated/dataModel";

/**
 * Users who may access a dispute thread (client, initiator, and either all matched
 * freelancers or only disputed members on partial team disputes).
 */
export function getDisputePartyUserIds(
  project: Doc<"projects">,
  dispute: Doc<"disputes">
): Id<"users">[] {
  const ids = new Set<string>();
  ids.add(String(project.clientId));

  const teamIds: Id<"users">[] = project.matchedFreelancerId
    ? [project.matchedFreelancerId]
    : [...(project.matchedFreelancerIds ?? [])];

  const disputed = dispute.disputedFreelancerIds ?? [];
  const isPartialTeam =
    teamIds.length > 1 &&
    disputed.length > 0 &&
    disputed.length < teamIds.length;

  ids.add(String(dispute.initiatorId));

  if (isPartialTeam) {
    for (const id of disputed) {
      ids.add(String(id));
    }
  } else {
    for (const id of teamIds) {
      ids.add(String(id));
    }
  }

  return Array.from(ids) as Id<"users">[];
}

export function viewerIsDisputeParty(
  userId: Id<"users">,
  project: Doc<"projects">,
  dispute: Doc<"disputes">
): boolean {
  return getDisputePartyUserIds(project, dispute).some((id) => String(id) === String(userId));
}

/** Freelancers who should receive dispute outcome emails (partial team → disputed only). */
export function getDisputeRecipientFreelancerIds(
  project: Doc<"projects">,
  dispute: Doc<"disputes">
): Id<"users">[] {
  const teamIds: Id<"users">[] = project.matchedFreelancerId
    ? [project.matchedFreelancerId]
    : [...(project.matchedFreelancerIds ?? [])];
  const disputed = dispute.disputedFreelancerIds ?? [];
  const isPartialTeam =
    teamIds.length > 1 &&
    disputed.length > 0 &&
    disputed.length < teamIds.length;
  const target = isPartialTeam ? disputed : teamIds;
  const onTeam = new Set(teamIds.map(String));
  return target.filter((id) => onTeam.has(String(id))) as Id<"users">[];
}
