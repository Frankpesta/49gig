import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    // Identity
    email: v.string(),
    emailVerified: v.boolean(),
    name: v.string(),

    // Auth
    authProvider: v.union(
      v.literal("email"),
      v.literal("google"),
      v.literal("magic_link")
    ),
    passwordHash: v.optional(v.string()), // Only for email auth
    twoFactorEnabled: v.optional(v.boolean()),
    twoFactorMethod: v.optional(v.union(v.literal("email"))),

    // Role & Permissions
    role: v.union(
      v.literal("client"),
      v.literal("freelancer"),
      v.literal("moderator"),
      v.literal("admin")
    ),
    roleChangedAt: v.optional(v.number()),
    roleChangedBy: v.optional(v.id("users")),

    // Profile (role-specific)
    profile: v.optional(
      v.object({
        // Client profile
        companyName: v.optional(v.string()),
        companySize: v.optional(v.string()),
        industry: v.optional(v.string()),
        workEmail: v.optional(v.string()),
        phoneNumber: v.optional(v.string()),
        address: v.optional(v.string()),
        companyWebsite: v.optional(v.string()),
        country: v.optional(v.string()),

        // Freelancer profile
        bio: v.optional(v.string()),
        skills: v.optional(v.array(v.string())),
        techField: v.optional(
          v.union(
            v.literal("development"),
            v.literal("data_science"),
            v.literal("technical_writing"),
            v.literal("design"),
            v.literal("other"),
            v.literal("software_development"),
            v.literal("ui_ux_design"),
            v.literal("data_analytics"),
            v.literal("devops_cloud"),
            v.literal("cybersecurity_it"),
            v.literal("ai"),
            v.literal("machine_learning"),
            v.literal("blockchain"),
            v.literal("qa_testing")
          )
        ),
        experienceLevel: v.optional(
          v.union(
            v.literal("junior"),
            v.literal("mid"),
            v.literal("senior"),
            v.literal("expert")
          )
        ),
        languagesWritten: v.optional(v.array(v.string())),
        hourlyRate: v.optional(v.number()),
        availability: v.optional(
          v.union(
            v.literal("available"),
            v.literal("busy"),
            v.literal("unavailable")
          )
        ),
        timezone: v.optional(v.string()),
        portfolioUrl: v.optional(v.string()),
        /** Code / engineering categories: required on profile + for matching */
        githubUrl: v.optional(v.string()),
        /** Design categories: required on profile + for matching */
        behanceUrl: v.optional(v.string()),
        /** Optional for all; required with or instead of portfolio for non-code, non-design roles */
        linkedinUrl: v.optional(v.string()),
        // Profile photo (e.g. from OAuth); do not use portfolioUrl for this
        imageUrl: v.optional(v.string()),
        // Freelancer: human-readable role title (e.g. "Senior Backend Engineer")
        primaryRole: v.optional(v.string()),
        weeklyHours: v.optional(v.number()),
        earliestStartDate: v.optional(v.number()),
        /** When techField is software_development: selected sub-fields (e.g. backend_dev, fullstack_dev) */
        softwareDevFields: v.optional(v.array(v.string())),
      })
    ),

    // Resume (freelancer)
    resumeUrl: v.optional(v.string()),
    resumeFileId: v.optional(v.id("_storage")),
    resumeUploadedAt: v.optional(v.number()),
    resumeStatus: v.optional(
      v.union(
        v.literal("not_uploaded"),
        v.literal("pending_upload"),
        v.literal("uploaded"),
        v.literal("processing"),
        v.literal("processed"),
        v.literal("failed")
      )
    ),
    resumeBio: v.optional(v.string()),
    resumeParsedData: v.optional(v.any()),
    resumeCanReuploadAt: v.optional(v.number()),

    // Notification preferences
    notificationPreferences: v.optional(
      v.object({
        email: v.boolean(),
        push: v.boolean(),
        inApp: v.boolean(),
      })
    ),

    // Status
    status: v.union(
      v.literal("active"),
      v.literal("suspended"),
      v.literal("deleted")
    ),

    /** Set when status becomes suspended (cleared when reactivated) */
    suspendedAt: v.optional(v.number()),
    suspendedBy: v.optional(v.id("users")),
    /** Timestamp when suspension lifts automatically (e.g. 6-month bans). Null = indefinite. */
    suspendedUntil: v.optional(v.number()),
    /** Internal note for admins/moderators (not shown to the user) */
    suspensionReason: v.optional(v.string()),

    // Verification Status (for freelancers)
    verificationStatus: v.optional(
      v.union(
        v.literal("not_started"),
        v.literal("in_progress"),
        v.literal("pending_review"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("suspended")
      )
    ),
    verificationCompletedAt: v.optional(v.number()),
    /** Last time we emailed a nudge to finish freelancer verification (cooldown between sends). */
    verificationIncompleteReminderSentAt: v.optional(v.number()),

    // KYC (freelancers): required for matching; approved = can be matched
    kycStatus: v.optional(
      v.union(
        v.literal("not_submitted"),
        v.literal("pending_review"),
        v.literal("approved"),
        v.literal("id_rejected"),
        v.literal("address_rejected")
      )
    ),
    kycApprovedAt: v.optional(v.number()),

    /** Freelancer: E.164 after successful SMS verification (Twilio Verify) */
    phoneE164: v.optional(v.string()),
    phoneVerifiedAt: v.optional(v.number()),

    // Flutterwave
    flutterwaveCustomerEmail: v.optional(v.string()), // Flutterwave uses email as customer identifier
    flutterwaveSubaccountId: v.optional(v.string()), // Freelancer's Flutterwave Subaccount ID
    flutterwavePayoutBankCode: v.optional(v.string()), // Stored at subaccount creation for transfers
    flutterwavePayoutAccountNumber: v.optional(v.string()), // Stored at subaccount creation for transfers

    // Referrals (unique share code for every user; attribution only for referred clients)
    referralCode: v.optional(v.string()),
    referredByUserId: v.optional(v.id("users")),
    referralAttributedAt: v.optional(v.number()),

    // Audit
    createdAt: v.number(),
    updatedAt: v.number(),
    lastLoginAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_status", ["status"])
    .index("by_verification_status", ["verificationStatus"])
    .index("by_resume_status", ["resumeStatus"])
    .index("by_kyc_status", ["kycStatus"])
    .index("by_referral_code", ["referralCode"])
    .index("by_referred_by", ["referredByUserId"]),

  /**
   * Referrer reward when a referred client’s hire is funded and active 7+ days.
   * Bonus = bonusPercent% of first successful pre_funding netAmount.
   */
  referralAccruals: defineTable({
    referrerId: v.id("users"),
    referredClientId: v.id("users"),
    projectId: v.id("projects"),
    firstPaymentId: v.id("payments"),
    /** First funding net to escrow, in cents */
    netAmountCents: v.number(),
    bonusPercent: v.number(),
    bonusCents: v.number(),
    status: v.union(
      v.literal("awaiting_first_monthly_approval"),
      v.literal("awaiting_in_progress"),
      v.literal("awaiting_eligibility_period"),
      v.literal("credited"),
      v.literal("void")
    ),
    /** When project entered in_progress (work started) */
    workStartedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    creditedAt: v.optional(v.number()),
  })
    .index("by_project", ["projectId"])
    .index("by_referrer", ["referrerId"])
    .index("by_referred_client", ["referredClientId"])
    .index("by_status", ["status"]),

  // KYC submissions: one per freelancer; resubmit overwrites documents
  kycSubmissions: defineTable({
    freelancerId: v.id("users"),
    idType: v.union(
      v.literal("nin"),
      v.literal("international_passport"),
      v.literal("voters_card"),
      v.literal("other")
    ),
    idOtherLabel: v.optional(v.string()),
    idFrontFileId: v.id("_storage"),
    /** Optional for single-sided IDs (e.g. passport data page, NIN slip). */
    idBackFileId: v.optional(v.id("_storage")),
    addressDocFileId: v.id("_storage"),
    addressDocType: v.union(
      v.literal("utility_bill"),
      v.literal("bank_statement"),
      v.literal("tenancy_agreement")
    ),
    status: v.union(
      v.literal("pending_review"),
      v.literal("approved"),
      v.literal("id_rejected"),
      v.literal("address_rejected")
    ),
    idRejectionCount: v.number(),
    addressRejectionCount: v.number(),
    idRejectionReason: v.optional(v.string()),
    addressRejectionReason: v.optional(v.string()),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    submittedAt: v.number(),
    updatedAt: v.number(),
    documentsDeletedAt: v.optional(v.number()), // Set when storage files are deleted after 12 months
  })
    .index("by_freelancer", ["freelancerId"])
    .index("by_status", ["status"]),

  emailVerificationTokens: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_token", ["token"])
    .index("by_expires", ["expiresAt"]),

  passwordResetTokens: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_token", ["token"])
    .index("by_expires", ["expiresAt"]),

  projects: defineTable({
    // Client
    clientId: v.id("users"),

    // Intake Form Data
    intakeForm: v.object({
      // Section 1: Hire Type
      hireType: v.union(v.literal("single"), v.literal("team")),
      /** Exact number of freelancers (team hires). Role selection is capped at this count. */
      teamMemberCount: v.optional(v.number()),
      /** @deprecated Legacy bucket; prefer teamMemberCount. Kept for existing projects. */
      teamSize: v.optional(
        v.union(
          v.literal("2-3"),
          v.literal("4-6"),
          v.literal("7+"),
          v.literal("not_sure")
        )
      ),
      // Section 2: Project Overview
      title: v.string(),
      description: v.string(),
      startDate: v.number(), // Timestamp
      endDate: v.number(), // Timestamp
      timelineFlexible: v.optional(v.boolean()),
      projectType: v.union(
        v.literal("one_time"),
        v.literal("ongoing"),
        v.literal("not_sure")
      ),
      projectDuration: v.optional(
        v.union(
          v.literal("1"),
          v.literal("3"),
          v.literal("6"),
          v.literal("12+"),
          v.literal("12"),
          v.literal("24"),
          v.literal("36"),
          v.literal("48"),
          v.literal("60")
        )
      ),
      roleType: v.optional(
        v.union(
          v.literal("full_time"),
          v.literal("part_time")
        )
      ),
      // Section 3: Talent Requirements
      roleTitle: v.optional(v.string()),
      talentCategory: v.union(
        v.literal("Software Development"),
        v.literal("UI/UX and Product Design"),
        v.literal("Data Analytics"),
        v.literal("DevOps and Cloud Engineering"),
        v.literal("Cyber Security and IT Infrastructure"),
        v.literal("AI"),
        v.literal("Machine Learning"),
        v.literal("Blockchain"),
        v.literal("Quality Assurance and Testing")
      ),
      experienceLevel: v.union(
        v.literal("junior"),
        v.literal("mid"),
        v.literal("senior"),
        v.literal("expert")
      ),
      requiredSkills: v.optional(v.array(v.string())),
      // Software Development sub-fields (e.g. backend_dev, frontend_dev, mobile_dev …)
      softwareDevFields: v.optional(v.array(v.string())),
      /** One entry per freelancer for team hires (role + optional dev specialisation + skills). */
      teamSlots: v.optional(
        v.array(
          v.object({
            roleId: v.string(),
            softwareDevFieldId: v.optional(v.string()),
            experienceLevel: v.optional(
              v.union(
                v.literal("junior"),
                v.literal("mid"),
                v.literal("senior"),
                v.literal("expert")
              )
            ),
            skills: v.array(v.string()),
          })
        )
      ),
      // Section 4: Budget / Notes
      budget: v.number(), // Calculated budget
      specialRequirements: v.optional(v.string()),
      // Legacy fields (kept for backward compatibility)
      category: v.optional(v.string()),
      timeline: v.optional(v.string()),
      engagementType: v.optional(v.union(v.literal("individual"), v.literal("team"))),
      durationValue: v.optional(v.number()),
      durationUnit: v.optional(
        v.union(v.literal("week"), v.literal("month"), v.literal("year"))
      ),
      hoursPerWeek: v.optional(v.number()),
      pricingPlan: v.optional(
        v.union(
          v.literal("starter"),
          v.literal("professional"),
          v.literal("enterprise")
        )
      ),
      teamPricingTier: v.optional(
        v.union(
          v.literal("startup"),
          v.literal("growth"),
          v.literal("enterprise"),
          v.literal("custom")
        )
      ),
      estimatedHours: v.optional(v.number()),
      estimatedBudget: v.optional(v.number()),
      deliverables: v.optional(v.array(v.string())),
      additionalRequirements: v.optional(v.string()),
    }),

    // Status
    status: v.union(
      v.literal("draft"),
      v.literal("pending_funding"),
      v.literal("funded"),
      v.literal("matching"),
      v.literal("awaiting_freelancer"), // Client selected; waiting for freelancer to accept
      v.literal("matched"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("disputed")
    ),

    // Matching
    matchedFreelancerId: v.optional(v.id("users")),
    matchedFreelancerIds: v.optional(v.array(v.id("users"))), // Team projects
    matchedAt: v.optional(v.number()),

    // Client selection before payment (pre-funding)
    selectedFreelancerId: v.optional(v.id("users")), // Single hire
    selectedFreelancerIds: v.optional(v.array(v.id("users"))), // Team hire

    // Contract
    contractFileId: v.optional(v.id("_storage")),
    contractGeneratedAt: v.optional(v.number()),
    contractSignedAt: v.optional(v.number()),
    clientContractSignedAt: v.optional(v.number()),
    clientContractSignedAtIp: v.optional(v.string()),
    clientContractSignedAtUserAgent: v.optional(v.string()),
    freelancerContractSignatures: v.optional(
      v.array(v.object({
        freelancerId: v.id("users"),
        signedAt: v.number(),
        signedAtIp: v.optional(v.string()),
        signedAtUserAgent: v.optional(v.string()),
      }))
    ),
    /** Set once final signed PDF emails are sent to parties (prevents duplicate sends). */
    contractFullyExecutedEmailedAt: v.optional(v.number()),

    // Payment
    totalAmount: v.number(),
    escrowedAmount: v.number(),
    platformFee: v.number(), // Percentage (e.g., 10)
    currency: v.string(), // "usd"
    fundUpfrontMonths: v.optional(v.number()), // Months paid for (held in escrow; released only at month end)

    // Tracking for follow-up payments: last month index that has been paid for (1-based)
    lastFundedMonthIndex: v.optional(v.number()),
    // When we last sent a "please pay for next month" reminder (timestamp)
    paymentReminderSentAt: v.optional(v.number()),

    // Team budget: role → monthly amount in cents per person (for role-based payment split)
    teamBudgetBreakdown: v.optional(v.record(v.string(), v.number())),

    // Flutterwave
    flutterwaveTransactionId: v.optional(v.string()),
    flutterwaveCustomerEmail: v.optional(v.string()),

    // Auto-assignment queue: true while the project is funded but has no matches yet
    awaitingMatch: v.optional(v.boolean()),
    awaitingMatchSince: v.optional(v.number()),
    /** Team hires: role labels still being matched (empty slots or no candidates yet). */
    rolesAwaitingMatch: v.optional(v.array(v.string())),
    /** Team hires: how many additional freelancers we still need after partial payment/selection. */
    pendingTeamMemberSlots: v.optional(v.number()),

    /** Set when we first email the client that freelancers are available to review (unlocks View matches CTA). */
    clientNotifiedOfAvailableMatchesAt: v.optional(v.number()),
    /** Last time we emailed the client about available matches (initial or periodic reminder). */
    lastClientMatchAvailabilityEmailAt: v.optional(v.number()),

    /** Dispute resolved as freelancer replacement — client must pick a new match (cleared when matched again). */
    replacementMatchingAt: v.optional(v.number()),
    /** Idempotency + audit: which dispute triggered the replacement flow. */
    replacementFlowDisputeId: v.optional(v.id("disputes")),

    /**
     * Freelancers removed after a client-favor or replacement dispute outcome.
     * Never shown again in generated matches for this hire (same client / project).
     */
    permanentlyExcludedFreelancerIds: v.optional(v.array(v.id("users"))),

    // Audit
    createdAt: v.number(),
    updatedAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_client", ["clientId"])
    .index("by_freelancer", ["matchedFreelancerId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_awaiting_match", ["awaitingMatch"]),

  chats: defineTable({
    // Type
    type: v.union(
      v.literal("project"),
      v.literal("support"),
      v.literal("system")
    ),

    // Participants
    participants: v.array(v.id("users")),

    // Project (if project chat)
    projectId: v.optional(v.id("projects")),

    // Support (if support chat)
    supportRequestId: v.optional(v.string()),
    /** Set by admin: primary moderator handling this support thread (inbox triage). */
    supportAssignedModeratorId: v.optional(v.id("users")),

    // Metadata
    title: v.optional(v.string()),
    lastMessageAt: v.optional(v.number()),
    lastMessagePreview: v.optional(v.string()),

    // Status
    status: v.union(
      v.literal("active"),
      v.literal("archived"),
      v.literal("deleted")
    ),

    // Audit
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_participant", ["participants"])
    .index("by_type", ["type"])
    .index("by_last_message", ["lastMessageAt"]),

  messages: defineTable({
    // Chat
    chatId: v.id("chats"),

    // Sender
    senderId: v.id("users"),
    senderRole: v.union(
      v.literal("client"),
      v.literal("freelancer"),
      v.literal("admin"),
      v.literal("moderator"),
      v.literal("system")
    ),

    // Content
    content: v.string(),
    contentType: v.union(
      v.literal("text"),
      v.literal("file"),
      v.literal("system")
    ),

    // Attachments
    attachments: v.optional(
      v.array(
        v.object({
          fileId: v.id("_storage"),
          fileName: v.string(),
          fileSize: v.number(),
          mimeType: v.string(),
          url: v.string(),
        })
      )
    ),

    // Status
    isPinned: v.boolean(),
    isDeleted: v.boolean(), // Soft delete
    deletedAt: v.optional(v.number()),

    // Read receipts
    readBy: v.array(
      v.object({
        userId: v.id("users"),
        readAt: v.number(),
      })
    ),

    // Audit
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_chat", ["chatId", "createdAt"])
    .index("by_sender", ["senderId"])
    .index("by_pinned", ["chatId", "isPinned"]),

  vettingResults: defineTable({
    // Freelancer
    freelancerId: v.id("users"),

    // English Proficiency
    englishProficiency: v.object({
      grammarScore: v.optional(v.number()), // 0-100
      comprehensionScore: v.optional(v.number()), // 0-100
      /** Latest submitted written response text (for grading and audit). */
      writtenResponse: v.optional(v.string()),
      writtenResponseScore: v.optional(v.number()), // 0-100
      overallScore: v.optional(v.number()), // Weighted average
      completedAt: v.optional(v.number()),
      // Anti-cheat measures
      testSessionId: v.optional(v.string()), // Unique session ID
      timeSpent: v.optional(v.number()), // Time in seconds
      attempts: v.optional(v.number()), // Number of attempts
      suspiciousActivity: v.optional(v.array(v.string())), // Flags for suspicious behavior
      browserFingerprint: v.optional(v.string()), // Browser fingerprint hash
      ipAddress: v.optional(v.string()), // IP address during test
    }),

    /** English attempt round (0 = first try, 1 = one retake used). */
    englishAttemptRound: v.optional(v.number()),
    englishFailedAttempts: v.optional(v.number()),
    /**
     * Timestamp (ms) before which an English retake must not be accepted (short cooldown).
     * Set on first English failure; `submitEnglishProficiency` enforces it. Cleared early if the freelancer skips wait.
     */
    englishRetakeAvailableAt: v.optional(v.number()),
    /** Skills composite attempt round for 50% gate + retake. */
    skillsAttemptRound: v.optional(v.number()),
    skillsFailedAttempts: v.optional(v.number()),
    /**
     * Timestamp (ms) before which a skill-test retake must not be accepted (short cooldown).
     * Set on first skills failure; `startSkillTest` enforces it. Cleared early if the freelancer skips wait.
     */
    skillsRetakeAvailableAt: v.optional(v.number()),
    /** MCQ / coding IDs already shown (retakes must not repeat). */
    usedMcqQuestionIds: v.optional(v.array(v.id("vettingMcqQuestions"))),
    usedCodingPromptIds: v.optional(v.array(v.id("vettingCodingPrompts"))),

    // Skill Assessments
    skillAssessments: v.array(
      v.object({
        skillId: v.string(),
        skillName: v.string(),
        assessmentType: v.union(
          v.literal("mcq"),
          v.literal("coding"),
          v.literal("portfolio")
        ),
        score: v.number(), // 0-100
        completedAt: v.number(),
        details: v.optional(v.any()), // Assessment-specific data
        // Anti-cheat measures
        testSessionId: v.optional(v.string()),
        timeSpent: v.optional(v.number()), // Time in seconds
        attempts: v.optional(v.number()),
        suspiciousActivity: v.optional(v.array(v.string())),
        browserFingerprint: v.optional(v.string()),
        ipAddress: v.optional(v.string()),
        // For coding challenges
        codeSubmissions: v.optional(
          v.array(
            v.object({
              code: v.string(),
              submittedAt: v.number(),
              testResults: v.optional(v.any()),
            })
          )
        ),
      })
    ),

    // Overall Scoring
    overallScore: v.number(), // Weighted: English 30%, Skills 70%

    // Status
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("pending_admin"),
      v.literal("approved"),
      v.literal("flagged"),
      v.literal("rejected")
    ),

    // Admin Review
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    reviewNotes: v.optional(v.string()),

    // Verification Steps Tracking
    currentStep: v.optional(
      v.union(
        v.literal("english"),
        v.literal("skills"),
        v.literal("complete")
      )
    ),
    stepsCompleted: v.array(
      v.union(
        v.literal("identity"),
        v.literal("english"),
        v.literal("skills")
      )
    ),

    // Anti-cheat flags
    fraudFlags: v.optional(
      v.array(
        v.object({
          flagType: v.string(), // e.g., "multiple_ips", "suspicious_timing", "plagiarism"
          severity: v.union(
            v.literal("low"),
            v.literal("medium"),
            v.literal("high"),
            v.literal("critical")
          ),
          description: v.string(),
          detectedAt: v.number(),
          resolved: v.boolean(),
        })
      )
    ),

    /**
     * Lightweight proctoring (no video storage, no ML): webcam consent + tab/window/paste signals.
     */
    proctoringSummary: v.optional(
      v.object({
        englishProctoringReadyAt: v.optional(v.number()),
        skillsProctoringReadyAt: v.optional(v.number()),
        visibilityHiddenMsTotal: v.optional(v.number()),
        windowBlurEvents: v.optional(v.number()),
        pasteAttempts: v.optional(v.number()),
        cameraOffSegments: v.optional(v.number()),
        fullscreenExitEvents: v.optional(v.number()),
        lastMetricsAt: v.optional(v.number()),
      })
    ),

    /** Weighted score failed on final submit; account deletion scheduled after WEIGHTED_FAILURE_COUNTDOWN_MS. */
    weightedTerminationJobScheduled: v.optional(v.boolean()),
    weightedFailureScheduledFor: v.optional(v.number()),

    /** Set when a complete verification evaluation finishes (pass, per-section retake, or weighted fail). */
    verificationEvaluatedAt: v.optional(v.number()),
    /** If automatic finalization (post–skill test) failed; user can call completeVerification again. */
    autoFinalizeError: v.optional(v.string()),

    // Immutable Audit
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_freelancer", ["freelancerId"])
    .index("by_status", ["status"])
    .index("by_score", ["overallScore"])
    .index("by_current_step", ["currentStep"]),

  matches: defineTable({
    // Project
    projectId: v.id("projects"),

    // Freelancer
    freelancerId: v.id("users"),

    // Scoring
    score: v.number(), // 0-100
    confidence: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),

    // Scoring Breakdown
    scoringBreakdown: v.object({
      skillOverlap: v.number(), // 0-100
      vettingScore: v.number(), // 0-100
      ratings: v.number(), // 0-100
      availability: v.number(), // 0-100
      pastPerformance: v.number(), // 0-100
      timezoneCompatibility: v.number(), // 0-100
    }),

    // Explanation
    explanation: v.string(), // Human-readable explanation

    // Team matching (optional)
    teamRole: v.optional(v.string()), // Role in team (e.g., "backend_dev", "mobile_dev")

    // Status
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("expired")
    ),

    // Client Action
    clientAction: v.optional(
      v.union(v.literal("accepted"), v.literal("rejected"))
    ),
    clientActionAt: v.optional(v.number()),

    // Freelancer acceptance (after client selects, before contract signing)
    freelancerAction: v.optional(
      v.union(v.literal("accepted"), v.literal("rejected"))
    ),
    freelancerActionAt: v.optional(v.number()),
    freelancerRejectionReason: v.optional(v.string()),

    // Audit
    createdAt: v.number(),
    updatedAt: v.number(),
    expiresAt: v.optional(v.number()), // Matches expire after 7 days
  })
    .index("by_project", ["projectId", "score"])
    .index("by_freelancer", ["freelancerId"])
    .index("by_status", ["status"])
    .index("by_expires", ["expiresAt"]),

  // One-on-one or kickoff sessions (Google Meet) scheduled before funding
  scheduledCalls: defineTable({
    projectId: v.id("projects"),
    freelancerIds: v.array(v.id("users")), // One for single, multiple for team kickoff
    startTime: v.number(),
    endTime: v.number(),
    meetLink: v.string(),
    googleEventId: v.optional(v.string()),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_start_time", ["startTime"]),

  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.string(), // system | admin | project | payment | dispute | etc.
    data: v.optional(v.any()),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId", "createdAt"])
    .index("by_read", ["userId", "readAt"]),

  // Freelancer wallets (in-platform balance)
  wallets: defineTable({
    userId: v.id("users"),
    balanceCents: v.number(), // Balance in smallest unit (cents for USD)
    currency: v.string(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // Wallet transaction log (credits, debits)
  walletTransactions: defineTable({
    walletId: v.id("wallets"),
    userId: v.id("users"),
    type: v.union(
      v.literal("credit"), // Monthly approval → wallet
      v.literal("debit"), // Withdrawal to bank
      v.literal("refund")
    ),
    category: v.optional(
      v.union(
        v.literal("earnings"),
        v.literal("referral_bonus"),
        v.literal("client_referral_credit"),
        v.literal("client_referral_payout"),
        v.literal("hiring_credit"),
        v.literal("withdrawal_referral")
      )
    ),
    amountCents: v.number(),
    currency: v.string(),
    balanceAfterCents: v.optional(v.number()),
    description: v.string(),
    projectId: v.optional(v.id("projects")),
    monthlyCycleId: v.optional(v.id("monthlyBillingCycles")),
    paymentId: v.optional(v.id("payments")),
    flutterwaveTransferId: v.optional(v.string()),
    status: v.union(
      v.literal("completed"),
      v.literal("pending"),
      v.literal("failed")
    ),
    createdAt: v.number(),
  })
    .index("by_wallet", ["walletId", "createdAt"])
    .index("by_user", ["userId", "createdAt"]),

  // Monthly billing cycles (replaces milestones)
  monthlyBillingCycles: defineTable({
    projectId: v.id("projects"),
    monthIndex: v.number(), // 1, 2, 3...
    monthStartDate: v.number(),
    monthEndDate: v.number(),
    amountCents: v.number(), // Amount for this month (after platform fee split)
    currency: v.string(),
    status: v.union(
      v.literal("pending"), // Awaiting client approval
      v.literal("approved"), // Client approved, funds to wallet
      v.literal("disputed"),
      v.literal("cancelled") // Unreleased funds returned to client (e.g. dispute)
    ),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    disputeId: v.optional(v.id("disputes")),
    autoReleaseAt: v.optional(v.number()), // 48h after monthEndDate; auto-approve if client hasn't
    /** Last time we emailed the client a pending-approval reminder for this cycle (throttles spam). */
    clientApprovalReminderSentAt: v.optional(v.number()),
    /** Per-freelancer cents already released for this cycle; supports admin holds on one team member. */
    releasedFreelancerCents: v.optional(v.record(v.string(), v.number())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_month", ["projectId", "monthIndex"])
    .index("by_status", ["status"])
    .index("by_auto_release", ["autoReleaseAt"]),

  projectBillingPauses: defineTable({
    projectId: v.id("projects"),
    freelancerId: v.optional(v.id("users")),
    scope: v.union(v.literal("project"), v.literal("freelancer")),
    status: v.union(v.literal("active"), v.literal("resumed")),
    reason: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    resumedBy: v.optional(v.id("users")),
    resumedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_status", ["projectId", "status"])
    .index("by_freelancer", ["freelancerId", "status"]),

  // Client ratings of freelancers (one per project)
  reviews: defineTable({
    projectId: v.id("projects"),
    clientId: v.id("users"),
    freelancerId: v.id("users"),
    rating: v.number(), // 1-5
    comment: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_freelancer", ["freelancerId"])
    .index("by_client", ["clientId"])
    .index("by_project_freelancer", ["projectId", "freelancerId"]),

  twoFactorTokens: defineTable({
    userId: v.id("users"),
    code: v.string(),
    purpose: v.union(
      v.literal("signin"),
      v.literal("enable"),
      v.literal("disable")
    ),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    attempts: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId", "createdAt"])
    .index("by_purpose", ["purpose", "createdAt"])
    .index("by_expires", ["expiresAt"]),

  disputes: defineTable({
    // Project
    projectId: v.id("projects"),

    // Monthly billing cycle (for monthly payment disputes)
    monthlyCycleId: v.optional(v.id("monthlyBillingCycles")),

    // Partial team dispute: IDs of specific freelancers being disputed (team hires only)
    // When set, only these freelancers are suspended/removed on client-favor resolution
    disputedFreelancerIds: v.optional(v.array(v.id("users"))),
    /** Matched team at dispute open — used after resolve when project members are patched */
    teamEscrowBasisFreelancerIds: v.optional(v.array(v.id("users"))),

    // Initiator
    initiatorId: v.id("users"),
    initiatorRole: v.union(
      v.literal("client"),
      v.literal("freelancer")
    ),

    // Type (legacy shared literals + role-specific; validated in initiateDispute)
    type: v.union(
      v.literal("milestone_quality"), // legacy rows only
      v.literal("deliverable_quality"),
      v.literal("payment"),
      v.literal("communication"),
      v.literal("freelancer_replacement"),
      v.literal("client_deliverable_quality"),
      v.literal("client_timeline_scope"),
      v.literal("client_payment_billing"),
      v.literal("client_communication_conduct"),
      v.literal("client_request_replacement"),
      v.literal("freelancer_payment_issue"),
      v.literal("freelancer_scope_requirements"),
      v.literal("freelancer_communication"),
      v.literal("freelancer_platform_policy")
    ),

    // Details
    reason: v.string(),
    description: v.string(),

    // Evidence
    evidence: v.array(
      v.object({
        type: v.union(
          v.literal("message"),
          v.literal("file"),
          v.literal("deliverable"),
          v.literal("milestone_deliverable"),
        ),
        messageId: v.optional(v.id("messages")),
        fileId: v.optional(v.id("_storage")),
        description: v.optional(v.string()),
      })
    ),

    // Status
    status: v.union(
      v.literal("open"),
      v.literal("negotiation"),
      v.literal("platform_intervention_requested"),
      v.literal("awaiting_party_evidence"),
      v.literal("under_review"),
      v.literal("judgment_issued"),
      v.literal("objection_window"),
      v.literal("appeal_review"),
      v.literal("enforcing_resolution"),
      v.literal("resolved"),
      v.literal("escalated"),
      v.literal("closed"),
      v.literal("cancelled")
    ),

    // Professional P2P-style lifecycle (new disputes use this; legacy disputes may omit)
    track: v.optional(v.union(v.literal("normal"), v.literal("fast_track"))),
    stage: v.optional(
      v.union(
        v.literal("negotiation"),
        v.literal("platform_intervention_requested"),
        v.literal("awaiting_party_evidence"),
        v.literal("under_review"),
        v.literal("judgment_issued"),
        v.literal("objection_window"),
        v.literal("appeal_review"),
        v.literal("enforcing_resolution"),
        v.literal("resolved"),
        v.literal("closed")
      )
    ),
    stageStartedAt: v.optional(v.number()),
    stageDeadlineAt: v.optional(v.number()),
    negotiationDeadlineAt: v.optional(v.number()),
    evidenceDeadlineAt: v.optional(v.number()),
    objectionWindowEndsAt: v.optional(v.number()),
    appealWindowEndsAt: v.optional(v.number()),
    platformInterventionRequestedAt: v.optional(v.number()),
    platformInterventionRequestedBy: v.optional(v.id("users")),
    judgmentIssuedAt: v.optional(v.number()),
    enforcementStartedAt: v.optional(v.number()),
    enforcedAt: v.optional(v.number()),
    fastTrackEligible: v.optional(v.boolean()),
    policyReasonLabel: v.optional(v.string()),
    requiredEvidenceChecklist: v.optional(
      v.array(
        v.object({
          id: v.string(),
          owner: v.union(
            v.literal("client"),
            v.literal("freelancer"),
            v.literal("both")
          ),
          label: v.string(),
          description: v.string(),
          satisfiedAt: v.optional(v.number()),
        })
      )
    ),
    nonCooperationFlags: v.optional(v.array(v.string())),
    policyFlags: v.optional(v.array(v.string())),
    objection: v.optional(
      v.object({
        raisedBy: v.id("users"),
        raisedAt: v.number(),
        reason: v.string(),
        evidenceIds: v.optional(v.array(v.id("_storage"))),
        status: v.union(
          v.literal("pending"),
          v.literal("accepted"),
          v.literal("rejected")
        ),
        reviewedBy: v.optional(v.id("users")),
        reviewedAt: v.optional(v.number()),
        reviewNotes: v.optional(v.string()),
      })
    ),

    // Cancellation (when initiator withdraws the dispute)
    cancellationReason: v.optional(v.string()),
    cancelledAt: v.optional(v.number()),
    cancelledBy: v.optional(v.id("users")),

    // Resolution
    resolution: v.optional(
      v.object({
        decision: v.union(
          v.literal("client_favor"),
          v.literal("freelancer_favor"),
          v.literal("partial"),
          v.literal("replacement")
        ),
        resolutionAmount: v.optional(v.number()),
        notes: v.string(),
        clientMessage: v.optional(v.string()),
        freelancerMessage: v.optional(v.string()),
        /** Hire `projects.status` after resolution — set by staff at judgment. */
        projectStatusAfterResolution: v.optional(
          v.union(
            v.literal("draft"),
            v.literal("pending_funding"),
            v.literal("funded"),
            v.literal("matching"),
            v.literal("awaiting_freelancer"),
            v.literal("matched"),
            v.literal("in_progress"),
            v.literal("completed"),
            v.literal("cancelled")
          )
        ),
        /** When set with `partial`, judgment used this whole % of the disputed freelancer-net pool for the freelancer side. */
        partialFreelancerSharePercent: v.optional(v.number()),
        resolvedBy: v.optional(v.id("users")), // omitted for automated resolution
        resolvedAt: v.number(),
      })
    ),

    // Moderator
    assignedModeratorId: v.optional(v.id("users")),
    assignedAt: v.optional(v.number()),

    /** Set when assigned staff finalize manual enforcement (`finalizeDisputeEnforcement`). */
    resolutionExecutedAt: v.optional(v.number()),
    resolutionExecutionSummary: v.optional(v.string()),

    // Funds
    lockedAmount: v.number(),
    /**
     * Snapshot freelancer-net escrow pool (cents) subdivided among `teamEscrowBasisFreelancerIds`
     * when computing economics. Monthly disputes use that cycle's `amountCents`; hire-level disputes
     * use pooled project escrow net. Lets seat-level UX match initiation after escrow moves.
     */
    lockedEconomicsFreelancerNetPoolCents: v.optional(v.number()),

    // Audit
    createdAt: v.number(),
    updatedAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_project", ["projectId"])
    .index("by_status", ["status"])
    .index("by_stage_deadline", ["status", "stageDeadlineAt"])
    .index("by_evidence_deadline", ["status", "evidenceDeadlineAt"])
    .index("by_objection_deadline", ["status", "objectionWindowEndsAt"])
    .index("by_initiator", ["initiatorId"])
    .index("by_moderator", ["assignedModeratorId"]),

  /** P2P-style dispute thread: parties + moderators; evidence links optional. */
  disputeMessages: defineTable({
    disputeId: v.id("disputes"),
    authorId: v.id("users"),
    authorName: v.optional(v.string()),
    authorRole: v.union(
      v.literal("client"),
      v.literal("freelancer"),
      v.literal("moderator"),
      v.literal("admin"),
      v.literal("system")
    ),
    body: v.string(),
    attachments: v.optional(
      v.array(
        v.object({
          fileId: v.id("_storage"),
          fileName: v.string(),
          fileSize: v.number(),
          mimeType: v.string(),
          url: v.optional(v.string()),
        })
      )
    ),
    createdAt: v.number(),
  })
    .index("by_dispute", ["disputeId", "createdAt"]),

  /** Structured dispute evidence records reviewed by moderators. */
  disputeEvidence: defineTable({
    disputeId: v.id("disputes"),
    projectId: v.id("projects"),
    submittedBy: v.id("users"),
    submittedByRole: v.union(
      v.literal("client"),
      v.literal("freelancer"),
      v.literal("moderator"),
      v.literal("admin")
    ),
    checklistItemId: v.optional(v.string()),
    evidenceRequestId: v.optional(v.id("disputeEvidenceRequests")),
    title: v.string(),
    description: v.optional(v.string()),
    evidenceType: v.union(
      v.literal("message"),
      v.literal("file"),
      v.literal("link"),
      v.literal("deliverable"),
      v.literal("payment_record"),
      v.literal("other")
    ),
    messageId: v.optional(v.id("messages")),
    fileId: v.optional(v.id("_storage")),
    url: v.optional(v.string()),
    status: v.union(
      v.literal("submitted"),
      v.literal("accepted"),
      v.literal("rejected")
    ),
    reviewNotes: v.optional(v.string()),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_dispute", ["disputeId", "createdAt"])
    .index("by_project", ["projectId", "createdAt"])
    .index("by_status", ["status"]),

  /** Admin/moderator follow-up evidence requests addressed to specific dispute parties. */
  disputeEvidenceRequests: defineTable({
    disputeId: v.id("disputes"),
    projectId: v.id("projects"),
    requestedBy: v.id("users"),
    requestedFromUserIds: v.array(v.id("users")),
    scope: v.union(
      v.literal("client"),
      v.literal("freelancer"),
      v.literal("both"),
      v.literal("specific")
    ),
    description: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("fulfilled"),
      v.literal("cancelled")
    ),
    fulfilledByUserIds: v.optional(v.array(v.id("users"))),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_dispute", ["disputeId", "createdAt"])
    .index("by_status", ["status", "createdAt"]),

  /** Immutable audit log for manual post-judgment staff actions on a dispute. */
  disputeEnforcementEvents: defineTable({
    disputeId: v.id("disputes"),
    projectId: v.id("projects"),
    actorId: v.id("users"),
    kind: v.string(),
    details: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_dispute", ["disputeId", "createdAt"]),

  /** Immutable dispute timeline events for a case-center audit trail. */
  disputeStageEvents: defineTable({
    disputeId: v.id("disputes"),
    projectId: v.id("projects"),
    actorId: v.optional(v.id("users")),
    actorRole: v.union(
      v.literal("client"),
      v.literal("freelancer"),
      v.literal("moderator"),
      v.literal("admin"),
      v.literal("system")
    ),
    eventType: v.string(),
    fromStatus: v.optional(v.string()),
    toStatus: v.optional(v.string()),
    title: v.string(),
    description: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_dispute", ["disputeId", "createdAt"])
    .index("by_project", ["projectId", "createdAt"]),

  /** Client referral cash withdrawal requests (PayPal or crypto — manually processed by admin). */
  clientReferralPayoutRequests: defineTable({
    userId: v.id("users"),
    amountCents: v.number(),
    currency: v.string(),
    method: v.union(v.literal("bank"), v.literal("crypto"), v.literal("paypal")),
    cryptoNetwork: v.optional(v.string()),
    cryptoAddress: v.optional(v.string()),
    paypalEmail: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("rejected")
    ),
    adminNote: v.optional(v.string()),
    processedBy: v.optional(v.id("users")),
    processedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId", "createdAt"])
    .index("by_status", ["status"]),

  payments: defineTable({
    // Project (optional for payout from wallet)
    projectId: v.optional(v.id("projects")),

    monthlyCycleId: v.optional(v.id("monthlyBillingCycles")),

    // Type
    type: v.union(
      v.literal("pre_funding"),
      v.literal("top_up"), // Follow-up payment for next month(s); fee before escrow
      v.literal("milestone_release"), // Legacy
      v.literal("monthly_release"), // New: approval → wallet
      v.literal("refund"),
      v.literal("platform_fee"),
      v.literal("payout") // Withdrawal from wallet to bank
    ),

    // Top-up: number of months this payment funds (1-based)
    topUpMonths: v.optional(v.number()),

    // Amount
    amount: v.number(),
    currency: v.string(),
    platformFee: v.optional(v.number()),
    netAmount: v.number(), // After platform fee

    /** Full funding obligation in dollars (before client referral wallet credit). Optional for legacy rows. */
    fundingGrossAmount: v.optional(v.number()),
    /** Dollars applied from client referral hiring wallet toward fundingGrossAmount */
    clientWalletCreditApplied: v.optional(v.number()),

    // Recipient (for payout from wallet - identifies freelancer)
    recipientId: v.optional(v.id("users")),

    // Flutterwave
    flutterwaveTransactionId: v.optional(v.string()), // Payment transaction reference
    flutterwaveRefundId: v.optional(v.string()),
    flutterwaveTransferId: v.optional(v.string()), // Transfer/payout reference
    flutterwaveCustomerEmail: v.optional(v.string()),
    flutterwaveSubaccountId: v.optional(v.string()), // Freelancer's Flutterwave Subaccount ID

    // Status
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("refunded"),
      v.literal("cancelled")
    ),

    // Webhook
    webhookReceived: v.boolean(),
    webhookReceivedAt: v.optional(v.number()),
    webhookEventId: v.optional(v.string()),

    // Error
    errorMessage: v.optional(v.string()),

    // Audit
    createdAt: v.number(),
    updatedAt: v.number(),
    processedAt: v.optional(v.number()),
  })
    .index("by_project", ["projectId"])
    .index("by_status", ["status"])
    .index("by_flutterwave_transaction", ["flutterwaveTransactionId"])
    .index("by_flutterwave_transfer", ["flutterwaveTransferId"])
    .index("by_flutterwave_refund", ["flutterwaveRefundId"])
    .index("by_webhook", ["webhookReceived"])
    .index("by_recipient", ["recipientId"]),

  auditLogs: defineTable({
    // Action
    action: v.string(), // e.g., "role_changed", "payment_processed", "dispute_resolved"
    actionType: v.union(
      v.literal("auth"),
      v.literal("payment"),
      v.literal("dispute"),
      v.literal("admin"),
      v.literal("system")
    ),

    // Actor
    actorId: v.id("users"),
    actorRole: v.union(
      v.literal("client"),
      v.literal("freelancer"),
      v.literal("admin"),
      v.literal("moderator"),
      v.literal("system")
    ),

    // Target
    targetType: v.optional(v.string()), // "user", "project", "payment", etc.
    targetId: v.optional(v.string()),

    // Details
    details: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),

    // Audit
    createdAt: v.number(),
  })
    .index("by_action", ["action"])
    .index("by_actor", ["actorId"])
    .index("by_target", ["targetType", "targetId"])
    .index("by_created", ["createdAt"]),

  /**
   * Tracks webhook events we've already processed so retries are idempotent.
   * Keyed by `{provider, eventId}`. Writes are best-effort: a concurrent duplicate
   * that slips past the check is still safe because the downstream mutations
   * (handlePaymentSuccess/Failure/Cancellation) have their own transition guards.
   */
  processedWebhookEvents: defineTable({
    provider: v.union(v.literal("flutterwave")),
    eventId: v.string(),
    eventType: v.optional(v.string()),
    processedAt: v.number(),
  }).index("by_provider_event", ["provider", "eventId"]),

  sessions: defineTable({
    // User
    userId: v.id("users"),

    // Session token
    sessionToken: v.string(),
    refreshToken: v.string(),

    // Expiry
    expiresAt: v.number(),
    refreshExpiresAt: v.number(),

    // Rotation
    lastRotatedAt: v.number(),
    rotationCount: v.number(),

    // Metadata
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),

    // Status
    isActive: v.boolean(),
    revokedAt: v.optional(v.number()),
    revokedReason: v.optional(v.string()),

    // Audit
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_token", ["sessionToken"])
    .index("by_refresh_token", ["refreshToken"])
    .index("by_expires", ["expiresAt"])
    .index("by_active", ["isActive"]),

  // Contact enquiries from public contact form (admin/moderator can view and reply)
  contactEnquiries: defineTable({
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    category: v.string(),
    message: v.string(),
    status: v.union(
      v.literal("new"),
      v.literal("replied"),
      v.literal("closed")
    ),
    /** Set when an admin assigns the enquiry to a moderator (moderators only see their assigned rows). */
    assignedModeratorId: v.optional(v.id("users")),
    assignedAt: v.optional(v.number()),
    repliedAt: v.optional(v.number()),
    repliedBy: v.optional(v.id("users")),
    replyMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_assigned_moderator_created", ["assignedModeratorId", "createdAt"]),

  // Platform pricing: base hourly rates per talent category (admin-editable)
  pricingConfig: defineTable({
    key: v.literal("baseRates"),
    ratesByCategory: v.record(
      v.string(),
      v.object({
        junior: v.number(),
        mid: v.number(),
        senior: v.number(),
        expert: v.number(),
      })
    ),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  }).index("by_key", ["key"]),

  // Platform settings (admin-editable, e.g. platform fee %)
  platformSettings: defineTable({
    key: v.string(),
    value: v.union(v.number(), v.string(), v.boolean()),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  }).index("by_key", ["key"]),

  // --- Vetting: generated questions and skill test sessions ---

  // Generated MCQ questions (server holds correct answer; client never receives it)
  vettingMcqQuestions: defineTable({
    questionKey: v.string(),
    categoryId: v.string(),
    skillTopics: v.array(v.string()),
    experienceLevel: v.union(
      v.literal("junior"),
      v.literal("mid"),
      v.literal("senior"),
      v.literal("expert")
    ),
    questionIndex: v.number(),
    questionText: v.string(),
    options: v.array(v.string()),
    correctOptionIndex: v.number(),
    createdAt: v.number(),
  })
    .index("by_question_key", ["questionKey"])
    .index("by_category_level", ["categoryId", "experienceLevel"]),

  // Generated coding challenges (language + difficulty)
  vettingCodingPrompts: defineTable({
    promptKey: v.string(),
    categoryId: v.string(),
    language: v.string(),
    experienceLevel: v.union(
      v.literal("junior"),
      v.literal("mid"),
      v.literal("senior"),
      v.literal("expert")
    ),
    promptIndex: v.number(),
    title: v.string(),
    description: v.string(),
    starterCode: v.optional(v.string()),
    testCases: v.optional(
      v.array(
        v.object({
          input: v.string(),
          expectedOutput: v.string(),
        })
      )
    ),
    createdAt: v.number(),
  })
    .index("by_prompt_key", ["promptKey"])
    .index("by_category_language_level", ["categoryId", "language", "experienceLevel"]),

  // --- Blog (marketing) ---
  blogPosts: defineTable({
    title: v.string(),
    slug: v.string(), // unique URL slug
    excerpt: v.string(), // short summary for cards/SEO
    content: v.string(), // TipTap JSON as string
    bannerImageId: v.optional(v.id("_storage")),
    authorId: v.id("users"),
    status: v.union(v.literal("draft"), v.literal("published")),
    publishedAt: v.optional(v.number()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_published", ["status", "publishedAt"])
    .index("by_author", ["authorId"])
    .index("by_created", ["createdAt"]),

  blogComments: defineTable({
    postId: v.id("blogPosts"),
    parentId: v.optional(v.id("blogComments")), // null = top-level
    authorId: v.optional(v.id("users")), // null = anonymous
    authorName: v.optional(v.string()), // for anonymous
    authorEmail: v.optional(v.string()), // for anonymous (optional)
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_post", ["postId", "createdAt"])
    .index("by_parent", ["parentId", "createdAt"]),

  blogPostLikes: defineTable({
    postId: v.id("blogPosts"),
    userId: v.id("users"), // only logged-in users can like (tracked)
    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_post_user", ["postId", "userId"]),

  // Active skill test session (path-based: coding+mcq, portfolio+mcq, or mcq-only)
  vettingSkillTestSessions: defineTable({
    freelancerId: v.id("users"),
    vettingResultId: v.id("vettingResults"),
    status: v.union(
      v.literal("not_started"),
      v.literal("coding"),
      v.literal("mcq"),
      v.literal("portfolio_review"),
      v.literal("completed")
    ),
    pathType: v.union(
      v.literal("coding_mcq"),
      v.literal("portfolio_mcq"),
      v.literal("mcq_only")
    ),
    experienceLevel: v.union(
      v.literal("junior"),
      v.literal("mid"),
      v.literal("senior"),
      v.literal("expert")
    ),
    categoryId: v.string(),
    selectedSkills: v.array(v.string()),
    selectedLanguage: v.optional(v.string()),
    codingPromptIds: v.optional(v.array(v.id("vettingCodingPrompts"))),
    mcqQuestionIds: v.optional(v.array(v.id("vettingMcqQuestions"))),
    codingSubmissions: v.optional(
      v.array(
        v.object({
          promptId: v.id("vettingCodingPrompts"),
          code: v.string(),
          submittedAt: v.number(),
          runResult: v.optional(v.any()),
        })
      )
    ),
    mcqAnswers: v.optional(
      v.array(
        v.object({
          questionId: v.id("vettingMcqQuestions"),
          selectedOptionIndex: v.number(),
        })
      )
    ),
    mcqScore: v.optional(v.number()),
    portfolioScore: v.optional(v.number()),
    startedAt: v.number(),
    expiresAt: v.optional(v.number()), // 30 minutes from startedAt — no submissions accepted after
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_freelancer", ["freelancerId"])
    .index("by_freelancer_created", ["freelancerId", "createdAt"])
    .index("by_vetting_result", ["vettingResultId"])
    .index("by_status", ["status"]),
});

