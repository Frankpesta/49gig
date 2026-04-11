"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { sendEmail } from "../email/send";
import React from "react";
import { DisputeUpdateEmail } from "../../emails/templates";

const internalAny = require("../_generated/api").internal as any;

function emailDateString() {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Email affected dispute parties (shared layout).
 */
export const sendDisputePartyEmailsInternal = internalAction({
  args: {
    userIds: v.array(v.id("users")),
    subject: v.string(),
    headline: v.string(),
    bodyText: v.string(),
    disputeId: v.id("disputes"),
    ctaLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const appUrl =
      process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://49gig.com";
    const date = emailDateString();
    const ctaHref = `${appUrl}/dashboard/disputes/${args.disputeId}`;
    for (const uid of args.userIds) {
      const u = (await ctx.runQuery(internalAny.users.queries.getUserByIdInternal, {
        userId: uid,
      })) as { name?: string; email?: string } | null;
      if (!u?.email) continue;
      await sendEmail({
        to: u.email,
        subject: args.subject,
        react: React.createElement(DisputeUpdateEmail, {
          name: u.name ?? "there",
          appUrl,
          date,
          headline: args.headline,
          bodyText: args.bodyText,
          ctaHref,
          ctaLabel: args.ctaLabel ?? "Open dispute",
        }),
      });
    }
  },
});

/**
 * Email moderator when a dispute is assigned to them (in addition to in-app notification).
 */
/** Email all active admins when a dispute is escalated. */
export const sendDisputeEscalationAdminsInternal = internalAction({
  args: {
    disputeId: v.id("disputes"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const dispute = (await ctx.runQuery(internalAny.disputes.queries.getDisputeDocInternal, {
      disputeId: args.disputeId,
    })) as Doc<"disputes"> | null;
    if (!dispute) return;

    const project = (await ctx.runQuery(internalAny.projects.queries.getProjectInternal, {
      projectId: dispute.projectId as Id<"projects">,
    })) as Doc<"projects"> | null;
    const title = project?.intakeForm?.title ?? "Project";

    const staff = (await ctx.runQuery(
      internalAny.users.queries.getModeratorsAndAdminsInternal,
      {}
    )) as Array<{ email?: string; name?: string; role: string }>;

    const appUrl =
      process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://49gig.com";
    const date = emailDateString();

    for (const s of staff) {
      if (s.role !== "admin" || !s.email) continue;
      await sendEmail({
        to: s.email,
        subject: `[49GIG] Dispute escalated: ${title}`,
        react: React.createElement(DisputeUpdateEmail, {
          name: s.name ?? "there",
          appUrl,
          date,
          headline: "Dispute escalated",
          bodyText: `A moderator escalated a dispute on "${title}".\n\nReason: ${args.reason}`,
          ctaHref: `${appUrl}/dashboard/disputes/${args.disputeId}`,
          ctaLabel: "Review dispute",
        }),
      });
    }
  },
});

export const sendDisputeAssignmentEmailInternal = internalAction({
  args: {
    disputeId: v.id("disputes"),
  },
  handler: async (ctx, args) => {
    const dispute = (await ctx.runQuery(internalAny.disputes.queries.getDisputeDocInternal, {
      disputeId: args.disputeId,
    })) as Doc<"disputes"> | null;
    if (!dispute?.assignedModeratorId) return;

    const moderator = (await ctx.runQuery(internalAny.users.queries.getUserByIdInternal, {
      userId: dispute.assignedModeratorId as Id<"users">,
    })) as Doc<"users"> | null;
    if (!moderator?.email) return;

    const project = (await ctx.runQuery(internalAny.projects.queries.getProjectInternal, {
      projectId: dispute.projectId as Id<"projects">,
    })) as Doc<"projects"> | null;
    const title = project?.intakeForm?.title ?? "Project";

    const appUrl =
      process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://49gig.com";
    const date = emailDateString();

    await sendEmail({
      to: moderator.email,
      subject: `[49GIG] Dispute assigned: ${title}`,
      react: React.createElement(DisputeUpdateEmail, {
        name: moderator.name ?? "there",
        appUrl,
        date,
        headline: "A dispute was assigned to you",
        bodyText: `A dispute on the hire "${title}" has been assigned to you for review. Open your disputes queue to respond.`,
        ctaHref: `${appUrl}/dashboard/disputes`,
        ctaLabel: "Open disputes",
      }),
    });
  },
});
