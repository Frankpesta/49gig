/**
 * Budget calculation based on experience level, timeline, and project type
 */

import {
  type TeamSlotIntake,
  compositionFromTeamSlots,
  teamSlotsToBudgetLines,
} from "./team-slots";

export type ExperienceLevel = "junior" | "mid" | "senior" | "expert";
export type ProjectType = "one_time" | "ongoing" | "not_sure";
export type HireType = "single" | "team";
export type TeamSize = "2-3" | "4-6" | "7+" | "not_sure";

/** Team hires: min/max freelancers the client can specify */
export const MIN_TEAM_MEMBER_COUNT = 2;
export const MAX_TEAM_MEMBER_COUNT = 25;

/** Map legacy bucket to a representative headcount (for old projects). */
export function legacyTeamSizeToCount(teamSize: TeamSize | undefined): number {
  switch (teamSize) {
    case "2-3":
      return 3;
    case "4-6":
      return 5;
    case "7+":
      return 7;
    case "not_sure":
      return 5;
    default:
      return 3;
  }
}

/** Resolved headcount for pricing / matching: prefers teamMemberCount, else legacy teamSize. */
export function resolveTargetTeamSize(
  teamMemberCount: number | undefined,
  teamSize: TeamSize | undefined
): number {
  if (teamMemberCount != null && Number.isFinite(teamMemberCount)) {
    const n = Math.floor(teamMemberCount);
    return Math.min(
      MAX_TEAM_MEMBER_COUNT,
      Math.max(MIN_TEAM_MEMBER_COUNT, n)
    );
  }
  if (teamSize) return legacyTeamSizeToCount(teamSize);
  return MIN_TEAM_MEMBER_COUNT;
}
export type RoleType = "full_time" | "part_time";

export type BaseRatesForCategory = Record<
  ExperienceLevel,
  number
>;

// Fallback when no pricing config / category (USD per hour)
const FALLBACK_HOURLY: BaseRatesForCategory = {
  junior: 30,
  mid: 55,
  senior: 90,
  expert: 140,
};

/** Hours per month based on role type */
export const HOURS_PER_MONTH: Record<RoleType, number> = {
  full_time: 160, // 40 hrs/week
  part_time: 80,  // 20 hrs/week
};

/**
 * Term discount on total contract value (single and team hires).
 * Applies only to commitments of **12+ months** (1+ year presets). **2%** off the full total.
 */
export function getDurationDiscount(months: number): number {
  return months >= 12 ? 2 : 0;
}

function getRates(
  baseRatesByCategory?: Record<string, BaseRatesForCategory>,
  talentCategory?: string
): BaseRatesForCategory {
  if (baseRatesByCategory && talentCategory && baseRatesByCategory[talentCategory]) {
    return baseRatesByCategory[talentCategory];
  }
  return FALLBACK_HOURLY;
}


export interface BudgetCalculationParams {
  hireType: HireType;
  /** Exact freelancer count for team hires (preferred). */
  teamMemberCount?: number;
  /** @deprecated Legacy; used if teamMemberCount is missing */
  teamSize?: TeamSize;
  experienceLevel: ExperienceLevel;
  projectType: ProjectType;
  startDate: Date;
  endDate: Date;
  timelineFlexible?: boolean;
  /** Talent category (e.g. Software Development, UI/UX and Product Design) for category-specific base rates */
  talentCategory?: string;
  /** Base hourly rates per category – from platform pricing config */
  baseRatesByCategory?: Record<string, BaseRatesForCategory>;
  /** Part-time (20 hrs/week) or full-time (40 hrs/week) – affects ongoing projects */
  roleType?: RoleType;
  /** Selected categories – used for team to distribute roles and apply category-specific rates */
  skillsRequired?: string[];
  /** Selected skill names (e.g. React, Node.js) – used to infer Backend vs Frontend for Software Development */
  selectedSkillNames?: string[];
  /** Selected software dev sub-fields (e.g. backend_dev, frontend_dev, mobile_dev) – overrides skill inference */
  softwareDevFields?: string[];
  /** Per-freelancer seats (team hires). When set, composition is derived exactly from slots. */
  teamSlots?: TeamSlotIntake[];
  /**
   * When set (e.g. from intake `projectDuration` via `getDurationMonths`), term discount eligibility
   * and duration use this count instead of ceil(calendar span / 30). Keeps totals, fund-upfront
   * months, and UI copy aligned.
   */
  durationMonthsForPricing?: number;
}

/** Per-role breakdown for team projects */
export interface TeamMemberBreakdown {
  role: string;
  roleDisplayName: string;
  category: string;
  count: number;
  hourlyRate: number;
  hoursPerMonth: number;
  monthlyPerPerson: number;
  monthlyTotal: number;
}

interface BudgetResult {
  estimatedBudget: number;
  breakdown: {
    baseRate: number;
    /** Always 1 — kept for backward compatibility */
    timelineMultiplier: number;
    /** Always 1 — kept for backward compatibility */
    projectTypeMultiplier: number;
    totalHours?: number;
    monthlyRate?: number;
    /** Per-role breakdown for team projects */
    teamMembers?: TeamMemberBreakdown[];
    /** Number of calendar months this hire spans */
    durationMonths?: number;
    /** Loyalty discount percentage applied (0 or 2 when 12+ mo) */
    durationDiscount?: number;
  };
  currency: string;
}

/** Human-readable role names */
const ROLE_DISPLAY_NAMES: Record<string, string> = {
  backend_dev: "Backend Developer",
  frontend_dev: "Frontend Developer",
  fullstack_dev: "Full-Stack Developer",
  mobile_dev: "Mobile Developer",
  game_dev: "Game Developer",
  desktop_dev: "Desktop / Windows Developer",
  embedded_dev: "Embedded Systems Developer",
  ui_designer: "UI/UX Designer",
  ux_designer: "UX Designer",
  cloud_engineer: "Cloud Engineer",
  devops: "DevOps Engineer",
  data_scientist: "Data Scientist",
  data_analyst: "Data Analyst",
  data_engineer: "Data Engineer",
  ai_engineer: "AI Engineer",
  blockchain_dev: "Blockchain Developer",
  qa: "QA Engineer",
  technical_writer: "Technical Writer",
};

/** Map talent category to default role(s) for team composition */
const CATEGORY_TO_ROLES: Record<string, string[]> = {
  "Software Development": ["backend_dev", "frontend_dev"],
  "UI/UX and Product Design": ["ui_designer"],
  "Data Analytics": ["data_analyst"],
  "DevOps and Cloud Engineering": ["cloud_engineer"],
  "Cyber Security and IT Infrastructure": ["backend_dev"],
  "AI": ["ai_engineer"],
  "Machine Learning": ["data_scientist"],
  "Blockchain": ["blockchain_dev"],
  "Quality Assurance and Testing": ["qa"],
};

/** Skills that indicate frontend development (for Software Development category) */
const FRONTEND_SKILLS = new Set([
  "react", "next.js", "vue.js", "angular", "typescript", "javascript",
  "html/css", "html", "css", "svelte", "nuxt",
]);
/** Skills that indicate backend development (for Software Development category) */
const BACKEND_SKILLS = new Set([
  "node.js", "node", "python", "java", "go", "rust", "php", "ruby", ".net", "c++", "c#",
]);

/**
 * Infer backend_dev vs frontend_dev for Software Development from selected skills (and languages).
 * Returns preferred role(s): one for single hire, or both for team when skills span both.
 */
function inferSoftwareDevRoles(
  skillNames: string[],
  targetTeamSize: number
): string[] {
  const normalized = skillNames.map((s) => s.toLowerCase().trim());
  const hasFrontend = normalized.some((s) =>
    [...FRONTEND_SKILLS].some((f) => s.includes(f) || f.includes(s))
  );
  const hasBackend = normalized.some((s) =>
    [...BACKEND_SKILLS].some((b) => s.includes(b) || b.includes(s))
  );
  if (hasFrontend && !hasBackend) return ["frontend_dev"];
  if (hasBackend && !hasFrontend) return ["backend_dev"];
  if (hasFrontend && hasBackend) {
    return targetTeamSize >= 2 ? ["backend_dev", "frontend_dev"] : ["frontend_dev"];
  }
  return ["backend_dev"];
}

/**
 * For Software Development single hire: return display name (Backend Developer / Frontend Developer) from skills.
 * Export for use in create project UI.
 */
export function getSoftwareDevRoleDisplayName(skillNames: string[]): string {
  if (!skillNames.length) return "Software Developer";
  const roles = inferSoftwareDevRoles(skillNames, 3);
  return ROLE_DISPLAY_NAMES[roles[0]!] ?? "Software Developer";
}

/**
 * Get software dev roles: prefer softwareDevFields when provided, else infer from skills.
 */
function getSoftwareDevRolesForComposition(
  softwareDevFields: string[] | undefined,
  selectedSkillNames: string[] | undefined,
  targetTeamSize: number
): string[] {
  if (softwareDevFields && softwareDevFields.length > 0) {
    return softwareDevFields.filter((id) => ROLE_DISPLAY_NAMES[id] || id.replace(/_/g, " "));
  }
  if (selectedSkillNames?.length) {
    return inferSoftwareDevRoles(selectedSkillNames, targetTeamSize);
  }
  return ["backend_dev"];
}

/**
 * Get team composition from selected categories and team size.
 * For Software Development, uses softwareDevFields when provided, else infers from selectedSkillNames.
 */
function getTeamCompositionFromCategories(
  categories: string[],
  targetTeamSize: number,
  selectedSkillNames?: string[],
  softwareDevFields?: string[]
): Array<{ role: string; category: string; count: number }> {
  const targetSize = Math.max(
    MIN_TEAM_MEMBER_COUNT,
    Math.min(MAX_TEAM_MEMBER_COUNT, Math.floor(targetTeamSize))
  );
  const uniqueCategories = [...new Set(categories)].filter(
    (c) => CATEGORY_TO_ROLES[c]
  );

  const getSoftwareDevRoles = () =>
    getSoftwareDevRolesForComposition(
      softwareDevFields,
      selectedSkillNames,
      targetSize
    );

  if (uniqueCategories.length === 0) {
    const roles = getSoftwareDevRoles();
    const role = roles[0];
    return [{ role, category: "Software Development", count: Math.min(targetSize, 2) }];
  }

  const result: Array<{ role: string; category: string; count: number }> = [];

  if (uniqueCategories.length >= targetSize) {
    for (let i = 0; i < targetSize; i++) {
      const cat = uniqueCategories[i];
      let role: string;
      if (cat === "Software Development") {
        const roles = getSoftwareDevRoles();
        role = roles[i % roles.length] ?? roles[0];
      } else {
        const roles = CATEGORY_TO_ROLES[cat] || ["backend_dev"];
        role = roles[0];
      }
      result.push({ role, category: cat, count: 1 });
    }
  } else {
    for (let i = 0; i < uniqueCategories.length; i++) {
      const baseCount = Math.floor(targetSize / uniqueCategories.length);
      const extra = i < targetSize % uniqueCategories.length ? 1 : 0;
      const count = baseCount + extra;
      const cat = uniqueCategories[i];
      let role: string;
      if (cat === "Software Development") {
        const roles = getSoftwareDevRoles();
        role = count > 1 && roles.length > 1 ? roles[i % roles.length]! : roles[0]!;
      } else {
        const roles = CATEGORY_TO_ROLES[cat] || ["backend_dev"];
        role = roles[0];
      }
      result.push({ role, category: cat, count });
    }
  }

  return result;
}

function calculateDurationDays(startDate: Date, endDate: Date): number {
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * Calculate budget for a project.
 *
 * Formula (single hire):
 *   total = hourlyRate × hoursPerMonth × durationMonths × (1 − durationDiscount/100)
 *
 * `durationMonths` is normally ceil((endDate − startDate) / 30 days), unless
 * `durationMonthsForPricing` is set (recommended for intake presets so it matches
 * `getDurationMonths(projectDuration)`).
 * Formula (team hire):
 *   total = sum_of_per_seat(hourlyRate × hoursPerMonth) × durationMonths × (1 − durationDiscount/100)
 *
 * Duration discount (loyalty): **2%** off the **full total** only when the hire is **12+ months** (1+ year).
 *
 * Platform fee is stored separately on the project and deducted at payout time.
 * No timeline multipliers, project-type multipliers, or milestone complexity factors.
 */
export function calculateProjectBudget(
  params: BudgetCalculationParams
): BudgetResult {
  const {
    hireType,
    teamMemberCount,
    teamSize,
    experienceLevel,
    startDate,
    endDate,
    talentCategory,
    baseRatesByCategory,
    roleType = "full_time",
    skillsRequired = [],
    selectedSkillNames = [],
    softwareDevFields,
    teamSlots,
    durationMonthsForPricing,
  } = params;

  const targetTeamSize = resolveTargetTeamSize(teamMemberCount, teamSize);
  const durationDays = calculateDurationDays(startDate, endDate);
  const durationMonths =
    durationMonthsForPricing != null &&
    Number.isFinite(durationMonthsForPricing) &&
    durationMonthsForPricing > 0
      ? Math.max(1, Math.floor(durationMonthsForPricing))
      : Math.max(1, Math.ceil(durationDays / 30));
  const discountPct = getDurationDiscount(durationMonths);
  const discountMultiplier = 1 - discountPct / 100;

  const rates = getRates(baseRatesByCategory, talentCategory);
  const baseHourlyRate = rates[experienceLevel];
  const hoursPerMonth = HOURS_PER_MONTH[roleType];

  if (hireType === "team") {
    const composition =
      teamSlots && teamSlots.length > 0
        ? compositionFromTeamSlots(teamSlots)
        : getTeamCompositionFromCategories(
            skillsRequired.length > 0
              ? skillsRequired
              : [talentCategory || "Software Development"],
            targetTeamSize,
            selectedSkillNames,
            softwareDevFields
          );

    const teamMembers: TeamMemberBreakdown[] =
      teamSlots && teamSlots.some((s) => s.roleId)
        ? teamSlotsToBudgetLines(teamSlots, experienceLevel).map((line) => {
            const catRates = getRates(baseRatesByCategory, line.category);
            const hourlyRate = catRates[line.experienceLevel];
            const monthlyPerPerson = hourlyRate * hoursPerMonth;
            return {
              role: line.budgetRoleKey,
              roleDisplayName:
                ROLE_DISPLAY_NAMES[line.budgetRoleKey] ||
                line.budgetRoleKey.replace(/_/g, " "),
              category: line.category,
              count: 1,
              hourlyRate,
              hoursPerMonth,
              monthlyPerPerson,
              monthlyTotal: monthlyPerPerson,
            };
          })
        : composition.map(({ role, category, count }) => {
            const catRates = getRates(baseRatesByCategory, category);
            const hourlyRate = catRates[experienceLevel];
            const monthlyPerPerson = hourlyRate * hoursPerMonth;
            return {
              role,
              roleDisplayName: ROLE_DISPLAY_NAMES[role] || role.replace(/_/g, " "),
              category,
              count,
              hourlyRate,
              hoursPerMonth,
              monthlyPerPerson,
              monthlyTotal: monthlyPerPerson * count,
            };
          });

    const totalMonthly = teamMembers.reduce((sum, m) => sum + m.monthlyTotal, 0);
    const estimatedBudget = Math.round(totalMonthly * durationMonths * discountMultiplier);

    return {
      estimatedBudget,
      breakdown: {
        baseRate: baseHourlyRate,
        timelineMultiplier: 1,
        projectTypeMultiplier: 1,
        teamMembers,
        monthlyRate: totalMonthly,
        durationMonths,
        durationDiscount: discountPct,
      },
      currency: "usd",
    };
  }

  // Single hire
  const monthlyRate = baseHourlyRate * hoursPerMonth;
  const estimatedBudget = Math.round(monthlyRate * durationMonths * discountMultiplier);

  return {
    estimatedBudget,
    breakdown: {
      baseRate: baseHourlyRate,
      timelineMultiplier: 1,
      projectTypeMultiplier: 1,
      monthlyRate,
      totalHours: hoursPerMonth * durationMonths,
      durationMonths,
      durationDiscount: discountPct,
    },
    currency: "usd",
  };
}

/**
 * Format budget for display
 */
export function formatBudget(budget: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(budget);
}

/**
 * Compute role → monthlyPerPersonCents for team projects.
 * Used to store in project and split payments by role (not equally).
 */
export function computeTeamBudgetBreakdown(
  teamMembers: TeamMemberBreakdown[],
  totalAmount: number,
  platformFeePercent: number,
  durationMonths: number
): Record<string, number> {
  if (teamMembers.length === 0) return {};

  const totalMonthly = teamMembers.reduce((sum, m) => sum + m.monthlyTotal, 0);
  if (totalMonthly <= 0) return {};

  const netPercent = 100 - platformFeePercent;
  const monthlyNet = (totalAmount * netPercent) / 100 / durationMonths;

  const result: Record<string, number> = {};
  for (const m of teamMembers) {
    const roleShare = m.monthlyTotal / totalMonthly;
    const roleMonthlyCents = Math.round(roleShare * monthlyNet * 100);
    const perPersonCents = Math.floor(roleMonthlyCents / m.count);
    result[m.role] = perPersonCents;
  }
  return result;
}
