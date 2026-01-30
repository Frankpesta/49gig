# Milestone Payments: How It Works

## How we know when a freelancer has reached a milestone

A milestone is **reached** when the freelancer **submits** it and the client **approves** it. The system does not auto-detect completion; it relies on explicit actions.

### 1. Milestone lifecycle (status flow)

- **pending** → Freelancer has not started.
- **in_progress** → Freelancer called `startMilestone` (work in progress).
- **submitted** → Freelancer called `submitMilestone` with deliverables (files/links). **This is “reached” from the freelancer’s side.**
- **approved** → Client called `approveMilestone`. **This is when we consider the milestone “done” for payment.**
- **rejected** → Client called `rejectMilestone` (with reason); freelancer can re-submit after fixing.
- **paid** → Money has been released to the freelancer (manually or by auto-release).

### 2. How we “check” if a milestone is reached

- **Reached for approval:** `milestone.status === "submitted"` → client can approve or reject.
- **Reached for payment:** `milestone.status === "approved"` → payment can be released (manually or after 48h).
- **Fully done:** `milestone.status === "paid"` → payment already sent.

So: we “check” by reading `milestone.status`; there is no separate automated check (e.g. no automatic “mark as complete” from code or tests). Completion is **client-approved submission**.

### 3. When does the freelancer get paid?

- **Option A – Manual:** Client calls `releaseMilestonePayment` (dashboard action) for an **approved** milestone → Flutterwave transfer is created, milestone status set to **paid**.
- **Option B – Auto-release:** After the client approves, we set `autoReleaseAt = now + 48 hours`. A **cron job** (`convex/cron/milestones.ts`) runs periodically, finds milestones where `status === "approved"` and `autoReleaseAt <= now`, and calls `releaseMilestonePayment` for each. So payment happens automatically 48 hours after approval unless the client releases earlier.

### 4. Summary

| Question | Answer |
|----------|--------|
| How do we know when a freelancer has reached a milestone? | When they **submit** it (`submitMilestone`) and the client **approves** it (`approveMilestone`). |
| How do we check? | By `milestone.status`: `submitted` = ready for client review; `approved` = ready for payment; `paid` = already paid. |
| When does payment happen? | When the client manually releases, or automatically 48h after approval via the cron. |

---

## Milestones vs deliverables (what a milestone “should be”)

Previously, milestones were often derived from **required skills** (e.g. “React”, “Node.js”), which are talent filters, not project phases. Real milestones should be **deliverables or phases** of the project (e.g. “Design mockups”, “Backend API”, “Frontend integration”, “Testing & handoff”).

The app now supports:

1. **Client-defined deliverables** – In “Create project”, the client can add **Deliverables / Milestones** (phases or outcomes). These are stored in `intakeForm.deliverables` and used when auto-creating milestones after funding.
2. **Description-based fallback** – If the client does not add deliverables, the backend can suggest milestone titles from the project **title + description** (e.g. keywords like “design”, “API”, “frontend”, “testing”, “deploy”) so milestones reflect the project, not just skills.
3. **Skills stay separate** – **Required skills** are only used for matching freelancers; they are no longer used as milestone titles.

So: “how we know when a freelancer has reached a milestone” is still **submit + approve**; “what a milestone should be” is now **deliverables/phases from the client or inferred from the project description**, not the tech skills list.
