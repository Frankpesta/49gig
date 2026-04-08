"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { sendEmail } from "../email/send";
import React from "react";

const internalAny = require("../_generated/api").internal as any;

/**
 * Email moderator when a dispute is assigned to them (in addition to in-app notification).
 */
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
    const dashboardUrl = `${appUrl}/dashboard/disputes`;

    await sendEmail({
      to: moderator.email,
      subject: `[49GIG] Dispute assigned: ${title}`,
      react: React.createElement(
        "div",
        { style: { fontFamily: "sans-serif", padding: "24px", maxWidth: "600px" } },
        React.createElement("p", null, `Hi ${moderator.name ?? "there"},`),
        React.createElement(
          "p",
          { style: { marginTop: "16px" } },
          "A dispute has been assigned to you for review."
        ),
        React.createElement("p", { style: { marginTop: "12px" } }, React.createElement("strong", null, "Hire: "), title),
        React.createElement("a", {
          href: dashboardUrl,
          style: {
            display: "inline-block",
            marginTop: "24px",
            padding: "12px 24px",
            backgroundColor: "#2563eb",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
          },
        }, "Open disputes in dashboard")
      ),
    });
  },
});
