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
| **Project created (admin)** | Client creates project | Admins | `AdminNewProjectEmail` |
| **Match confirmed** | Client accepts match | Client | `MatchFoundClientEmail` |
| **Match confirmed** | Client accepts match | Freelancer(s) | `OpportunityMatchFreelancerEmail` |
| **Match confirmed (admin)** | Client accepts match | Admins | `AdminMatchConfirmedEmail` |
| **Hire cancelled by admin** | Admin cancels an active hire | Client + Freelancer(s) | `ProjectAdminCancelledEmail` |
| **Unfunded reminder** | 7 or 3 days before deletion | Client | `UnfundedProjectReminderEmail` |
| **Monthly cycle pending** | Cron (daily) | Client | `MonthlyCyclePendingReminderEmail` |

## Contact & Support

| Email | Trigger | Recipient | Template |
|-------|---------|-----------|----------|
| **New contact enquiry** | Contact form submit | Admins | `SystemNoticeEmail` |
| **Contact enquiry reply** | Admin replies to enquiry | Enquirer | `SystemNoticeEmail` |
| **Contact enquiry assigned** | Admin assigns enquiry | Moderator | `SystemNoticeEmail` |
| **Support chat assigned** | Admin assigns support chat | Moderator | `SystemNoticeEmail` |

## Contracts

| Email | Trigger | Recipient | Template |
|-------|---------|-----------|----------|
| **Contract ready** | Contract generated | Client + Freelancer(s) | `ContractReadyEmail` |
| **Contract signed** | After any party signs | All parties | `ContractReadyEmail` |

## Scheduled Calls

| Email | Trigger | Recipient | Template |
|-------|---------|-----------|----------|
| **Session scheduled** | One-on-one or kickoff booked | Client, Freelancer(s), Moderators | `OneOnOneSessionScheduledEmail` |

## Disputes

| Email | Trigger | Recipient | Template |
|-------|---------|-----------|----------|
| **Dispute opened** | Client/freelancer opens a dispute | Other dispute parties | `DisputeUpdateEmail` |
| **Dispute assigned** | Staff assigns a moderator/admin | Assignee | `DisputeUpdateEmail` |
| **Dispute resolved** | Staff or automation resolves a dispute | Client + affected Freelancer(s) | `DisputeUpdateEmail` |
| **Dispute escalated** | Moderator escalates for admin review | Dispute parties + Admins | `DisputeUpdateEmail` |
| **Dispute closed** | Staff closes a resolved dispute | Dispute parties | `DisputeUpdateEmail` |
| **Dispute cancelled** | Initiator cancels an open/under-review dispute | Other dispute parties | `DisputeUpdateEmail` |

## Verification & KYC

| Email | Trigger | Recipient | Template |
|-------|---------|-----------|----------|
| **Freelancer verification unsuccessful** | Staff terminates verification | Freelancer | `VerificationTerminatedEmail` |
| **Verification incomplete reminder** | Verification reminder job | Freelancer | `VerificationIncompleteReminderEmail` |
| **KYC action required** | KYC document rejected | Freelancer | `SystemNoticeEmail` |
| **KYC approved** | KYC approved | Freelancer | `SystemNoticeEmail` |
| **Account removed after KYC failures** | Repeated KYC failure removal | Freelancer | `SystemNoticeEmail` |

## Crons (defined in `convex/crons.ts`)

| Cron | Schedule | Description |
|------|----------|-------------|
| cleanup unfunded projects | Every 6 hours | Delete unfunded projects (14 days) |
| unfunded project reminders | Daily 10:00 UTC | 7-day and 3-day reminders |
| monthly cycle pending reminders | Daily 14:00 UTC | Pending approval reminders |
| auto-release milestones | Every hour | Release approved milestones past autoReleaseAt |
| cleanup expired sessions | Every hour | Remove expired sessions |

**Note:** In-app notifications use `sendSystemNotification` (not email). Transactional email is sent via `sendEmail`, and all email bodies should render through the shared React email layout.
