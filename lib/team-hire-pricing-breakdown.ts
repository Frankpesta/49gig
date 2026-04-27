/**
 * Recompute team hire budget from platform pricing config (same path as create/edit intake).
 * Used on project detail so per-seat $/mo matches admin pricing + intake calculator.
 */

import {
  calculateProjectBudget,
  type ExperienceLevel,
  type ProjectType,
  type RoleType,
} from "./budget-calculator";
import {
  allSkillsFromTeamSlots,
  primaryCategoryFromTeamSlots,
  uniqueCategoriesFromTeamSlots,
  type TeamSlotIntake,
} from "./team-slots";

/** Same shape as `api.pricing.queries.getPricingConfig` merged document. */
export type BaseRatesByCategoryMap = Record<
  string,
  { junior: number; mid: number; senior: number; expert: number }
>;

function projectTypeFromIntake(
  projectType: "one_time" | "ongoing" | "not_sure" | undefined
): ProjectType {
  return projectType ?? "ongoing";
}

/**
 * Returns the same `calculateProjectBudget` result as the hire intake form when
 * `baseRatesByCategory` is the DB `getPricingConfig` payload (or undefined → calculator fallbacks).
 */
export function teamHireBudgetFromPricingConfig(input: {
  teamMemberCount: number;
  teamSlots: TeamSlotIntake[];
  experienceLevel: ExperienceLevel;
  roleType: RoleType;
  startDate: Date;
  endDate: Date;
  intakeProjectType?: "one_time" | "ongoing" | "not_sure";
  pricingConfig: BaseRatesByCategoryMap | undefined;
}): ReturnType<typeof calculateProjectBudget> | null {
  const {
    teamMemberCount,
    teamSlots,
    experienceLevel,
    roleType,
    startDate,
    endDate,
    intakeProjectType,
    pricingConfig,
  } = input;

  const slots = teamSlots ?? [];
  const complete = slots.every(
    (s) =>
      !!s.roleId &&
      (s.roleId !== "software_development" || !!s.softwareDevFieldId) &&
      (s.skills?.length ?? 0) > 0 &&
      !!s.experienceLevel
  );
  if (!slots.length || slots.length !== teamMemberCount || !complete) {
    return null;
  }
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate.getTime() < startDate.getTime()) {
    return null;
  }

  const categoriesForBudget = uniqueCategoriesFromTeamSlots(slots);
  const calc = calculateProjectBudget({
    hireType: "team",
    teamMemberCount,
    teamSlots: slots,
    experienceLevel,
    projectType: projectTypeFromIntake(intakeProjectType),
    startDate,
    endDate,
    talentCategory: primaryCategoryFromTeamSlots(slots),
    baseRatesByCategory: pricingConfig,
    roleType,
    skillsRequired:
      categoriesForBudget.length > 0 ? categoriesForBudget : ["Software Development"],
    selectedSkillNames: allSkillsFromTeamSlots(slots),
  });

  if (!Number.isFinite(calc.estimatedBudget) || calc.estimatedBudget <= 0) {
    return null;
  }
  return calc;
}
