/**
 * Role-based professional links for freelancers (profile + matching gates).
 * Used by Convex mutations and client UI; keep in sync with matching rules.
 */

const CODE_TECH_FIELDS: ReadonlySet<string> = new Set([
  "software_development",
  "development",
  "machine_learning",
  "ai",
  "devops_cloud",
  "blockchain",
  "data_analytics",
  "cybersecurity_it",
  "qa_testing",
  "data_science",
]);

const DESIGN_TECH_FIELDS: ReadonlySet<string> = new Set(["ui_ux_design", "design"]);

export function requiresGithubUrl(techField: string | undefined): boolean {
  if (!techField) return false;
  return CODE_TECH_FIELDS.has(techField);
}

export function requiresBehanceUrl(techField: string | undefined): boolean {
  if (!techField) return false;
  return DESIGN_TECH_FIELDS.has(techField);
}

/** Non-code, non-design (e.g. technical_writing, other): LinkedIn or general portfolio. */
export function requiresProfessionalLink(techField: string | undefined): boolean {
  if (!techField) return false;
  return !requiresGithubUrl(techField) && !requiresBehanceUrl(techField);
}

const URL_MAX_LEN = 2048;

export function normalizeHttpUrl(raw: string | undefined | null): string | null {
  if (raw == null) return null;
  const t = raw.trim();
  if (!t || t.length > URL_MAX_LEN) return null;
  const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase();
    if (!host.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function validateGithubHost(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    const h = u.hostname.toLowerCase();
    return h === "github.com" || h.endsWith(".github.com");
  } catch {
    return false;
  }
}

export function validateBehanceHost(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    const h = u.hostname.toLowerCase();
    return h === "behance.net" || h.endsWith(".behance.net");
  } catch {
    return false;
  }
}

export function validateLinkedInHost(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    const h = u.hostname.toLowerCase();
    if (h !== "linkedin.com" && !h.endsWith(".linkedin.com")) return false;
    const p = u.pathname.toLowerCase();
    return p.includes("/in/") || p.includes("/company/");
  } catch {
    return false;
  }
}

export type FreelancerProfileLinksInput = {
  techField?: string;
  githubUrl?: string;
  behanceUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
};

/**
 * Validates and normalizes URLs on the merged profile patch (freelancers only).
 * Mutates `patch` in place with canonical URLs where applicable.
 */
function clearIfEmpty(patch: FreelancerProfileLinksInput, key: keyof FreelancerProfileLinksInput): void {
  const v = patch[key];
  if (v == null || (typeof v === "string" && !v.trim())) {
    delete patch[key];
  }
}

export function applyFreelancerProfileLinkRules(patch: FreelancerProfileLinksInput): void {
  const tf = patch.techField;

  if (requiresGithubUrl(tf)) {
    const u = normalizeHttpUrl(patch.githubUrl);
    if (!u || !validateGithubHost(u)) {
      throw new Error(
        "GitHub profile URL is required for your category. Use a link on github.com (e.g. your profile or organization)."
      );
    }
    patch.githubUrl = u;
  } else if (patch.githubUrl != null && String(patch.githubUrl).trim()) {
    const u = normalizeHttpUrl(patch.githubUrl);
    if (!u || !validateGithubHost(u)) {
      throw new Error("GitHub URL must be a valid https link on github.com.");
    }
    patch.githubUrl = u;
  } else {
    clearIfEmpty(patch, "githubUrl");
  }

  if (requiresBehanceUrl(tf)) {
    const u = normalizeHttpUrl(patch.behanceUrl);
    if (!u || !validateBehanceHost(u)) {
      throw new Error(
        "Behance profile URL is required for design roles. Use a link on behance.net."
      );
    }
    patch.behanceUrl = u;
  } else if (patch.behanceUrl != null && String(patch.behanceUrl).trim()) {
    const u = normalizeHttpUrl(patch.behanceUrl);
    if (!u || !validateBehanceHost(u)) {
      throw new Error("Behance URL must be a valid https link on behance.net.");
    }
    patch.behanceUrl = u;
  } else {
    clearIfEmpty(patch, "behanceUrl");
  }

  if (patch.linkedinUrl != null && String(patch.linkedinUrl).trim()) {
    const u = normalizeHttpUrl(patch.linkedinUrl);
    if (!u || !validateLinkedInHost(u)) {
      throw new Error(
        "LinkedIn URL must be a profile or company page on linkedin.com (e.g. linkedin.com/in/…)."
      );
    }
    patch.linkedinUrl = u;
  } else {
    clearIfEmpty(patch, "linkedinUrl");
  }

  if (patch.portfolioUrl != null && String(patch.portfolioUrl).trim()) {
    const u = normalizeHttpUrl(patch.portfolioUrl);
    if (!u) {
      throw new Error("Portfolio URL is not valid. Include a domain (e.g. https://your-site.com).");
    }
    patch.portfolioUrl = u;
  } else {
    clearIfEmpty(patch, "portfolioUrl");
  }

  if (requiresProfessionalLink(tf)) {
    const hasLi = !!patch.linkedinUrl;
    const hasPo = !!patch.portfolioUrl;
    if (!hasLi && !hasPo) {
      throw new Error(
        "For your category, add a LinkedIn profile or a portfolio / website URL so clients can verify your work."
      );
    }
  }
}

/**
 * Hard gate for client matching pools. Category links are collected during onboarding
 * and validated on profile save — they do not block pool entry once the account is approved.
 */
export function freelancerHasVerifiedPhoneForMatching(freelancer: {
  phoneVerifiedAt?: number;
}): boolean {
  return freelancer.phoneVerifiedAt != null;
}

/**
 * @deprecated Prefer {@link freelancerHasVerifiedPhoneForMatching} for matching eligibility.
 * Still useful if you need “phone + required portfolio links” for non-matching UX.
 */
export function freelancerHasPhoneAndLinksForMatching(freelancer: {
  phoneVerifiedAt?: number;
  profile?: FreelancerProfileLinksInput | null;
}): boolean {
  if (!freelancerHasVerifiedPhoneForMatching(freelancer)) return false;
  const p = freelancer.profile ?? {};
  const tf = p.techField;

  if (requiresGithubUrl(tf)) {
    const u = normalizeHttpUrl(p.githubUrl);
    if (!u || !validateGithubHost(u)) return false;
  }
  if (requiresBehanceUrl(tf)) {
    const u = normalizeHttpUrl(p.behanceUrl);
    if (!u || !validateBehanceHost(u)) return false;
  }
  if (requiresProfessionalLink(tf)) {
    const liRaw = normalizeHttpUrl(p.linkedinUrl);
    const liOk = !!liRaw && validateLinkedInHost(liRaw);
    const poOk = !!normalizeHttpUrl(p.portfolioUrl);
    if (!liOk && !poOk) return false;
  }
  return true;
}
