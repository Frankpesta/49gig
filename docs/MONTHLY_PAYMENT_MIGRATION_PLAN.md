# Monthly Payment Migration Plan

## Current State (Milestone-Based)

### Flow
1. **Client creates project** → Total budget, deliverables, start/end dates
2. **Client pays full amount upfront** (pre_funding) → Funds go to escrow
3. **Milestones auto-created** from deliverables or phases (2–5 milestones)
4. **Freelancer submits** each milestone → Client approves
5. **48h auto-release** → Funds released to freelancer via Flutterwave transfer

### Key Tables
- **projects**: `totalAmount`, `escrowedAmount`, `status`
- **milestones**: `title`, `amount`, `dueDate`, `status` (pending → in_progress → submitted → approved → paid)
- **payments**: `type` (pre_funding, milestone_release, refund, platform_fee, payout)

### Payment Types
- `pre_funding`: Client pays full project amount upfront
- `milestone_release`: Each approved milestone triggers payout to freelancer

---

## Target State (Monthly-Based)

### Proposed Monthly Model
- **Fixed monthly retainer**: Client pays $X/month. At end of each month, client approves "month's work" and funds release to freelancer.
- **Monthly cycles**: Project has N months (e.g. 3, 6, 12). Each month = one billing cycle.

### Flow Options

**Option A: Pay at start of month (preferred)**
1. Client pays month 1 at project start → escrowed
2. At end of month 1: freelancer submits summary → client approves → 48h auto-release
3. Client pays month 2 (or auto-charge) → escrowed
4. Repeat for each month

**Option B: Pay at end of month (in arrears)**
1. Month 1: freelancer works → client approves at end of month
2. Client pays for month 1 → immediate release to freelancer
3. Less escrow, but client pays after work

---

## Schema Changes

### 1. New: `billingModel` on projects
```ts
billingModel: v.union(
  v.literal("milestone"),   // existing
  v.literal("monthly")     // new
)
```

### 2. New: `monthlyBillingCycles` table (or extend milestones)
```ts
monthlyBillingCycles: defineTable({
  projectId: v.id("projects"),
  monthIndex: v.number(),        // 1, 2, 3...
  monthStartDate: v.number(),    // Unix timestamp
  monthEndDate: v.number(),
  amount: v.number(),
  currency: v.string(),
  status: v.union(
    v.literal("pending"),        // Not yet paid by client
    v.literal("paid"),           // Client paid, in escrow
    v.literal("submitted"),      // Freelancer submitted work summary
    v.literal("approved"),      // Client approved
    v.literal("released"),      // Paid to freelancer
    v.literal("disputed")
  ),
  workSummary: v.optional(v.string()),
  submittedAt: v.optional(v.number()),
  approvedBy: v.optional(v.id("users")),
  approvedAt: v.optional(v.number()),
  autoReleaseAt: v.optional(v.number()),
  paidAt: v.optional(v.number()),
  flutterwaveTransactionId: v.optional(v.string()),
  flutterwaveTransferId: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_project", ["projectId"])
  .index("by_status", ["status"])
  .index("by_auto_release", ["autoReleaseAt"])
```

### 3. Extend `payments` table
- Add `monthlyCycleId` (optional) for `monthly_release` type
- Keep `milestoneId` for backward compatibility

### 4. New payment type
- `monthly_release` (or reuse `milestone_release` with a different source)

---

## Backend Changes

### Convex

1. **Project creation**
   - When `billingModel === "monthly"`: create `monthlyBillingCycles` instead of milestones
   - Compute monthly amount: `totalAmount / numberOfMonths`
   - Compute month boundaries from `startDate` and `endDate`

2. **Pre-funding**
   - **Option A**: Client pays first month only at start → `escrowedAmount = monthlyAmount`
   - **Option B**: Client pays full amount upfront (same as now) → escrowed, released monthly

3. **New mutations**
   - `submitMonthlyWork` (freelancer): Submit work summary for month N
   - `approveMonthlyCycle` (client): Approve month N → set `autoReleaseAt` (48h)
   - `payMonthlyCycle` (client): For Option A, client pays for next month at start of cycle

4. **Cron**
   - New: `autoReleaseMonthlyCycles` (similar to `autoReleaseMilestones`)
   - Runs hourly, checks `monthlyBillingCycles` where `status === "approved"` and `autoReleaseAt <= now`

5. **Payment actions**
   - `releaseMonthlyPayment`: Similar to `releaseMilestonePayment`, transfers to freelancer

---

## UI Changes

### Create Project
- Add **billing model** selector: "Milestone-based" vs "Monthly"
- If monthly: show monthly amount, number of months, first payment due

### Project Detail
- **Milestone view** → Replace with **Monthly cycles** when `billingModel === "monthly"`
- Each row: Month 1, Month 2... with status, amount, actions (Submit / Approve)

### Payment
- **First payment**: If monthly Option A, charge first month only
- **Recurring**: Client pays each month (manual or auto-charge)

### Transactions
- Support `monthly_release` type in transaction list/detail

---

## Migration Strategy

### Phase 1: Add monthly support (no breaking changes)
1. Add `billingModel` to projects (default `"milestone"`)
2. Add `monthlyBillingCycles` table
3. Create monthly-specific mutations and cron
4. Keep all existing milestone logic unchanged

### Phase 2: UI for new projects
1. Create project: add billing model choice
2. Project detail: show monthly cycles when applicable
3. Payment flow: first month only for monthly

### Phase 3: Existing projects
- All existing projects remain milestone-based
- No migration of existing milestones

### Phase 4: Deprecate milestones (optional, later)
- Add feature flag for "monthly only" mode
- Eventually: new projects default to monthly

---

## Open Questions

1. **Payment timing**: Pay at start of month (escrow) vs end of month (in arrears)?
2. **Client payment**: Manual each month, or auto-charge (saved card)?
3. **Work verification**: Freelancer submits "work summary" or timesheet? Or auto-approve at end of month?
4. **Ongoing projects**: Current `projectType === "ongoing"` skips milestones. Should monthly apply to ongoing?
5. **Team projects**: Monthly per freelancer or per project?

---

## Files to Modify

1. **Schema**: `convex/schema.ts`
2. **Project creation**: `convex/projects/mutations.ts` (createProject, autoCreateMilestonesInternal)
3. **Payment flow**: `convex/payments/actions.ts`, `convex/payments/mutations.ts`
4. **New**: `convex/monthlyCycles/mutations.ts`, `convex/monthlyCycles/queries.ts`
5. **Cron**: `convex/cron/monthly.ts` (new)
6. **UI**: Create project form, project detail, payment pages
7. **Budget calculator**: `lib/payment-calculator.ts` (monthly split)
