import type { ExperienceLevel } from "./budget-calculator";

/** Display labels for hire flows (single + team seats). */
export const EXPERIENCE_LEVEL_OPTIONS: ReadonlyArray<{
  value: ExperienceLevel;
  label: string;
}> = [
  { value: "junior", label: "Junior (1–3 years)" },
  { value: "mid", label: "Mid-level (3–5 years)" },
  { value: "senior", label: "Senior (5–10 years)" },
  { value: "expert", label: "Expert (10+ years)" },
];

export function experienceLevelOptionLabel(value: string | undefined): string {
  if (!value) return "—";
  const o = EXPERIENCE_LEVEL_OPTIONS.find((x) => x.value === value);
  return o?.label ?? value;
}
