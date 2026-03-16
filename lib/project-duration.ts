/**
 * Helpers for project duration (projectDuration field from intake form).
 * Values: "3", "6", "12+", "12", "24", "36", "48", "60"
 * - "3", "6" = months
 * - "12+" = legacy "1 year+" (treated as 12 months)
 * - "12", "24", "36", "48", "60" = months (1–5 years)
 */

export function getDurationMonths(projectDuration: string | undefined): number {
  if (!projectDuration) return 3;
  if (projectDuration === "12+") return 12;
  const n = parseInt(projectDuration, 10);
  return Number.isFinite(n) && n > 0 ? n : 3;
}
