/**
 * Team Matching Algorithm
 * 
 * Intelligently matches multiple freelancers with different specializations
 * based on project requirements and team size.
 */

import type { Doc } from "../convex/_generated/dataModel";

export type TeamSize = "2-3" | "4-6" | "7+" | "not_sure";
export type TalentCategory =
  | "Software Development"
  | "UI/UX and Product Design"
  | "Data Analytics"
  | "DevOps and Cloud Engineering"
  | "Cyber Security and IT Infrastructure"
  | "AI, Machine Learning and Blockchain"
  | "Quality Assurance and Testing"

export type ExperienceLevel = "junior" | "mid" | "senior" | "expert";

/**
 * Skill specialization mapping
 * Maps skills to specific roles/specializations
 */
const SKILL_TO_ROLE: Record<string, string[]> = {
  // Mobile Development
  "React Native": ["mobile_dev"],
  "Flutter": ["mobile_dev"],
  "Swift": ["mobile_dev", "ios_dev"],
  "Kotlin": ["mobile_dev", "android_dev"],
  "Mobile Dev": ["mobile_dev"],
  
  // Backend Development
  "Node.js": ["backend_dev"],
  "Python": ["backend_dev", "data_science", "data_scientist", "data_analyst"],
  "Java": ["backend_dev"],
  "Go": ["backend_dev"],
  "Rust": ["backend_dev"],
  "PHP": ["backend_dev"],
  "Ruby": ["backend_dev"],
  ".NET": ["backend_dev"],
  "C++": ["backend_dev"],
  
  // Frontend Development
  "React": ["frontend_dev"],
  "Next.js": ["frontend_dev"],
  "Vue.js": ["frontend_dev"],
  "Angular": ["frontend_dev"],
  "TypeScript": ["frontend_dev"],
  "JavaScript": ["frontend_dev"],
  
  // Cloud/DevOps
  "AWS": ["cloud_engineer", "devops"],
  "Azure": ["cloud_engineer", "devops"],
  "GCP": ["cloud_engineer", "devops"],
  "Docker": ["devops", "cloud_engineer"],
  "Kubernetes": ["devops", "cloud_engineer"],
  "Terraform": ["devops", "cloud_engineer"],
  "CI/CD": ["devops"],
  
  // UI/UX Design
  "Figma": ["ui_designer", "ux_designer"],
  "Adobe XD": ["ui_designer"],
  "Sketch": ["ui_designer"],
  "Prototyping": ["ux_designer"],
  "User Research": ["ux_designer"],
  "Wireframing": ["ux_designer"],
  "Visual Design": ["ui_designer"],
  
  // Data Analytics
  "SQL": ["data_analyst", "data_engineer"],
  "Tableau": ["data_analyst"],
  "Power BI": ["data_analyst"],
  "R": ["data_scientist"],
  "Machine Learning": ["data_scientist"],
  "Pandas": ["data_scientist", "data_analyst"],
  "NumPy": ["data_scientist"],
  
  "Technical Writing": ["technical_writer"],
};

/**
 * Role distribution templates for different project types
 */
const ROLE_DISTRIBUTIONS: Record<string, Record<string, number>> = {
  "fintech_app": {
    mobile_dev: 2,
    backend_dev: 3,
    cloud_engineer: 2,
  },
  "ecommerce_platform": {
    frontend_dev: 2,
    backend_dev: 2,
    ui_designer: 1,
    devops: 1,
  },
  "data_platform": {
    data_scientist: 2,
    data_engineer: 2,
    backend_dev: 1,
    cloud_engineer: 1,
  },
  "default": {
    backend_dev: 1,
    frontend_dev: 1,
  },
};

/**
 * Infer project type from description and skills
 */
function inferProjectType(
  description: string,
  skills: string[],
  category: TalentCategory
): string {
  const descLower = description.toLowerCase();
  
  // Fintech indicators
  if (
    descLower.includes("fintech") ||
    descLower.includes("financial") ||
    descLower.includes("payment") ||
    descLower.includes("banking")
  ) {
    return "fintech_app";
  }
  
  // E-commerce indicators
  if (
    descLower.includes("ecommerce") ||
    descLower.includes("e-commerce") ||
    descLower.includes("online store") ||
    descLower.includes("shopping")
  ) {
    return "ecommerce_platform";
  }
  
  // Data platform indicators
  if (
    descLower.includes("data") ||
    descLower.includes("analytics") ||
    descLower.includes("machine learning") ||
    descLower.includes("ai")
  ) {
    return "data_platform";
  }
  
  // Marketing category removed - return default
  return "default";
}

/**
 * Determine team composition based on project requirements
 */
export function determineTeamComposition(params: {
  teamSize: TeamSize;
  description: string;
  skills: string[];
  category: TalentCategory;
  experienceLevel: ExperienceLevel;
}): Record<string, number> {
  const { teamSize, description, skills, category } = params;
  
  // Get target team size
  let targetSize: number;
  switch (teamSize) {
    case "2-3":
      targetSize = 3; // Use upper bound
      break;
    case "4-6":
      targetSize = 5; // Use middle
      break;
    case "7+":
      targetSize = 7; // Use minimum
      break;
    case "not_sure":
      // Infer from project complexity
      targetSize = skills.length > 5 ? 5 : 3;
      break;
    default:
      targetSize = 3;
  }
  
  // Infer project type
  const projectType = inferProjectType(description, skills, category);
  
  // Get base role distribution
  const baseDistribution = ROLE_DISTRIBUTIONS[projectType] || ROLE_DISTRIBUTIONS["default"];
  
  // Map skills to roles
  const skillRoles = new Map<string, number>();
  for (const skill of skills) {
    const roles = SKILL_TO_ROLE[skill] || [];
    for (const role of roles) {
      skillRoles.set(role, (skillRoles.get(role) || 0) + 1);
    }
  }
  
  // Build team composition based on skills and base distribution
  const composition: Record<string, number> = {};
  let totalAllocated = 0;
  
  // First, allocate based on skill requirements
  for (const [role, count] of skillRoles.entries()) {
    if (totalAllocated >= targetSize) break;
    
    const baseCount = baseDistribution[role] || 0;
    const skillCount = Math.min(count, 2); // Max 2 per role from skills
    const allocated = Math.max(baseCount, skillCount);
    
    if (allocated > 0 && totalAllocated + allocated <= targetSize) {
      composition[role] = allocated;
      totalAllocated += allocated;
    }
  }
  
  // Fill remaining slots with base distribution
  for (const [role, count] of Object.entries(baseDistribution)) {
    if (totalAllocated >= targetSize) break;
    if (composition[role]) continue; // Already allocated
    
    const remaining = targetSize - totalAllocated;
    if (remaining > 0) {
      composition[role] = Math.min(count, remaining);
      totalAllocated += composition[role];
    }
  }
  
  // If still not enough, add generic roles
  if (totalAllocated < targetSize) {
    const remaining = targetSize - totalAllocated;
    if (category === "Software Development") {
      composition["backend_dev"] = (composition["backend_dev"] || 0) + Math.ceil(remaining / 2);
      composition["frontend_dev"] = (composition["frontend_dev"] || 0) + Math.floor(remaining / 2);
    } else if (category === "UI/UX and Product Design") {
      composition["ui_designer"] = (composition["ui_designer"] || 0) + Math.ceil(remaining / 2);
      composition["ux_designer"] = (composition["ux_designer"] || 0) + Math.floor(remaining / 2);
    } else if (category === "Data Analytics") {
      composition["data_scientist"] = (composition["data_scientist"] || 0) + remaining;
    } else if (category === "DevOps and Cloud Engineering") {
      composition["devops"] = (composition["devops"] || 0) + remaining;
    } else if (category === "Cyber Security and IT Infrastructure") {
      composition["backend_dev"] = (composition["backend_dev"] || 0) + remaining;
    } else if (category === "AI, Machine Learning and Blockchain") {
      composition["data_scientist"] = (composition["data_scientist"] || 0) + remaining;
    } else if (category === "Quality Assurance and Testing") {
      composition["qa"] = (composition["qa"] || 0) + remaining;
    }
  }
  
  return composition;
}

/**
 * Match freelancers to team roles
 */
export interface TeamMatchResult {
  role: string;
  freelancer: Doc<"users">;
  score: number;
  matchReasons: string[];
}

export function matchFreelancerToRole(
  freelancer: Doc<"users">,
  role: string,
  requiredSkills: string[],
  experienceLevel: ExperienceLevel
): {
  score: number;
  matchReasons: string[];
} {
  const freelancerSkills = freelancer.profile?.skills || [];
  const freelancerExperience = freelancer.profile?.experienceLevel || "mid";
  
  let score = 0;
  const matchReasons: string[] = [];
  
  // Check skill overlap for this role
  const roleSkills = Object.entries(SKILL_TO_ROLE)
    .filter((entry: [string, string[]]) => {
      const [_skill, roles] = entry;
      return roles.includes(role);
    })
    .map((entry: [string, string[]]) => {
      const [skill] = entry;
      return skill;
    });
  
  const skillMatches = (required: string, fs: string) => {
    const r = required.toLowerCase().trim();
    const f = fs.toLowerCase().trim();
    if (r === f) return true;
    if (f.includes(r) || r.includes(f)) return true;
    const norm = (s: string) => s.replace(/\s*[.\-]\s*js$/i, "").replace(/\s+/g, " ").trim();
    return norm(r) === norm(f);
  };
  const matchingSkills = roleSkills.filter((skill: string) =>
    freelancerSkills.some((fs: string) => skillMatches(skill, fs))
  );
  
  if (matchingSkills.length > 0) {
    const skillOverlap = (matchingSkills.length / Math.max(roleSkills.length, 1)) * 100;
    score += skillOverlap * 0.4; // 40% weight
    matchReasons.push(`${matchingSkills.length} matching skills for ${role}`);
  }
  
  // Check experience level match
  const experienceMatch = freelancerExperience === experienceLevel;
  if (experienceMatch) {
    score += 30; // 30% weight
    matchReasons.push(`Experience level matches (${experienceLevel})`);
  } else {
    // Partial match for adjacent levels
    const levelOrder = ["junior", "mid", "senior", "expert"];
    const requiredIndex = levelOrder.indexOf(experienceLevel);
    const freelancerIndex = levelOrder.indexOf(freelancerExperience);
    const distance = Math.abs(requiredIndex - freelancerIndex);
    
    if (distance === 1) {
      score += 15; // Partial match
      matchReasons.push(`Experience level close (${freelancerExperience} vs ${experienceLevel})`);
    }
  }
  
  // Check required skills overlap
  const requiredSkillMatches = requiredSkills.filter((skill: string) =>
    freelancerSkills.some((fs: string) => fs.toLowerCase() === skill.toLowerCase())
  );
  
  if (requiredSkillMatches.length > 0) {
    const requiredOverlap = (requiredSkillMatches.length / requiredSkills.length) * 100;
    score += requiredOverlap * 0.3; // 30% weight
    matchReasons.push(`${requiredSkillMatches.length} required skills matched`);
  }
  
  return {
    score: Math.min(100, score),
    matchReasons,
  };
}
