import { cronJobs } from "convex/server";

// Use require to avoid "excessively deep" TypeScript instantiation with Convex API
const { internal } = require("./_generated/api");

const crons = cronJobs();

// Clean up unfunded projects (draft or pending_funding) older than 14 days
crons.interval(
  "cleanup unfunded projects",
  { hours: 6 },
  internal["cron/projects"].cleanupUnfundedProjectsAfter48h
);

// Send unfunded project reminders (7-day and 3-day before deletion)
crons.daily(
  "unfunded project reminders",
  { hourUTC: 10, minuteUTC: 0 },
  internal["cron/projects"].sendUnfundedProjectReminders
);

// Send monthly cycle pending approval reminders to clients
crons.daily(
  "monthly cycle pending reminders",
  { hourUTC: 14, minuteUTC: 0 },
  internal["cron/monthlyCycles"].sendMonthlyCyclePendingReminders
);

// Auto-release monthly cycles (48h after month end if client hasn't approved)
crons.interval(
  "auto-release monthly cycles",
  { hours: 1 },
  internal["cron/monthlyCycles"].autoReleaseMonthlyCycles
);

// Clean up expired sessions
crons.interval(
  "cleanup expired sessions",
  { hours: 1 },
  internal["cron/sessions"].cleanupExpiredSessions
);

// Delete KYC documents from storage 12 months after approval
crons.daily(
  "delete old KYC documents",
  { hourUTC: 3, minuteUTC: 0 },
  internal["cron/kyc"].deleteKycDocumentsOlderThan12Months
);

// Payment follow-up: remind clients to fund next month, terminate after grace
crons.daily(
  "payment follow-up reminders and terminate",
  { hourUTC: 9, minuteUTC: 0 },
  internal["cron/paymentFollowUp"].sendPaymentFollowUpRemindersAndTerminate
);

export default crons;
