/**
 * Whether a freelancer is relevant to a hire's intake (skills + role alignment).
 * Used by admin manual matching to surface skill-aligned talent first.
 */

import {
  isFreelancerEligibleForProjectMatch,
  normalizeRequiredSkillsForMatching,
  projectPrimaryRoleId,
} from "./matching-skill-utils";
import type { TeamSlotIntake } from "./team-slots";

export type IntakeForRelevance = {
  hireType?: "single" | "team";
  teamSlots?: TeamSlotIntake[];
  requiredSkills?: string[];
  softwareDevFields?: string[];
  talentCategory?: string;
};

export function freelancerRelevantToProjectIntake(
  freelancer: {
    phoneVerifiedAt?: number;
    profile?: {
      skills?: string[];
      techField?: string;
      githubUrl?: string;
      behanceUrl?: string;
      linkedinUrl?: string;
      portfolioUrl?: string;
    };
  },
  intake: IntakeForRelevance
): boolean {
  if (intake.hireType === "team" && intake.teamSlots?.some((s) => s.roleId)) {
    for (const slot of intake.teamSlots!) {
      if (!slot.roleId) continue;
      const norm = normalizeRequiredSkillsForMatching({
        requiredSkills: [
          ...(slot.skills ?? []),
          ...(intake.requiredSkills ?? []),
        ],
        softwareDevFields: slot.softwareDevFieldId
          ? [slot.softwareDevFieldId]
          : intake.softwareDevFields,
        talentCategory: intake.talentCategory,
      });
      if (isFreelancerEligibleForProjectMatch(freelancer, norm, slot.roleId)) {
        return true;
      }
    }
    return false;
  }

  const norm = normalizeRequiredSkillsForMatching(intake);
  return isFreelancerEligibleForProjectMatch(
    freelancer,
    norm,
    projectPrimaryRoleId(intake)
  );
}
