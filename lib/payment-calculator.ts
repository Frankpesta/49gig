/**
 * Comprehensive payment calculation for quotes and checkout UI.
 * Billing phases are illustrative slices of the total (escrow uses monthly cycles in production).
 */

import type { ExperienceLevel, ProjectType, HireType, TeamSize } from "./budget-calculator";

export type BillingModel = "fixed_price" | "phased" | "hourly" | "hybrid";

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
  phases?: BillingPhase[];
  hourlyRate?: number;
  estimatedHours?: number;
  currency: string;
}

export interface BillingPhase {
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

  if (totalAmount < 500) {
    return "fixed_price";
  }

  if (projectType === "ongoing") {
    return "hourly";
  }

  if (deliverables && deliverables.length > 0 && deliverables.length <= 5) {
    return "phased";
  }

  if (durationDays > 90) {
    return estimatedHours ? "hourly" : "hybrid";
  }

  if (complexity === "complex" || (deliverables && deliverables.length > 3)) {
    return "phased";
  }

  return "phased";
}

/**
 * Calculate platform fee – 25% to company (flat)
 */
export function calculatePlatformFee(totalAmount: number): {
  fee: number;
  percentage: number;
} {
  const percentage = 25;
  return { fee: totalAmount * (percentage / 100), percentage };
}

/**
 * Auto-split project into illustrative payment phases (deliverables or timeline).
 */
export function autoSplitPhases(
  params: PaymentCalculationParams,
  billingModel: BillingModel
): BillingPhase[] {
  const { totalAmount, deliverables, startDate, endDate, projectType } = params;
  const durationDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

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

  if (billingModel === "hourly") {
    return [];
  }

  if (deliverables && deliverables.length > 0) {
    return splitByDeliverables(deliverables, totalAmount, startDate, endDate);
  }

  return splitByPhases(totalAmount, durationDays, startDate, endDate, projectType);
}

function splitByDeliverables(
  deliverables: string[],
  totalAmount: number,
  startDate: Date,
  endDate: Date
): BillingPhase[] {
  const phaseCount = Math.min(deliverables.length, 5);
  const amountPerPhase = totalAmount / phaseCount;
  const durationMs = endDate.getTime() - startDate.getTime();
  const intervalMs = durationMs / phaseCount;

  return deliverables.slice(0, phaseCount).map((deliverable, index) => {
    const dueDate = new Date(startDate.getTime() + (index + 1) * intervalMs);
    const percentage = (1 / phaseCount) * 100;

    return {
      title: deliverable,
      description: `Deliverable: ${deliverable}`,
      amount: Math.round(amountPerPhase * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
      order: index + 1,
      dueDate: dueDate.getTime(),
    };
  });
}

function splitByPhases(
  totalAmount: number,
  durationDays: number,
  startDate: Date,
  endDate: Date,
  projectType: ProjectType
): BillingPhase[] {
  let phases: Array<{ name: string; percentage: number }>;

  if (durationDays <= 7) {
    phases = [
      { name: "Initial Development", percentage: 50 },
      { name: "Final Delivery", percentage: 50 },
    ];
  } else if (durationDays <= 30) {
    phases = [
      { name: "Planning & Setup", percentage: 30 },
      { name: "Development", percentage: 40 },
      { name: "Testing & Delivery", percentage: 30 },
    ];
  } else if (durationDays <= 90) {
    phases = [
      { name: "Planning & Design", percentage: 20 },
      { name: "Core Development", percentage: 30 },
      { name: "Integration & Testing", percentage: 30 },
      { name: "Final Delivery", percentage: 20 },
    ];
  } else {
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

export function calculateHourlyRate(
  totalAmount: number,
  estimatedHours: number,
  experienceLevel: ExperienceLevel
): number {
  const calculatedRate = totalAmount / estimatedHours;

  const minimumRates: Record<ExperienceLevel, number> = {
    junior: 3,
    mid: 5,
    senior: 10,
    expert: 15,
  };

  return Math.max(calculatedRate, minimumRates[experienceLevel]);
}

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

  if (billingModel === "phased" || billingModel === "fixed_price") {
    breakdown.phases = autoSplitPhases(params, billingModel);
  }

  if (billingModel === "hourly" || billingModel === "hybrid") {
    if (estimatedHours) {
      breakdown.hourlyRate = calculateHourlyRate(
        netAmount,
        estimatedHours,
        experienceLevel
      );
      breakdown.estimatedHours = estimatedHours;
    }
  }

  return breakdown;
}

export function formatPaymentBreakdown(breakdown: PaymentBreakdown): {
  summary: string;
  details: Array<{ label: string; value: string; description?: string }>;
} {
  const details: Array<{ label: string; value: string; description?: string }> = [
    {
      label: "Total (you pay)",
      value: formatCurrency(breakdown.totalAmount),
      description: "Full amount charged for the project",
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

  if (breakdown.phases && breakdown.phases.length > 0) {
    details.push({
      label: "Payment structure (illustrative)",
      value: `${breakdown.phases.length} phase${breakdown.phases.length > 1 ? "s" : ""}`,
      description: breakdown.phases.map((m) => `${m.percentage}%`).join(", "),
    });
  }

  const summary = `${formatCurrency(breakdown.totalAmount)} total`;

  return { summary, details };
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function validateBillingPhases(
  phases: BillingPhase[],
  totalAmount: number
): { valid: boolean; error?: string } {
  const total = phases.reduce((sum, m) => sum + m.amount, 0);
  const difference = Math.abs(total - totalAmount);

  if (difference > 0.01) {
    return {
      valid: false,
      error: `Phase amounts (${formatCurrency(total)}) don't match project total (${formatCurrency(totalAmount)}). Difference: ${formatCurrency(difference)}`,
    };
  }

  return { valid: true };
}
