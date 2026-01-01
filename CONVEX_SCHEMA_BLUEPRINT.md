# 🗄️ CONVEX SCHEMA BLUEPRINT — 49GIG

**Status:** Planning Phase  
**Version:** 0.1.0

---

## 📋 SCHEMA ARCHITECTURE OVERVIEW

Convex schema uses **strict TypeScript types** and follows **domain-driven design** principles. All tables include audit fields (`createdAt`, `updatedAt`) and are optimized for real-time queries.

---

## 🗂️ SCHEMA DEFINITIONS

### **Users Table**

```typescript
users: defineTable({
  // Identity
  email: v.string(),
  emailVerified: v.boolean(),
  name: v.string(),
  
  // Auth
  authProvider: v.union(v.literal("email"), v.literal("google"), v.literal("magic_link")),
  passwordHash: v.optional(v.string()), // Only for email auth
  
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
  profile: v.optional(v.object({
    // Client profile
    companyName: v.optional(v.string()),
    companySize: v.optional(v.string()),
    industry: v.optional(v.string()),
    
    // Freelancer profile
    bio: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    hourlyRate: v.optional(v.number()),
    availability: v.optional(v.union(
      v.literal("available"),
      v.literal("busy"),
      v.literal("unavailable")
    )),
    timezone: v.optional(v.string()),
    portfolioUrl: v.optional(v.string()),
  })),
  
  // Status
  status: v.union(
    v.literal("active"),
    v.literal("suspended"),
    v.literal("deleted")
  ),
  
  // Audit
  createdAt: v.number(),
  updatedAt: v.number(),
  lastLoginAt: v.optional(v.number()),
})
  .index("by_email", ["email"])
  .index("by_role", ["role"])
  .index("by_status", ["status"]);
```

---

### **Projects Table**

```typescript
projects: defineTable({
  // Client
  clientId: v.id("users"),
  
  // Intake Form Data
  intakeForm: v.object({
    title: v.string(),
    description: v.string(),
    category: v.string(),
    requiredSkills: v.array(v.string()),
    budget: v.number(),
    timeline: v.string(),
    deliverables: v.array(v.string()),
    additionalRequirements: v.optional(v.string()),
  }),
  
  // Status
  status: v.union(
    v.literal("draft"),
    v.literal("pending_funding"),
    v.literal("funded"),
    v.literal("matching"),
    v.literal("matched"),
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("cancelled"),
    v.literal("disputed")
  ),
  
  // Matching
  matchedFreelancerId: v.optional(v.id("users")),
  matchedAt: v.optional(v.number()),
  
  // Payment
  totalAmount: v.number(),
  escrowedAmount: v.number(),
  platformFee: v.number(), // Percentage (e.g., 10)
  currency: v.string(), // "usd"
  
  // Stripe
  stripePaymentIntentId: v.optional(v.string()),
  stripeCustomerId: v.optional(v.string()),
  
  // Audit
  createdAt: v.number(),
  updatedAt: v.number(),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
})
  .index("by_client", ["clientId"])
  .index("by_freelancer", ["matchedFreelancerId"])
  .index("by_status", ["status"])
  .index("by_created", ["createdAt"]);
```

---

### **Milestones Table**

```typescript
milestones: defineTable({
  // Project
  projectId: v.id("projects"),
  
  // Details
  title: v.string(),
  description: v.string(),
  order: v.number(), // Sequential order
  
  // Payment
  amount: v.number(),
  currency: v.string(),
  
  // Status
  status: v.union(
    v.literal("pending"),
    v.literal("in_progress"),
    v.literal("submitted"),
    v.literal("approved"),
    v.literal("rejected"),
    v.literal("paid"),
    v.literal("disputed")
  ),
  
  // Deliverables
  deliverables: v.optional(v.array(v.object({
    name: v.string(),
    fileId: v.optional(v.id("_storage")),
    url: v.optional(v.string()),
    submittedAt: v.number(),
  }))),
  
  // Approval
  approvedBy: v.optional(v.id("users")),
  approvedAt: v.optional(v.number()),
  rejectionReason: v.optional(v.string()),
  
  // Stripe
  stripePaymentIntentId: v.optional(v.string()),
  stripePayoutId: v.optional(v.string()),
  
  // Dates
  dueDate: v.number(),
  submittedAt: v.optional(v.number()),
  paidAt: v.optional(v.number()),
  
  // Auto-release
  autoReleaseAt: v.optional(v.number()), // 48h after approval
  
  // Audit
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_project", ["projectId"])
  .index("by_status", ["status"])
  .index("by_auto_release", ["autoReleaseAt"]);
```

---

### **Chats Table**

```typescript
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
  .index("by_last_message", ["lastMessageAt"]);
```

---

### **Messages Table**

```typescript
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
  attachments: v.optional(v.array(v.object({
    fileId: v.id("_storage"),
    fileName: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    url: v.string(),
  }))),
  
  // Status
  isPinned: v.boolean(),
  isDeleted: v.boolean(), // Soft delete
  deletedAt: v.optional(v.number()),
  
  // Read receipts
  readBy: v.array(v.object({
    userId: v.id("users"),
    readAt: v.number(),
  })),
  
  // Typing (ephemeral, not stored)
  
  // Audit
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_chat", ["chatId", "createdAt"])
  .index("by_sender", ["senderId"])
  .index("by_pinned", ["chatId", "isPinned"]);
```

---

### **VettingResults Table**

```typescript
vettingResults: defineTable({
  // Freelancer
  freelancerId: v.id("users"),
  
  // Identity Verification
  identityVerification: v.object({
    provider: v.union(v.literal("smile_identity"), v.literal("dojah")),
    status: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("failed"),
      v.literal("rejected")
    ),
    verifiedAt: v.optional(v.number()),
    documentType: v.optional(v.string()),
    documentNumber: v.optional(v.string()),
    livenessCheck: v.optional(v.boolean()),
    score: v.optional(v.number()), // 0-100
  }),
  
  // English Proficiency
  englishProficiency: v.object({
    grammarScore: v.optional(v.number()), // 0-100
    comprehensionScore: v.optional(v.number()), // 0-100
    writtenResponseScore: v.optional(v.number()), // 0-100
    overallScore: v.optional(v.number()), // Weighted average
    completedAt: v.optional(v.number()),
  }),
  
  // Skill Assessments
  skillAssessments: v.array(v.object({
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
  })),
  
  // Overall Scoring
  overallScore: v.number(), // Weighted: Identity 20%, English 30%, Skills 50%
  
  // Status
  status: v.union(
    v.literal("pending"),
    v.literal("in_progress"),
    v.literal("approved"),
    v.literal("flagged"),
    v.literal("rejected")
  ),
  
  // Admin Review
  reviewedBy: v.optional(v.id("users")),
  reviewedAt: v.optional(v.number()),
  reviewNotes: v.optional(v.string()),
  
  // Immutable Audit
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_freelancer", ["freelancerId"])
  .index("by_status", ["status"])
  .index("by_score", ["overallScore"]);
```

---

### **Matches Table**

```typescript
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
  
  // Status
  status: v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("rejected"),
    v.literal("expired")
  ),
  
  // Client Action
  clientAction: v.optional(v.union(
    v.literal("accepted"),
    v.literal("rejected")
  )),
  clientActionAt: v.optional(v.number()),
  
  // Audit
  createdAt: v.number(),
  updatedAt: v.number(),
  expiresAt: v.optional(v.number()), // Matches expire after 7 days
})
  .index("by_project", ["projectId", "score"])
  .index("by_freelancer", ["freelancerId"])
  .index("by_status", ["status"])
  .index("by_expires", ["expiresAt"]);
```

---

### **Disputes Table**

```typescript
disputes: defineTable({
  // Project
  projectId: v.id("projects"),
  
  // Milestone (if milestone-specific)
  milestoneId: v.optional(v.id("milestones")),
  
  // Initiator
  initiatorId: v.id("users"),
  initiatorRole: v.union(
    v.literal("client"),
    v.literal("freelancer")
  ),
  
  // Type
  type: v.union(
    v.literal("milestone_quality"),
    v.literal("payment"),
    v.literal("communication"),
    v.literal("freelancer_replacement")
  ),
  
  // Details
  reason: v.string(),
  description: v.string(),
  
  // Evidence
  evidence: v.array(v.object({
    type: v.union(
      v.literal("message"),
      v.literal("file"),
      v.literal("milestone_deliverable")
    ),
    messageId: v.optional(v.id("messages")),
    fileId: v.optional(v.id("_storage")),
    milestoneId: v.optional(v.id("milestones")),
    description: v.optional(v.string()),
  })),
  
  // Status
  status: v.union(
    v.literal("open"),
    v.literal("under_review"),
    v.literal("resolved"),
    v.literal("escalated"),
    v.literal("closed")
  ),
  
  // Resolution
  resolution: v.optional(v.object({
    decision: v.union(
      v.literal("client_favor"),
      v.literal("freelancer_favor"),
      v.literal("partial"),
      v.literal("replacement")
    ),
    resolutionAmount: v.optional(v.number()),
    notes: v.string(),
    resolvedBy: v.id("users"),
    resolvedAt: v.number(),
  })),
  
  // Moderator
  assignedModeratorId: v.optional(v.id("users")),
  assignedAt: v.optional(v.number()),
  
  // Funds
  lockedAmount: v.number(),
  
  // Audit
  createdAt: v.number(),
  updatedAt: v.number(),
  resolvedAt: v.optional(v.number()),
})
  .index("by_project", ["projectId"])
  .index("by_status", ["status"])
  .index("by_initiator", ["initiatorId"])
  .index("by_moderator", ["assignedModeratorId"]);
```

---

### **Payments Table**

```typescript
payments: defineTable({
  // Project
  projectId: v.id("projects"),
  
  // Milestone (if milestone payment)
  milestoneId: v.optional(v.id("milestones")),
  
  // Type
  type: v.union(
    v.literal("pre_funding"),
    v.literal("milestone_release"),
    v.literal("refund"),
    v.literal("platform_fee"),
    v.literal("payout")
  ),
  
  // Amount
  amount: v.number(),
  currency: v.string(),
  platformFee: v.optional(v.number()),
  netAmount: v.number(), // After platform fee
  
  // Stripe
  stripePaymentIntentId: v.optional(v.string()),
  stripePayoutId: v.optional(v.string()),
  stripeTransferId: v.optional(v.string()),
  stripeCustomerId: v.optional(v.string()),
  stripeAccountId: v.optional(v.string()), // Freelancer's Stripe Connect account
  
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
  .index("by_milestone", ["milestoneId"])
  .index("by_status", ["status"])
  .index("by_stripe_payment_intent", ["stripePaymentIntentId"])
  .index("by_webhook", ["webhookReceived"]);
```

---

### **AuditLogs Table**

```typescript
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
  .index("by_created", ["createdAt"]);
```

---

## 🔍 INDEXING STRATEGY

**Primary Indexes:**
- Foreign key relationships (e.g., `by_project`, `by_freelancer`)
- Status fields (e.g., `by_status`)
- Timestamp fields (e.g., `by_created`, `by_last_message`)

**Composite Indexes:**
- Multi-field queries (e.g., `["projectId", "status"]`)
- Sorting queries (e.g., `["chatId", "createdAt"]`)

---

## 🔐 DATA ACCESS PATTERNS

**Queries:**
- Real-time subscriptions for chat, projects, milestones
- Filtered queries by user role
- Pagination for large datasets

**Mutations:**
- Server-side validation
- Role-based access checks
- Audit log creation

**Actions:**
- Webhook ingestion (Stripe, Smile Identity, Dojah)
- External API calls
- Cron jobs

---

## ✅ NEXT STEPS

1. Implement schema in `convex/schema.ts`
2. Create query functions
3. Create mutation functions
4. Create action functions
5. Add validation helpers
6. Set up indexes

---

**Status:** ✅ Blueprint Complete — Ready for Implementation

