/**
 * Comprehensive Payment Calculation System
 * Handles different billing models: fixed-price, milestone-based, hourly, and hybrid
 */

import type { ExperienceLevel, ProjectType, HireType, TeamSize } from "./budget-calculator";

export type BillingModel = "fixed_price" | "milestone_based" | "hourly" | "hybrid";

export interface PaymentCalculationParams {
  totalAmount: number;
  projectType: ProjectType;
  hireType: HireType;
  experienceLevel: ExperienceLevel;
  startDate: Date;
  endDate: Date;
  deliverables?: string[];
  complexity?: "simple" | "moderate" | "complex";
  estimatedHours?: number;
}

export interface PaymentBreakdown {
  totalAmount: number;
  platformFee: number;
  platformFeePercentage: number;
  netAmount: number; // Amount after platform fee (what freelancer receives)
  billingModel: BillingModel;
  milestones?: MilestonePayment[];
  hourlyRate?: number;
  estimatedHours?: number;
  currency: string;
}

export interface MilestonePayment {
  title: string;
  description: string;
  amount: number;
  percentage: number; // Percentage of total amount
  order: number;
  dueDate: number; // Unix timestamp
}

/**
 * Determine the best billing model based on project characteristics
 */
export function determineBillingModel(params: PaymentCalculationParams): BillingModel {
  const { totalAmount, projectType, deliverables, estimatedHours, complexity } = params;
  const durationDays = Math.ceil(
    (params.endDate.getTime() - params.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Simple projects (< $500) - fixed price
  if (totalAmount < 500) {
    return "fixed_price";
  }

  // Ongoing projects - hourly
  if (projectType === "ongoing") {
    return "hourly";
  }

  // Projects with clear deliverables - milestone-based
  if (deliverables && deliverables.length > 0 && deliverables.length <= 5) {
    return "milestone_based";
  }

  // Long-term projects (> 3 months) - hourly or hybrid
  if (durationDays > 90) {
    return estimatedHours ? "hourly" : "hybrid";
  }

  // Complex projects with multiple phases - milestone-based
  if (complexity === "complex" || (deliverables && deliverables.length > 3)) {
    return "milestone_based";
  }

  // Default: milestone-based for one-time projects
  return "milestone_based";
}

/**
 * Calculate platform fee (can be tiered based on project size)
 */
export function calculatePlatformFee(totalAmount: number): {
  fee: number;
  percentage: number;
} {
  // Tiered platform fee structure
  if (totalAmount < 500) {
    // Small projects: 12% (higher to cover processing costs)
    return { fee: totalAmount * 0.12, percentage: 12 };
  } else if (totalAmount < 5000) {
    // Medium projects: 10% (standard)
    return { fee: totalAmount * 0.1, percentage: 10 };
  } else if (totalAmount < 50000) {
    // Large projects: 8% (volume discount)
    return { fee: totalAmount * 0.08, percentage: 8 };
  } else {
    // Enterprise projects: 6% (enterprise discount)
    return { fee: totalAmount * 0.06, percentage: 6 };
  }
}

/**
 * Auto-split project into milestones based on deliverables or project phases
 */
export function autoSplitMilestones(
  params: PaymentCalculationParams,
  billingModel: BillingModel
): MilestonePayment[] {
  const { totalAmount, deliverables, startDate, endDate, projectType } = params;
  const durationDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Fixed price projects: single milestone
  if (billingModel === "fixed_price") {
    return [
      {
        title: "Project Completion",
        description: "Complete project delivery",
        amount: totalAmount,
        percentage: 100,
        order: 1,
        dueDate: endDate.getTime(),
      },
    ];
  }

  // Hourly projects: no milestones (billed as work progresses)
  if (billingModel === "hourly") {
    return [];
  }

  // Milestone-based: split by deliverables or phases
  if (deliverables && deliverables.length > 0) {
    return splitByDeliverables(deliverables, totalAmount, startDate, endDate);
  }

  // Default: split by project phases
  return splitByPhases(totalAmount, durationDays, startDate, endDate, projectType);
}

/**
 * Split milestones by deliverables
 */
function splitByDeliverables(
  deliverables: string[],
  totalAmount: number,
  startDate: Date,
  endDate: Date
): MilestonePayment[] {
  const milestoneCount = Math.min(deliverables.length, 5); // Max 5 milestones
  const amountPerMilestone = totalAmount / milestoneCount;
  const durationMs = endDate.getTime() - startDate.getTime();
  const intervalMs = durationMs / milestoneCount;

  return deliverables.slice(0, milestoneCount).map((deliverable, index) => {
    const dueDate = new Date(startDate.getTime() + (index + 1) * intervalMs);
    const percentage = (1 / milestoneCount) * 100;

    return {
      title: deliverable,
      description: `Deliverable: ${deliverable}`,
      amount: Math.round(amountPerMilestone * 100) / 100, // Round to 2 decimals
      percentage: Math.round(percentage * 100) / 100,
      order: index + 1,
      dueDate: dueDate.getTime(),
    };
  });
}

/**
 * Split milestones by project phases (for projects without clear deliverables)
 */
function splitByPhases(
  totalAmount: number,
  durationDays: number,
  startDate: Date,
  endDate: Date,
  projectType: ProjectType
): MilestonePayment[] {
  let phases: Array<{ name: string; percentage: number }>;

  if (durationDays <= 7) {
    // Short projects: 2 milestones (50/50)
    phases = [
      { name: "Initial Development", percentage: 50 },
      { name: "Final Delivery", percentage: 50 },
    ];
  } else if (durationDays <= 30) {
    // Medium projects: 3 milestones (30/40/30)
    phases = [
      { name: "Planning & Setup", percentage: 30 },
      { name: "Development", percentage: 40 },
      { name: "Testing & Delivery", percentage: 30 },
    ];
  } else if (durationDays <= 90) {
    // Longer projects: 4 milestones (20/30/30/20)
    phases = [
      { name: "Planning & Design", percentage: 20 },
      { name: "Core Development", percentage: 30 },
      { name: "Integration & Testing", percentage: 30 },
      { name: "Final Delivery", percentage: 20 },
    ];
  } else {
    // Long-term projects: 5 milestones (15/20/25/25/15)
    phases = [
      { name: "Planning & Design", percentage: 15 },
      { name: "Initial Development", percentage: 20 },
      { name: "Core Development", percentage: 25 },
      { name: "Advanced Features", percentage: 25 },
      { name: "Final Delivery", percentage: 15 },
    ];
  }

  const intervalMs = (endDate.getTime() - startDate.getTime()) / phases.length;

  return phases.map((phase, index) => {
    const dueDate = new Date(startDate.getTime() + (index + 1) * intervalMs);
    const amount = (totalAmount * phase.percentage) / 100;

    return {
      title: phase.name,
      description: `Phase ${index + 1}: ${phase.name}`,
      amount: Math.round(amount * 100) / 100,
      percentage: phase.percentage,
      order: index + 1,
      dueDate: dueDate.getTime(),
    };
  });
}

/**
 * Calculate hourly rate from total amount and estimated hours
 */
export function calculateHourlyRate(
  totalAmount: number,
  estimatedHours: number,
  experienceLevel: ExperienceLevel
): number {
  const calculatedRate = totalAmount / estimatedHours;

  // Ensure minimum rates by experience level
  const minimumRates: Record<ExperienceLevel, number> = {
    junior: 20,
    mid: 40,
    senior: 80,
    expert: 120,
  };

  return Math.max(calculatedRate, minimumRates[experienceLevel]);
}

/**
 * Main payment calculation function
 */
export function calculatePayment(params: PaymentCalculationParams): PaymentBreakdown {
  const { totalAmount, estimatedHours, experienceLevel } = params;
  const billingModel = determineBillingModel(params);
  const { fee: platformFee, percentage: platformFeePercentage } =
    calculatePlatformFee(totalAmount);
  const netAmount = totalAmount - platformFee;

  const breakdown: PaymentBreakdown = {
    totalAmount,
    platformFee,
    platformFeePercentage,
    netAmount,
    billingModel,
    currency: "usd",
  };

  // Add milestones for milestone-based and fixed-price projects
  if (billingModel === "milestone_based" || billingModel === "fixed_price") {
    breakdown.milestones = autoSplitMilestones(params, billingModel);
  }

  // Add hourly rate for hourly and hybrid projects
  if (billingModel === "hourly" || billingModel === "hybrid") {
    if (estimatedHours) {
      breakdown.hourlyRate = calculateHourlyRate(
        netAmount, // Use net amount (what freelancer receives)
        estimatedHours,
        experienceLevel
      );
      breakdown.estimatedHours = estimatedHours;
    }
  }

  return breakdown;
}

/**
 * Format payment breakdown for display
 */
export function formatPaymentBreakdown(breakdown: PaymentBreakdown): {
  summary: string;
  details: Array<{ label: string; value: string; description?: string }>;
} {
  const details: Array<{ label: string; value: string; description?: string }> = [
    {
      label: "Total Project Value",
      value: formatCurrency(breakdown.totalAmount),
      description: "Total amount client pays",
    },
    {
      label: "Platform Fee",
      value: formatCurrency(breakdown.platformFee),
      description: `${breakdown.platformFeePercentage}% of total`,
    },
    {
      label: "Freelancer Earnings",
      value: formatCurrency(breakdown.netAmount),
      description: "Amount freelancer receives after platform fee",
    },
  ];

  if (breakdown.billingModel === "hourly" && breakdown.hourlyRate) {
    details.push({
      label: "Hourly Rate",
      value: formatCurrency(breakdown.hourlyRate),
      description: breakdown.estimatedHours
        ? `Estimated ${breakdown.estimatedHours} hours`
        : undefined,
    });
  }

  if (breakdown.milestones && breakdown.milestones.length > 0) {
    details.push({
      label: "Payment Structure",
      value: `${breakdown.milestones.length} Milestone${breakdown.milestones.length > 1 ? "s" : ""}`,
      description: breakdown.milestones
        .map((m) => `${m.percentage}%`)
        .join(", "),
    });
  }

  const summary = `${formatCurrency(breakdown.totalAmount)} total (${breakdown.platformFeePercentage}% platform fee)`;

  return { summary, details };
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Validate milestone amounts sum to total
 */
export function validateMilestones(
  milestones: MilestonePayment[],
  totalAmount: number
): { valid: boolean; error?: string } {
  const total = milestones.reduce((sum, m) => sum + m.amount, 0);
  const difference = Math.abs(total - totalAmount);

  if (difference > 0.01) {
    return {
      valid: false,
      error: `Milestone amounts (${formatCurrency(total)}) don't match project total (${formatCurrency(totalAmount)}). Difference: ${formatCurrency(difference)}`,
    };
  }

  return { valid: true };
}
