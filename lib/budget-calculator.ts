/**
 * Budget calculation based on experience level, timeline, and project type
 */

export type ExperienceLevel = "junior" | "mid" | "senior" | "expert";
export type ProjectType = "one_time" | "ongoing" | "not_sure";
export type HireType = "single" | "team";
export type TeamSize = "2-3" | "4-6" | "7+" | "not_sure";

// Base hourly rates by experience level (USD)
const BASE_HOURLY_RATES: Record<ExperienceLevel, number> = {
  junior: 3,
  mid: 5,
  senior: 10,
  expert: 15,
};

// Base daily rates (8 hours)
const BASE_DAILY_RATES: Record<ExperienceLevel, number> = {
  junior: BASE_HOURLY_RATES.junior * 8,
  mid: BASE_HOURLY_RATES.mid * 8,
  senior: BASE_HOURLY_RATES.senior * 8,
  expert: BASE_HOURLY_RATES.expert * 8,
};

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

interface BudgetCalculationParams {
  hireType: HireType;
  teamSize?: TeamSize;
  experienceLevel: ExperienceLevel;
  projectType: ProjectType;
  startDate: Date;
  endDate: Date;
  timelineFlexible?: boolean;
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
  };
  currency: string;
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
  } = params;

  const durationDays = calculateDurationDays(startDate, endDate);
  const timelineMultiplier = timelineFlexible
    ? 0.9 // Flexible timeline gets 10% discount
    : getTimelineMultiplier(durationDays);

  const projectTypeMultiplier = PROJECT_TYPE_MULTIPLIERS[projectType];
  const complexity = determineComplexity(durationDays, hireType, teamSize);

  if (hireType === "team" && teamSize) {
    // Team pricing
    const teamMultiplier = getTeamSizeMultiplier(teamSize);
    const baseMonthlyRate = BASE_DAILY_RATES[experienceLevel] * 20; // 20 working days per month
    const monthlyRate = baseMonthlyRate * teamMultiplier;
    
    // For ongoing projects, use monthly rate
    if (projectType === "ongoing") {
      const months = Math.max(1, Math.ceil(durationDays / 30));
      const estimatedBudget = Math.round(
        monthlyRate *
          months *
          timelineMultiplier *
          projectTypeMultiplier
      );

      return {
        estimatedBudget,
        breakdown: {
          baseRate: baseMonthlyRate,
          timelineMultiplier,
          projectTypeMultiplier,
          teamMultiplier,
          monthlyRate,
        },
        currency: "usd",
      };
    }

    // For one-time projects, calculate based on days
    const dailyRate = BASE_DAILY_RATES[experienceLevel] * teamMultiplier;
    const estimatedBudget = Math.round(
      dailyRate * durationDays * timelineMultiplier * projectTypeMultiplier
    );

    return {
      estimatedBudget,
      breakdown: {
        baseRate: BASE_DAILY_RATES[experienceLevel],
        timelineMultiplier,
        projectTypeMultiplier,
        teamMultiplier,
        totalDays: durationDays,
      },
      currency: "usd",
    };
  }

  // Single talent pricing
  const baseHourlyRate = BASE_HOURLY_RATES[experienceLevel];
  const baseDailyRate = BASE_DAILY_RATES[experienceLevel];

  if (projectType === "ongoing") {
    // Ongoing: hourly or monthly
    const hoursPerDay = 8;
    const daysPerMonth = 20; // Working days
    const hoursPerMonth = hoursPerDay * daysPerMonth;
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

  // One-time: milestone-based
  // For simple projects, use a more conservative hour estimate
  let estimatedHours: number;
  
  if (complexity === "simple") {
    // Simple projects: 4-6 hours/day (less intensive)
    estimatedHours = Math.max(8, Math.ceil(durationDays * 5));
  } else if (complexity === "moderate") {
    // Moderate: 6-7 hours/day
    estimatedHours = Math.max(16, Math.ceil(durationDays * 6.5));
  } else {
    // Complex: 8 hours/day (full-time)
    estimatedHours = Math.max(24, durationDays * 8);
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
