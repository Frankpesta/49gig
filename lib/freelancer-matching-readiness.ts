/**
 * UX copy + routes for “why you might not appear in client matching”.
 * Aligns with lib/matching-skill-utils isFreelancerEligibleForProjectMatch (phone + skill fit).
 */

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

/**
 * Ordered checklist of blockers for being eligible when clients run matching.
 * Does not include portfolio links (enforced at onboarding / profile); does not include skill fit (project-dependent).
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
        "Complete platform verification and wait for admin approval to be eligible for matches.",
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

  return issues;
}

export function isFreelancerMatchingReady(user: FreelancerUserLike): boolean {
  return getFreelancerMatchingReadinessIssues(user).length === 0;
}

/**
 * Single source of truth for “is this freelancer eligible to appear in the client-matching pool”.
 * Used server-side in matching actions and any admin surface that picks candidates. Skill/category fit
 * is evaluated separately per project — this is the global account-level gate only.
 */
export function isFreelancerInMatchingPool(user: FreelancerUserLike): boolean {
  if (user.role !== "freelancer") return false;
  if (user.status !== "active") return false;
  if (user.verificationStatus !== "approved") return false;
  if (user.kycStatus !== "approved") return false;
  if (user.phoneVerifiedAt == null) return false;
  return true;
}
