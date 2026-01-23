/**
 * Team Matching Utilities for Convex
 * 
 * Intelligently matches multiple freelancers with different specializations
 */

import { Doc } from "../_generated/dataModel";

export type TeamSize = "2-3" | "4-6" | "7+" | "not_sure";
export type TalentCategory = 
  | "Software Development"
  | "UI/UX & Product Design"
  | "Data & Analytics"
  | "Digital Marketing"
  | "Writing & Content";

export type ExperienceLevel = "junior" | "mid" | "senior" | "expert";

/**
 * Skill specialization mapping
 */
const SKILL_TO_ROLE: Record<string, string[]> = {
  "React Native": ["mobile_dev"],
  "Flutter": ["mobile_dev"],
  "Swift": ["mobile_dev", "ios_dev"],
  "Kotlin": ["mobile_dev", "android_dev"],
  "Mobile Dev": ["mobile_dev"],
  "Node.js": ["backend_dev"],
  "Python": ["backend_dev", "data_science"],
  "Java": ["backend_dev"],
  "Go": ["backend_dev"],
  "Rust": ["backend_dev"],
  "PHP": ["backend_dev"],
  "Ruby": ["backend_dev"],
  ".NET": ["backend_dev"],
  "C++": ["backend_dev"],
  "React": ["frontend_dev"],
  "Next.js": ["frontend_dev"],
  "Vue.js": ["frontend_dev"],
  "Angular": ["frontend_dev"],
  "TypeScript": ["frontend_dev"],
  "JavaScript": ["frontend_dev"],
  "AWS": ["cloud_engineer", "devops"],
  "Azure": ["cloud_engineer", "devops"],
  "GCP": ["cloud_engineer", "devops"],
  "Docker": ["devops", "cloud_engineer"],
  "Kubernetes": ["devops", "cloud_engineer"],
  "Terraform": ["devops", "cloud_engineer"],
  "CI/CD": ["devops"],
  "Figma": ["ui_designer", "ux_designer"],
  "Adobe XD": ["ui_designer"],
  "Sketch": ["ui_designer"],
  "Prototyping": ["ux_designer"],
  "User Research": ["ux_designer"],
  "Wireframing": ["ux_designer"],
  "Visual Design": ["ui_designer"],
  "SQL": ["data_analyst", "data_engineer"],
  "Tableau": ["data_analyst"],
  "Power BI": ["data_analyst"],
  "R": ["data_scientist"],
  "Machine Learning": ["data_scientist"],
  "Pandas": ["data_scientist", "data_analyst"],
  "NumPy": ["data_scientist"],
  "SEO": ["seo_specialist"],
  "PPC": ["ppc_specialist"],
  "Google Ads": ["ppc_specialist"],
  "Facebook Ads": ["social_media_specialist"],
  "Social Media Marketing": ["social_media_specialist"],
  "Content Marketing": ["content_marketer"],
  "Email Marketing": ["email_marketer"],
  "Analytics": ["marketing_analyst"],
  "Copywriting": ["copywriter"],
  "Blog Writing": ["content_writer"],
  "Technical Writing": ["technical_writer"],
  "SEO Content": ["seo_writer"],
  "Creative Writing": ["creative_writer"],
  "Content Strategy": ["content_strategist"],
};

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
  "marketing_campaign": {
    seo_specialist: 1,
    content_writer: 2,
    social_media_specialist: 1,
    ppc_specialist: 1,
  },
  "default": {
    backend_dev: 1,
    frontend_dev: 1,
  },
};

function inferProjectType(
  description: string,
  skills: string[],
  category: TalentCategory
): string {
  const descLower = description.toLowerCase();
  
  if (
    descLower.includes("fintech") ||
    descLower.includes("financial") ||
    descLower.includes("payment") ||
    descLower.includes("banking")
  ) {
    return "fintech_app";
  }
  
  if (
    descLower.includes("ecommerce") ||
    descLower.includes("e-commerce") ||
    descLower.includes("online store") ||
    descLower.includes("shopping")
  ) {
    return "ecommerce_platform";
  }
  
  if (
    descLower.includes("data") ||
    descLower.includes("analytics") ||
    descLower.includes("machine learning") ||
    descLower.includes("ai")
  ) {
    return "data_platform";
  }
  
  if (
    category === "Digital Marketing" ||
    descLower.includes("marketing") ||
    descLower.includes("campaign")
  ) {
    return "marketing_campaign";
  }
  
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
  
  let targetSize: number;
  switch (teamSize) {
    case "2-3":
      targetSize = 3;
      break;
    case "4-6":
      targetSize = 5;
      break;
    case "7+":
      targetSize = 7;
      break;
    case "not_sure":
      targetSize = skills.length > 5 ? 5 : 3;
      break;
    default:
      targetSize = 3;
  }
  
  const projectType = inferProjectType(description, skills, category);
  const baseDistribution = ROLE_DISTRIBUTIONS[projectType] || ROLE_DISTRIBUTIONS["default"];
  
  const skillRoles = new Map<string, number>();
  for (const skill of skills) {
    const roles = SKILL_TO_ROLE[skill] || [];
    for (const role of roles) {
      skillRoles.set(role, (skillRoles.get(role) || 0) + 1);
    }
  }
  
  const composition: Record<string, number> = {};
  let totalAllocated = 0;
  
  for (const [role, count] of skillRoles.entries()) {
    if (totalAllocated >= targetSize) break;
    
    const baseCount = baseDistribution[role] || 0;
    const skillCount = Math.min(count, 2);
    const allocated = Math.max(baseCount, skillCount);
    
    if (allocated > 0 && totalAllocated + allocated <= targetSize) {
      composition[role] = allocated;
      totalAllocated += allocated;
    }
  }
  
  for (const [role, count] of Object.entries(baseDistribution)) {
    if (totalAllocated >= targetSize) break;
    if (composition[role]) continue;
    
    const remaining = targetSize - totalAllocated;
    if (remaining > 0) {
      composition[role] = Math.min(count, remaining);
      totalAllocated += composition[role];
    }
  }
  
  if (totalAllocated < targetSize) {
    const remaining = targetSize - totalAllocated;
    if (category === "Software Development") {
      composition["backend_dev"] = (composition["backend_dev"] || 0) + Math.ceil(remaining / 2);
      composition["frontend_dev"] = (composition["frontend_dev"] || 0) + Math.floor(remaining / 2);
    } else if (category === "UI/UX & Product Design") {
      composition["ui_designer"] = (composition["ui_designer"] || 0) + Math.ceil(remaining / 2);
      composition["ux_designer"] = (composition["ux_designer"] || 0) + Math.floor(remaining / 2);
    } else if (category === "Data & Analytics") {
      composition["data_scientist"] = (composition["data_scientist"] || 0) + remaining;
    } else if (category === "Digital Marketing") {
      composition["content_marketer"] = (composition["content_marketer"] || 0) + remaining;
    } else if (category === "Writing & Content") {
      composition["content_writer"] = (composition["content_writer"] || 0) + remaining;
    }
  }
  
  return composition;
}

/**
 * Match freelancer to role
 */
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
  
  const roleSkills = Object.entries(SKILL_TO_ROLE)
    .filter(([_, roles]) => roles.includes(role))
    .map(([skill]) => skill);
  
  const matchingSkills = roleSkills.filter((skill) =>
    freelancerSkills.some((fs) => fs.toLowerCase() === skill.toLowerCase())
  );
  
  if (matchingSkills.length > 0) {
    const skillOverlap = (matchingSkills.length / Math.max(roleSkills.length, 1)) * 100;
    score += skillOverlap * 0.4;
    matchReasons.push(`${matchingSkills.length} matching skills for ${role}`);
  }
  
  const experienceMatch = freelancerExperience === experienceLevel;
  if (experienceMatch) {
    score += 30;
    matchReasons.push(`Experience level matches (${experienceLevel})`);
  } else {
    const levelOrder = ["junior", "mid", "senior", "expert"];
    const requiredIndex = levelOrder.indexOf(experienceLevel);
    const freelancerIndex = levelOrder.indexOf(freelancerExperience);
    const distance = Math.abs(requiredIndex - freelancerIndex);
    
    if (distance === 1) {
      score += 15;
      matchReasons.push(`Experience level close (${freelancerExperience} vs ${experienceLevel})`);
    }
  }
  
  const requiredSkillMatches = requiredSkills.filter((skill) =>
    freelancerSkills.some((fs) => fs.toLowerCase() === skill.toLowerCase())
  );
  
  if (requiredSkillMatches.length > 0) {
    const requiredOverlap = (requiredSkillMatches.length / requiredSkills.length) * 100;
    score += requiredOverlap * 0.3;
    matchReasons.push(`${requiredSkillMatches.length} required skills matched`);
  }
  
  return {
    score: Math.min(100, score),
    matchReasons,
  };
}
