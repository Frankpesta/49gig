import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";
import {
  estimatedPlatformFeeClawbackOnRefund,
  grossClientFundsInflowOnPayment,
  platformFeeRecognizedOnPayment,
} from "../platformRevenue";
import { getDefaultPlatformFeePercent } from "../platformFeeResolve";

const ACTIVE_PROJECT_STATUSES = new Set([
  "pending_funding",
  "funded",
  "matching",
  "matched",
  "in_progress",
]);

/**
 * Helper function to get current user in queries
 * Supports both Convex Auth and session token authentication via userId
 */
async function getCurrentUserInQuery(
  ctx: any,
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

export const searchByIdAdmin = query({
  args: {
    id: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      return [];
    }

    const raw = args.id.trim();
    if (!raw) return [];

    type Row = {
      kind: string;
      id: string;
      title: string;
      subtitle?: string;
      href?: string;
    };
    const rows: Row[] = [];

    const tryPush = async (
      table:
        | "users"
        | "projects"
        | "disputes"
        | "matches"
        | "payments"
        | "walletTransactions"
        | "wallets"
        | "chats"
        | "messages"
        | "notifications"
        | "monthlyBillingCycles",
      payload: {
        kind: string;
        title: (doc: any) => string;
        subtitle?: (doc: any) => string | undefined;
        href?: (id: string, doc: Doc<any>) => string;
      }
    ) => {
      const normalizedId = ctx.db.normalizeId(table, raw as any);
      if (!normalizedId) return;
      const doc = await ctx.db.get(normalizedId);
      if (!doc) return;
      rows.push({
        kind: payload.kind,
        id: String(normalizedId),
        title: payload.title(doc),
        subtitle: payload.subtitle?.(doc),
        href: payload.href?.(String(normalizedId), doc),
      });
    };

    await tryPush("users", {
      kind: "user",
      title: (doc) => `${doc.name || "Unknown"} (${doc.role})`,
      subtitle: (doc) => doc.email,
      href: (id) => `/dashboard/users/${id}`,
    });
    await tryPush("projects", {
      kind: "project",
      title: (doc) => doc.intakeForm?.title || "Untitled project",
      subtitle: (doc) => `Status: ${doc.status}`,
      href: (id) => `/dashboard/projects/${id}`,
    });
    await tryPush("disputes", {
      kind: "dispute",
      title: (doc) => `Dispute (${doc.status})`,
      subtitle: (doc) => doc.reason,
      href: (id) => `/dashboard/disputes/${id}`,
    });
    await tryPush("matches", {
      kind: "match",
      title: (doc) => `Match (${doc.status})`,
      subtitle: (doc) => `Score: ${doc.score}`,
      href: (id) => `/dashboard/match-requests?matchId=${id}`,
    });
    await tryPush("payments", {
      kind: "payment",
      title: (doc) => `Payment ${doc.type} (${doc.status})`,
      subtitle: (doc) => `${doc.amount} ${String(doc.currency || "").toUpperCase()}`,
      href: (id) => `/dashboard/transactions/${id}`,
    });
    await tryPush("walletTransactions", {
      kind: "wallet_transaction",
      title: (doc) => `Wallet ${doc.type} (${doc.status})`,
      subtitle: (doc) => doc.description,
      href: (id) => `/dashboard/transactions/${id}`,
    });
    await tryPush("wallets", {
      kind: "wallet",
      title: (doc) => `Wallet (${String(doc.currency || "").toUpperCase()})`,
      subtitle: (doc) => `Balance: ${(doc.balanceCents ?? 0) / 100}`,
      href: () => `/dashboard/wallet`,
    });
    await tryPush("chats", {
      kind: "chat",
      title: (doc) => doc.title || "Chat",
      subtitle: (doc) => `Type: ${doc.type}`,
      href: (id, doc) =>
        doc.type === "support"
          ? `/dashboard/chat/support/${id}`
          : `/dashboard/chat/${id}`,
    });
    await tryPush("messages", {
      kind: "message",
      title: (doc) => doc.content?.slice(0, 80) || "Message",
      subtitle: (doc) => `Type: ${doc.contentType}`,
      href: (id) => `/dashboard/chat?messageId=${id}`,
    });
    await tryPush("notifications", {
      kind: "notification",
      title: (doc) => doc.title,
      subtitle: (doc) => doc.message,
      href: (id) => `/dashboard/notifications?notificationId=${id}`,
    });
    await tryPush("monthlyBillingCycles", {
      kind: "monthly_cycle",
      title: (doc) => `Monthly cycle #${doc.monthIndex}`,
      subtitle: (doc) => `Status: ${doc.status}`,
      href: (id) => `/dashboard/monthly-approvals?cycleId=${id}`,
    });
    return rows;
  },
});

export const getDashboardMetrics = query({
  args: {
    userId: v.optional(v.id("users")),
    nowMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Accept caller-provided time so the query is deterministic w.r.t. its reads.
    // Fallback preserves existing behavior for callers that don't pass it.
    const now = args.nowMs ?? Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    if (user.role === "client") {
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_client", (q) => q.eq("clientId", user._id))
        .collect();

      const projectIds = new Set(projects.map((project) => project._id));
      const activeProjects = projects.filter((project) =>
        ACTIVE_PROJECT_STATUSES.has(project.status)
      );

      const escrowed = projects.reduce(
        (sum, project) => sum + (project.escrowedAmount || 0),
        0
      );

      const matches = await ctx.db
        .query("matches")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect();
      const proposals = matches.filter((match) => projectIds.has(match.projectId));

      const payments = await ctx.db
        .query("payments")
        .withIndex("by_status", (q) => q.eq("status", "succeeded"))
        .collect();
      const totalSpend = payments
        .filter(
          (payment) =>
            payment.projectId != null &&
            projectIds.has(payment.projectId) &&
            (payment.type === "pre_funding" || payment.type === "milestone_release")
        )
        .reduce((sum, payment) => sum + payment.amount, 0);

      const matchedProjects = projects.filter(
        (project) => project.matchedAt && project.createdAt
      );
      const avgMatchHours =
        matchedProjects.length > 0
          ? Math.round(
              matchedProjects.reduce((sum, project) => {
                return sum + (project.matchedAt! - project.createdAt) / 36e5;
              }, 0) / matchedProjects.length
            )
          : 0;

      const disputes = await ctx.db
        .query("disputes")
        .withIndex("by_status", (q) => q.eq("status", "open"))
        .collect();
      const disputedProjectIds = new Set(
        disputes.map((dispute) => dispute.projectId)
      );
      const completedProjects = projects.filter(
        (project) => project.status === "completed"
      );
      const satisfiedCount = completedProjects.filter(
        (project) => !disputedProjectIds.has(project._id)
      ).length;
      let satisfactionRate =
        completedProjects.length > 0
          ? Math.round((satisfiedCount / completedProjects.length) * 100)
          : 0;

      // Satisfaction from client's ratings when available (1-5 → 0-100)
      const clientReviews = await ctx.db
        .query("reviews")
        .withIndex("by_client", (q) => q.eq("clientId", user._id))
        .collect();
      if (clientReviews.length > 0) {
        const avgRating =
          clientReviews.reduce((sum, r) => sum + r.rating, 0) / clientReviews.length;
        satisfactionRate = Math.round(avgRating * 20); // 1-5 → 20-100
      }

      // Active projects progress: share of monthly billing cycles approved for active hires
      const activeProjectIds = new Set(activeProjects.map((p) => p._id));
      const allCycles = await ctx.db.query("monthlyBillingCycles").collect();
      const activeCycles = allCycles.filter((c) => activeProjectIds.has(c.projectId));
      const completedCycles = activeCycles.filter((c) => c.status === "approved");
      const activeProjectsProgress =
        activeCycles.length > 0
          ? Math.round((completedCycles.length / activeCycles.length) * 100)
          : 0;

      // Calculate trends (compare current period with previous period)
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

      // Active Projects trend (30 days) - count projects that were active 30 days ago
      // We need to check projects that existed 30 days ago and were active then
      const activeProjects30DaysAgo = projects.filter(
        (p) =>
          p.createdAt < thirtyDaysAgo &&
          ACTIVE_PROJECT_STATUSES.has(p.status) &&
          (p.matchedAt === undefined || p.matchedAt < thirtyDaysAgo)
      ).length;
      const activeProjectsTrend = activeProjects30DaysAgo > 0
        ? Math.round(((activeProjects.length - activeProjects30DaysAgo) / activeProjects30DaysAgo) * 100)
        : activeProjects.length > 0 ? 100 : 0;

      // Proposals trend (7 days)
      const proposals7DaysAgo = matches.filter(
        (m) => projectIds.has(m.projectId) && m.createdAt < sevenDaysAgo
      ).length;
      const proposalsTrend = proposals7DaysAgo > 0
        ? Math.round(((proposals.length - proposals7DaysAgo) / proposals7DaysAgo) * 100)
        : proposals.length > 0 ? 100 : 0;

      // Escrow trend (30 days)
      const escrowed30DaysAgo = projects
        .filter((p) => p.createdAt < thirtyDaysAgo)
        .reduce((sum, project) => sum + (project.escrowedAmount || 0), 0);
      const escrowedTrend = escrowed30DaysAgo > 0
        ? Math.round(((escrowed - escrowed30DaysAgo) / escrowed30DaysAgo) * 100)
        : escrowed > 0 ? 100 : 0;

      // Total Spend trend (30 days)
      const totalSpend30DaysAgo = payments
        .filter(
          (payment) =>
            payment.projectId != null &&
            projectIds.has(payment.projectId) &&
            (payment.type === "pre_funding" || payment.type === "milestone_release") &&
            payment.createdAt < thirtyDaysAgo
        )
        .reduce((sum, payment) => sum + payment.amount, 0);
      const totalSpendTrend = totalSpend30DaysAgo > 0
        ? Math.round(((totalSpend - totalSpend30DaysAgo) / totalSpend30DaysAgo) * 100)
        : totalSpend > 0 ? 100 : 0;

      return {
        role: "client",
        metrics: {
          activeProjects: activeProjects.length,
          activeProjectsProgress,
          proposals: proposals.length,
          escrowed,
          totalSpend,
          avgMatchHours,
          satisfactionRate,
          trends: {
            activeProjects: { value: Math.abs(activeProjectsTrend), isPositive: activeProjectsTrend >= 0, label: "30d" },
            proposals: { value: Math.abs(proposalsTrend), isPositive: proposalsTrend >= 0, label: "7d" },
            escrowed: { value: Math.abs(escrowedTrend), isPositive: escrowedTrend >= 0, label: "30d" },
            totalSpend: { value: Math.abs(totalSpendTrend), isPositive: totalSpendTrend >= 0, label: "30d" },
          },
        },
      };
    }

    if (user.role === "freelancer") {
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_freelancer", (q) => q.eq("matchedFreelancerId", user._id))
        .collect();

      const projectIds = new Set(projects.map((project) => project._id));
      const activeProjects = projects.filter((project) =>
        ACTIVE_PROJECT_STATUSES.has(project.status)
      );

      const payments = await ctx.db
        .query("payments")
        .withIndex("by_status", (q) => q.eq("status", "succeeded"))
        .collect();
      const earnings = payments
        .filter(
          (payment) =>
            payment.projectId != null &&
            projectIds.has(payment.projectId) &&
            (payment.type === "payout" || payment.type === "milestone_release")
        )
        .reduce((sum, payment) => sum + payment.netAmount, 0);

      const matches = await ctx.db
        .query("matches")
        .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
        .collect();
      const scoredMatches = matches.filter((match) => match.createdAt >= thirtyDaysAgo);
      const matchScore =
        scoredMatches.length > 0
          ? Math.round(
              scoredMatches.reduce((sum, match) => sum + match.score, 0) /
                scoredMatches.length
            )
          : 0;

      const estimatedHours = activeProjects.reduce((sum, project) => {
        return sum + (project.intakeForm.estimatedHours || 0);
      }, 0);

      const pendingCycles = await ctx.db
        .query("monthlyBillingCycles")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect();
      const pendingReviews = pendingCycles.filter(
        (cycle) =>
          projectIds.has(cycle.projectId) &&
          cycle.monthEndDate <= now
      );

      // Client ratings / reputation
      const clientReviews = await ctx.db
        .query("reviews")
        .withIndex("by_freelancer", (q) => q.eq("freelancerId", user._id))
        .collect();
      const avgRating =
        clientReviews.length > 0
          ? Math.round(
              (clientReviews.reduce((s, r) => s + r.rating, 0) / clientReviews.length) * 10
            ) / 10
          : 0;
      const reviewCount = clientReviews.length;

      const acceptedMatches = matches.filter((match) => match.status === "accepted");
      const respondedMatches = matches.filter(
        (match) => match.status === "accepted" || match.status === "rejected"
      );
      const responseRate =
        matches.length > 0
          ? Math.round((respondedMatches.length / matches.length) * 100)
          : 0;

      // Calculate trends (use thirtyDaysAgo from handler scope)
      // Active Projects trend (30 days)
      const activeProjects30DaysAgo = projects.filter(
        (p) =>
          p.matchedAt && p.matchedAt < thirtyDaysAgo &&
          ACTIVE_PROJECT_STATUSES.has(p.status)
      ).length;
      const activeProjectsTrend = activeProjects30DaysAgo > 0
        ? Math.round(((activeProjects.length - activeProjects30DaysAgo) / activeProjects30DaysAgo) * 100)
        : activeProjects.length > 0 ? 100 : 0;

      // Earnings trend (30 days)
      const earnings30DaysAgo = payments
        .filter(
          (payment) =>
            payment.projectId != null &&
            projectIds.has(payment.projectId) &&
            (payment.type === "payout" || payment.type === "milestone_release") &&
            payment.createdAt < thirtyDaysAgo
        )
        .reduce((sum, payment) => sum + payment.netAmount, 0);
      const earningsTrend = earnings30DaysAgo > 0
        ? Math.round(((earnings - earnings30DaysAgo) / earnings30DaysAgo) * 100)
        : earnings > 0 ? 100 : 0;

      return {
        role: "freelancer",
        metrics: {
          activeProjects: activeProjects.length,
          earnings,
          matchScore,
          estimatedHours,
          pendingReviews: pendingReviews.length,
          responseRate,
          avgRating,
          reviewCount,
          trends: {
            activeProjects: { value: Math.abs(activeProjectsTrend), isPositive: activeProjectsTrend >= 0, label: "30d" },
            earnings: { value: Math.abs(earningsTrend), isPositive: earningsTrend >= 0, label: "30d" },
          },
        },
      };
    }

    // Admin
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_created", (q) => q.gte("createdAt", 0))
      .collect();
    const totalProjects = projects.length;

    const clients = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "client"))
      .collect();
    const freelancers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "freelancer"))
      .collect();
    const activeClients = clients.filter((u) => u.status === "active").length;
    const activeFreelancers = freelancers.filter((u) => u.status === "active").length;

    const allPayments = await ctx.db.query("payments").collect();
    const projectById = new Map(projects.map((p) => [String(p._id), p]));
    const defaultPlatformFee = await getDefaultPlatformFeePercent(ctx);

    const monthStartMs = Date.UTC(
      new Date(now).getUTCFullYear(),
      new Date(now).getUTCMonth(),
      1,
      0,
      0,
      0,
      0
    );

    let recognizedMtd = 0;
    let clawbackMtd = 0;
    let recognizedAllTime = 0;
    let clawbackAllTime = 0;
    let grossInflowMtd = 0;
    let grossInflowAllTime = 0;

    for (const payment of allPayments) {
      const rec = platformFeeRecognizedOnPayment(payment);
      if (rec > 0) {
        recognizedAllTime += rec;
        if (payment.createdAt >= monthStartMs) {
          recognizedMtd += rec;
        }
      }
      const inflow = grossClientFundsInflowOnPayment(payment);
      if (inflow > 0) {
        grossInflowAllTime += inflow;
        if (payment.createdAt >= monthStartMs) {
          grossInflowMtd += inflow;
        }
      }
    }

    for (const payment of allPayments) {
      if (payment.type !== "refund" || payment.status !== "refunded") continue;
      const proj = payment.projectId ? projectById.get(String(payment.projectId)) : undefined;
      const pct = proj?.platformFee ?? defaultPlatformFee;
      const claw = estimatedPlatformFeeClawbackOnRefund(payment, pct);
      if (claw <= 0) continue;
      clawbackAllTime += claw;
      if (payment.createdAt >= monthStartMs) {
        clawbackMtd += claw;
      }
    }

    /** Total client funds that entered the platform (MTD / all time). */
    const revenue = grossInflowMtd;
    const revenueAllTime = grossInflowAllTime;
    const platformFeesNetMtd = Math.max(0, recognizedMtd - clawbackMtd);
    const platformFeesNetAllTime = Math.max(0, recognizedAllTime - clawbackAllTime);

    const disputes = await ctx.db
      .query("disputes")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();
    const openDisputes = disputes.length;

    const failedPayments = await ctx.db
      .query("payments")
      .withIndex("by_status", (q) => q.eq("status", "failed"))
      .collect();
    const succeededCount = allPayments.filter((p) => p.status === "succeeded").length;
    const totalProcessed = succeededCount + failedPayments.length;
    const systemHealth =
      totalProcessed > 0
        ? Math.round((succeededCount / totalProcessed) * 100)
        : 100;

    return {
      role: "admin",
      metrics: {
        totalProjects,
        activeClients,
        activeFreelancers,
        /** Gross client hire payments MTD (funding, top-ups, legacy release rows). */
        revenue,
        /** Gross client funds into the platform all time. */
        revenueAllTime,
        /** Net platform fees MTD (fee portion minus est. refund clawback). */
        platformFeesNetMtd,
        /** Net platform fees all time. */
        platformFeesNetAllTime,
        /** Gross fees recognized MTD (before refund adjustment). */
        platformFeesRecognizedMtd: recognizedMtd,
        /** Estimated fee clawback from refunds MTD. */
        platformFeeRefundAdjustmentMtd: clawbackMtd,
        openDisputes,
        systemHealth,
      },
    };
  },
});

/**
 * Upcoming billing periods for the current user's active projects (month ended, still pending approval).
 */
export const getUpcomingBillingCycles = query({
  args: {
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
    nowMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInQuery(ctx, args.userId);
    if (!user) return [];

    const now = args.nowMs ?? Date.now();
    const limit = args.limit ?? 5;

    let projectIds: Set<Doc<"projects">["_id"]> = new Set();

    if (user.role === "client") {
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_client", (q) => q.eq("clientId", user._id))
        .collect();
      projectIds = new Set(projects.map((p) => p._id));
    } else if (user.role === "freelancer") {
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_freelancer", (q) => q.eq("matchedFreelancerId", user._id))
        .collect();
      projectIds = new Set(projects.map((p) => p._id));
    } else {
      return [];
    }

    const allCycles = await ctx.db.query("monthlyBillingCycles").collect();
    const upcoming = allCycles
      .filter(
        (c) =>
          projectIds.has(c.projectId) &&
          c.status === "pending" &&
          c.monthEndDate >= now
      )
      .sort((a, b) => a.monthEndDate - b.monthEndDate)
      .slice(0, limit);

    return upcoming.map((c) => ({
      _id: c._id,
      title: `Month ${c.monthIndex}`,
      dueDate: c.monthEndDate,
      status: c.status,
      projectId: c.projectId,
    }));
  },
});
