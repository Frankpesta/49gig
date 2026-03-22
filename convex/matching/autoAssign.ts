"use node";

/**
 * Auto-Assignment System
 *
 * When a project has no suitable freelancers available, it can be placed in an
 * "awaiting match" queue (awaitingMatch = true on the project) — draft, pending_funding,
 * funded, or matching.
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
import { AutoMatchReadyClientEmail, AutoMatchFreelancerEmail } from "../../emails/templates";

const internalAny = require("../_generated/api").internal as any;
const apiAny = require("../_generated/api").api as any;

function getAppUrl() {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://49gig.com"
  );
}

function getLogoUrl(appUrl: string) {
  return `${appUrl}/logo-light.png`;
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Email helpers
// ---------------------------------------------------------------------------

async function sendAutoMatchClientEmail(
  email: string,
  clientName: string,
  hireTitle: string,
  matchedCount: number,
  projectId: string
) {
  const appUrl = getAppUrl();
  const logoUrl = getLogoUrl(appUrl);
  const date = formatDate();
  const matchesPageUrl = `${appUrl}/dashboard/projects/${projectId}/matches`;
  const subject =
    matchedCount > 1
      ? `Automatic match: ${matchedCount} freelancers for your hire on 49GIG`
      : `Automatic match: a freelancer for your hire on 49GIG`;

  await sendEmail({
    to: email,
    subject,
    react: React.createElement(AutoMatchReadyClientEmail, {
      name: clientName,
      hireTitle,
      matchedCount,
      matchesPageUrl,
      appUrl,
      logoUrl,
      date,
    }),
  });
}

async function sendAutoMatchFreelancerEmail(
  email: string,
  freelancerName: string,
  hireTitle: string,
  clientName: string,
  projectId: string
) {
  const appUrl = getAppUrl();
  const logoUrl = getLogoUrl(appUrl);
  const date = formatDate();
  const hirePageUrl = `${appUrl}/dashboard/projects/${projectId}/matches`;

  await sendEmail({
    to: email,
    subject: `You've been automatically matched for a hire on 49GIG`,
    react: React.createElement(AutoMatchFreelancerEmail, {
      name: freelancerName,
      hireTitle,
      clientName,
      hirePageUrl,
      appUrl,
      logoUrl,
      date,
    }),
  });
}

// ---------------------------------------------------------------------------
// Core re-matching logic
// ---------------------------------------------------------------------------

/**
 * Notify client + freelancers for the given match rows (pre/post fund).
 */
async function notifyForMatches(
  ctx: any,
  project: { _id: string; clientId: string; intakeForm: { title: string } },
  projectId: string,
  matchDocs: Array<{ _id: string; freelancerId: string } | null | undefined>
) {
  const validMatches = matchDocs.filter(Boolean) as Array<{ _id: string; freelancerId: string }>;
  if (validMatches.length === 0) return;

  const client = await ctx.runQuery(internalAny.users.queries.getUserByIdInternal, {
    userId: project.clientId,
  });

  if (client?.email) {
    await sendAutoMatchClientEmail(
      client.email,
      client.name ?? "there",
      project.intakeForm.title,
      validMatches.length,
      projectId
    );
  }

  await ctx.runAction(internalAny.notifications.actions.sendSystemNotification, {
    userIds: [project.clientId],
    title: "Automatic match for your hire",
    message: `You've been automatically matched with ${validMatches.length > 1 ? `${validMatches.length} freelancers` : "a freelancer"} for "${project.intakeForm.title}". Review them on your hire's matches page.`,
    type: "match",
    data: { projectId },
  });

  for (const match of validMatches) {
    const freelancer = await ctx.runQuery(internalAny.users.queries.getUserByIdInternal, {
      userId: match.freelancerId,
    });
    if (freelancer?.email) {
      await sendAutoMatchFreelancerEmail(
        freelancer.email,
        freelancer.name ?? "there",
        project.intakeForm.title,
        client?.name ?? "a client",
        projectId
      );
    }
    await ctx.runAction(internalAny.notifications.actions.sendSystemNotification, {
      userIds: [match.freelancerId],
      title: "You've been automatically matched for a hire",
      message: `You've been automatically matched for "${project.intakeForm.title}". Open your dashboard to review the hire and next steps.`,
      type: "match",
      data: { projectId, matchId: match._id },
    });
  }
}

/**
 * Attempt to generate matches for a single awaiting project.
 * Sends emails to client + matched freelancers when new matches appear.
 * Returns the number of new matches notified (0 = still no new match).
 */
async function tryMatchProject(ctx: any, projectId: string): Promise<number> {
  try {
    const project = await ctx.runQuery(
      internalAny.projects.queries.getProjectInternal,
      { projectId }
    );
    if (!project) return 0;

    const isPreFund =
      project.status === "draft" || project.status === "pending_funding";
    const isPostFund =
      project.status === "funded" || project.status === "matching";
    if (!isPreFund && !isPostFund) return 0;

    // ── Pre-funding: generateMatchesForDraft (same as matches page).
    // Only notify when new pending freelancers appear — avoids emailing every cron tick.
    if (isPreFund) {
      const beforeRows = await ctx.runQuery(
        internalAny.matching.queries.listProjectMatchesInternal,
        { projectId }
      );
      const beforeFreelancers = new Set(
        beforeRows
          .filter((m: { status: string }) => m.status === "pending")
          .map((m: { freelancerId: string }) => m.freelancerId)
      );

      await ctx.runAction(apiAny.matching.actions.generateMatchesForDraft, {
        projectId,
      });

      const afterRows = await ctx.runQuery(
        internalAny.matching.queries.listProjectMatchesInternal,
        { projectId }
      );
      const newMatches = afterRows.filter(
        (m: { status: string; freelancerId: string }) =>
          m.status === "pending" && !beforeFreelancers.has(m.freelancerId)
      );

      if (newMatches.length === 0) return 0;

      await notifyForMatches(ctx, project, projectId, newMatches);
      return newMatches.length;
    }

    // ── Post-funding
    let matchIds: string[] = [];
    if (project.intakeForm?.hireType === "team") {
      const res = await ctx.runAction(apiAny.matching.actions.generateTeamMatches, {
        projectId,
      });
      matchIds = res?.matchIds ?? [];
    } else {
      matchIds = await ctx.runAction(apiAny.matching.actions.generateMatches, {
        projectId,
        limit: 5,
      });
    }

    if (matchIds.length === 0) return 0;

    const matchDocs = await Promise.all(
      matchIds.map((id: string) =>
        ctx.runQuery(internalAny.matching.queries.getMatchById, { matchId: id })
      )
    );

    await notifyForMatches(ctx, project, projectId, matchDocs);
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
 * Scans all projects awaiting a match (including draft) and tries to assign.
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
 * Periodic retry: re-runs matching for every project still awaiting assignment.
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
