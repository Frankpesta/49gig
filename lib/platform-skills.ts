/**
 * Platform-supported tech categories and skills.
 * Used for freelancer signup and verification (vetting).
 * UI/UX & Product Design is portfolio-only; others use MCQ + coding where available.
 */

export const PLATFORM_CATEGORIES = [
  { id: "software_development", label: "Software Development" },
  { id: "ui_ux_design", label: "UI/UX & Product Design" },
  { id: "data_analytics", label: "Data & Analytics" },
  { id: "devops_cloud", label: "DevOps & Cloud Engineering" },
  { id: "cybersecurity_it", label: "Cybersecurity & IT Infrastructure" },
  { id: "ai_ml_blockchain", label: "AI, Machine Learning & Blockchain" },
  { id: "qa_testing", label: "Quality Assurance & Testing" },
] as const;

export type PlatformCategoryId = (typeof PLATFORM_CATEGORIES)[number]["id"];

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
  ai_ml_blockchain: [
    "Python",
    "TensorFlow",
    "PyTorch",
    "Machine Learning",
    "Blockchain",
    "Solidity",
    "NLP",
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
