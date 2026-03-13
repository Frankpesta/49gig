"use node";

/**
 * Auto-Assignment System
 *
 * When a funded project has no suitable freelancers available, it is placed in an
 * "awaiting match" queue (awaitingMatch = true on the project).
 *
 * Two triggers re-run matching for queued projects:
 *  1. `checkAndAutoAssignForFreelancer`  – called when a freelancer's KYC is approved
 *  2. `retryAwaitingMatchProjects`       – runs on a cron every 4 hours
 *
 * When a match IS found, both the client and the freelancer(s) receive an email.
 */

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import React from "react";
import { sendEmail } from "../email/send";

const internalAny = require("../_generated/api").internal as any;
const apiAny = require("../_generated/api").api as any;

// ---------------------------------------------------------------------------
// Email helpers
// ---------------------------------------------------------------------------

async function sendAutoMatchClientEmail(
  email: string,
  clientName: string,
  projectTitle: string,
  matchedCount: number
) {
  await sendEmail({
    to: email,
    subject: `Great news — we found ${matchedCount > 1 ? "freelancers" : "a freelancer"} for your hire on 49GIG`,
    react: React.createElement(
      "div",
      { style: { fontFamily: "sans-serif", padding: "24px", maxWidth: "600px" } },
      React.createElement("h2", { style: { marginBottom: "16px", color: "#111" } }, "A match has been found!"),
      React.createElement("p", null, `Hi ${clientName},`),
      React.createElement(
        "p",
        { style: { marginTop: "16px" } },
        `We're pleased to let you know that we have found ${matchedCount > 1 ? `${matchedCount} freelancers` : "a freelancer"} for your hire — `,
        React.createElement("strong", null, projectTitle),
        "."
      ),
      React.createElement(
        "p",
        { style: { marginTop: "16px" } },
        "Log in to your 49GIG dashboard to review the match and confirm."
      ),
      React.createElement(
        "a",
        {
          href: "https://49gig.com/dashboard",
          style: {
            display: "inline-block",
            marginTop: "20px",
            padding: "12px 24px",
            background: "#2563eb",
            color: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "600",
          },
        },
        "View match →"
      ),
      React.createElement(
        "p",
        { style: { marginTop: "24px", fontSize: "13px", color: "#666" } },
        "The 49GIG team"
      )
    ),
  });
}

async function sendAutoMatchFreelancerEmail(
  email: string,
  freelancerName: string,
  projectTitle: string
) {
  await sendEmail({
    to: email,
    subject: "You've been matched to a project on 49GIG",
    react: React.createElement(
      "div",
      { style: { fontFamily: "sans-serif", padding: "24px", maxWidth: "600px" } },
      React.createElement("h2", { style: { marginBottom: "16px", color: "#111" } }, "You have a new project match!"),
      React.createElement("p", null, `Hi ${freelancerName},`),
      React.createElement(
        "p",
        { style: { marginTop: "16px" } },
        "Congratulations! You have been automatically matched to a new project: ",
        React.createElement("strong", null, projectTitle),
        "."
      ),
      React.createElement(
        "p",
        { style: { marginTop: "16px" } },
        "Log in to your 49GIG dashboard to review the details and get started."
      ),
      React.createElement(
        "a",
        {
          href: "https://49gig.com/dashboard",
          style: {
            display: "inline-block",
            marginTop: "20px",
            padding: "12px 24px",
            background: "#2563eb",
            color: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "600",
          },
        },
        "View project →"
      ),
      React.createElement(
        "p",
        { style: { marginTop: "24px", fontSize: "13px", color: "#666" } },
        "The 49GIG team"
      )
    ),
  });
}

// ---------------------------------------------------------------------------
// Core re-matching logic
// ---------------------------------------------------------------------------

/**
 * Attempt to generate matches for a single awaiting project.
 * Sends emails to client + matched freelancers when a match is found.
 * Returns the number of new matches created (0 = still no match).
 */
async function tryMatchProject(ctx: any, projectId: string): Promise<number> {
  try {
    const project = await ctx.runQuery(
      internalAny.projects.queries.getProjectInternal,
      { projectId }
    );
    if (!project || project.status !== "funded") return 0;

    const matchIds: string[] = await ctx.runAction(
      apiAny.matching.actions.generateMatches,
      { projectId, limit: 5 }
    );

    if (matchIds.length === 0) return 0;

    // Fetch client to send email
    const client = await ctx.runQuery(internalAny.users.queries.getUserByIdInternal, {
      userId: project.clientId,
    });

    if (client?.email) {
      await sendAutoMatchClientEmail(
        client.email,
        client.name ?? "there",
        project.intakeForm.title,
        matchIds.length
      );
    }

    // Notify client in-app
    await ctx.runAction(
      internalAny.notifications.actions.sendSystemNotification,
      {
        userIds: [project.clientId],
        title: "A freelancer match has been found!",
        message: `We found ${matchIds.length > 1 ? `${matchIds.length} freelancers` : "a freelancer"} for your hire "${project.intakeForm.title}". Review the match in your dashboard.`,
        type: "match",
        data: { projectId },
      }
    );

    // Fetch matched freelancers and send each an email + in-app notification
    const matchDocs = await Promise.all(
      matchIds.map((id: string) =>
        ctx.runQuery(internalAny.matching.queries.getMatchById, { matchId: id })
      )
    );

    for (const match of matchDocs) {
      if (!match) continue;
      const freelancer = await ctx.runQuery(internalAny.users.queries.getUserByIdInternal, {
        userId: match.freelancerId,
      });
      if (freelancer?.email) {
        await sendAutoMatchFreelancerEmail(
          freelancer.email,
          freelancer.name ?? "there",
          project.intakeForm.title
        );
      }
      // In-app notification for freelancer
      await ctx.runAction(
        internalAny.notifications.actions.sendSystemNotification,
        {
          userIds: [match.freelancerId],
          title: "You've been matched to a project!",
          message: `You have been matched to "${project.intakeForm.title}". Log in to review the details.`,
          type: "match",
          data: { projectId, matchId: match._id },
        }
      );
    }

    return matchIds.length;
  } catch (err) {
    console.error("[autoAssign] tryMatchProject error for", projectId, err);
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Exported actions
// ---------------------------------------------------------------------------

/**
 * Called immediately after a freelancer's KYC is approved.
 * Scans all funded projects awaiting a match and tries to assign this freelancer.
 */
export const checkAndAutoAssignForFreelancer = internalAction({
  args: {
    freelancerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const awaitingProjects = await ctx.runQuery(
      internalAny.matching.queries.getProjectsAwaitingMatch,
      {}
    );

    if (!awaitingProjects || awaitingProjects.length === 0) return;

    for (const project of awaitingProjects) {
      await tryMatchProject(ctx, project._id);
    }
  },
});

/**
 * Periodic retry: re-runs matching for every funded project still awaiting assignment.
 * Registered as a cron job in convex/crons.ts.
 */
export const retryAwaitingMatchProjects = internalAction({
  args: {},
  handler: async (ctx) => {
    const awaitingProjects = await ctx.runQuery(
      internalAny.matching.queries.getProjectsAwaitingMatch,
      {}
    );

    if (!awaitingProjects || awaitingProjects.length === 0) return;

    console.log(`[autoAssign] Retrying ${awaitingProjects.length} awaiting project(s)…`);

    for (const project of awaitingProjects) {
      await tryMatchProject(ctx, project._id);
    }
  },
});
