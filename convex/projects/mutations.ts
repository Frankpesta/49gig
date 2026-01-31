import { mutation, internalMutation, MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";
import type { FunctionReference } from "convex/server";

const api = require("../_generated/api") as {
  api: {
    notifications: { actions: { sendSystemNotification: unknown } };
  };
};

/**
 * Helper function to get current user in mutations
 * Supports both Convex Auth and session token authentication via userId
 */
async function getCurrentUserInMutation(
  ctx: MutationCtx,
  userId?: string
): Promise<Doc<"users"> | null> {
  if (userId) {
    const user = await ctx.db.get(userId as any as Doc<"users">["_id"]);
    if (!user) {
      return null;
    }
    const userDoc = user as Doc<"users">;
    if (userDoc.status !== "active") {
      return null;
    }
    return userDoc;
  }

  // Fall back to Convex Auth
  const user = await getCurrentUser(ctx);
  if (!user) {
    return null;
  }
  const userDoc = user as Doc<"users">;
  if (userDoc.status !== "active") {
    return null;
  }
  return userDoc;
}

/**
 * Create a new project from intake form
 * Only clients can create projects
 */
export const createProject = mutation({
  args: {
    intakeForm: v.object({
      // Section 1: Hire Type
      hireType: v.union(v.literal("single"), v.literal("team")),
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
      startDate: v.number(),
      endDate: v.number(),
      timelineFlexible: v.optional(v.boolean()),
      projectType: v.union(
        v.literal("one_time"),
        v.literal("ongoing"),
        v.literal("not_sure")
      ),
      projectDuration: v.optional(
        v.union(
          v.literal("1-3"),
          v.literal("3-6"),
          v.literal("6+")
        )
      ),
      roleType: v.optional(
        v.union(
          v.literal("full_time"),
          v.literal("part_time"),
          v.literal("contract")
        )
      ),
      // Section 3: Talent Requirements
      roleTitle: v.optional(v.string()),
      talentCategory: v.union(
        v.literal("Software Development"),
        v.literal("UI/UX & Product Design"),
        v.literal("Data & Analytics")
      ),
      experienceLevel: v.union(
        v.literal("junior"),
        v.literal("mid"),
        v.literal("senior"),
        v.literal("expert")
      ),
      requiredSkills: v.optional(v.array(v.string())),
      // Section 4: Budget / Notes
      budget: v.number(),
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
    totalAmount: v.number(),
    platformFee: v.number(), // Percentage (e.g., 10)
    currency: v.string(), // "usd"
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Only clients can create projects
    if (user.role !== "client") {
      throw new Error("Only clients can create projects");
    }

    const now = Date.now();

    // Calculate escrowed amount (will be 0 until funded)
    const escrowedAmount = 0;

    // Create project
    const projectId = await ctx.db.insert("projects", {
      clientId: user._id,
      intakeForm: args.intakeForm,
      status: "draft",
      totalAmount: args.totalAmount,
      escrowedAmount,
      platformFee: args.platformFee,
      currency: args.currency,
      createdAt: now,
      updatedAt: now,
    });

    // Log audit
    await ctx.db.insert("auditLogs", {
      action: "project_created",
      actionType: "admin",
      actorId: user._id,
      actorRole: user.role,
      targetType: "project",
      targetId: projectId,
      details: {
        title: args.intakeForm.title,
        budget: args.totalAmount,
      },
      createdAt: now,
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [user._id],
      title: "Project created",
      message: `Your project "${args.intakeForm.title}" was created.`,
      type: "project",
      data: { projectId },
    });

    return projectId;
  },
});

/**
 * Update project details
 * Only the client who owns the project can update it (unless draft)
 */
export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    intakeForm: v.optional(
      v.object({
        title: v.string(),
        description: v.string(),
        category: v.string(),
        requiredSkills: v.array(v.string()),
        budget: v.number(),
        timeline: v.string(),
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
        teamSize: v.optional(v.number()),
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
        deliverables: v.array(v.string()),
        additionalRequirements: v.optional(v.string()),
      })
    ),
    totalAmount: v.optional(v.number()),
    platformFee: v.optional(v.number()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Only client can update, and only if draft or pending_funding
    if (user.role !== "admin" && project.clientId !== user._id) {
      throw new Error("Not authorized to update this project");
    }

    if (
      user.role !== "admin" &&
      project.status !== "draft" &&
      project.status !== "pending_funding"
    ) {
      throw new Error("Project can only be updated in draft or pending_funding status");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.intakeForm) {
      updates.intakeForm = args.intakeForm;
    }

    if (args.totalAmount !== undefined) {
      updates.totalAmount = args.totalAmount;
    }

    if (args.platformFee !== undefined) {
      updates.platformFee = args.platformFee;
    }

    await ctx.db.patch(args.projectId, updates);

    // Log audit
    await ctx.db.insert("auditLogs", {
      action: "project_updated",
      actionType: "admin",
      actorId: user._id,
      actorRole: user.role,
      targetType: "project",
      targetId: args.projectId,
      details: {
        changes: Object.keys(updates),
      },
      createdAt: Date.now(),
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: [project.clientId],
      title: "Project updated",
      message: `Project "${project.intakeForm.title}" was updated.`,
      type: "project",
      data: { projectId: args.projectId },
    });

    return args.projectId;
  },
});

/**
 * Update project status
 * Status transitions are controlled based on role and current status
 */
export const updateProjectStatus = mutation({
  args: {
    projectId: v.id("projects"),
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
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Authorization checks based on status transition
    const isAdmin = user.role === "admin";
    const isClient = project.clientId === user._id;
    const isModerator = user.role === "moderator";

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      draft: ["pending_funding", "cancelled"],
      pending_funding: ["funded", "cancelled"],
      funded: ["matching", "cancelled"],
      matching: ["matched", "cancelled"],
      matched: ["in_progress", "cancelled"],
      in_progress: ["completed", "disputed", "cancelled"],
      completed: [], // Terminal state
      cancelled: [], // Terminal state
      disputed: ["in_progress", "cancelled"], // Can be resolved
    };

    if (
      !isAdmin &&
      !validTransitions[project.status]?.includes(args.status)
    ) {
      throw new Error(`Invalid status transition from ${project.status} to ${args.status}`);
    }

    // Role-based authorization for specific transitions
    if (args.status === "pending_funding" && !isClient && !isAdmin) {
      throw new Error("Only client or admin can move project to pending_funding");
    }

    if (args.status === "cancelled" && !isClient && !isAdmin) {
      throw new Error("Only client or admin can cancel project");
    }

    if (args.status === "disputed" && !isClient && !isModerator && !isAdmin) {
      throw new Error("Only client, moderator, or admin can dispute project");
    }

    const updates: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    // Set timestamps for specific statuses
    if (args.status === "in_progress" && !project.startedAt) {
      updates.startedAt = Date.now();
    }

    if (args.status === "completed" && !project.completedAt) {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.projectId, updates);

    // Log audit
    await ctx.db.insert("auditLogs", {
      action: "project_status_updated",
      actionType: "admin",
      actorId: user._id,
      actorRole: user.role,
      targetType: "project",
      targetId: args.projectId,
      details: {
        oldStatus: project.status,
        newStatus: args.status,
      },
      createdAt: Date.now(),
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    const statusLabels: Record<Doc<"projects">["status"], string> = {
      draft: "Draft",
      pending_funding: "Pending funding",
      funded: "Funded",
      matching: "Matching in progress",
      matched: "Matched",
      in_progress: "In progress",
      completed: "Completed",
      cancelled: "Cancelled",
      disputed: "Disputed",
    };
    const recipientIds = [project.clientId];
    if (project.matchedFreelancerId) {
      recipientIds.push(project.matchedFreelancerId);
    }
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: recipientIds,
      title: "Project status updated",
      message: `Project "${project.intakeForm.title}" is now ${statusLabels[args.status]}.`,
      type: "project",
      data: { projectId: args.projectId, status: args.status },
    });

    return args.projectId;
  },
});

/**
 * Create milestones for a project
 * Only client or admin can create milestones
 */
export const createMilestones = mutation({
  args: {
    projectId: v.id("projects"),
    milestones: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        order: v.number(),
        amount: v.number(),
        currency: v.string(),
        dueDate: v.number(), // Unix timestamp
      })
    ),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Only client or admin can create milestones
    if (user.role !== "admin" && project.clientId !== user._id) {
      throw new Error("Not authorized to create milestones for this project");
    }

    // Check if milestones already exist
    const existingMilestones = await ctx.db
      .query("milestones")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    if (existingMilestones.length > 0) {
      throw new Error("Milestones already exist for this project");
    }

    // Validate total milestone amount matches project total
    const totalMilestoneAmount = args.milestones.reduce(
      (sum, m) => sum + m.amount,
      0
    );

    if (Math.abs(totalMilestoneAmount - project.totalAmount) > 0.01) {
      throw new Error(
        `Total milestone amount (${totalMilestoneAmount}) must match project total (${project.totalAmount})`
      );
    }

    const now = Date.now();
    const milestoneIds = [];

    // Create milestones
    for (const milestone of args.milestones) {
      const milestoneId = await ctx.db.insert("milestones", {
        projectId: args.projectId,
        title: milestone.title,
        description: milestone.description,
        order: milestone.order,
        amount: milestone.amount,
        currency: milestone.currency,
        status: "pending",
        dueDate: milestone.dueDate,
        createdAt: now,
        updatedAt: now,
      });

      milestoneIds.push(milestoneId);
    }

    // Log audit
    await ctx.db.insert("auditLogs", {
      action: "milestones_created",
      actionType: "admin",
      actorId: user._id,
      actorRole: user.role,
      targetType: "project",
      targetId: args.projectId,
      details: {
        milestoneCount: args.milestones.length,
        totalAmount: totalMilestoneAmount,
      },
      createdAt: now,
    });

    const sendSystemNotification =
      api.api.notifications.actions.sendSystemNotification as unknown as FunctionReference<
        "action",
        "internal"
      >;
    const recipients = [project.clientId];
    if (project.matchedFreelancerId) {
      recipients.push(project.matchedFreelancerId);
    }
    await ctx.scheduler.runAfter(0, sendSystemNotification, {
      userIds: recipients,
      title: "Milestones created",
      message: `Milestones were created for "${project.intakeForm.title}".`,
      type: "milestone",
      data: { projectId: args.projectId, milestoneCount: args.milestones.length },
    });

    return milestoneIds;
  },
});

/**
 * Suggest milestone/deliverable names from project title + description (keyword-based).
 * Used when client does not provide deliverables so milestones reflect the project, not skills.
 */
function suggestDeliverablesFromDescription(
  title: string,
  description: string
): string[] {
  const text = `${(title || "").toLowerCase()} ${(description || "").toLowerCase()}`;
  const suggested: string[] = [];

  // Map keywords to phase names (order matters: first match wins)
  const keywordPhases: Array<{ keywords: string[]; name: string }> = [
    { keywords: ["design", "mockup", "wireframe", "figma", "ui/ux"], name: "Design & Mockups" },
    { keywords: ["api", "backend", "server", "database", "auth"], name: "Backend / API" },
    { keywords: ["frontend", "front-end", "react", "vue", "angular", "mobile app"], name: "Frontend / App" },
    { keywords: ["integration", "connect", "third-party"], name: "Integration" },
    { keywords: ["test", "qa", "bug"], name: "Testing & QA" },
    { keywords: ["deploy", "launch", "host", "production"], name: "Deployment & Launch" },
  ];

  for (const { keywords, name } of keywordPhases) {
    if (keywords.some((k) => text.includes(k)) && !suggested.includes(name)) {
      suggested.push(name);
    }
  }

  // If we found at least 2, use them; otherwise return empty (fall back to generic phases)
  if (suggested.length >= 2 && suggested.length <= 5) {
    return suggested;
  }
  return [];
}

/**
 * Auto-create milestones based on payment breakdown
 * This is called after project is funded to automatically create milestones.
 * Uses: 1) client-defined deliverables, 2) description-based suggestions, 3) generic phases.
 */
export const autoCreateMilestones = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Only client or admin can auto-create milestones
    if (user.role !== "admin" && project.clientId !== user._id) {
      throw new Error("Not authorized to create milestones for this project");
    }

    // Check if milestones already exist
    const existingMilestones = await ctx.db
      .query("milestones")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    if (existingMilestones.length > 0) {
      throw new Error("Milestones already exist for this project");
    }

    // Only create milestones for milestone-based or fixed-price projects
    const projectType = project.intakeForm.projectType;
    if (projectType === "ongoing") {
      return [];
    }

    // Prefer client-defined deliverables; else suggest from title + description; else use generic phases
    let deliverables = project.intakeForm.deliverables ?? [];
    if (deliverables.length === 0) {
      const suggested = suggestDeliverablesFromDescription(
        project.intakeForm.title,
        project.intakeForm.description
      );
      if (suggested.length >= 2 && suggested.length <= 5) {
        deliverables = suggested;
      }
    }

    const durationDays = Math.ceil(
      (project.intakeForm.endDate - project.intakeForm.startDate) / (1000 * 60 * 60 * 24)
    );

    let milestones: Array<{
      title: string;
      description: string;
      order: number;
      amount: number;
      dueDate: number;
    }> = [];

    if (deliverables.length > 0 && deliverables.length <= 5) {
      // Split by deliverables (client-defined or description-suggested)
      const milestoneCount = deliverables.length;
      const amountPerMilestone = project.totalAmount / milestoneCount;
      const intervalMs = (project.intakeForm.endDate - project.intakeForm.startDate) / milestoneCount;

      milestones = deliverables.map((deliverable, index) => {
        const dueDate = project.intakeForm.startDate + (index + 1) * intervalMs;
        return {
          title: deliverable,
          description: `Deliverable: ${deliverable}`,
          order: index + 1,
          amount: Math.round(amountPerMilestone * 100) / 100,
          dueDate,
        };
      });
    } else {
      // Split by generic phases (duration-based)
      let phases: Array<{ name: string; percentage: number }>;

      if (durationDays <= 7) {
        phases = [
          { name: "Initial Development", percentage: 50 },
          { name: "Final Delivery", percentage: 50 },
        ];
      } else if (durationDays <= 30) {
        phases = [
          { name: "Planning & Setup", percentage: 30 },
          { name: "Development", percentage: 40 },
          { name: "Testing & Delivery", percentage: 30 },
        ];
      } else if (durationDays <= 90) {
        phases = [
          { name: "Planning & Design", percentage: 20 },
          { name: "Core Development", percentage: 30 },
          { name: "Integration & Testing", percentage: 30 },
          { name: "Final Delivery", percentage: 20 },
        ];
      } else {
        phases = [
          { name: "Planning & Design", percentage: 15 },
          { name: "Initial Development", percentage: 20 },
          { name: "Core Development", percentage: 25 },
          { name: "Advanced Features", percentage: 25 },
          { name: "Final Delivery", percentage: 15 },
        ];
      }

      const intervalMs = (project.intakeForm.endDate - project.intakeForm.startDate) / phases.length;

      milestones = phases.map((phase, index) => {
        const dueDate = project.intakeForm.startDate + (index + 1) * intervalMs;
        const amount = (project.totalAmount * phase.percentage) / 100;
        return {
          title: phase.name,
          description: `Phase ${index + 1}: ${phase.name}`,
          order: index + 1,
          amount: Math.round(amount * 100) / 100,
          dueDate,
        };
      });
    }

    // Ensure total matches (adjust last milestone if needed)
    const total = milestones.reduce((sum, m) => sum + m.amount, 0);
    const difference = project.totalAmount - total;
    if (Math.abs(difference) > 0.01 && milestones.length > 0) {
      milestones[milestones.length - 1].amount += difference;
      milestones[milestones.length - 1].amount = Math.round(milestones[milestones.length - 1].amount * 100) / 100;
    }

    // Create milestones
    const now = Date.now();
    const milestoneIds = [];

    for (const milestone of milestones) {
      const milestoneId = await ctx.db.insert("milestones", {
        projectId: args.projectId,
        title: milestone.title,
        description: milestone.description,
        order: milestone.order,
        amount: milestone.amount,
        currency: project.currency,
        status: "pending",
        dueDate: milestone.dueDate,
        createdAt: now,
        updatedAt: now,
      });

      milestoneIds.push(milestoneId);
    }

    // Log audit
    await ctx.db.insert("auditLogs", {
      action: "milestones_auto_created",
      actionType: "admin",
      actorId: user._id,
      actorRole: user.role,
      targetType: "project",
      targetId: args.projectId,
      details: {
        milestoneCount: milestones.length,
        totalAmount: project.totalAmount,
      },
      createdAt: now,
    });

    return milestoneIds;
  },
});

/**
 * Internal: auto-create milestones when project is funded (called from payment webhook).
 * No auth; idempotent if milestones already exist.
 */
export const autoCreateMilestonesInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return [];

    const existingMilestones = await ctx.db
      .query("milestones")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    if (existingMilestones.length > 0) return [];

    const projectType = project.intakeForm.projectType;
    if (projectType === "ongoing") return [];

    let deliverables = project.intakeForm.deliverables ?? [];
    if (deliverables.length === 0) {
      const suggested = suggestDeliverablesFromDescription(
        project.intakeForm.title,
        project.intakeForm.description
      );
      if (suggested.length >= 2 && suggested.length <= 5) deliverables = suggested;
    }

    const durationDays = Math.ceil(
      (project.intakeForm.endDate - project.intakeForm.startDate) / (1000 * 60 * 60 * 24)
    );

    let milestones: Array<{ title: string; description: string; order: number; amount: number; dueDate: number }> = [];

    if (deliverables.length > 0 && deliverables.length <= 5) {
      const milestoneCount = deliverables.length;
      const amountPerMilestone = project.totalAmount / milestoneCount;
      const intervalMs = (project.intakeForm.endDate - project.intakeForm.startDate) / milestoneCount;
      milestones = deliverables.map((deliverable, index) => {
        const dueDate = project.intakeForm.startDate + (index + 1) * intervalMs;
        return {
          title: deliverable,
          description: `Deliverable: ${deliverable}`,
          order: index + 1,
          amount: Math.round(amountPerMilestone * 100) / 100,
          dueDate,
        };
      });
    } else {
      let phases: Array<{ name: string; percentage: number }>;
      if (durationDays <= 7) phases = [{ name: "Initial Development", percentage: 50 }, { name: "Final Delivery", percentage: 50 }];
      else if (durationDays <= 30) phases = [{ name: "Planning & Setup", percentage: 30 }, { name: "Development", percentage: 40 }, { name: "Testing & Delivery", percentage: 30 }];
      else if (durationDays <= 90) phases = [{ name: "Planning & Design", percentage: 20 }, { name: "Core Development", percentage: 30 }, { name: "Integration & Testing", percentage: 30 }, { name: "Final Delivery", percentage: 20 }];
      else phases = [{ name: "Planning & Design", percentage: 15 }, { name: "Initial Development", percentage: 20 }, { name: "Core Development", percentage: 25 }, { name: "Advanced Features", percentage: 25 }, { name: "Final Delivery", percentage: 15 }];
      const intervalMs = (project.intakeForm.endDate - project.intakeForm.startDate) / phases.length;
      milestones = phases.map((phase, index) => {
        const dueDate = project.intakeForm.startDate + (index + 1) * intervalMs;
        return {
          title: phase.name,
          description: `Phase ${index + 1}: ${phase.name}`,
          order: index + 1,
          amount: Math.round((project.totalAmount * phase.percentage) / 100 * 100) / 100,
          dueDate,
        };
      });
    }

    const total = milestones.reduce((sum, m) => sum + m.amount, 0);
    const difference = project.totalAmount - total;
    if (Math.abs(difference) > 0.01 && milestones.length > 0) {
      milestones[milestones.length - 1].amount += difference;
      milestones[milestones.length - 1].amount = Math.round(milestones[milestones.length - 1].amount * 100) / 100;
    }

    const now = Date.now();
    const milestoneIds: Doc<"milestones">["_id"][] = [];
    for (const m of milestones) {
      const id = await ctx.db.insert("milestones", {
        projectId: args.projectId,
        title: m.title,
        description: m.description,
        order: m.order,
        amount: m.amount,
        currency: project.currency,
        status: "pending",
        dueDate: m.dueDate,
        createdAt: now,
        updatedAt: now,
      });
      milestoneIds.push(id);
    }

    await ctx.db.insert("auditLogs", {
      action: "milestones_auto_created",
      actionType: "admin",
      actorId: project.clientId,
      actorRole: "system",
      targetType: "project",
      targetId: args.projectId,
      details: { milestoneCount: milestones.length, totalAmount: project.totalAmount },
      createdAt: now,
    });
    return milestoneIds;
  },
});

/**
 * Internal mutation to update project status (for use by payment system)
 */
export const updateProjectStatusInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
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
    escrowedAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const now = Date.now();
    const updates: any = {
      status: args.status,
      updatedAt: now,
    };

    if (args.escrowedAmount !== undefined) {
      updates.escrowedAmount = args.escrowedAmount;
    }

    // Set timestamps for specific statuses
    if (args.status === "in_progress" && !project.startedAt) {
      updates.startedAt = now;
    }

    if (args.status === "completed" && !project.completedAt) {
      updates.completedAt = now;
    }

    await ctx.db.patch(args.projectId, updates);

    // Log audit
    // For system events, we use the project's client ID as the actor
    await ctx.db.insert("auditLogs", {
      action: "project_status_updated",
      actionType: "admin",
      actorId: project.clientId, // Use project owner for system events
      actorRole: "system",
      targetType: "project",
      targetId: args.projectId,
      details: {
        oldStatus: project.status,
        newStatus: args.status,
      },
      createdAt: now,
    });

    return args.projectId;
  },
});

