/**
 * 49GIG Client and Freelancer Agreement text for in-app display and PDF.
 * Placeholders: [Client Name], [Freelancer Name(s)], [Date].
 * Effective date is auto-generated at document generation time.
 */

/** Divider line; must be WinAnsi-safe for PDF generation */
const RULE = "---";

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT AGREEMENT SECTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const CLIENT_AGREEMENT_SECTIONS = [
  { title: "49GIG CLIENT AGREEMENT", level: "title" as const },
  {
    body: "Effective Date: [Date]\n\nThis Client Agreement (\"Agreement\") is entered into between 49GIG (\"Platform\", \"we\", \"us\") and the individual or entity hiring talent through the Platform (\"Client\", \"you\").\n\nBy clicking \"Hire Talent\", \"Confirm Hire\", or \"Agree\", you confirm that you have read, understood, and agreed to be bound by this Agreement.",
  },
  { title: RULE, level: "divider" as const },

  { title: "1. Platform Role", level: "heading" as const },
  {
    body: "49GIG is a talent-matching and engagement facilitation platform.\n\n49GIG:\n• Is not an employer of any freelancer (\"Talent\")\n• Does not supervise or control how work is performed\n\nAll Talent engaged through the Platform act as independent contractors.",
  },
  { title: RULE, level: "divider" as const },

  { title: "2. Scope of Engagement", level: "heading" as const },
  {
    body: "2.1 The Client engages Talent on a Part-Time or Full-Time monthly basis through the Platform.\n\n2.2 Engagement details — including role title, experience level, working hours, duration, and start date — are selected during the hiring process and form part of this Agreement.\n\n2.3 Any optional pre-hire discussions or interviews do not create a contractual relationship until the hire is confirmed and payment is funded.",
  },
  { title: RULE, level: "divider" as const },

  { title: "3. Working Hours & Time Tracking", level: "heading" as const },
  {
    body: "3.1 Standard working hours are fixed as follows:\n• Part-Time: 20 hours per week (≈ 80 hours per month)\n• Full-Time: 40 hours per week (≈ 160 hours per month)\n\n3.2 Talent must record work using Platform-approved tools, including timesheets and activity summaries.\n\n3.3 Timesheets constitute the primary record for determining work performed and payment eligibility.",
  },
  { title: RULE, level: "divider" as const },

  { title: "4. Engagement Duration", level: "heading" as const },
  {
    body: "4.1 The Client selects a minimum engagement duration (e.g. 1 month, 3 months, 6 months, or ongoing).\n\n4.2 The minimum duration represents the initial commitment.\n\n4.3 After the minimum duration, the engagement continues on a month-to-month basis unless terminated in accordance with this Agreement.",
  },
  { title: RULE, level: "divider" as const },

  { title: "5. Payments & Monthly Escrow", level: "heading" as const },
  {
    body: "5.1 The Client agrees to fund one month of work in advance. Funds are held securely in escrow by 49GIG.\n\n5.2 Payments are structured monthly, not by milestones.\n\n5.3 49GIG charges a 25% platform fee, included in the total amount paid by the Client.\n\n5.4 Talent receives 75% of the total paid amount.",
  },
  { title: RULE, level: "divider" as const },

  { title: "6. Monthly Approval & Auto-Release", level: "heading" as const },
  {
    body: "6.1 At the end of each billing month, the Client must:\n• Approve the completed work, or\n• Raise a dispute through the Platform.\n\n6.2 If the Client takes no action within 5 calendar days after the billing period ends, payment may be automatically released to the Talent.",
  },
  { title: RULE, level: "divider" as const },

  { title: "7. Disputes, Replacements & Refunds", level: "heading" as const },
  {
    body: "7.1 Disputes must be raised through the Platform within the approval window.\n\n7.2 49GIG reviews disputes based on:\n• Timesheets\n• Work summaries\n• Communication records\n• Engagement terms\n\n7.3 Where justified, 49GIG may:\n• Issue a partial refund for unworked time\n• Replace the Talent\n• Take corrective action\n\n7.4 Refunds are not guaranteed and apply only to unworked or unsatisfactorily delivered time, as determined by 49GIG.\n\n7.5 Decisions by 49GIG are final and binding.",
  },
  { title: RULE, level: "divider" as const },

  { title: "8. Intellectual Property", level: "heading" as const },
  {
    body: "8.1 Upon full payment for approved work, all deliverables become the exclusive intellectual property of the Client, unless otherwise agreed in writing.\n\n8.2 Until payment is completed, all intellectual property remains with the Talent.",
  },
  { title: RULE, level: "divider" as const },

  { title: "9. Confidentiality", level: "heading" as const },
  {
    body: "The Client agrees to keep confidential all non-public information relating to:\n• Talent\n• Platform processes\n• Business or technical information\n\nConfidentiality obligations survive termination of this Agreement.",
  },
  { title: RULE, level: "divider" as const },

  { title: "10. Non-Circumvention (Anti-Bypass)", level: "heading" as const },
  {
    body: "10.1 The Client agrees not to engage, solicit, or hire Talent outside the 49GIG Platform for work introduced through 49GIG.\n\n10.2 This restriction applies:\n• During the engagement, and\n• For 12 months after termination.\n\n10.3 Violation may result in:\n• Immediate account termination\n• A penalty equal to 100% of the total engagement value\n• Recovery of unpaid platform fees\n• Legal action where applicable",
  },
  { title: RULE, level: "divider" as const },

  { title: "11. Termination & Notice", level: "heading" as const },
  {
    body: "11.1 Either party may terminate the engagement after the minimum duration by providing 7 days' written notice via the Platform.\n\n11.2 Payments for work already performed remain payable.\n\n11.3 Breach of this Agreement may result in immediate termination without notice.",
  },
  { title: RULE, level: "divider" as const },

  { title: "12. Limitation of Liability", level: "heading" as const },
  {
    body: "To the maximum extent permitted by law:\n• 49GIG is not liable for indirect or consequential damages\n• Total liability is limited to platform fees paid by the Client in the preceding 12 months",
  },
  { title: RULE, level: "divider" as const },

  { title: "13. Governing Law", level: "heading" as const },
  {
    body: "This Agreement is governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to conflict-of-law principles.",
  },
  { title: RULE, level: "divider" as const },

  { title: "14. Acceptance", level: "heading" as const },
  {
    body: "By clicking \"Agree\", \"Hire Talent\", or \"Confirm Hire\", you confirm that you have read, understood, and accepted this Client Agreement.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// FREELANCER AGREEMENT SECTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const FREELANCER_AGREEMENT_SECTIONS = [
  { title: "49GIG FREELANCER AGREEMENT", level: "title" as const },
  {
    body: "Effective Date: [Date]\n\nThis Freelancer Agreement (\"Agreement\") is entered into between 49GIG (\"Platform\", \"we\", \"us\") and the individual professional providing services through the Platform (\"Freelancer\", \"Talent\", \"you\").\n\nBy clicking \"Accept Offer\", \"Confirm Engagement\", or \"Agree\", you confirm that you have read, understood, and agreed to be bound by this Agreement.",
  },

  { title: "1. Independent Contractor Status", level: "heading" as const },
  {
    body: "1.1 You acknowledge that you are an independent contractor, not an employee, agent, or partner of 49GIG or any Client.\n\n1.2 Nothing in this Agreement creates an employment relationship, joint venture, or partnership.\n\n1.3 You are solely responsible for all taxes, levies, insurance, and statutory obligations related to your earnings.",
  },

  { title: "2. Eligibility & Vetting", level: "heading" as const },
  {
    body: "2.1 You confirm that all information provided during registration, vetting, and onboarding is accurate, complete, and truthful.\n\n2.2 49GIG may suspend or terminate your account if any information is found to be false, misleading, or outdated.\n\n2.3 Acceptance onto the Platform does not guarantee continuous work, minimum hours, or income.",
  },

  { title: "3. Scope of Engagement", level: "heading" as const },
  {
    body: "3.1 You may be engaged by Clients on a Part-Time or Full-Time monthly basis.\n\n3.2 Engagement details — including role, experience level, duration, start date, and working hours — are defined at the time of hire and form part of this Agreement.\n\n3.3 Optional interviews or discussions do not create a binding engagement until:\n• The hire is confirmed, and\n• The Client funds the first month of work in escrow.",
  },

  { title: "4. Working Hours, Availability & Tracking", level: "heading" as const },
  {
    body: "4.1 Standard working hours are:\n• Part-Time: 20 hours per week (≈ 80 hours per month)\n• Full-Time: 40 hours per week (≈ 160 hours per month)\n\n4.2 You agree to:\n• Be available during agreed working hours\n• Accurately log time and activity using Platform-approved tools\n• Provide work summaries when required\n• Communicate proactively with Clients and 49GIG\n\n4.3 Logged timesheets and activity records are the primary evidence of work performed.\n\n4.4 Repeated failure to meet agreed availability or hours may result in replacement, suspension, or termination.",
  },

  { title: "5. Performance Standards", level: "heading" as const },
  {
    body: "5.1 You agree to perform services with reasonable skill, care, professionalism, and diligence.\n\n5.2 You are responsible for delivering work consistent with the role and experience level accepted.\n\n5.3 Poor performance, misconduct, misrepresentation, or unprofessional behavior may result in:\n• Warnings\n• Rating reduction\n• Replacement\n• Suspension or removal from the Platform",
  },

  { title: "6. Payments & Platform Fees", level: "heading" as const },
  {
    body: "6.1 Client payments are funded monthly in advance and held in escrow.\n\n6.2 Payment is released after:\n• Completion of the billing month, and\n• Client approval or automatic release by the Platform.\n\n6.3 Platform Fee:\n• 49GIG retains 25% of the total engagement value.\n• You receive 75% of the total amount paid by the Client.\n\n6.4 Platform fees are non-negotiable.",
  },

  { title: "7. Monthly Approval, Auto-Release & Disputes", level: "heading" as const },
  {
    body: "7.1 At the end of each billing month, the Client may approve work or raise a dispute.\n\n7.2 If no action is taken within the Platform-defined approval window, payment may be automatically released.\n\n7.3 In the event of a dispute, you agree to cooperate fully with 49GIG's dispute resolution process.\n\n7.4 Dispute decisions are based on:\n• Logged hours\n• Work summaries\n• Communication records\n• Engagement terms\n\n7.5 Decisions by 49GIG are final and binding.",
  },

  { title: "8. Intellectual Property", level: "heading" as const },
  {
    body: "8.1 Upon full payment for approved work, all deliverables become the exclusive intellectual property of the Client, unless otherwise agreed in writing.\n\n8.2 Until payment is completed, intellectual property remains with you.\n\n8.3 You may not reuse, resell, or disclose Client deliverables without written permission.",
  },

  { title: "9. Confidentiality", level: "heading" as const },
  {
    body: "9.1 You agree to keep confidential all non-public information relating to:\n• Clients\n• Client businesses\n• Platform systems and processes\n\n9.2 Confidentiality obligations survive termination of this Agreement.",
  },

  { title: "10. Non-Circumvention (Anti-Bypass)", level: "heading" as const },
  {
    body: "10.1 You agree not to bypass 49GIG by engaging or attempting to engage Clients outside the Platform for work introduced through 49GIG.\n\n10.2 This restriction applies:\n• During the engagement, and\n• For 12 months after termination.\n\n10.3 Violation may result in:\n• Immediate account termination\n• Forfeiture of pending payments (where permitted by law)\n• A penalty equal to 100% of the engagement value\n• Legal action where applicable",
  },

  { title: "11. Termination & Notice", level: "heading" as const },
  {
    body: "11.1 Either party may terminate an engagement after the minimum duration by providing 7 days' notice through the Platform.\n\n11.2 You are entitled to payment only for approved and completed work up to the termination date.\n\n11.3 Serious breaches may result in immediate termination without notice.",
  },

  { title: "12. Suspension & Removal", level: "heading" as const },
  {
    body: "49GIG may suspend or permanently remove you from the Platform for:\n• Policy violations\n• Fraud or misrepresentation\n• Repeated poor performance\n• Anti-bypass violations\n• Abuse of Clients or Platform systems",
  },

  { title: "13. Limitation of Liability", level: "heading" as const },
  {
    body: "To the maximum extent permitted by law:\n• 49GIG is not liable for lost income, future opportunities, or reputational impact\n• Total liability is limited to fees earned through the Platform in the preceding 12 months",
  },

  { title: "14. Governing Law", level: "heading" as const },
  {
    body: "This Agreement is governed by the laws of the Federal Republic of Nigeria, without regard to conflict-of-law principles.",
  },

  { title: "15. Acceptance", level: "heading" as const },
  {
    body: "By clicking \"Accept Offer\", \"Confirm Engagement\", or \"Agree\", you confirm that you have read, understood, and accepted this Freelancer Agreement.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// PLAIN-TEXT HELPERS (in-app display, email fallback, pdf-lib in contracts/actions)
// ═══════════════════════════════════════════════════════════════════════════════

/** Same placeholder rules as agreement bodies; used by PDF structured renderer. */
export function applyClientAgreementPlaceholders(
  body: string,
  clientName: string,
  freelancerNames: string,
  effectiveDate: string,
): string {
  return body
    .replace("[Client Name / Company]", clientName || "Client")
    .replace("[Date]", effectiveDate)
    .replace("[Freelancer(s)]", freelancerNames || "Freelancer(s)");
}

export function applyFreelancerAgreementPlaceholders(
  body: string,
  freelancerName: string,
  effectiveDate: string,
): string {
  return body
    .replace("[Freelancer Name]", freelancerName || "Freelancer")
    .replace("[Date]", effectiveDate);
}

export function getClientAgreementFilled(
  clientName: string,
  freelancerNames: string,
  effectiveDate: string,
): string {
  let text = "";
  for (const s of CLIENT_AGREEMENT_SECTIONS) {
    if (s.level === "title") text += s.title + "\n\n";
    else if (s.level === "heading") text += s.title + "\n\n";
    else if (s.level === "divider") text += s.title + "\n\n";
    else if ("body" in s) {
      text +=
        applyClientAgreementPlaceholders(
          s.body as string,
          clientName,
          freelancerNames,
          effectiveDate,
        ) + "\n\n";
    }
  }
  return text.trim();
}

export function getFreelancerAgreementFilled(
  freelancerName: string,
  effectiveDate: string,
): string {
  let text = "";
  for (const s of FREELANCER_AGREEMENT_SECTIONS) {
    if (s.level === "title") text += s.title + "\n\n";
    else if (s.level === "heading") text += s.title + "\n\n";
    else if ("body" in s) {
      text +=
        applyFreelancerAgreementPlaceholders(
          s.body as string,
          freelancerName,
          effectiveDate,
        ) + "\n\n";
    }
  }
  return text.trim();
}
