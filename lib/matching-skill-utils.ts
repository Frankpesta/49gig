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
import { freelancerHasPhoneAndLinksForMatching } from "./freelancer-profile-links";

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
 * Hard gate: at least one selected skill must match (when there are normalized skills).
 * When explicit skills are required, techField is used only as a scoring factor — not a hard gate —
 * because many skills (Python, SQL, TypeScript, …) span multiple categories.
 * When there are NO required skills, techField is the only category signal, so we gate on it.
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
  if (!freelancerHasPhoneAndLinksForMatching(freelancer)) {
    return false;
  }
  if (normalizedRequired.length > 0) {
    // Skills are specified — gate on skill match only; techField is a scoring signal, not a hard filter.
    if (
      !freelancerMatchesAtLeastOneRequiredSkill(
        normalizedRequired,
        freelancer.profile?.skills
      )
    ) {
      return false;
    }
  } else {
    // No required skills — use techField as the category proxy.
    if (!freelancerMatchesRole(freelancer.profile?.techField, projectRoleId)) {
      return false;
    }
  }
  return true;
}
