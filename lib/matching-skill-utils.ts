/**
 * Shared skill matching for Convex matching actions and lib/team-matching.
 * Keeps normalization and fuzzy rules in one place.
 */

import {
  freelancerMatchesRole,
  getRoleIdFromCategoryLabel,
  getSoftwareDevFieldSkills,
  isCategoryLabel,
  isLegacyCategoryLabel,
  SOFTWARE_DEV_FIELDS,
} from "./platform-skills";
import { freelancerHasVerifiedPhoneForMatching } from "./freelancer-profile-links";

export const MIN_REQUIRED_SKILL_OVERLAP_PERCENT = 50;

function isSoftwareDevSubFieldId(value: string): boolean {
  return SOFTWARE_DEV_FIELDS.some((f) => f.id === value);
}

export type IntakeForSkillNormalize = {
  requiredSkills?: string[];
  softwareDevFields?: string[];
  talentCategory?: string;
};

/**
 * If a required skill matches any freelancer skill (fuzzy / word-safe).
 */
export function skillMatches(required: string, freelancerSkill: string): boolean {
  const r = required.toLowerCase().trim();
  const f = freelancerSkill.toLowerCase().trim();
  if (!r || !f) return false;
  if (r === f) return true;
  const normalize = (s: string) =>
    s.replace(/\s*[.\-]\s*js$/i, "").replace(/\s+/g, " ").trim();
  if (normalize(r) === normalize(f)) return true;
  const isWordBoundary = (idx: number, len: number, str: string) => {
    const beforeOk = idx === 0 || !/[\w]/.test(str[idx - 1]);
    const afterOk = idx + len >= str.length || !/[\w]/.test(str[idx + len]);
    return beforeOk && afterOk;
  };
  const idx = f.indexOf(r);
  if (idx >= 0 && isWordBoundary(idx, r.length, f)) return true;
  const idxR = r.indexOf(f);
  if (idxR >= 0 && f.length >= 3 && isWordBoundary(idxR, f.length, r)) return true;
  return false;
}

/**
 * Strip category labels and software sub-field ids; expand softwareDevFields when needed.
 */
export function normalizeRequiredSkillsForMatching(
  intake: IntakeForSkillNormalize
): string[] {
  const raw = intake.requiredSkills ?? [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of raw) {
    if (!s || typeof s !== "string") continue;
    const t = s.trim();
    if (!t) continue;
    if (isCategoryLabel(t) || isLegacyCategoryLabel(t)) continue;
    if (isSoftwareDevSubFieldId(t)) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  if (out.length === 0 && intake.softwareDevFields && intake.softwareDevFields.length > 0) {
    return getSoftwareDevFieldSkills(intake.softwareDevFields);
  }
  return out;
}

export function projectPrimaryRoleId(intake: IntakeForSkillNormalize): string {
  return getRoleIdFromCategoryLabel(intake.talentCategory || "Software Development");
}

/** Map team-composition / slot role keys to platform category role ids (for techField checks). */
export function platformRoleIdForTeamRoleKey(roleKey: string): string {
  const k = roleKey.toLowerCase();
  if (
    k === "mobile_dev" ||
    k === "backend_dev" ||
    k === "frontend_dev" ||
    k === "fullstack_dev" ||
    k === "game_dev" ||
    k === "desktop_dev" ||
    k === "embedded_dev" ||
    k === "ios_dev" ||
    k === "android_dev"
  ) {
    return "software_development";
  }
  if (k === "ui_designer" || k === "ux_designer") return "ui_ux_design";
  if (k === "cloud_engineer" || k === "devops") return "devops_cloud";
  if (k === "data_scientist" || k === "data_analyst" || k === "data_engineer") {
    return "data_analytics";
  }
  if (k === "ai_engineer") return "ai";
  if (k === "blockchain_dev") return "blockchain";
  if (k === "qa" || k === "qa_engineer") return "qa_testing";
  return "software_development";
}

export function freelancerMatchesAtLeastOneRequiredSkill(
  requiredSkills: string[],
  freelancerSkills: string[] | undefined
): boolean {
  if (requiredSkills.length === 0) return true;
  const fs = freelancerSkills ?? [];
  if (fs.length === 0) return false;
  return requiredSkills.some((skill) => fs.some((f) => skillMatches(skill, f)));
}

export function freelancerMatchesAllRequiredSkills(
  requiredSkills: string[],
  freelancerSkills: string[] | undefined
): boolean {
  if (requiredSkills.length === 0) return true;
  const fs = freelancerSkills ?? [];
  if (fs.length === 0) return false;
  return requiredSkills.every((skill) => fs.some((f) => skillMatches(skill, f)));
}

export function freelancerMeetsRequiredSkillThreshold(
  requiredSkills: string[],
  freelancerSkills: string[] | undefined,
  minPercent = MIN_REQUIRED_SKILL_OVERLAP_PERCENT
): boolean {
  if (requiredSkills.length === 0) return true;
  return calculateSkillOverlapPercent(requiredSkills, freelancerSkills ?? []) >= minPercent;
}

/**
 * Skill overlap 0–100. Empty required → 0 (caller should use category fallback).
 */
export function calculateSkillOverlapPercent(
  requiredSkills: string[],
  freelancerSkills: string[]
): number {
  if (requiredSkills.length === 0) return 0;
  if (freelancerSkills.length === 0) return 0;
  const matchedSkills = requiredSkills.filter((skill) =>
    freelancerSkills.some((fs) => skillMatches(skill, fs))
  );
  return (matchedSkills.length / requiredSkills.length) * 100;
}

/**
 * Hard gate: SMS-verified phone + techField category + enough required skills.
 * Portfolio links are enforced during onboarding / profile save, not here.
 *
 * techField is ALWAYS enforced as a category gate (when set), regardless of whether skills
 * are present. This prevents cross-category mismatches such as a data analyst matching a
 * software development slot just because they share a skill like SQL or Python.
 *
 * If techField is not set on the freelancer profile we fall through to skill-only matching
 * so that freelancers who haven't filled their profile yet aren't silently excluded.
 */
export function isFreelancerEligibleForProjectMatch(
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
  normalizedRequired: string[],
  projectRoleId: string
): boolean {
  if (!freelancerHasVerifiedPhoneForMatching(freelancer)) {
    return false;
  }

  // Category gate — always enforced when techField is set.
  if (!freelancerMatchesRole(freelancer.profile?.techField, projectRoleId)) {
    return false;
  }

  // Skill gate — enough overlap keeps matching useful without requiring every nice-to-have.
  if (normalizedRequired.length > 0) {
    if (!freelancerMeetsRequiredSkillThreshold(normalizedRequired, freelancer.profile?.skills)) {
      return false;
    }
  }

  return true;
}

/**
 * Sub-field gate for software-development slots.
 *
 * `platformRoleIdForTeamRoleKey` maps all software-dev sub-fields (frontend_dev, backend_dev,
 * mobile_dev, …) to the same parent category id "software_development". This means a backend
 * developer and a mobile developer both pass the category gate for each other's slots.
 *
 * This function uses the canonical per-sub-field skill list to add a second discriminator:
 * the freelancer must have at least one skill that belongs to the target sub-field's cluster.
 *
 * Returns true when:
 *  - the budgetRoleKey is not a recognised software-dev sub-field (no constraint to apply), OR
 *  - the freelancer has at least one skill from the target sub-field's canonical list.
 */
export function freelancerFitsSubField(
  freelancerSkills: string[] | undefined,
  budgetRoleKey: string
): boolean {
  const subFieldSkills = getSoftwareDevFieldSkills([budgetRoleKey]);
  // If no canonical skills are defined for this key it isn't a software-dev sub-field — skip.
  if (subFieldSkills.length === 0) return true;

  const fs = freelancerSkills ?? [];
  if (fs.length === 0) return false;

  return fs.some((fl) => subFieldSkills.some((cs) => skillMatches(cs, fl)));
}

export function freelancerHasExactSoftwareSubField(
  freelancer: { profile?: { softwareDevFields?: string[]; primaryRole?: string; skills?: string[] } },
  budgetRoleKey: string
): boolean {
  if (!isSoftwareDevSubFieldId(budgetRoleKey)) return true;
  const savedSubFields = freelancer.profile?.softwareDevFields ?? [];
  if (savedSubFields.length > 0) {
    return savedSubFields.includes(budgetRoleKey);
  }
  // Legacy profiles may not have softwareDevFields yet, so use skills/primaryRole as fallback.
  if (freelancerFitsSubField(freelancer.profile?.skills, budgetRoleKey)) {
    return true;
  }
  const roleLabel = SOFTWARE_DEV_FIELDS.find((f) => f.id === budgetRoleKey)?.label;
  return (
    !!roleLabel &&
    freelancer.profile?.primaryRole?.trim().toLowerCase() === roleLabel.toLowerCase()
  );
}
