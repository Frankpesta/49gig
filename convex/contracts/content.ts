/**
 * 49GIG Client and Freelancer Agreement text for in-app display and PDF.
 * Placeholders: [Client Name], [Freelancer Name(s)], [Date].
 * Effective date is auto-generated at document generation time.
 */

/** Divider line; must be WinAnsi-safe for PDF generation */
const RULE = "---";

export const CLIENT_AGREEMENT_SECTIONS = [
  { title: "49GIG Client Project Agreement (Digital Contract)", level: "title" as const },
  { title: "Parties", level: "heading" as const },
  { body: "This Agreement is entered into between:\n• Client: [Client Name / Company] (“Client”)\n• Platform: 49GIG (“Platform”)\n• Freelancer(s): Assigned by 49GIG (“Freelancer”)\n\nEffective Date: [Date]\n\nThis Agreement governs the creation, management, and execution of the project(s) initiated through the 49GIG platform." },
  { title: RULE, level: "divider" as const },
  { title: "1. Project Scope", level: "heading" as const },
  { body: "1.1 Client agrees to provide a clear description of the project, including:\n• Deliverables\n• Timeline\n• Required skills / roles\n\n1.2 Platform will match Client with vetted Freelancer(s) based on project requirements.\n1.3 Optional: Client may request an interview with Freelancer(s) prior to project start. Interviews are not mandatory, and the project may proceed without them." },
  { title: RULE, level: "divider" as const },
  { title: "2. Payment Terms", level: "heading" as const },
  { body: "2.1 Project costs are calculated based on the Client's selected engagement type, duration, experience level, and timeline, as described in the 49GIG Pricing system.\n\n2.2 Milestone-Based Payment:\n• Funds are deposited into 49GIG escrow.\n• Milestones are defined and agreed upon before work begins.\n• Payment is released upon Client approval of each milestone.\n\n2.3 Platform Fee:\n• 49GIG collects 25% of total project value.\n• Freelancer receives 75% of total project value.\n\n2.4 Optional client budget caps are accepted, but total project payments must flow through the 49GIG platform." },
  { title: RULE, level: "divider" as const },
  { title: "3. Project Timeline & Deliverables", level: "heading" as const },
  { body: "3.1 Freelancer(s) will deliver work according to milestone deadlines.\n3.2 Client will review work and approve or request revisions within a reasonable timeframe.\n3.3 Delays caused by Client's failure to provide required information may result in timeline adjustments." },
  { title: RULE, level: "divider" as const },
  { title: "4. Intellectual Property", level: "heading" as const },
  { body: "4.1 Upon full payment of milestones, all deliverables produced by Freelancer(s) become the intellectual property of the Client.\n4.2 Platform and Freelancer retain the right to use work for portfolio and marketing purposes with Client's consent." },
  { title: RULE, level: "divider" as const },
  { title: "5. Non-Circumvention Clause", level: "heading" as const },
  { body: "5.1 Client agrees to not bypass the 49GIG platform to work directly with any Freelancer assigned by 49GIG.\n\n5.2 If Client attempts to circumvent 49GIG:\n• Client shall pay a penalty equal to 100% of the agreed project value to 49GIG plus a fine of $15,000.\n• This penalty is in addition to any unpaid platform fees\n\nThis ensures fair compensation for the platform and protection of Freelancer relationships." },
  { title: RULE, level: "divider" as const },
  { title: "6. Revisions & Dispute Resolution", level: "heading" as const },
  { body: "6.1 Client may request reasonable revisions within the scope of the project.\n6.2 If a dispute arises, 49GIG will mediate based on:\n• Original project description\n• Freelancer deliverables\n• Milestone approval history\n\n6.3 Platform decisions are final and binding to ensure timely resolution." },
  { title: RULE, level: "divider" as const },
  { title: "7. Confidentiality", level: "heading" as const },
  { body: "7.1 All project-related information, intellectual property, and sensitive materials must be kept confidential by Client and Freelancer(s) unless otherwise agreed." },
  { title: RULE, level: "divider" as const },
  { title: "8. Termination", level: "heading" as const },
  { body: "8.1 Either party may terminate the project in writing via the 49GIG platform.\n8.2 Funds already released for completed milestones are non-refundable, except in approved dispute resolutions.\n8.3 Platform reserves the right to terminate projects for violation of platform rules or bypassing the platform." },
  { title: RULE, level: "divider" as const },
  { title: "9. Governing Law", level: "heading" as const },
  { body: "This Agreement is governed by the laws of the Federal Capital Territory, Abuja, Nigeria and is enforceable in all relevant courts." },
  { title: RULE, level: "divider" as const },
  { title: "10. Client Acceptance", level: "heading" as const },
  { body: "By clicking “Approve / Sign”, Client agrees to:\n• The project scope, deliverables, and milestones\n• 49GIG's platform fee\n• Non-circumvention terms\n• Intellectual property and confidentiality clauses" },
];

export const FREELANCER_AGREEMENT_SECTIONS = [
  { title: "49GIG FREELANCER AGREEMENT", level: "title" as const },
  { body: "Effective Date: [Date]\n\nThis Freelancer Agreement (“Agreement”) is entered into between 49GIG (“Platform”, “we”, “us”) and the individual professional providing services through the Platform (“Freelancer”, “Talent”, “you”).\n\nBy clicking “Accept Offer”, “Confirm Engagement”, or “Agree”, you confirm that you have read, understood, and agreed to be bound by this Agreement." },
  { title: "1. Independent Contractor Status", level: "heading" as const },
  { body: "1.1 You acknowledge and agree that you are an independent contractor, not an employee, agent, or partner of 49GIG or any Client.\n1.2 Nothing in this Agreement creates an employment relationship, joint venture, or partnership.\n1.3 You are responsible for all taxes, levies, and statutory obligations related to your earnings." },
  { title: "2. Eligibility & Vetting", level: "heading" as const },
  { body: "2.1 You confirm that all information provided during registration and vetting is accurate and truthful.\n2.2 49GIG reserves the right to suspend or terminate your account if any information is found to be false or misleading.\n2.3 Acceptance into the Platform does not guarantee continuous work or income." },
  { title: "3. Scope of Engagement", level: "heading" as const },
  { body: "3.1 You may be engaged by Clients on a Part-Time or Full-Time basis.\n3.2 Engagement details (role, duration, start date, and working hours) are defined at the time of hire and form part of this Agreement.\n3.3 Optional interviews or discussions do not constitute a binding engagement until the hire is confirmed and escrow is funded." },
  { title: "4. Working Hours & Availability", level: "heading" as const },
  { body: "4.1 Standard working hours are:\n• Part-Time: 20 hours per week (approximately 80 hours per month)\n• Full-Time: 40 hours per week (approximately 160 hours per month)\n\n4.2 You agree to:\n• Maintain availability during agreed working hours\n• Accurately log time and activity using Platform tools\n• Communicate proactively with Clients\n\n4.3 Repeated failure to meet expected hours or availability may result in termination." },
  { title: "5. Performance Standards", level: "heading" as const },
  { body: "5.1 You agree to perform services with reasonable skill, care, professionalism, and diligence.\n5.2 You are responsible for delivering work consistent with the role and experience level accepted.\n5.3 Poor performance, misconduct, or misrepresentation may result in suspension or removal from the Platform." },
  { title: "6. Payments & Fees", level: "heading" as const },
  { body: "6.1 Client payments are funded monthly in advance and held in escrow.\n6.2 Payment is released after:\n• Completion of the billing month, and\n• Client approval or automatic release.\n\n6.3 Platform Fee:\n• 49GIG retains 25% of the total engagement value.\n• You receive 75% of the total amount paid by the Client.\n\n6.4 You acknowledge that the platform fee is non-negotiable." },
  { title: "7. Disputes", level: "heading" as const },
  { body: "7.1 If a dispute arises, you agree to participate in 49GIG's dispute resolution process.\n7.2 Dispute decisions are based on:\n• Logged hours\n• Communication records\n• Work summaries\n• Agreed role expectations\n\n7.3 Decisions by 49GIG are final and binding." },
  { title: "8. Intellectual Property", level: "heading" as const },
  { body: "8.1 All work produced during a paid engagement becomes the Client's intellectual property upon full payment.\n8.2 Until payment is completed, intellectual property remains with you.\n8.3 You may not reuse, resell, or disclose Client deliverables without written permission." },
  { title: "9. Confidentiality", level: "heading" as const },
  { body: "9.1 You agree to keep confidential all non-public information relating to Clients, their businesses, and the Platform.\n9.2 Confidentiality obligations survive termination of this Agreement." },
  { title: "10. Non-Circumvention (Anti-Bypass)", level: "heading" as const },
  { body: "10.1 You agree not to bypass the Platform by engaging or attempting to engage Clients outside 49GIG for work introduced through the Platform.\n\n10.2 This restriction applies:\n• During the engagement, and\n• For 12 months after termination.\n\n10.3 Violation may result in:\n• Immediate account termination\n• Forfeiture of pending payments\n• A penalty equal to 100% of the engagement value\n• Legal action where applicable" },
  { title: "11. Termination", level: "heading" as const },
  { body: "11.1 Either party may terminate an engagement after the minimum duration with notice through the Platform.\n11.2 You are entitled to payment for approved work completed up to the termination date.\n11.3 Serious breaches may result in immediate termination without notice." },
  { title: "12. Suspension & Removal", level: "heading" as const },
  { body: "49GIG may suspend or permanently remove you from the Platform for:\n• Policy violations\n• Fraud or misrepresentation\n• Repeated poor performance\n• Anti-bypass violations\n• Abuse of Clients or Platform systems" },
  { title: "13. Limitation of Liability", level: "heading" as const },
  { body: "To the maximum extent permitted by law:\n• 49GIG is not liable for lost income or future opportunities.\n• Total liability is limited to fees earned through the Platform in the preceding 12 months." },
  { title: "14. Governing Law", level: "heading" as const },
  { body: "This Agreement is governed by the laws of the Federal Republic of Nigeria, without regard to conflict-of-law principles." },
  { title: "15. Acceptance", level: "heading" as const },
  { body: "By clicking “Accept Offer”, “Confirm Engagement”, or “Agree”, you confirm that you have read, understood, and accepted this Freelancer Agreement." },
];

export function getClientAgreementFilled(clientName: string, freelancerNames: string, effectiveDate: string): string {
  let text = "";
  for (const s of CLIENT_AGREEMENT_SECTIONS) {
    if (s.level === "title") text += s.title + "\n\n";
    else if (s.level === "heading") text += s.title + "\n\n";
    else if (s.level === "divider") text += s.title + "\n\n";
    else if ("body" in s) {
      text += (s.body as string)
        .replace("[Client Name / Company]", clientName || "Client")
        .replace("[Date]", effectiveDate)
        .replace("[Freelancer(s)]", freelancerNames || "Freelancer(s)")
        + "\n\n";
    }
  }
  return text.trim();
}

export function getFreelancerAgreementFilled(freelancerName: string, effectiveDate: string): string {
  let text = "";
  for (const s of FREELANCER_AGREEMENT_SECTIONS) {
    if (s.level === "title") text += s.title + "\n\n";
    else if (s.level === "heading") text += s.title + "\n\n";
    else if ("body" in s) {
      text += (s.body as string)
        .replace("[Freelancer Name]", freelancerName || "Freelancer")
        .replace("[Date]", effectiveDate)
        + "\n\n";
    }
  }
  return text.trim();
}
