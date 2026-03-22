/**
 * Team hire: one row per freelancer (Option B).
 * Stored on project intake as teamSlots.
 */

import {
  getCategoryLabelForRole,
  getRoleLabelsFromProject,
  humanizeTeamRoleKey,
} from "./platform-skills";

export type TeamSlotExperienceLevel = "junior" | "mid" | "senior" | "expert";

export type TeamSlotIntake = {
  roleId: string;
  /** Required when roleId === software_development */
  softwareDevFieldId?: string;
  /** Experience level for this seat (team matching & pricing). Defaults to project-level if omitted. */
  experienceLevel?: TeamSlotExperienceLevel;
  skills: string[];
};

/** Empty slot for new rows */
export function emptyTeamSlot(): TeamSlotIntake {
  return { roleId: "", softwareDevFieldId: undefined, skills: [] };
}

/** Budget / pricing internal role keys (must match ROLE_DISPLAY_NAMES in budget-calculator). */
const PLATFORM_ROLE_ID_TO_BUDGET_ROLE: Record<string, string> = {
  ui_ux_design: "ui_designer",
  data_analytics: "data_analyst",
  devops_cloud: "cloud_engineer",
  cybersecurity_it: "backend_dev",
  ai: "ai_engineer",
  machine_learning: "data_scientist",
  blockchain: "blockchain_dev",
  qa_testing: "qa",
};

export function slotToBudgetRole(slot: TeamSlotIntake): {
  category: string;
  budgetRoleKey: string;
} {
  const category = getCategoryLabelForRole(slot.roleId || "software_development");
  if (slot.roleId === "software_development") {
    const field = slot.softwareDevFieldId || "fullstack_dev";
    return { category, budgetRoleKey: field };
  }
  const budgetRoleKey =
    PLATFORM_ROLE_ID_TO_BUDGET_ROLE[slot.roleId] ?? "backend_dev";
  return { category, budgetRoleKey };
}

/**
 * Aggregated lines for pricing (same role/category merged with count).
 */
export function compositionFromTeamSlots(
  slots: TeamSlotIntake[]
): Array<{ role: string; category: string; count: number }> {
  const map = new Map<
    string,
    { category: string; role: string; count: number }
  >();

  for (const slot of slots) {
    if (!slot.roleId) continue;
    const { category, budgetRoleKey } = slotToBudgetRole(slot);
    const key = `${category}::${budgetRoleKey}`;
    const prev = map.get(key);
    if (prev) prev.count += 1;
    else map.set(key, { category, role: budgetRoleKey, count: 1 });
  }

  return Array.from(map.values()).map((v) => ({
    role: v.role,
    category: v.category,
    count: v.count,
  }));
}

/**
 * Raw counts per budget role for team matching (e.g. { frontend_dev: 2, backend_dev: 1 }).
 */
export function teamSlotRoleCountsForMatching(
  slots: TeamSlotIntake[]
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const slot of slots) {
    if (!slot.roleId) continue;
    const { budgetRoleKey } = slotToBudgetRole(slot);
    out[budgetRoleKey] = (out[budgetRoleKey] ?? 0) + 1;
  }
  return out;
}

export function allSkillsFromTeamSlots(slots: TeamSlotIntake[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const s of slots) {
    for (const skill of s.skills) {
      if (!seen.has(skill)) {
        seen.add(skill);
        result.push(skill);
      }
    }
  }
  return result;
}

export function uniqueCategoriesFromTeamSlots(slots: TeamSlotIntake[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const s of slots) {
    if (!s.roleId) continue;
    const cat = getCategoryLabelForRole(s.roleId);
    if (!seen.has(cat)) {
      seen.add(cat);
      result.push(cat);
    }
  }
  return result;
}

export function primaryCategoryFromTeamSlots(slots: TeamSlotIntake[]): string {
  const first = slots.find((s) => s.roleId);
  if (!first) return "Software Development";
  return getCategoryLabelForRole(first.roleId);
}

/** Unique software sub-fields from slots (legacy / analytics). */
export function softwareDevFieldsFromTeamSlots(slots: TeamSlotIntake[]): string[] {
  const set = new Set<string>();
  for (const s of slots) {
    if (s.roleId === "software_development" && s.softwareDevFieldId) {
      set.add(s.softwareDevFieldId);
    }
  }
  return [...set];
}

const DEFAULT_SLOT_LEVEL: TeamSlotExperienceLevel = "mid";

/**
 * Per budget role key, ordered experience levels (one per team slot row).
 */
export function experienceLevelsPerBudgetRole(
  slots: TeamSlotIntake[],
  projectDefaultLevel: TeamSlotExperienceLevel = DEFAULT_SLOT_LEVEL
): Record<string, TeamSlotExperienceLevel[]> {
  const out: Record<string, TeamSlotExperienceLevel[]> = {};
  for (const s of slots) {
    if (!s.roleId) continue;
    const { budgetRoleKey } = slotToBudgetRole(s);
    const lvl = s.experienceLevel ?? projectDefaultLevel;
    if (!out[budgetRoleKey]) out[budgetRoleKey] = [];
    out[budgetRoleKey].push(lvl);
  }
  return out;
}

/** One budget line per filled team slot (for pricing when levels differ per seat). */
export function teamSlotsToBudgetLines(
  slots: TeamSlotIntake[],
  projectDefaultLevel: TeamSlotExperienceLevel = DEFAULT_SLOT_LEVEL
): Array<{
  budgetRoleKey: string;
  category: string;
  experienceLevel: TeamSlotExperienceLevel;
}> {
  const lines: Array<{
    budgetRoleKey: string;
    category: string;
    experienceLevel: TeamSlotExperienceLevel;
  }> = [];
  for (const s of slots) {
    if (!s.roleId) continue;
    const { category, budgetRoleKey } = slotToBudgetRole(s);
    lines.push({
      budgetRoleKey,
      category,
      experienceLevel: s.experienceLevel ?? projectDefaultLevel,
    });
  }
  return lines;
}

/** One entry per filled team seat — used for matching and stable `teamRole` labels. */
export type TeamSlotMatchSpec = {
  roleKey: string;
  experienceLevel: TeamSlotExperienceLevel;
  skills: string[];
  /** Stored on matches / shown in UI; unique per seat (e.g. "Frontend Developer #1"). */
  teamRoleLabel: string;
};

export function teamSlotsToMatchSpecs(
  slots: TeamSlotIntake[],
  projectDefaultLevel: TeamSlotExperienceLevel = DEFAULT_SLOT_LEVEL
): TeamSlotMatchSpec[] {
  const specs: TeamSlotMatchSpec[] = [];
  let filledOrdinal = 0;
  for (const s of slots) {
    if (!s.roleId) continue;
    const { budgetRoleKey } = slotToBudgetRole(s);
    filledOrdinal += 1;
    specs.push({
      roleKey: budgetRoleKey,
      experienceLevel: s.experienceLevel ?? projectDefaultLevel,
      skills: s.skills ?? [],
      teamRoleLabel: `${humanizeTeamRoleKey(budgetRoleKey)} #${filledOrdinal}`,
    });
  }
  return specs;
}

/** Role labels for partial team / UI when intake uses per-seat rows. */
export function getTeamSlotDisplayLabelsFromSlots(slots: TeamSlotIntake[]): string[] {
  return teamSlotsToMatchSpecs(slots).map((s) => s.teamRoleLabel);
}

/**
 * Prefer explicit team slot labels when slots are set; otherwise derive from skills/category.
 */
export function getRoleLabelsForProjectIntake(intake: {
  teamSlots?: TeamSlotIntake[];
  requiredSkills?: string[];
  talentCategory?: string;
  category?: string;
}): string[] {
  if (intake.teamSlots?.some((s) => s.roleId)) {
    return getTeamSlotDisplayLabelsFromSlots(intake.teamSlots as TeamSlotIntake[]);
  }
  return getRoleLabelsFromProject(intake);
}
