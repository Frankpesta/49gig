/**
 * UX copy + routes for “why you might not appear in client matching”.
 * Aligns with lib/matching-skill-utils isFreelancerEligibleForProjectMatch and Convex pool filters.
 */

import {
  freelancerHasPhoneAndLinksForMatching,
  normalizeHttpUrl,
  requiresBehanceUrl,
  requiresGithubUrl,
  requiresProfessionalLink,
  validateBehanceHost,
  validateGithubHost,
  validateLinkedInHost,
} from "./freelancer-profile-links";

export type MatchingReadinessIssue = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
};

type FreelancerUserLike = {
  role?: string;
  status?: string;
  verificationStatus?: string;
  kycStatus?: string;
  phoneVerifiedAt?: number;
  profile?: {
    techField?: string;
    githubUrl?: string;
    behanceUrl?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
  } | null;
};

function phoneGap(user: FreelancerUserLike): boolean {
  return user.phoneVerifiedAt == null;
}

function profileLinkGaps(user: FreelancerUserLike): string[] {
  const p = user.profile ?? {};
  const tf = p.techField;
  const gaps: string[] = [];
  const gh = normalizeHttpUrl(p.githubUrl);
  const bh = normalizeHttpUrl(p.behanceUrl);
  const li = normalizeHttpUrl(p.linkedinUrl);
  const po = normalizeHttpUrl(p.portfolioUrl);

  if (requiresGithubUrl(tf)) {
    if (!gh || !validateGithubHost(gh)) gaps.push("github");
  }
  if (requiresBehanceUrl(tf)) {
    if (!bh || !validateBehanceHost(bh)) gaps.push("behance");
  }
  if (requiresProfessionalLink(tf)) {
    const liOk = !!li && validateLinkedInHost(li);
    const poOk = !!po;
    if (!liOk && !poOk) gaps.push("linkedin_or_portfolio");
  }
  return gaps;
}

/**
 * Ordered checklist of blockers for being eligible when clients run matching.
 * Does not include “add skills” (soft / project-dependent).
 */
export function getFreelancerMatchingReadinessIssues(
  user: FreelancerUserLike
): MatchingReadinessIssue[] {
  if (user.role !== "freelancer") return [];

  const issues: MatchingReadinessIssue[] = [];

  if (user.status && user.status !== "active") {
    issues.push({
      id: "account_status",
      title: "Account not active",
      description:
        "Suspended or inactive accounts are not included in client matching.",
      actionLabel: "Contact support",
      href: "/dashboard/support",
    });
  }

  if (user.verificationStatus !== "approved") {
    issues.push({
      id: "verification",
      title: "Verification not approved",
      description:
        "Complete platform verification and wait for approval to be eligible for matches.",
      actionLabel: "Go to verification",
      href: "/onboarding/verification",
    });
  }

  if (user.kycStatus !== "approved") {
    issues.push({
      id: "kyc",
      title: "Identity verification (KYC) incomplete",
      description:
        "Approved KYC is required before you can appear in client match results.",
      actionLabel: "Complete KYC",
      href: "/onboarding/verification",
    });
  }

  if (phoneGap(user)) {
    issues.push({
      id: "phone",
      title: "Phone number not verified",
      description:
        "Verify your mobile number so we can confirm it’s you and include you in matching.",
      actionLabel: "Verify phone",
      href: "/dashboard/profile",
    });
  }

  const linkGaps = profileLinkGaps(user);
  if (linkGaps.includes("github")) {
    issues.push({
      id: "github",
      title: "GitHub profile link missing or invalid",
      description:
        "For your role category, add a valid GitHub profile URL (github.com) so clients can review your work.",
      actionLabel: "Add GitHub link",
      href: "/dashboard/profile",
    });
  }
  if (linkGaps.includes("behance")) {
    issues.push({
      id: "behance",
      title: "Behance link missing or invalid",
      description:
        "Design roles need a Behance profile URL on behance.net.",
      actionLabel: "Add Behance link",
      href: "/dashboard/profile",
    });
  }
  if (linkGaps.includes("linkedin_or_portfolio")) {
    issues.push({
      id: "professional_link",
      title: "LinkedIn or portfolio required",
      description:
        "For your category, add a LinkedIn profile or a portfolio / website URL.",
      actionLabel: "Update profile links",
      href: "/dashboard/profile",
    });
  }

  // Same gate as matching-skill-utils (covers edge cases if logic drifts)
  if (
    issues.length === 0 &&
    !freelancerHasPhoneAndLinksForMatching(user as Parameters<typeof freelancerHasPhoneAndLinksForMatching>[0])
  ) {
    issues.push({
      id: "profile_links",
      title: "Profile links need attention",
      description:
        "Update your profile so phone and professional links meet platform requirements.",
      actionLabel: "Open profile",
      href: "/dashboard/profile",
    });
  }

  return issues;
}

export function isFreelancerMatchingReady(user: FreelancerUserLike): boolean {
  return getFreelancerMatchingReadinessIssues(user).length === 0;
}
