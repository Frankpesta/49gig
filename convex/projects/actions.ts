"use node";

import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import React from "react";
import { sendEmail } from "../email/send";
import {
  ProjectCreatedEmail,
  MatchFoundClientEmail,
  OpportunityMatchFreelancerEmail,
  UnfundedProjectReminderEmail,
  MonthlyCyclePendingReminderEmail,
} from "../../emails/templates";

const internalAny: any = require("../_generated/api").internal;

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

/**
 * Send project created email to client and admins
 */
export const sendProjectCreatedEmail = internalAction({
  args: {
    projectId: v.id("projects"),
    clientEmail: v.string(),
    clientName: v.optional(v.string()),
    projectName: v.string(),
  },
  handler: async (ctx, args) => {
    const appUrl = getAppUrl();
    const logoUrl = getLogoUrl(appUrl);
    const date = formatDate();

    await sendEmail({
      to: args.clientEmail,
      subject: `Project created: ${args.projectName}`,
      react: React.createElement(ProjectCreatedEmail, {
        name: args.clientName || "there",
        projectName: args.projectName,
        appUrl,
        logoUrl,
        date,
      }),
    });

    return { success: true };
  },
});

/**
 * Send project created notification to admins
 */
export const sendProjectCreatedAdminEmail = internalAction({
  args: {
    projectName: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const admins = await ctx.runQuery(
      internalAny.users.queries.getModeratorsAndAdminsInternal,
      {}
    );
    if (!admins || admins.length === 0) return { success: true };

    const appUrl = getAppUrl();
    const dashboardUrl = `${appUrl}/dashboard/projects/${args.projectId}`;

    await sendEmail({
      to: admins.map((a: { email: string }) => a.email),
      subject: `[49GIG] New project created: ${args.projectName}`,
      react: React.createElement(
        "div",
        { style: { fontFamily: "sans-serif", padding: "24px", maxWidth: "600px" } },
        React.createElement("h2", { style: { marginBottom: "16px" } }, "New Project Created"),
        React.createElement("p", null, `Project: ${args.projectName}`),
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
        }, "View in Dashboard")
      ),
    });

    return { success: true };
  },
});

/**
 * Send match success emails to client and freelancer(s)
 */
export const sendMatchSuccessEmails = internalAction({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.runQuery(
      internalAny.projects.queries.getProjectInternal,
      { projectId: args.projectId }
    );
    if (!project) return { success: false };

    const client = await ctx.runQuery(
      internalAny.users.queries.getUserByIdInternal,
      { userId: project.clientId }
    );
    if (!client?.email) return { success: false };

    const freelancerIds = project.matchedFreelancerId
      ? [project.matchedFreelancerId]
      : project.matchedFreelancerIds ?? [];
    const appUrl = getAppUrl();
    const logoUrl = getLogoUrl(appUrl);
    const date = formatDate();
    const projectName = project.intakeForm.title;

    // Email to client
    const freelancerNames: string[] = [];
    for (const fid of freelancerIds) {
      const f = await ctx.runQuery(
        internalAny.users.queries.getUserByIdInternal,
        { userId: fid }
      );
      if (f?.name) freelancerNames.push(f.name);
    }
    const freelancerNameStr = freelancerNames.length > 0
      ? freelancerNames.join(", ")
      : "your selected talent";

    await sendEmail({
      to: client.email,
      subject: `Match confirmed: ${projectName}`,
      react: React.createElement(MatchFoundClientEmail, {
        name: client.name || "there",
        freelancerName: freelancerNameStr,
        projectName,
        appUrl,
        logoUrl,
        date,
      }),
    });

    // Notify admins of match
    const admins = await ctx.runQuery(
      internalAny.users.queries.getModeratorsAndAdminsInternal,
      {}
    );
    if (admins && admins.length > 0) {
      await sendEmail({
        to: admins.map((a: { email: string }) => a.email),
        subject: `[49GIG] Match confirmed: ${projectName}`,
        react: React.createElement(
          "div",
          { style: { fontFamily: "sans-serif", padding: "24px", maxWidth: "600px" } },
          React.createElement("h2", { style: { marginBottom: "16px" } }, "Match Confirmed"),
          React.createElement("p", null, `Project: ${projectName}`),
          React.createElement("p", null, `Client: ${client.name || client.email}`),
          React.createElement("p", null, `Freelancers: ${freelancerNameStr}`),
          React.createElement("a", {
            href: `${appUrl}/dashboard/projects/${args.projectId}`,
            style: {
              display: "inline-block",
              marginTop: "24px",
              padding: "12px 24px",
              backgroundColor: "#2563eb",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
            },
          }, "View in Dashboard")
        ),
      });
    }

    // Email to each freelancer
    const clientName = client.name || "the client";
    for (const fid of freelancerIds) {
      const freelancer = await ctx.runQuery(
        internalAny.users.queries.getUserByIdInternal,
        { userId: fid }
      );
      if (freelancer?.email) {
        await sendEmail({
          to: freelancer.email,
          subject: `You've been matched: ${projectName}`,
          react: React.createElement(OpportunityMatchFreelancerEmail, {
            name: freelancer.name || "there",
            projectName,
            clientName,
            appUrl,
            logoUrl,
            date,
          }),
        });
      }
    }

    return { success: true };
  },
});

/**
 * Send unfunded project reminder to client
 */
export const sendUnfundedProjectReminderEmail = internalAction({
  args: {
    clientEmail: v.string(),
    clientName: v.optional(v.string()),
    projectName: v.string(),
    daysLeft: v.number(),
  },
  handler: async (ctx, args) => {
    const appUrl = getAppUrl();
    const logoUrl = getLogoUrl(appUrl);
    const date = formatDate();

    await sendEmail({
      to: args.clientEmail,
      subject: `Reminder: Complete funding for ${args.projectName}`,
      react: React.createElement(UnfundedProjectReminderEmail, {
        name: args.clientName || "there",
        projectName: args.projectName,
        daysLeft: args.daysLeft,
        appUrl,
        logoUrl,
        date,
      }),
    });

    return { success: true };
  },
});

/**
 * Send monthly cycle pending reminder to client
 */
export const sendMonthlyCyclePendingReminderEmail = internalAction({
  args: {
    clientEmail: v.string(),
    clientName: v.optional(v.string()),
    projectName: v.string(),
    monthLabel: v.string(),
  },
  handler: async (ctx, args) => {
    const appUrl = getAppUrl();
    const logoUrl = getLogoUrl(appUrl);
    const date = formatDate();

    await sendEmail({
      to: args.clientEmail,
      subject: `Action required: Approve ${args.monthLabel} payment for ${args.projectName}`,
      react: React.createElement(MonthlyCyclePendingReminderEmail, {
        name: args.clientName || "there",
        projectName: args.projectName,
        monthLabel: args.monthLabel,
        appUrl,
        logoUrl,
        date,
      }),
    });

    return { success: true };
  },
});
