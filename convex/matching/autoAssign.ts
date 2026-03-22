"use node";

/**
 * Match-suggestion pipeline (cron every 4h + KYC trigger)
 *
 * We still run the same match generators as before so `matches` rows exist for the client UI.
 * We do **not** email freelancers when suggestions appear.
 *
 * The client receives:
 *  - An email when **new** pending matches appear (pre-fund: delta only; post-fund: new match rows).
 *  - **Periodic reminder** emails (48h apart) while the hire is in the awaiting-match queue and has
 *    at least one pending match.
 *
 * `clientNotifiedOfAvailableMatchesAt` is set on the first client email so the dashboard can show
 * "View matches" only after we’ve notified them.
 */

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import React from "react";
import { sendEmail } from "../email/send";
import { FreelancersAvailableClientEmail } from "../../emails/templates";

const internalAny = require("../_generated/api").internal as any;
const apiAny = require("../_generated/api").api as any;

/** Minimum time between client availability / reminder emails */
const CLIENT_MATCH_EMAIL_REMINDER_MS = 48 * 60 * 60 * 1000;

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

async function sendClientFreelancersAvailableEmail(
  ctx: any,
  project: { _id: string; clientId: string; intakeForm: { title: string } },
  projectId: string,
  pendingCount: number,
  isReminder: boolean
): Promise<boolean> {
  const client = await ctx.runQuery(internalAny.users.queries.getUserByIdInternal, {
    userId: project.clientId,
  });
  if (!client?.email) return false;

  const appUrl = getAppUrl();
  const logoUrl = getLogoUrl(appUrl);
  const date = formatDate();
  const matchesPageUrl = `${appUrl}/dashboard/projects/${projectId}/matches`;
  const subject = isReminder
    ? `Reminder: review matches for your hire on 49GIG`
    : pendingCount > 1
      ? `Freelancers available for your hire on 49GIG`
      : `A freelancer is available for your hire on 49GIG`;

  try {
    await sendEmail({
      to: client.email,
      subject,
      react: React.createElement(FreelancersAvailableClientEmail, {
        name: client.name ?? "there",
        hireTitle: project.intakeForm.title,
        matchesPageUrl,
        appUrl,
        logoUrl,
        date,
        isReminder,
        pendingCount,
      }),
    });
  } catch (e) {
    console.error("[autoAssign] client availability email failed", projectId, e);
    return false;
  }

  await ctx.runMutation(internalAny.projects.mutations.recordClientMatchAvailabilityEmailInternal, {
    projectId: project._id as any,
  });

  await ctx.runAction(internalAny.notifications.actions.sendSystemNotification, {
    userIds: [project.clientId],
    title: isReminder ? "Reminder: matches to review" : "Freelancers available for your hire",
    message: isReminder
      ? `You still have matches to review for "${project.intakeForm.title}". Open your hire to continue.`
      : `Vetted freelancers are available for "${project.intakeForm.title}". Review matches and select who you’d like.`,
    type: "match",
    data: { projectId },
  });

  return true;
}

/**
 * When new match rows appear (pre- or post-fund): email client only.
 */
async function notifyClientForNewMatchSuggestions(
  ctx: any,
  project: { _id: string; clientId: string; intakeForm: { title: string } },
  projectId: string,
  newSuggestionCount: number
) {
  if (newSuggestionCount <= 0) return;
  await sendClientFreelancersAvailableEmail(ctx, project, projectId, newSuggestionCount, false);
}

/**
 * Periodic reminders for projects still waiting, with pending suggestions.
 */
async function sendPeriodicClientMatchReminders(ctx: any) {
  const projects = await ctx.runQuery(internalAny.matching.queries.getProjectsAwaitingMatch, {});
  if (!projects?.length) return;

  const now = Date.now();

  for (const project of projects) {
    const rows = await ctx.runQuery(internalAny.matching.queries.listProjectMatchesInternal, {
      projectId: project._id,
    });
    const pendingCount = (rows || []).filter((m: { status: string }) => m.status === "pending").length;
    if (pendingCount === 0) continue;

    const last = project.lastClientMatchAvailabilityEmailAt;
    if (last != null && now - last < CLIENT_MATCH_EMAIL_REMINDER_MS) continue;

    const isReminder = last != null;
    await sendClientFreelancersAvailableEmail(ctx, project, project._id, pendingCount, isReminder);
  }
}

/**
 * Attempt to generate matches for a single awaiting project.
 * Emails the client when new suggestions appear (not freelancers).
 * Returns the number of new matches notified (0 = none).
 */
async function tryMatchProject(ctx: any, projectId: string): Promise<number> {
  try {
    const project = await ctx.runQuery(internalAny.projects.queries.getProjectInternal, { projectId });
    if (!project) return 0;

    const isPreFund = project.status === "draft" || project.status === "pending_funding";
    const isPostFund = project.status === "funded" || project.status === "matching";
    if (!isPreFund && !isPostFund) return 0;

    if (isPreFund) {
      const beforeRows = await ctx.runQuery(internalAny.matching.queries.listProjectMatchesInternal, {
        projectId,
      });
      const beforeFreelancers = new Set(
        beforeRows
          .filter((m: { status: string }) => m.status === "pending")
          .map((m: { freelancerId: string }) => m.freelancerId)
      );

      await ctx.runAction(apiAny.matching.actions.generateMatchesForDraft, { projectId });

      const afterRows = await ctx.runQuery(internalAny.matching.queries.listProjectMatchesInternal, {
        projectId,
      });
      const newMatches = afterRows.filter(
        (m: { status: string; freelancerId: string }) =>
          m.status === "pending" && !beforeFreelancers.has(m.freelancerId)
      );

      if (newMatches.length === 0) return 0;

      await notifyClientForNewMatchSuggestions(ctx, project, projectId, newMatches.length);
      return newMatches.length;
    }

    let matchIds: string[] = [];
    if (project.intakeForm?.hireType === "team") {
      const res = await ctx.runAction(apiAny.matching.actions.generateTeamMatches, { projectId });
      matchIds = res?.matchIds ?? [];
    } else {
      matchIds = await ctx.runAction(apiAny.matching.actions.generateMatches, {
        projectId,
        limit: 5,
      });
    }

    if (matchIds.length === 0) return 0;

    await notifyClientForNewMatchSuggestions(ctx, project, projectId, matchIds.length);
    return matchIds.length;
  } catch (err) {
    console.error("[autoAssign] tryMatchProject error for", projectId, err);
    return 0;
  }
}

/**
 * Called immediately after a freelancer's KYC is approved.
 */
export const checkAndAutoAssignForFreelancer = internalAction({
  args: {
    freelancerId: v.id("users"),
  },
  handler: async (ctx, _args) => {
    const awaitingProjects = await ctx.runQuery(internalAny.matching.queries.getProjectsAwaitingMatch, {});

    if (!awaitingProjects || awaitingProjects.length === 0) return;

    for (const project of awaitingProjects) {
      await tryMatchProject(ctx, project._id);
    }

    await sendPeriodicClientMatchReminders(ctx);
  },
});

/**
 * Periodic retry: regenerate suggestions + reminder emails.
 */
export const retryAwaitingMatchProjects = internalAction({
  args: {},
  handler: async (ctx) => {
    const awaitingProjects = await ctx.runQuery(internalAny.matching.queries.getProjectsAwaitingMatch, {});

    if (!awaitingProjects || awaitingProjects.length === 0) return;

    console.log(`[autoAssign] Retrying ${awaitingProjects.length} awaiting project(s)…`);

    for (const project of awaitingProjects) {
      await tryMatchProject(ctx, project._id);
    }

    await sendPeriodicClientMatchReminders(ctx);
  },
});
