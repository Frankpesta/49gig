/**
 * UX copy + routes for “why you might not appear in client matching”.
 * Aligns with lib/matching-skill-utils isFreelancerEligibleForProjectMatch (skill fit).
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
  profile?: {
    techField?: string;
    githubUrl?: string;
    behanceUrl?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
  } | null;
};

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
  return true;
}

/** Defaults used when user doc fields are unset (legacy rows). */
export function normalizeFreelancerVerificationStatus(status?: string): string {
  return status ?? "not_started";
}

export function normalizeFreelancerKycStatus(status?: string): string {
  return status ?? "not_submitted";
}

/**
 * Admin / matching gate on the user document only (verification + KYC).
 * Same pair as `isFreelancerInMatchingPool`, without the active-account check.
 */
export function isFreelancerKycAndAdminApproved(user: FreelancerUserLike): boolean {
  if (user.role !== "freelancer") return false;
  return (
    user.verificationStatus === "approved" && user.kycStatus === "approved"
  );
}

/**
 * Freelancers who still need admin profile approval and/or KYC approval.
 * Excludes deleted accounts; includes active and suspended.
 */
export function needsFreelancerKycOrAdminApproval(user: FreelancerUserLike): boolean {
  if (user.role !== "freelancer") return false;
  if (user.status === "deleted") return false;
  return !isFreelancerKycAndAdminApproved(user);
}

export type SignupQueueVettingLike = { status?: string } | null | undefined;
export type SignupQueueKycSubmissionLike = { status?: string } | null | undefined;

/**
 * Narrow actionable queue: tests submitted for admin + KYC documents in review.
 * Used for one-click signup approval and “Signup queue” badges.
 */
export function isInOneStepSignupApprovalQueue(
  user: FreelancerUserLike,
  vetting?: SignupQueueVettingLike,
  kycSubmission?: SignupQueueKycSubmissionLike
): boolean {
  if (user.role !== "freelancer" || user.status !== "active") return false;
  if (isFreelancerKycAndAdminApproved(user)) return false;
  const kycSubmissionStatus =
    kycSubmission?.status ?? normalizeFreelancerKycStatus(user.kycStatus);
  return (
    vetting?.status === "pending_admin" && kycSubmissionStatus === "pending_review"
  );
}
