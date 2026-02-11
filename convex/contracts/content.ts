/**
 * 49GIG Client and Freelancer Agreement text for in-app display and PDF.
 * Placeholders: [Client Name], [Freelancer Name(s)], [Date], [Project Title].
 */

const RULE = "⸻";

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
  { title: "49GIG Freelancer Project Agreement (Digital Contract)", level: "title" as const },
  { title: "Parties", level: "heading" as const },
  { body: "This Agreement is entered into between:\n• Freelancer: [Freelancer Name] (“Freelancer”)\n• Platform: 49GIG (“Platform”)\n• Client: Assigned by 49GIG (“Client”)\n\nEffective Date: [Date]\n\nThis Agreement governs the terms under which the Freelancer will perform services for Client projects through the 49GIG platform." },
  { title: RULE, level: "divider" as const },
  { title: "1. Project Scope", level: "heading" as const },
  { body: "1.1 Freelancer agrees to deliver work according to the project description, scope, and milestones provided by Client and 49GIG.\n1.2 Deliverables, deadlines, and milestones are defined and agreed upon before the project begins.\n1.3 Optional: Freelancer may participate in a client interview prior to project start, if requested. Interviews are not mandatory." },
  { title: RULE, level: "divider" as const },
  { title: "2. Payment Terms", level: "heading" as const },
  { body: "2.1 Milestone-Based Payment:\n• Freelancer payments are released upon Client approval of each milestone.\n• Funds are held securely in 49GIG escrow until approved.\n\n2.2 Platform Fee:\n• 49GIG collects 25% of total project value.\n• Freelancer receives 75% of total project value.\n\n2.3 All payments must go through 49GIG. Freelancers may not accept payments directly from clients outside the platform." },
  { title: RULE, level: "divider" as const },
  { title: "3. Project Timeline", level: "heading" as const },
  { body: "3.1 Freelancer agrees to deliver work according to milestone deadlines.\n3.2 If Freelancer cannot meet a deadline, they must notify the Client and Platform immediately.\n3.3 Revisions may be requested by Client within reasonable limits of the agreed scope." },
  { title: RULE, level: "divider" as const },
  { title: "4. Intellectual Property", level: "heading" as const },
  { body: "4.1 Upon full payment of milestones, all work created for the Client becomes the property of the Client.\n4.2 Freelancer retains the right to showcase work in portfolios or marketing materials, with Client's consent." },
  { title: RULE, level: "divider" as const },
  { title: "5. Non-Circumvention Clause", level: "heading" as const },
  { body: "5.1 Freelancer agrees not to bypass 49GIG to work directly with any Client assigned via the platform.\n\n5.2 Violation of this clause will result in:\n• Immediate suspension of Freelancer account\n• Payment of a penalty equal to 100% of the project value to 49GIG\n• A fine of $10,000\n• Possible legal action to recover damages and unpaid platform fees\n\nThis protects the platform, clients, and other freelancers." },
  { title: RULE, level: "divider" as const },
  { title: "6. Confidentiality", level: "heading" as const },
  { body: "6.1 Freelancer must keep all project-related information, sensitive materials, and intellectual property confidential.\n6.2 Confidential information may not be shared or used outside the project without explicit consent." },
  { title: RULE, level: "divider" as const },
  { title: "7. Dispute Resolution", level: "heading" as const },
  { body: "7.1 All disputes between Freelancer and Client are mediated by 49GIG.\n7.2 Platform decisions are final and binding, based on milestones, approved deliverables, and communications.\n7.3 Failure to comply with the platform's dispute resolution may result in account suspension or termination." },
  { title: RULE, level: "divider" as const },
  { title: "8. Termination", level: "heading" as const },
  { body: "8.1 Projects may be terminated by Client or Platform for valid reasons, including violation of platform rules.\n8.2 Freelancer is entitled to payment for all completed and approved milestones.\n8.3 Freelancers who bypass the platform or violate rules may forfeit payments and face account suspension." },
  { title: RULE, level: "divider" as const },
  { title: "9. Governing Law", level: "heading" as const },
  { body: "This Agreement is governed by the laws of the Federal Capital Territory, Abuja, Nigeria and enforceable in relevant courts." },
  { title: RULE, level: "divider" as const },
  { title: "10. Freelancer Acceptance", level: "heading" as const },
  { body: "By clicking “Approve / Sign”, Freelancer agrees to:\n• Complete the project as per scope and milestones\n• Accept platform fees (25% of total project value)\n• Respect intellectual property, confidentiality, and non-circumvention clauses\n• Follow 49GIG dispute resolution process" },
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
    else if (s.level === "divider") text += s.title + "\n\n";
    else if ("body" in s) {
      text += (s.body as string)
        .replace("[Freelancer Name]", freelancerName || "Freelancer")
        .replace("[Date]", effectiveDate)
        + "\n\n";
    }
  }
  return text.trim();
}
