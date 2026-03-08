# Emails Sent from 49GIG

Transactional emails sent via Resend (`convex/email/send.ts`).

## Auth & Account

| Email | Trigger | Recipient | Template |
|-------|---------|-----------|----------|
| **Verification code** | Sign up / login (unverified) | User | `VerificationCodeEmail` |
| **Password reset** | Forgot password | User | `PasswordResetEmail` |
| **Welcome** | Sign up (any method) | User | `WelcomeEmail` |
| **Two-factor code** | 2FA sign-in | User | `TwoFactorCodeEmail` |

## Projects & Matching

| Email | Trigger | Recipient | Template |
|-------|---------|-----------|----------|
| **Project created** | Client creates project | Client | `ProjectCreatedEmail` |
| **Project created (admin)** | Client creates project | Admins | Raw HTML |
| **Match confirmed** | Client accepts match | Client | `MatchFoundClientEmail` |
| **Match confirmed** | Client accepts match | Freelancer(s) | `OpportunityMatchFreelancerEmail` |
| **Match confirmed (admin)** | Client accepts match | Admins | Raw HTML |
| **Unfunded reminder** | 7 or 3 days before deletion | Client | `UnfundedProjectReminderEmail` |
| **Monthly cycle pending** | Cron (daily) | Client | `MonthlyCyclePendingReminderEmail` |

## Contact & Support

| Email | Trigger | Recipient | Template |
|-------|---------|-----------|----------|
| **New contact enquiry** | Contact form submit | Admins | Raw HTML |
| **Contact enquiry reply** | Admin replies to enquiry | Enquirer | Raw HTML |

## Contracts

| Email | Trigger | Recipient | Template |
|-------|---------|-----------|----------|
| **Contract ready** | Contract generated | Client + Freelancer(s) | `ContractReadyEmail` |
| **Contract signed** | After any party signs | All parties | `ContractReadyEmail` |

## Scheduled Calls

| Email | Trigger | Recipient | Template |
|-------|---------|-----------|----------|
| **Session scheduled** | One-on-one or kickoff booked | Client, Freelancer(s), Moderators | `OneOnOneSessionScheduledEmail` |

## Crons (defined in `convex/crons.ts`)

| Cron | Schedule | Description |
|------|----------|-------------|
| cleanup unfunded projects | Every 6 hours | Delete unfunded projects (14 days) |
| unfunded project reminders | Daily 10:00 UTC | 7-day and 3-day reminders |
| monthly cycle pending reminders | Daily 14:00 UTC | Pending approval reminders |
| auto-release milestones | Every hour | Release approved milestones past autoReleaseAt |
| cleanup expired sessions | Every hour | Remove expired sessions |

**Note:** In-app notifications use `sendSystemNotification` (not email). Email is only sent via `sendEmail` in the actions above.
