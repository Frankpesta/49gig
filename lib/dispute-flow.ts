export const DISPUTE_STAGE_ORDER = [
  "negotiation",
  "platform_intervention_requested",
  "awaiting_party_evidence",
  "under_review",
  "judgment_issued",
  "objection_window",
  "appeal_review",
  "enforcing_resolution",
  "resolved",
  "closed",
] as const;

export type ProfessionalDisputeStatus =
  | (typeof DISPUTE_STAGE_ORDER)[number]
  | "open"
  | "escalated"
  | "cancelled";

export type DisputeTrack = "normal" | "fast_track";
export type EvidenceOwner = "client" | "freelancer" | "both";

export type DisputeReasonPolicy = {
  id:
    | "deliverable_quality"
    | "payment"
    | "communication"
    | "freelancer_replacement"
    | "client_deliverable_quality"
    | "client_timeline_scope"
    | "client_payment_billing"
    | "client_communication_conduct"
    | "client_request_replacement"
    | "freelancer_payment_issue"
    | "freelancer_scope_requirements"
    | "freelancer_communication"
    | "freelancer_platform_policy";
  label: string;
  openedBy: "client" | "freelancer" | "both";
  summary: string;
  fastTrackEligible: boolean;
  negotiationHours: number;
  evidenceHours: number;
  objectionHours: number;
  requiredEvidence: Array<{
    id: string;
    owner: EvidenceOwner;
    label: string;
    description: string;
  }>;
  outcomes: Array<"client_favor" | "freelancer_favor" | "partial" | "replacement">;
};

const DAY_HOURS = 24;

export const DISPUTE_REASON_POLICIES: DisputeReasonPolicy[] = [
  {
    id: "deliverable_quality",
    label: "Deliverable or work quality",
    openedBy: "both",
    summary: "Use when completed work is disputed on quality, completeness, or alignment with scope.",
    fastTrackEligible: false,
    negotiationHours: 6,
    evidenceHours: 48,
    objectionHours: DAY_HOURS,
    requiredEvidence: [
      {
        id: "expected_scope",
        owner: "client",
        label: "Expected scope",
        description: "Attach the agreed requirements, acceptance criteria, or project messages.",
      },
      {
        id: "delivered_work",
        owner: "both",
        label: "Delivered work",
        description: "Attach files, links, screenshots, or messages that show what was delivered.",
      },
      {
        id: "counter_response",
        owner: "both",
        label: "Other party response",
        description: "Each side should explain their position with supporting proof.",
      },
    ],
    outcomes: ["client_favor", "freelancer_favor", "partial", "replacement"],
  },
  {
    id: "client_payment_billing",
    label: "Payment or billing issue",
    openedBy: "client",
    summary: "Use this when a monthly payment, charge, or escrow amount is being challenged.",
    fastTrackEligible: true,
    negotiationHours: 2,
    evidenceHours: DAY_HOURS,
    objectionHours: DAY_HOURS,
    requiredEvidence: [
      {
        id: "billing_context",
        owner: "client",
        label: "Billing context",
        description: "Explain which month, payment, or amount is being disputed.",
      },
      {
        id: "supporting_records",
        owner: "both",
        label: "Supporting records",
        description: "Upload invoices, payment screenshots, project messages, or scope records.",
      },
    ],
    outcomes: ["client_favor", "freelancer_favor", "partial"],
  },
  {
    id: "freelancer_payment_issue",
    label: "Client has not approved or paid",
    openedBy: "freelancer",
    summary: "Use this when work was completed but the client has not approved the billing period.",
    fastTrackEligible: true,
    negotiationHours: 2,
    evidenceHours: DAY_HOURS,
    objectionHours: DAY_HOURS,
    requiredEvidence: [
      {
        id: "work_completion",
        owner: "freelancer",
        label: "Work completion proof",
        description: "Provide deliverables, links, screenshots, or chat messages showing completed work.",
      },
      {
        id: "client_response",
        owner: "client",
        label: "Client response",
        description: "Client should confirm approval, rejection, or reasons for withholding payment.",
      },
    ],
    outcomes: ["freelancer_favor", "client_favor", "partial"],
  },
  {
    id: "client_deliverable_quality",
    label: "Deliverable or quality issue",
    openedBy: "client",
    summary: "Use this when delivered work is incomplete, defective, or not aligned with agreed scope.",
    fastTrackEligible: false,
    negotiationHours: 6,
    evidenceHours: 48,
    objectionHours: DAY_HOURS,
    requiredEvidence: [
      {
        id: "expected_scope",
        owner: "client",
        label: "Expected scope",
        description: "Attach the agreed requirements, acceptance criteria, or project messages.",
      },
      {
        id: "delivered_work",
        owner: "both",
        label: "Delivered work",
        description: "Attach files, links, screenshots, or messages that show what was delivered.",
      },
      {
        id: "freelancer_response",
        owner: "freelancer",
        label: "Freelancer response",
        description: "Freelancer should explain delivery status and provide supporting proof.",
      },
    ],
    outcomes: ["client_favor", "freelancer_favor", "partial", "replacement"],
  },
  {
    id: "client_request_replacement",
    label: "Request freelancer replacement",
    openedBy: "client",
    summary: "Use this when a client wants a freelancer removed and replaced.",
    fastTrackEligible: false,
    negotiationHours: 6,
    evidenceHours: 48,
    objectionHours: DAY_HOURS,
    requiredEvidence: [
      {
        id: "replacement_reason",
        owner: "client",
        label: "Replacement reason",
        description: "Explain why replacement is required and attach relevant work or communication proof.",
      },
      {
        id: "freelancer_position",
        owner: "freelancer",
        label: "Freelancer position",
        description: "Freelancer should respond with context and any proof of cooperation or delivery.",
      },
    ],
    outcomes: ["replacement", "freelancer_favor", "partial"],
  },
  {
    id: "client_timeline_scope",
    label: "Timeline or scope issue",
    openedBy: "client",
    summary: "Use this for missed deadlines, scope mismatch, or work outside agreed terms.",
    fastTrackEligible: false,
    negotiationHours: 6,
    evidenceHours: 48,
    objectionHours: DAY_HOURS,
    requiredEvidence: [
      {
        id: "agreed_timeline",
        owner: "client",
        label: "Agreed timeline or scope",
        description: "Attach the agreement, project brief, deliverables list, or chat records.",
      },
      {
        id: "timeline_response",
        owner: "freelancer",
        label: "Freelancer timeline response",
        description: "Freelancer should explain delays, dependencies, or completed work.",
      },
    ],
    outcomes: ["client_favor", "freelancer_favor", "partial", "replacement"],
  },
  {
    id: "freelancer_scope_requirements",
    label: "Scope creep or unclear requirements",
    openedBy: "freelancer",
    summary: "Use this when the client requests work outside the agreed scope or changes requirements.",
    fastTrackEligible: false,
    negotiationHours: 6,
    evidenceHours: 48,
    objectionHours: DAY_HOURS,
    requiredEvidence: [
      {
        id: "original_scope",
        owner: "freelancer",
        label: "Original scope",
        description: "Attach original requirements and messages showing the agreed work.",
      },
      {
        id: "change_requests",
        owner: "freelancer",
        label: "Change requests",
        description: "Attach messages or files showing the additional requests.",
      },
      {
        id: "client_position",
        owner: "client",
        label: "Client position",
        description: "Client should explain why the request is inside or outside the agreed scope.",
      },
    ],
    outcomes: ["freelancer_favor", "client_favor", "partial"],
  },
  {
    id: "client_communication_conduct",
    label: "Communication or conduct issue",
    openedBy: "client",
    summary: "Use this when communication breaks down or conduct affects delivery.",
    fastTrackEligible: false,
    negotiationHours: 6,
    evidenceHours: 48,
    objectionHours: DAY_HOURS,
    requiredEvidence: [
      {
        id: "message_history",
        owner: "both",
        label: "Message history",
        description: "Attach relevant project chat messages and response timelines.",
      },
    ],
    outcomes: ["client_favor", "freelancer_favor", "partial", "replacement"],
  },
  {
    id: "freelancer_communication",
    label: "Client communication issue",
    openedBy: "freelancer",
    summary: "Use this when the client is unresponsive or communication blocks delivery/payment.",
    fastTrackEligible: false,
    negotiationHours: 6,
    evidenceHours: 48,
    objectionHours: DAY_HOURS,
    requiredEvidence: [
      {
        id: "message_history",
        owner: "both",
        label: "Message history",
        description: "Attach relevant project chat messages and response timelines.",
      },
    ],
    outcomes: ["freelancer_favor", "client_favor", "partial"],
  },
  {
    id: "freelancer_platform_policy",
    label: "Platform policy or safety issue",
    openedBy: "freelancer",
    summary: "Use this for policy violations, unsafe behavior, or off-platform pressure.",
    fastTrackEligible: false,
    negotiationHours: 2,
    evidenceHours: 48,
    objectionHours: DAY_HOURS,
    requiredEvidence: [
      {
        id: "policy_evidence",
        owner: "freelancer",
        label: "Policy evidence",
        description: "Attach messages, screenshots, or files showing the policy concern.",
      },
      {
        id: "client_response",
        owner: "client",
        label: "Client response",
        description: "Client may provide context or rebuttal evidence.",
      },
    ],
    outcomes: ["freelancer_favor", "client_favor", "partial"],
  },
];

export function getDisputeReasonPolicy(type: string): DisputeReasonPolicy {
  const normalized = type === "milestone_quality" ? "deliverable_quality" : type;
  return (
    DISPUTE_REASON_POLICIES.find((policy) => policy.id === normalized) ?? {
      id: normalized as DisputeReasonPolicy["id"],
      label: type.replace(/_/g, " "),
      openedBy: "both",
      summary: "Provide details and evidence for this dispute.",
      fastTrackEligible: false,
      negotiationHours: 6,
      evidenceHours: 48,
      objectionHours: DAY_HOURS,
      requiredEvidence: [
        {
          id: "general_evidence",
          owner: "both",
          label: "Relevant evidence",
          description: "Attach project messages, files, screenshots, or supporting documents.",
        },
      ],
      outcomes: ["client_favor", "freelancer_favor", "partial", "replacement"],
    }
  );
}

export function disputeStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    open: "Open",
    negotiation: "Negotiation",
    platform_intervention_requested: "Platform intervention requested",
    awaiting_party_evidence: "Awaiting evidence",
    under_review: "Under review",
    judgment_issued: "Judgment issued",
    objection_window: "Objection window",
    appeal_review: "Appeal review",
    enforcing_resolution: "Enforcing resolution",
    resolved: "Resolved",
    escalated: "Escalated",
    closed: "Closed",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status.replace(/_/g, " ");
}

export function disputeStageIndex(status: string): number {
  const index = DISPUTE_STAGE_ORDER.indexOf(status as (typeof DISPUTE_STAGE_ORDER)[number]);
  return index >= 0 ? index : 0;
}
