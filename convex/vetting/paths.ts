/**
 * Vetting path determination by category, skills, and programming language.
 * Used to decide: coding+mcq, portfolio+mcq, or mcq-only.
 */

export type ExperienceLevel = "junior" | "mid" | "senior" | "expert";
export type VettingPathType = "coding_mcq" | "portfolio_mcq" | "mcq_only";

export type VettingPath = {
  pathType: VettingPathType;
  categoryId: string;
  experienceLevel: ExperienceLevel;
  selectedSkills: string[];
  /** Set for coding_mcq path (Software Dev with language, or Cyber/QA with language). */
  selectedLanguage?: string;
};

/** Categories that use coding + MCQ when a programming language is selected. */
const CODING_CATEGORIES = new Set([
  "software_development",
  "cybersecurity_it",
  "qa_testing",
]);

/** Categories that use portfolio (30%) + MCQ (70%) when no programming language is selected. */
const PORTFOLIO_MCQ_CATEGORIES = new Set([
  "data_analytics",
  "devops_cloud",
  "ai_ml_blockchain",
]);

/** MCQ-only (no coding, no portfolio). */
const MCQ_ONLY_CATEGORIES = new Set(["ui_ux_design"]);

/** Software Development always requires at least one programming language for coding path. */
const SOFTWARE_DEV = "software_development";

/** Programming-language-like skills (profile.languagesWritten or skills that imply coding). */
const PROGRAMMING_LANGUAGE_IDS = new Set([
  "javascript",
  "typescript",
  "python",
  "java",
  "c++",
  "c#",
  "go",
  "rust",
  "php",
  "ruby",
  "sql",
  "swift",
  "kotlin",
  "scala",
  "r",
  "matlab",
  "html/css",
  "react",
  "node.js",
  "vue.js",
  "angular",
  "solidity",
]);

function hasProgrammingLanguage(profile: {
  languagesWritten?: string[];
  skills?: string[];
}): { has: boolean; first?: string } {
  const langs = profile.languagesWritten ?? [];
  const skills = profile.skills ?? [];
  const combined = [...new Set([...langs, ...skills])];
  const normalized = combined.map((s) => s.toLowerCase().replace(/\s+/g, ""));
  for (let i = 0; i < combined.length; i++) {
    const n = normalized[i];
    if (PROGRAMMING_LANGUAGE_IDS.has(n) || n.includes("javascript") || n.includes("typescript") || n.includes("python")) {
      return { has: true, first: combined[i] };
    }
  }
  return { has: false };
}

/**
 * Determine vetting path from freelancer profile.
 * - Software Development + language → coding_mcq (2+ coding, 50 MCQ).
 * - Software Development without language → treat as invalid (caller should block or use MCQ-only fallback).
 * - UI/UX → mcq_only (50 MCQ).
 * - Data Analytics / DevOps / AI-ML without language → portfolio_mcq (portfolio 30%, 50 MCQ 70%).
 * - Data Analytics / DevOps / AI-ML with language → can use coding_mcq if we want; design said "no programming language selected" for portfolio path. So with language we could do coding_mcq for those too. For simplicity we do: if category supports coding and they have a language → coding_mcq; else if portfolio_mcq category → portfolio_mcq; else mcq_only.
 * - Cyber Security / QA with Python (or language) → coding_mcq; without → mcq_only or portfolio_mcq. Design: "If Python selected: 2+ coding + 50 MCQ; if no Python: 50 very hard MCQ".
 */
export function getVettingPath(profile: {
  techField?: string;
  experienceLevel?: string;
  skills?: string[];
  languagesWritten?: string[];
}): VettingPath | null {
  const categoryId = profile.techField ?? "";
  const experienceLevel = (profile.experienceLevel ?? "mid") as ExperienceLevel;
  const selectedSkills = profile.skills ?? [];
  const lang = hasProgrammingLanguage(profile);

  if (!categoryId) return null;

  // Software Development: require language for coding path; otherwise we still allow MCQ-only so they can complete (or block at onboarding).
  if (categoryId === SOFTWARE_DEV) {
    if (lang.has && lang.first) {
      return {
        pathType: "coding_mcq",
        categoryId,
        experienceLevel,
        selectedSkills,
        selectedLanguage: lang.first,
      };
    }
    // No language: design says "require at least one programming language" at registration. So we could return null to block, or mcq_only. We return mcq_only so existing users without language can still take 50 MCQ.
    return {
      pathType: "mcq_only",
      categoryId,
      experienceLevel,
      selectedSkills,
    };
  }

  // UI/UX: MCQ only
  if (MCQ_ONLY_CATEGORIES.has(categoryId)) {
    return {
      pathType: "mcq_only",
      categoryId,
      experienceLevel,
      selectedSkills,
    };
  }

  // Cyber Security / QA: coding if language (e.g. Python), else MCQ only
  if (CODING_CATEGORIES.has(categoryId)) {
    if (lang.has && lang.first) {
      return {
        pathType: "coding_mcq",
        categoryId,
        experienceLevel,
        selectedSkills,
        selectedLanguage: lang.first,
      };
    }
    return {
      pathType: "mcq_only",
      categoryId,
      experienceLevel,
      selectedSkills,
    };
  }

  // Data Analytics, DevOps, AI-ML: portfolio + MCQ if no language; coding + MCQ if language
  if (PORTFOLIO_MCQ_CATEGORIES.has(categoryId)) {
    if (lang.has && lang.first) {
      return {
        pathType: "coding_mcq",
        categoryId,
        experienceLevel,
        selectedSkills,
        selectedLanguage: lang.first,
      };
    }
    return {
      pathType: "portfolio_mcq",
      categoryId,
      experienceLevel,
      selectedSkills,
    };
  }

  // Fallback
  return {
    pathType: "mcq_only",
    categoryId,
    experienceLevel,
    selectedSkills,
  };
}

/** Whether the category is Software Development (used to enforce language at onboarding). */
export function isSoftwareDevelopment(categoryId: string): boolean {
  return categoryId === SOFTWARE_DEV;
}
