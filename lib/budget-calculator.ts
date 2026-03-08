/**
 * Budget calculation based on experience level, timeline, and project type
 */

export type ExperienceLevel = "junior" | "mid" | "senior" | "expert";
export type ProjectType = "one_time" | "ongoing" | "not_sure";
export type HireType = "single" | "team";
export type TeamSize = "2-3" | "4-6" | "7+" | "not_sure";
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

/** Hours per month based on role type (ongoing projects) */
export const HOURS_PER_MONTH: Record<RoleType, number> = {
  full_time: 160, // 40 hrs/week
  part_time: 80,  // 20 hrs/week
};

/** Hours per day for one-time projects */
export const HOURS_PER_DAY: Record<RoleType, number> = {
  full_time: 8,
  part_time: 4,
};

function getRates(
  baseRatesByCategory?: Record<string, BaseRatesForCategory>,
  talentCategory?: string
): BaseRatesForCategory {
  if (baseRatesByCategory && talentCategory && baseRatesByCategory[talentCategory]) {
    return baseRatesByCategory[talentCategory];
  }
  return FALLBACK_HOURLY;
}

// Timeline multipliers (shorter timelines = premium, longer = discount)
const TIMELINE_MULTIPLIERS = {
  // Days
  "1-3": 1.5, // Rush job premium
  "4-7": 1.3,
  "8-14": 1.2,
  "15-30": 1.1,
  // Weeks
  "2-4": 1.0, // Standard
  "5-8": 0.95,
  "9-12": 0.9,
  // Months
  "1-2": 0.9,
  "3-6": 0.85,
  "7-12": 0.8,
  "12+": 0.75, // Long-term discount
};

// Project type multipliers
const PROJECT_TYPE_MULTIPLIERS: Record<ProjectType, number> = {
  one_time: 1.0, // Standard pricing
  ongoing: 0.9, // Ongoing projects get 10% discount
  not_sure: 1.0, // Default to standard
};

export interface BudgetCalculationParams {
  hireType: HireType;
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
  /** Selected categories/skills – used for team to distribute roles and apply category-specific rates */
  skillsRequired?: string[];
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
    timelineMultiplier: number;
    projectTypeMultiplier: number;
    teamMultiplier?: number;
    totalHours?: number;
    totalDays?: number;
    monthlyRate?: number;
    /** Per-role breakdown for team projects */
    teamMembers?: TeamMemberBreakdown[];
  };
  currency: string;
}

/** Human-readable role names */
const ROLE_DISPLAY_NAMES: Record<string, string> = {
  backend_dev: "Backend Developer",
  frontend_dev: "Frontend Developer",
  mobile_dev: "Mobile Developer",
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

/**
 * Get team composition from selected categories and team size.
 * Distributes roles across categories with category-specific rates.
 */
function getTeamCompositionFromCategories(
  categories: string[],
  teamSize: TeamSize
): Array<{ role: string; category: string; count: number }> {
  const targetSize = teamSize === "2-3" ? 3 : teamSize === "4-6" ? 5 : 7;
  const uniqueCategories = [...new Set(categories)].filter(
    (c) => CATEGORY_TO_ROLES[c]
  );

  if (uniqueCategories.length === 0) {
    return [{ role: "backend_dev", category: "Software Development", count: Math.min(targetSize, 2) }];
  }

  const result: Array<{ role: string; category: string; count: number }> = [];

  if (uniqueCategories.length >= targetSize) {
    for (let i = 0; i < targetSize; i++) {
      const cat = uniqueCategories[i];
      const roles = CATEGORY_TO_ROLES[cat] || ["backend_dev"];
      result.push({ role: roles[0], category: cat, count: 1 });
    }
  } else {
    for (let i = 0; i < uniqueCategories.length; i++) {
      const baseCount = Math.floor(targetSize / uniqueCategories.length);
      const extra = i < targetSize % uniqueCategories.length ? 1 : 0;
      const count = baseCount + extra;
      const cat = uniqueCategories[i];
      const roles = CATEGORY_TO_ROLES[cat] || ["backend_dev"];
      result.push({ role: roles[0], category: cat, count });
    }
  }

  return result;
}

/**
 * Calculate project duration in days
 */
function calculateDurationDays(startDate: Date, endDate: Date): number {
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays); // Minimum 1 day
}

/**
 * Get timeline multiplier based on duration
 */
function getTimelineMultiplier(days: number): number {
  if (days <= 3) return TIMELINE_MULTIPLIERS["1-3"];
  if (days <= 7) return TIMELINE_MULTIPLIERS["4-7"];
  if (days <= 14) return TIMELINE_MULTIPLIERS["8-14"];
  if (days <= 30) return TIMELINE_MULTIPLIERS["15-30"];
  
  const weeks = Math.floor(days / 7);
  if (weeks <= 4) return TIMELINE_MULTIPLIERS["2-4"];
  if (weeks <= 8) return TIMELINE_MULTIPLIERS["5-8"];
  if (weeks <= 12) return TIMELINE_MULTIPLIERS["9-12"];
  
  const months = Math.floor(days / 30);
  if (months <= 2) return TIMELINE_MULTIPLIERS["1-2"];
  if (months <= 6) return TIMELINE_MULTIPLIERS["3-6"];
  if (months <= 12) return TIMELINE_MULTIPLIERS["7-12"];
  return TIMELINE_MULTIPLIERS["12+"];
}

/**
 * Get team size multiplier
 */
function getTeamSizeMultiplier(teamSize: TeamSize): number {
  switch (teamSize) {
    case "2-3":
      return 2.5; // Average of 2-3 people
    case "4-6":
      return 5; // Average of 4-6 people
    case "7+":
      return 8; // Average of 7+ people
    case "not_sure":
      return 5; // Default to mid-range
    default:
      return 1;
  }
}

/**
 * Determine project complexity based on duration and requirements
 */
function determineComplexity(
  durationDays: number,
  hireType: HireType,
  teamSize?: TeamSize
): "simple" | "moderate" | "complex" {
  if (hireType === "team") {
    return "complex";
  }

  if (durationDays <= 7) {
    return "simple";
  } else if (durationDays <= 30) {
    return "moderate";
  } else {
    return "complex";
  }
}

/**
 * Calculate minimum project value (ensures projects are viable)
 */
function calculateMinimumProjectValue(
  experienceLevel: ExperienceLevel,
  durationDays: number
): number {
  const baseMinimums: Record<ExperienceLevel, number> = {
    junior: 30,
    mid: 50,
    senior: 100,
    expert: 150,
  };

  const baseMinimum = baseMinimums[experienceLevel];
  
  // For very short projects (< 3 days), ensure minimum viable amount
  if (durationDays < 3) {
    return Math.max(baseMinimum, 30);
  }

  return baseMinimum;
}

/**
 * Calculate budget for a project
 */
export function calculateProjectBudget(
  params: BudgetCalculationParams
): BudgetResult {
  const {
    hireType,
    teamSize,
    experienceLevel,
    projectType,
    startDate,
    endDate,
    timelineFlexible,
    talentCategory,
    baseRatesByCategory,
    roleType = "full_time",
    skillsRequired = [],
  } = params;

  const rates = getRates(baseRatesByCategory, talentCategory);
  const baseHourlyRate = rates[experienceLevel];
  const baseDailyRate = baseHourlyRate * 8;

  const durationDays = calculateDurationDays(startDate, endDate);
  const timelineMultiplier = timelineFlexible
    ? 0.9 // Flexible timeline gets 10% discount
    : getTimelineMultiplier(durationDays);

  const projectTypeMultiplier = PROJECT_TYPE_MULTIPLIERS[projectType];
  const complexity = determineComplexity(durationDays, hireType, teamSize);

  const hoursPerMonth = HOURS_PER_MONTH[roleType];
  const hoursPerDay = HOURS_PER_DAY[roleType];

  if (hireType === "team" && teamSize) {
    // Team pricing with category-specific rates and per-role breakdown
    const categories = skillsRequired.length > 0
      ? skillsRequired
      : [talentCategory || "Software Development"];
    const composition = getTeamCompositionFromCategories(categories, teamSize);

    const teamMembers: TeamMemberBreakdown[] = composition.map(({ role, category, count }) => {
      const catRates = getRates(baseRatesByCategory, category);
      const hourlyRate = catRates[experienceLevel];
      const monthlyPerPerson = hourlyRate * hoursPerMonth;
      const monthlyTotal = monthlyPerPerson * count;
      return {
        role,
        roleDisplayName: ROLE_DISPLAY_NAMES[role] || role.replace(/_/g, " "),
        category,
        count,
        hourlyRate,
        hoursPerMonth,
        monthlyPerPerson,
        monthlyTotal,
      };
    });

    const totalMonthlyBeforeMultipliers = teamMembers.reduce(
      (sum, m) => sum + m.monthlyTotal,
      0
    );

    if (projectType === "ongoing") {
      const months = Math.max(1, Math.ceil(durationDays / 30));
      const estimatedBudget = Math.round(
        totalMonthlyBeforeMultipliers *
          months *
          timelineMultiplier *
          projectTypeMultiplier
      );

      return {
        estimatedBudget,
        breakdown: {
          baseRate: baseHourlyRate,
          timelineMultiplier,
          projectTypeMultiplier,
          teamMembers,
          monthlyRate: totalMonthlyBeforeMultipliers,
        },
        currency: "usd",
      };
    }

    // One-time team: use days × hours per day
    const totalDailyRate = teamMembers.reduce(
      (sum, m) => sum + m.hourlyRate * hoursPerDay * m.count,
      0
    );
    const estimatedBudget = Math.round(
      totalDailyRate * durationDays * timelineMultiplier * projectTypeMultiplier
    );

    return {
      estimatedBudget,
      breakdown: {
        baseRate: baseHourlyRate,
        timelineMultiplier,
        projectTypeMultiplier,
        teamMembers,
        totalDays: durationDays,
      },
      currency: "usd",
    };
  }

  // Single talent pricing (baseHourlyRate, baseDailyRate already set above)
  if (projectType === "ongoing") {
    // Ongoing: hourly or monthly – roleType affects hours (part-time 80, full-time 160)
    const monthlyRate = baseHourlyRate * hoursPerMonth;
    const months = Math.max(1, Math.ceil(durationDays / 30));
    
    const estimatedBudget = Math.round(
      monthlyRate * months * timelineMultiplier * projectTypeMultiplier
    );

    return {
      estimatedBudget,
      breakdown: {
        baseRate: baseHourlyRate,
        timelineMultiplier,
        projectTypeMultiplier,
        monthlyRate,
        totalHours: hoursPerMonth * months,
      },
      currency: "usd",
    };
  }

  // One-time: milestone-based – roleType affects hours per day (part-time 4, full-time 8)
  let estimatedHours: number;
  
  if (complexity === "simple") {
    estimatedHours = Math.max(8, Math.ceil(durationDays * (hoursPerDay * 0.6)));
  } else if (complexity === "moderate") {
    estimatedHours = Math.max(16, Math.ceil(durationDays * (hoursPerDay * 0.8)));
  } else {
    estimatedHours = Math.max(24, durationDays * hoursPerDay);
  }

  let estimatedBudget = Math.round(
    baseHourlyRate *
      estimatedHours *
      timelineMultiplier *
      projectTypeMultiplier
  );

  // Ensure minimum project value
  const minimumValue = calculateMinimumProjectValue(experienceLevel, durationDays);
  estimatedBudget = Math.max(estimatedBudget, minimumValue);

  return {
    estimatedBudget,
    breakdown: {
      baseRate: baseHourlyRate,
      timelineMultiplier,
      projectTypeMultiplier,
      totalHours: estimatedHours,
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
