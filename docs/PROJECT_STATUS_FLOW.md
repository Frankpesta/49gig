# Project Status Flow

This document describes the order of project statuses and when each transition occurs.

## Status Diagram

```
draft → pending_funding → funded → matching → matched → in_progress → completed
   │           │             │         │          │            │
   └───────────┴─────────────┴─────────┴──────────┴────────────┴→ cancelled
                                                                  disputed (from in_progress)
```

## Status Definitions

| Status | Description | Who can act |
|--------|-------------|-------------|
| **draft** | Project created, not yet submitted for funding | Client edits |
| **pending_funding** | Client initiated payment, awaiting Flutterwave | Client completes payment |
| **funded** | Payment received, escrow funded | System: matching or accept selection |
| **matching** | System finding freelancers (post-funding flow) | System generates matches |
| **matched** | Freelancer(s) assigned, contract ready to sign | Client + Freelancer sign contract |
| **in_progress** | Both parties signed, work started | Freelancer delivers, client approves |
| **completed** | Project delivered and closed | Terminal |
| **cancelled** | Project cancelled | Client or admin |
| **disputed** | Dispute opened | Moderator resolves |

## Key Transitions

### 1. draft → pending_funding
- **Trigger:** Client clicks "Fund Project" and initiates payment
- **Mutation:** `updateProjectStatus` (client only)

### 2. pending_funding → funded
- **Trigger:** Flutterwave webhook receives `charge.completed` (payment success)
- **Mutation:** `handlePaymentSuccess` (payments)
- **Then:** Schedules `acceptSelectedMatchInternal` (for pre-funding) or `generateMatches` runs (for post-funding)

### 3. funded → matched (pre-funding with client selection)
- **Trigger:** `acceptSelectedMatchInternal` runs after payment success
- **Condition:** Project has `selectedFreelancerId` or `selectedFreelancerIds`
- **Action:** Sets `matchedFreelancerId`/`matchedFreelancerIds`, status → `matched`
- **Then:** Contract generated, freelancer can sign

### 4. funded → matching (post-funding, no pre-selection)
- **Trigger:** Client has not pre-selected; `generateMatches` creates matches
- **Action:** Client picks from matches via `acceptMatch` mutation
- **Then:** funded → matched (when client accepts a match)

### 5. matched → in_progress
- **Trigger:** Both client and freelancer(s) have signed the contract
- **Mutation:** `signContract` (contracts) – when last party signs
- **Condition:** `project.status === "matched"` and all signatures present

### 6. in_progress → completed
- **Trigger:** Client marks project complete
- **Mutation:** `updateProjectStatus` (client only)

## Contract Signing Flow

**Freelancer can sign only when:**
- `project.status === "matched"` OR `project.status === "in_progress"`
- AND `project.matchedFreelancerId === user._id` (or in `matchedFreelancerIds`)
- AND freelancer has not yet signed

**Critical:** If payment succeeds but the project stays at `funded` (e.g. `acceptSelectedMatchInternal` didn’t set `matched`), the freelancer cannot sign. The fix ensures we always transition to `matched` when the client has pre-selected freelancer(s).

## Valid Transitions (enforced in `updateProjectStatus`)

```
draft           → pending_funding, cancelled
pending_funding → funded, cancelled
funded          → matching, cancelled
matching        → matched, cancelled
matched         → in_progress, cancelled
in_progress     → completed, disputed, cancelled
completed       → (terminal)
cancelled       → (terminal)
disputed        → in_progress, cancelled
```
