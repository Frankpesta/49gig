"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import React from "react";
import { sendEmail } from "../email/send";
import { OneOnOneSessionScheduledEmail } from "../../emails/templates";

const crypto = require("crypto");

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

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Shape of Google Cloud service account JSON key file (e.g. gig-483014-*.json). */
interface GoogleServiceAccountKey {
  type: string;
  project_id?: string;
  private_key_id?: string;
  private_key: string;
  client_email: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
  universe_domain?: string;
}

/**
 * Create a JWT for Google OAuth2 service account and exchange for access token.
 * Env: GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON = full contents of the service account JSON key file.
 */
async function getGoogleCalendarAccessToken(): Promise<string> {
  const jsonRaw = process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON;
  if (!jsonRaw) {
    throw new Error(
      "Google Calendar API not configured: set GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON in Convex env (paste the full JSON key file content)"
    );
  }

  let key: GoogleServiceAccountKey;
  try {
    key = JSON.parse(jsonRaw) as GoogleServiceAccountKey;
  } catch {
    throw new Error(
      "GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON is invalid JSON. Paste the full contents of your service account JSON key file (e.g. gig-483014-*.json)."
    );
  }

  if (key.type !== "service_account") {
    throw new Error(
      "GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON must be a service account key (type: 'service_account')"
    );
  }

  const email = key.client_email;
  const privateKeyPem = (key.private_key || "").replace(/\\n/g, "\n");
  if (!email || !privateKeyPem) {
    throw new Error(
      "GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON must contain client_email and private_key"
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: email,
    scope: "https://www.googleapis.com/auth/calendar.events",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const headerB64 = base64UrlEncode(Buffer.from(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(Buffer.from(JSON.stringify(payload)));
  const signatureInput = `${headerB64}.${payloadB64}`;

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signatureInput);
  const signature = sign.sign(privateKeyPem, "base64");
  const signatureB64 = base64UrlEncode(Buffer.from(signature, "base64"));
  const jwt = `${signatureInput}.${signatureB64}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${tokenRes.status} ${errText}`);
  }

  const tokenData = (await tokenRes.json()) as { access_token: string };
  return tokenData.access_token;
}

/**
 * Create a Google Calendar event with Google Meet link.
 * Env: GOOGLE_CALENDAR_ID (optional; default primary for the service account).
 */
async function createGoogleCalendarEventWithMeet(
  accessToken: string,
  title: string,
  startTime: number,
  endTime: number,
  attendeeEmails: string[]
): Promise<{ meetLink: string; eventId: string }> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
  const calendarIdEnc = calendarId.includes("@") ? encodeURIComponent(calendarId) : calendarId;

  const start = new Date(startTime);
  const end = new Date(endTime);
  const timeZone = "UTC";
  const startRfc = start.toISOString().replace(/\.\d{3}Z$/, "Z");
  const endRfc = end.toISOString().replace(/\.\d{3}Z$/, "Z");

  const eventBody = {
    summary: title,
    description: `49GIG ${title}`,
    start: { dateTime: startRfc, timeZone },
    end: { dateTime: endRfc, timeZone },
    attendees: attendeeEmails.map((e) => ({ email: e })),
    conferenceData: {
      createRequest: {
        requestId: `49gig-${startTime}-${Math.random().toString(36).slice(2)}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarIdEnc}/events?conferenceDataVersion=1`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Calendar API failed: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as {
    id: string;
    conferenceData?: { entryPoints?: Array<{ uri?: string }> };
  };
  const meetLink =
    data.conferenceData?.entryPoints?.find((p) => p.uri?.startsWith("https://"))?.uri ||
    data.conferenceData?.entryPoints?.[0]?.uri ||
    "";
  if (!meetLink) {
    throw new Error("Google Meet link was not returned by Calendar API");
  }
  return { meetLink, eventId: data.id };
}

/**
 * Schedule a one-on-one or team kickoff session: check conflicts, create Google Meet, store and send emails.
 */
export const scheduleOneOnOneSession = action({
  args: {
    projectId: v.id("projects"),
    freelancerIds: v.array(v.id("users")),
    startTime: v.number(),
    endTime: v.number(),
    title: v.string(),
    userId: v.id("users"), // Required: client making the request (enforces auth)
  },
  handler: async (ctx, args) => {
    const project = await ctx.runQuery(
      internal.projects.queries.getProjectInternal,
      { projectId: args.projectId }
    );
    if (!project) throw new Error("Project not found");
    if (project.clientId !== args.userId) {
      throw new Error("Only the project client can schedule this session");
    }

    const overlapping = await ctx.runQuery(
      internal.scheduledCalls.queries.getOverlappingCallsInternal,
      { startTime: args.startTime, endTime: args.endTime }
    );
    if (overlapping.length > 0) {
      throw new Error(
        "A session is already scheduled at this time. Please choose a different date or time."
      );
    }

    const client = await ctx.runQuery(internal.users.queries.getUserByIdInternal, {
      userId: project.clientId,
    });
    const freelancers = await Promise.all(
      args.freelancerIds.map((id) =>
        ctx.runQuery(internal.users.queries.getUserByIdInternal, { userId: id })
      )
    );
    const attendeeEmails: string[] = [client?.email ?? ""];
    freelancers.forEach((f: { email?: string } | null) => {
      if (f?.email) attendeeEmails.push(f.email);
    });
    attendeeEmails.filter(Boolean);

    const accessToken = await getGoogleCalendarAccessToken();
    const { meetLink, eventId } = await createGoogleCalendarEventWithMeet(
      accessToken,
      args.title,
      args.startTime,
      args.endTime,
      attendeeEmails
    );

    await ctx.runMutation(
      internal.scheduledCalls.mutations.createScheduledCallInternal,
      {
        projectId: args.projectId,
        freelancerIds: args.freelancerIds,
        startTime: args.startTime,
        endTime: args.endTime,
        meetLink,
        googleEventId: eventId,
        title: args.title,
      }
    );

    const appUrl = getAppUrl();
    const logoUrl = getLogoUrl(appUrl);
    const date = formatDate();
    const startFormatted = new Date(args.startTime).toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    });
    const endFormatted = new Date(args.endTime).toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    });
    const projectName = project.intakeForm.title;
    const isTeamKickoff = args.freelancerIds.length > 1;
    const participantNames = [client?.name, ...freelancers.map((f: { name?: string } | null) => f?.name)]
      .filter(Boolean)
      .join(", ");

    const emailProps = {
      projectName,
      startTimeFormatted: startFormatted,
      endTimeFormatted: endFormatted,
      meetLink,
      isTeamKickoff,
      participantNames,
      appUrl,
      logoUrl,
      date,
    };

    if (client?.email) {
      await sendEmail({
        to: client.email,
        subject: isTeamKickoff ? "Kickoff session scheduled" : "One-on-one session scheduled",
        react: React.createElement(OneOnOneSessionScheduledEmail, {
          name: client.name ?? "there",
          ...emailProps,
        }),
      });
    }

    for (const f of freelancers) {
      if (f?.email) {
        await sendEmail({
          to: f.email,
          subject: isTeamKickoff ? "Kickoff session scheduled" : "One-on-one session scheduled",
          react: React.createElement(OneOnOneSessionScheduledEmail, {
            name: f.name ?? "there",
            ...emailProps,
          }),
        });
      }
    }

    const moderators = await ctx.runQuery(
      internal.users.queries.getModeratorsAndAdminsInternal,
      {}
    );
    for (const mod of moderators) {
      if (mod?.email) {
        await sendEmail({
          to: mod.email,
          subject: `[49GIG] ${isTeamKickoff ? "Kickoff" : "One-on-one"} session scheduled: ${projectName}`,
          react: React.createElement(OneOnOneSessionScheduledEmail, {
            name: mod.name ?? "Moderator",
            ...emailProps,
          }),
        });
      }
    }

    return { meetLink, eventId };
  },
});
