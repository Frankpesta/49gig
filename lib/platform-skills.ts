/**
 * Platform-supported tech categories and skills.
 * Used for freelancer onboarding, verification (vetting), and project matching.
 * Labels must match schema talentCategory and project create TALENT_CATEGORIES.
 * UI/UX and Product Design is portfolio-only; others use MCQ + coding where available.
 */

export const PLATFORM_CATEGORIES = [
  { id: "software_development", label: "Software Development" },
  { id: "ui_ux_design", label: "UI/UX and Product Design" },
  { id: "data_analytics", label: "Data Analytics" },
  { id: "devops_cloud", label: "DevOps and Cloud Engineering" },
  { id: "cybersecurity_it", label: "Cyber Security and IT Infrastructure" },
  { id: "ai", label: "AI" },
  { id: "machine_learning", label: "Machine Learning" },
  { id: "blockchain", label: "Blockchain" },
  { id: "qa_testing", label: "Quality Assurance and Testing" },
] as const;

export type PlatformCategoryId = (typeof PLATFORM_CATEGORIES)[number]["id"];

/**
 * Role titles (what clients hire / freelancers identify as).
 * Each role maps to a category for pricing and to skills for matching.
 */
export const PLATFORM_ROLES = [
  { id: "software_development", label: "Software Developer", categoryId: "software_development", categoryLabel: "Software Development" },
  { id: "ui_ux_design", label: "UI/UX Designer", categoryId: "ui_ux_design", categoryLabel: "UI/UX and Product Design" },
  { id: "data_analytics", label: "Data Analyst", categoryId: "data_analytics", categoryLabel: "Data Analytics" },
  { id: "devops_cloud", label: "DevOps Engineer", categoryId: "devops_cloud", categoryLabel: "DevOps and Cloud Engineering" },
  { id: "cybersecurity_it", label: "Cyber Security Specialist", categoryId: "cybersecurity_it", categoryLabel: "Cyber Security and IT Infrastructure" },
  { id: "ai", label: "AI Engineer", categoryId: "ai", categoryLabel: "AI" },
  { id: "machine_learning", label: "Machine Learning Engineer", categoryId: "machine_learning", categoryLabel: "Machine Learning" },
  { id: "blockchain", label: "Blockchain Developer", categoryId: "blockchain", categoryLabel: "Blockchain" },
  { id: "qa_testing", label: "Quality Assurance Tester", categoryId: "qa_testing", categoryLabel: "Quality Assurance and Testing" },
] as const;

export type PlatformRoleId = (typeof PLATFORM_ROLES)[number]["id"];

/** All valid techField values (legacy + platform categories) for schema/mutations */
export type TechFieldValue =
  | "development"
  | "data_science"
  | "technical_writing"
  | "design"
  | "other"
  | PlatformCategoryId;

/** Valid experience levels for schema/mutations */
export type ExperienceLevelValue = "junior" | "mid" | "senior" | "expert";

/** Canonical list of talent category labels (schema, pricing, project create). Single source of truth. */
export const TALENT_CATEGORY_LABELS = [
  "Software Development",
  "UI/UX and Product Design",
  "Data Analytics",
  "DevOps and Cloud Engineering",
  "Cyber Security and IT Infrastructure",
  "AI",
  "Machine Learning",
  "Blockchain",
  "Quality Assurance and Testing",
] as const;

/** Skills (programming languages / tech) used for MCQ + coding verification. Must match convex/vetting/questions.ts SKILL_QUESTIONS. */
export const SKILLS_FOR_MCQ_CODING = [
  "React",
  "Python",
  "JavaScript",
  "Node.js",
  "TypeScript",
  "Java",
  "SQL",
  "Go",
  "C++",
  "C#",
  "Rust",
  "PHP",
  "Ruby",
] as const;

/** Full list of programming languages for freelancer profile and onboarding. */
export const PROGRAMMING_LANGUAGES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "C#",
  "Go",
  "Rust",
  "PHP",
  "Ruby",
  "SQL",
  "Swift",
  "Kotlin",
  "Scala",
  "R",
  "MATLAB",
  "HTML/CSS",
  "React",
  "Node.js",
  "Vue.js",
  "Angular",
  "Solidity",
  "Other",
] as const;

/** Categories that are assessed by portfolio strength only (no MCQ/coding). */
export const PORTFOLIO_ONLY_CATEGORIES: PlatformCategoryId[] = ["ui_ux_design"];

/** Skills suggested per category for signup and verification. */
export const SKILLS_BY_CATEGORY: Record<PlatformCategoryId, readonly string[]> = {
  software_development: [
    "React",
    "JavaScript",
    "TypeScript",
    "Node.js",
    "Python",
    "Java",
    "C++",
    "C#",
    "Go",
    "Rust",
    "PHP",
    "Ruby",
    "Swift",
    "Kotlin",
  ],
  ui_ux_design: [
    "Figma",
    "Adobe XD",
    "Sketch",
    "UI Design",
    "UX Research",
    "Product Design",
    "Prototyping",
  ],
  data_analytics: [
    "Python",
    "R",
    "SQL",
    "JavaScript",
    "Data Visualization",
    "Machine Learning",
    "Statistics",
  ],
  devops_cloud: [
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "GCP",
    "Linux",
    "CI/CD",
    "Terraform",
  ],
  cybersecurity_it: [
    "Network Security",
    "Penetration Testing",
    "SIEM",
    "Linux",
    "Python",
    "Cloud Security",
  ],
  ai: [
    "Python",
    "NLP",
    "Prompt Engineering",
    "LangChain",
    "LLMs",
    "RAG",
    "OpenAI API",
  ],
  machine_learning: [
    "Python",
    "TensorFlow",
    "PyTorch",
    "Machine Learning",
    "scikit-learn",
    "Data Science",
    "Deep Learning",
  ],
  blockchain: [
    "Blockchain",
    "Solidity",
    "Web3",
    "Smart Contracts",
    "Ethereum",
    "EVM",
  ],
  qa_testing: [
    "JavaScript",
    "Python",
    "Selenium",
    "Cypress",
    "Jest",
    "API Testing",
    "Performance Testing",
  ],
};

export function isPortfolioOnlyCategory(categoryId: string): boolean {
  return PORTFOLIO_ONLY_CATEGORIES.includes(categoryId as PlatformCategoryId);
}

export function getSkillsForCategory(categoryId: string): string[] {
  return [...(SKILLS_BY_CATEGORY[categoryId as PlatformCategoryId] ?? [])];
}

/** Get skills for a role (role id = category id) */
export function getSkillsForRole(roleId: string): string[] {
  return getSkillsForCategory(roleId);
}

/** Get category label for a role (for pricing, schema) */
export function getCategoryLabelForRole(roleId: string): string {
  const role = PLATFORM_ROLES.find((r) => r.id === roleId);
  return role?.categoryLabel ?? "Software Development";
}

/** Get human-readable role label (e.g. "Software Developer") from role id */
export function getRoleLabel(roleId: string): string {
  const role = PLATFORM_ROLES.find((r) => r.id === roleId);
  return role?.label ?? roleId.replace(/_/g, " ");
}

/** Get role label from category label (for legacy data) */
export function getRoleLabelFromCategoryLabel(categoryLabel: string): string {
  const role = PLATFORM_ROLES.find((r) => r.categoryLabel === categoryLabel);
  return role?.label ?? categoryLabel;
}

/** Get role/category id for a skill (for inferring roles from skills when loading legacy data) */
export function getRoleIdForSkill(skill: string): string | null {
  const skillLower = skill.toLowerCase().trim();
  for (const [catId, skills] of Object.entries(SKILLS_BY_CATEGORY)) {
    if (skills.some((s) => s.toLowerCase().trim() === skillLower)) return catId;
  }
  return null;
}

/** Check if string is a category label (vs a skill) */
export function isCategoryLabel(value: string): boolean {
  return PLATFORM_ROLES.some((r) => r.categoryLabel === value);
}

/** Legacy combined category - map to AI, Machine Learning, Blockchain when loading old data */
export const LEGACY_AI_ML_BLOCKCHAIN = "AI, Machine Learning and Blockchain";

export function isLegacyCategoryLabel(value: string): boolean {
  return value === LEGACY_AI_ML_BLOCKCHAIN;
}
