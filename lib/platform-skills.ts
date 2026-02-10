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
  { id: "ai_ml_blockchain", label: "AI, Machine Learning and Blockchain" },
  { id: "qa_testing", label: "Quality Assurance and Testing" },
] as const;

export type PlatformCategoryId = (typeof PLATFORM_CATEGORIES)[number]["id"];

/** Canonical list of talent category labels (schema, pricing, project create). Single source of truth. */
export const TALENT_CATEGORY_LABELS = [
  "Software Development",
  "UI/UX and Product Design",
  "Data Analytics",
  "DevOps and Cloud Engineering",
  "Cyber Security and IT Infrastructure",
  "AI, Machine Learning and Blockchain",
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
