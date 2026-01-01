# 🧠🚀 49GIG — SYSTEM ARCHITECTURE & PLANNING DOCUMENT

**Status:** Phase 1 — System Understanding & Assumptions  
**Date:** 2025-01-27  
**Version:** 0.1.0

---

## 📋 TABLE OF CONTENTS

1. [Phase 1: System Understanding & Assumptions](#phase-1-system-understanding--assumptions)
2. [Phase 2: High-Level Architecture](#phase-2-high-level-architecture)
3. [Phase 3: Agent Decomposition](#phase-3-agent-decomposition)
4. [Phase 4: Security & Authentication Design](#phase-4-security--authentication-design)
5. [Phase 5: Data Modeling](#phase-5-data-modeling)
6. [Phase 6: In-App Chat Architecture](#phase-6-in-app-chat-architecture)
7. [Phase 7: Vetting & Verification](#phase-7-vetting--verification)
8. [Phase 8: Matching Engine](#phase-8-matching-engine)
9. [Phase 9: Payments & Stripe Webhooks](#phase-9-payments--stripe-webhooks)
10. [Phase 10: Disputes & Moderation](#phase-10-disputes--moderation)
11. [Phase 11: Frontend Architecture](#phase-11-frontend-architecture)
12. [Phase 12: Convex Backend Architecture](#phase-12-convex-backend-architecture)
13. [Phase 13: Public Landing & Marketing Pages](#phase-13-public-landing--marketing-pages)
14. [Phase 14: 30-Day Development Roadmap](#phase-14-30-day-development-roadmap)

---

## PHASE 1: SYSTEM UNDERSTANDING & ASSUMPTIONS

### 🎯 Core Business Model

**49GIG** is a **high-trust, curated freelance marketplace** that operates fundamentally differently from traditional platforms:

1. **No Public Job Postings**: Clients submit structured project intake forms instead of posting jobs publicly
2. **Pre-Funding Required**: Clients must pre-fund projects via Stripe before matching begins
3. **Automatic Matching**: System algorithmically matches vetted freelancers to projects (no bidding)
4. **Vetted Talent Pool**: All freelancers undergo comprehensive verification before acceptance
5. **Milestone-Based Payments**: Payments are escrowed and released upon milestone completion
6. **Automated Dispute Resolution**: Disputes are handled algorithmically with moderator override capability
7. **Real-Time Communication**: First-class in-app chat system for all project-related communication
8. **Public-Facing Marketing**: Andela-inspired landing pages accessible without authentication

### 👥 User Roles & Permissions

#### **Client**
- Submit project intake forms
- Pre-fund projects via Stripe
- View matched freelancer profiles
- Accept/reject matches
- Communicate via in-app chat
- Approve milestones
- Initiate disputes
- Request freelancer replacement

#### **Freelancer**
- Complete comprehensive vetting process
- View matched project opportunities
- Accept/reject project matches
- Submit milestone deliverables
- Communicate via in-app chat
- Request milestone payments
- Respond to disputes
- Manage availability & timezone

#### **Admin**
- Full system access
- Manage all users (promote/demote roles)
- Configure system settings
- View all chats, projects, payments
- Override automated decisions
- Access audit logs
- Manage platform fees & thresholds

#### **Moderator**
- Resolve disputes
- Review flagged content
- Access project & chat logs
- Override automated dispute decisions
- Escalate to Admin when needed

### 🔐 Security Model: Zero-Trust Architecture

**Core Principles:**
- All authorization checks happen **server-side only** (Convex)
- Client-side role checks are for **UI rendering only**, never for access control
- Every API endpoint validates user identity and permissions
- Session tokens are rotated regularly
- Full audit logging for all sensitive operations
- Rate limiting on all public endpoints
- CSRF protection on state-changing operations

### 💬 In-App Chat: First-Class Feature

**Chat Types:**
1. **Project Chat**: Client ↔ Freelancer (scoped to specific project)
2. **Support Chat**: User ↔ Admin/Moderator (for support requests)
3. **System Messages**: Automated notifications (milestones, payments, disputes)

**Chat Features:**
- Real-time messaging (Convex subscriptions)
- Read receipts
- Typing indicators
- File attachments
- Message pinning
- Soft deletes (preserved in audit logs)
- Admin/Moderator visibility into all chats
- Chat logs as authoritative evidence in disputes

### 🧪 Vetting & Verification System

**Multi-Layer Verification:**

1. **Identity & Liveness Verification**
   - Primary: Smile Identity
   - Fallback: Dojah
   - Document verification (ID, passport)
   - Liveness checks (video/photo)

2. **English Proficiency**
   - Timed multiple-choice questions (grammar)
   - Timed comprehension tests
   - AI-graded written responses
   - Minimum threshold required

3. **Skill Proficiency**
   - **Technical Skills**: MCQs + coding challenges (Judge0 abstraction)
   - **Non-Technical Skills**: Portfolio uploads + AI-assisted rubric scoring
   - Skill-specific thresholds

4. **Vetting Engine**
   - Weighted scoring algorithm
   - Admin-configurable thresholds
   - Auto-approve / flag / reject decisions
   - Immutable audit logs

### 🧠 Matching Engine

**Deterministic, Explainable Algorithm**

**Input Factors:**
- Skill overlap (required vs. freelancer skills)
- Vetting score (weighted)
- Historical ratings
- Availability status
- Timezone compatibility
- Past performance metrics
- Industry relevance
- Project complexity match

**Output:**
- Ranked list of matched freelancers
- Scoring metadata (explainable)
- Match confidence score
- Reasons for match/rejection

### 💳 Payments, Escrow & Disputes

**Payment Flow:**
1. Client pre-funds project via Stripe
2. Funds held in platform escrow account
3. Milestones created and escrowed
4. Freelancer completes milestone
5. Client approves → Auto-release after timeout OR manual release
6. Stripe Connect payout to freelancer
7. Platform fee deducted

**Dispute Flow:**
1. Client or Freelancer initiates dispute
2. Funds locked in escrow
3. Automated resolution attempt (if applicable)
4. Moderator review if needed
5. Resolution decision → Funds released accordingly
6. Freelancer replacement option if needed

**Critical Rule:** All payment state changes **must** be validated via Stripe webhooks (single source of truth)

### 🏗️ Technical Stack (Confirmed)

**Frontend:**
- Next.js 16.1.1 (App Router) ✅
- TypeScript (strict mode) ✅
- Zustand 5.0.9 ✅
- Tailwind CSS 4 ✅
- shadcn/ui (to be installed)
- Aceternity UI (to be installed)
- GSAP (to be installed)

**Backend:**
- Convex 1.31.2 ✅
  - Queries, mutations, actions
  - Real-time subscriptions
  - File storage
  - Cron jobs
  - Auth
  - Webhook ingestion

**Payments:**
- Stripe (to be configured)
- Stripe Connect (to be configured)
- Webhook endpoints (Convex actions)

**Third-Party Services:**
- Smile Identity (identity verification)
- Dojah (fallback identity verification)
- Judge0 (coding challenge execution)

### 🎨 Design Language: Andela-Inspired

**Visual Principles:**
- Clean, minimal interface
- Enterprise-grade aesthetics
- Calm, confident tone
- Strong typography hierarchy
- Minimal visual noise
- Professional color palette
- Smooth, purposeful animations (GSAP)

### 📊 Key Assumptions

1. **Convex as Single Backend**
   - All business logic in Convex
   - Real-time subscriptions for chat
   - File storage for portfolios/documents
   - Cron jobs for automated releases
   - Webhook ingestion via Convex actions

2. **Stripe as Payment Infrastructure**
   - Stripe Connect for freelancer payouts
   - Webhooks as authoritative payment state source
   - Platform holds escrow funds
   - Milestone-based releases

3. **Vetting is Pre-Entry**
   - Freelancers must complete full vetting before accessing platform
   - Vetting results are immutable
   - Re-vetting possible for skill updates

4. **Matching is Automatic**
   - No manual bidding
   - Clients can accept/reject matches
   - System suggests top N matches

5. **Chat is Central**
   - All project communication happens in-app
   - Chat logs are evidence in disputes
   - Real-time is critical

6. **Public Pages are Unauthenticated**
   - Landing page, marketing pages accessible without login
   - No authentication required for public content

7. **Role-Based Access is Server-Side Only**
   - Client-side checks are for UI only
   - All data access validated in Convex

---

## PHASE 2: HIGH-LEVEL ARCHITECTURE

### 🏛️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PUBLIC LANDING PAGES                      │
│              (Next.js - No Authentication)                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              NEXT.JS APP ROUTER (Frontend)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Zustand    │  │   shadcn/ui  │  │     GSAP     │      │
│  │   Stores     │  │  Components  │  │  Animations  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    CONVEX BACKEND                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Queries    │  │  Mutations   │  │   Actions    │      │
│  │  (Real-time) │  │  (Writes)    │  │ (Webhooks)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth       │  │ File Storage │  │  Cron Jobs    │      │
│  │  (Convex)    │  │  (Convex)    │  │  (Convex)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│    Stripe    │  │ Smile Identity│  │    Dojah    │
│  (Payments)  │  │  (Verification)│  │ (Fallback)  │
└──────────────┘  └──────────────┘  └──────────────┘
```

### 🔄 Data Flow Patterns

**Authentication Flow:**
```
User → Next.js → Convex Auth → JWT Token → Stored in Zustand → 
Convex Queries/Mutations (with token) → Server-side validation
```

**Payment Flow:**
```
Client → Pre-fund via Stripe → Webhook → Convex Action → 
Update Project State → Match Freelancer → Milestone Creation → 
Escrow → Completion → Release → Stripe Connect Payout
```

**Chat Flow:**
```
User → Send Message → Convex Mutation → Real-time Subscription → 
All Participants Receive Update → Read Receipts → Typing Indicators
```

**Matching Flow:**
```
Project Intake Form → Convex Action → Matching Engine → 
Score Freelancers → Return Top N → Client Accept/Reject
```

---

## PHASE 3: AGENT DECOMPOSITION

### 🤖 Specialized Agent Responsibilities

#### **Agent 1: System Architecture & Infrastructure**
**Responsibilities:**
- Overall system design
- Convex schema structure
- File organization
- Environment configuration
- Deployment strategy
- Performance optimization
- Scalability planning

**Deliverables:**
- System architecture diagrams
- Convex project structure
- Environment variable schema
- Deployment checklist

#### **Agent 2: Authentication & Security**
**Responsibilities:**
- Convex Auth integration
- RBAC implementation
- Session management
- CSRF protection
- Rate limiting
- Audit logging
- Security best practices

**Deliverables:**
- Auth system design
- Role-based access patterns
- Security middleware
- Audit log schema

#### **Agent 3: In-App Chat System**
**Responsibilities:**
- Real-time chat architecture
- Message schema design
- Read receipts & typing indicators
- File attachments
- Chat scoping (project/support/system)
- Admin visibility
- Chat search & filtering

**Deliverables:**
- Chat system architecture
- Message data model
- Real-time subscription patterns
- Chat UI components

#### **Agent 4: Vetting & Verification**
**Responsibilities:**
- Smile Identity integration
- Dojah fallback integration
- English proficiency tests
- Skill assessment design
- Judge0 integration (coding challenges)
- Vetting engine algorithm
- Scoring & thresholds

**Deliverables:**
- Vetting workflow design
- Integration patterns
- Scoring algorithm
- Admin configuration UI

#### **Agent 5: Matching Engine**
**Responsibilities:**
- Matching algorithm design
- Scoring weights & factors
- Explainability requirements
- Performance optimization
- Match ranking logic
- Client acceptance/rejection flow

**Deliverables:**
- Matching algorithm specification
- Scoring formula
- Match explanation system
- Performance benchmarks

#### **Agent 6: Payments & Stripe Integration**
**Responsibilities:**
- Stripe Connect setup
- Webhook ingestion (Convex actions)
- Escrow management
- Milestone payment flow
- Platform fee calculation
- Refund handling
- Payment state machine

**Deliverables:**
- Payment flow diagrams
- Webhook handler design
- Escrow state management
- Stripe Connect configuration

#### **Agent 7: Disputes & Moderation**
**Responsibilities:**
- Dispute workflow design
- Automated resolution rules
- Moderator override system
- Freelancer replacement flow
- Evidence collection (chat logs, deliverables)
- Dispute state machine

**Deliverables:**
- Dispute system design
- Moderation UI/UX
- Automated resolution rules
- Evidence presentation system

#### **Agent 8: Frontend & Design System**
**Responsibilities:**
- Zustand store architecture
- Component library (shadcn/ui + Aceternity)
- Design system tokens
- GSAP animation patterns
- Responsive design
- Accessibility
- Performance optimization

**Deliverables:**
- Zustand store structure
- Component library setup
- Design system documentation
- Animation guidelines

#### **Agent 9: Convex Backend & Data Modeling**
**Responsibilities:**
- Database schema design
- Query optimization
- Mutation patterns
- Action design (webhooks, external APIs)
- Real-time subscription patterns
- Cron job design
- File storage patterns

**Deliverables:**
- Complete Convex schema
- Query/mutation/action patterns
- Cron job specifications
- Data access patterns

#### **Agent 10: Public Landing & Marketing Pages**
**Responsibilities:**
- Landing page design (Andela-inspired)
- Marketing page structure
- SEO optimization
- Performance optimization
- Public content management

**Deliverables:**
- Landing page design
- Marketing page templates
- SEO strategy
- Public content architecture

---

## PHASE 4: SECURITY & AUTHENTICATION DESIGN

### 🔐 Authentication Methods

1. **Email/Password**
   - Secure password hashing (Convex handles this)
   - Email verification required
   - Password reset flow

2. **Google OAuth**
   - Convex Auth OAuth integration
   - Account linking

3. **Magic Links** (Optional)
   - Passwordless authentication
   - Time-limited tokens

### 🛡️ Authorization Model

**Role-Based Access Control (RBAC):**

```typescript
enum UserRole {
  CLIENT = "client",
  FREELANCER = "freelancer",
  MODERATOR = "moderator",
  ADMIN = "admin"
}

// Permission checks happen in Convex
function hasPermission(user: User, resource: string, action: string): boolean {
  // Server-side only
}
```

**Access Patterns:**
- All Convex queries/mutations validate user identity
- Role checks embedded in data access logic
- Client-side role checks for UI rendering only

### 🔒 Security Measures

1. **Session Management**
   - JWT tokens (Convex Auth)
   - Token rotation
   - Secure storage (httpOnly cookies preferred)

2. **CSRF Protection**
   - Token-based CSRF protection
   - SameSite cookie attributes

3. **Rate Limiting**
   - Per-user rate limits
   - Per-endpoint rate limits
   - Brute-force protection on auth endpoints

4. **Audit Logging**
   - All role changes logged
   - All payment operations logged
   - All dispute actions logged
   - All admin actions logged

---

## PHASE 5: DATA MODELING

### 📊 Core Entities

**Users**
- id, email, name, role, createdAt, updatedAt
- profile data (role-specific)
- auth metadata

**Projects**
- id, clientId, status, intakeForm, matchedFreelancerId
- milestones, totalAmount, escrowedAmount
- createdAt, updatedAt

**Milestones**
- id, projectId, title, description, amount
- status, dueDate, completedAt
- deliverables, approvalStatus

**Chats**
- id, type (project/support/system), participants
- projectId (if project chat), messages
- createdAt, updatedAt

**Messages**
- id, chatId, senderId, content, attachments
- readBy, pinned, deleted (soft)
- createdAt, updatedAt

**VettingResults**
- id, freelancerId, identityVerified, englishScore
- skillScores, overallScore, status
- immutable audit log

**Matches**
- id, projectId, freelancerId, score, reasons
- status (pending/accepted/rejected)
- createdAt

**Disputes**
- id, projectId, initiatorId, type, status
- evidence, resolution, moderatorId
- createdAt, resolvedAt

**Payments**
- id, projectId, milestoneId, amount, type
- stripePaymentIntentId, status
- webhookReceived, createdAt

---

## PHASE 6: IN-APP CHAT ARCHITECTURE

### 💬 Chat System Design

**Chat Types:**
1. **Project Chat**: Client ↔ Freelancer (one per project)
2. **Support Chat**: User ↔ Admin/Moderator (one per support request)
3. **System Messages**: Automated notifications (milestones, payments, etc.)

**Real-Time Architecture:**
- Convex subscriptions for message updates
- Optimistic UI updates (Zustand)
- Read receipt tracking
- Typing indicator state

**Message Features:**
- Text messages
- File attachments (Convex file storage)
- Message pinning
- Soft deletes (preserved in audit)
- Admin/Moderator visibility

**Chat Scoping:**
- Project chats are project-scoped
- Support chats are user-scoped
- System messages are user-scoped

---

## PHASE 7: VETTING & VERIFICATION

### 🧪 Vetting Workflow

**Step 1: Identity Verification**
- Smile Identity integration (primary)
- Dojah fallback if Smile Identity fails
- Document upload & verification
- Liveness check

**Step 2: English Proficiency**
- Timed MCQ test (grammar)
- Timed comprehension test
- AI-graded written response
- Minimum threshold: 70%

**Step 3: Skill Assessment**
- **Technical**: MCQs + coding challenges (Judge0)
- **Non-Technical**: Portfolio upload + AI rubric scoring
- Skill-specific thresholds

**Step 4: Vetting Engine**
- Weighted scoring:
  - Identity: 20%
  - English: 30%
  - Skills: 50%
- Admin-configurable thresholds
- Auto-approve / flag / reject

**Step 5: Audit Log**
- Immutable vetting results
- All scores preserved
- Admin review history

---

## PHASE 8: MATCHING ENGINE

### 🧠 Matching Algorithm

**Scoring Factors:**
1. **Skill Overlap** (40%)
   - Required skills vs. freelancer skills
   - Skill level matching

2. **Vetting Score** (25%)
   - Overall vetting score
   - Recent performance

3. **Ratings** (15%)
   - Historical client ratings
   - Project completion rate

4. **Availability** (10%)
   - Current availability status
   - Timezone compatibility

5. **Past Performance** (10%)
   - On-time delivery rate
   - Milestone completion quality

**Output:**
- Ranked list of top N matches (default: 5)
- Match score (0-100)
- Explanation metadata
- Match confidence level

**Client Actions:**
- Accept match → Project starts
- Reject match → Next match suggested
- Request more matches

---

## PHASE 9: PAYMENTS & STRIPE WEBHOOKS

### 💳 Payment Flow

**1. Pre-Funding**
- Client submits project intake form
- Client pre-funds via Stripe Checkout
- Webhook confirms payment → Project status: "funded"

**2. Milestone Escrow**
- Milestones created → Funds escrowed
- Stripe payment intent created per milestone

**3. Milestone Completion**
- Freelancer submits deliverable
- Client approves → Auto-release after 48h OR manual release
- Stripe Connect payout to freelancer
- Platform fee deducted (default: 10%)

**4. Dispute Handling**
- Dispute initiated → Funds locked
- Resolution → Funds released accordingly

**Critical: Webhooks as Single Source of Truth**
- All payment state changes validated via Stripe webhooks
- Convex actions handle webhook ingestion
- Idempotent webhook processing

---

## PHASE 10: DISPUTES & MODERATION

### ⚖️ Dispute System

**Dispute Types:**
1. **Milestone Quality**: Deliverable doesn't meet requirements
2. **Payment Dispute**: Payment-related issues
3. **Communication Issues**: Communication breakdown
4. **Freelancer Replacement**: Request for new freelancer

**Dispute Flow:**
1. Initiation (Client or Freelancer)
2. Funds locked in escrow
3. Evidence collection (chat logs, deliverables)
4. Automated resolution attempt (if applicable)
5. Moderator review (if needed)
6. Resolution decision
7. Funds released accordingly

**Moderator Override:**
- Moderators can override automated decisions
- Full access to project history, chats, deliverables
- Resolution notes required

**Freelancer Replacement:**
- If dispute resolved in favor of replacement
- New matching process initiated
- Previous freelancer compensated per resolution

---

## PHASE 11: FRONTEND ARCHITECTURE

### 🎨 Zustand Store Structure

**Stores:**
1. **authStore**: User authentication state, role, session
2. **projectStore**: Projects, milestones, matches
3. **chatStore**: Active chats, messages, typing indicators
4. **vettingStore**: Vetting progress, results
5. **paymentStore**: Payment status, escrow amounts
6. **disputeStore**: Active disputes, evidence
7. **uiStore**: UI state (modals, notifications, theme)

**Component Architecture:**
- shadcn/ui base components
- Aceternity UI for advanced components
- Custom components for domain-specific features
- GSAP for animations (minimal, purposeful)

**Design System:**
- Andela-inspired color palette
- Typography scale
- Spacing system
- Component variants

---

## PHASE 12: CONVEX BACKEND ARCHITECTURE

### 🗄️ Convex Structure

```
convex/
├── schema.ts              # Database schema
├── auth.ts                # Auth helpers
├── users/
│   ├── queries.ts
│   ├── mutations.ts
│   └── actions.ts
├── projects/
│   ├── queries.ts
│   ├── mutations.ts
│   └── actions.ts
├── chat/
│   ├── queries.ts
│   ├── mutations.ts
│   └── subscriptions.ts
├── vetting/
│   ├── queries.ts
│   ├── mutations.ts
│   └── actions.ts
├── matching/
│   └── actions.ts
├── payments/
│   ├── mutations.ts
│   └── actions.ts        # Webhook handlers
├── disputes/
│   ├── queries.ts
│   ├── mutations.ts
│   └── actions.ts
└── cron/
    └── jobs.ts
```

**Patterns:**
- Queries: Read-only, real-time subscriptions
- Mutations: Write operations, server-side validation
- Actions: External API calls, webhooks, cron jobs

---

## PHASE 13: PUBLIC LANDING & MARKETING PAGES

### 🌐 Public Pages

**Landing Page:**
- Hero section (Andela-inspired)
- Value proposition
- How it works
- Trust indicators
- CTA (Sign up / Get started)

**Marketing Pages:**
- For Clients
- For Freelancers
- About Us
- Pricing (if applicable)
- Blog (optional)

**SEO:**
- Meta tags
- Structured data
- Performance optimization
- Accessibility

---

## PHASE 14: 30-DAY DEVELOPMENT ROADMAP

### 📅 Development Phases

**Week 1: Foundation**
- Convex setup & configuration
- Authentication system
- Basic data models
- Landing page

**Week 2: Core Features**
- Project intake forms
- Vetting system (basic)
- Matching engine (MVP)
- Basic chat system

**Week 3: Payments & Escrow**
- Stripe integration
- Webhook handlers
- Escrow management
- Milestone system

**Week 4: Polish & Launch Prep**
- Dispute system
- Admin/moderator tools
- UI/UX polish
- Testing & bug fixes
- Documentation

---

## ✅ NEXT STEPS

**Awaiting Approval Before Implementation**

1. Review and approve this architecture document
2. Confirm assumptions and technical decisions
3. Approve agent decomposition
4. Begin production-grade coding

---

**Document Status:** ✅ Phase 1-14 Complete — Awaiting Approval

