/**
 * Team hire: one row per freelancer (Option B).
 * Stored on project intake as teamSlots.
 */

import { getCategoryLabelForRole } from "./platform-skills";

export type TeamSlotIntake = {
  roleId: string;
  /** Required when roleId === software_development */
  softwareDevFieldId?: string;
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
