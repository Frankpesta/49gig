"use client";

import { PageHeader } from "@/components/marketing/page-header";
import { FileCheck } from "lucide-react";

export default function ClientAgreementPage() {
  return (
    <div className="w-full">
      <PageHeader
        badge={{ icon: FileCheck, text: "Client Agreement" }}
        title="Client Agreement Template"
        description="Last updated: January 6, 2026"
      />

      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h2>Client Services Agreement</h2>
            <p className="text-sm italic">
              This Client Services Agreement ("Agreement") is entered into between the Client and the Freelancer through the 49GIG platform. By posting a project and engaging a Freelancer, the Client agrees to be bound by these terms.
            </p>

            <h2>1. Parties</h2>
            <p><strong>Client:</strong> [Client Name/Company Name] ("Client")</p>
            <p><strong>Freelancer:</strong> [Freelancer Name] ("Freelancer")</p>
            <p><strong>Platform:</strong> 49GIG ("Platform")</p>

            <h2>2. Project Overview</h2>
            <ul>
              <li><strong>Project Title:</strong> [Project Name]</li>
              <li><strong>Project Description:</strong> [Brief description]</li>
              <li><strong>Expected Deliverables:</strong> [List of deliverables]</li>
              <li><strong>Project Timeline:</strong> [Start Date] to [End Date]</li>
              <li><strong>Total Budget:</strong> $[Amount] (inclusive of platform fees)</li>
            </ul>

            <h2>3. Client Obligations</h2>
            <h3>3.1 Project Requirements</h3>
            <p>
              The Client agrees to:
            </p>
            <ul>
              <li>Provide clear, detailed project specifications</li>
              <li>Supply all necessary materials, information, and access required for project completion</li>
              <li>Respond to Freelancer inquiries within 48 hours</li>
              <li>Provide timely feedback on deliverables</li>
            </ul>

            <h3>3.2 Payment Obligations</h3>
            <p>
              The Client agrees to:
            </p>
            <ul>
              <li>Fund the full project amount in escrow before work begins</li>
              <li>Review milestone deliverables within 7 days</li>
              <li>Approve completed work that meets agreed specifications</li>
              <li>Release payments for approved milestones promptly</li>
            </ul>

            <h3>3.3 Communication</h3>
            <p>
              The Client agrees to maintain professional communication and provide constructive feedback throughout the project.
            </p>

            <h2>4. Freelancer Obligations</h2>
            <h3>4.1 Performance Standards</h3>
            <p>
              The Freelancer agrees to:
            </p>
            <ul>
              <li>Deliver high-quality work meeting project specifications</li>
              <li>Meet agreed-upon deadlines and milestones</li>
              <li>Communicate progress and potential issues proactively</li>
              <li>Provide deliverables as specified in the project scope</li>
            </ul>

            <h3>4.2 Professional Conduct</h3>
            <p>
              The Freelancer will maintain professional standards and adhere to 49GIG's Code of Conduct.
            </p>

            <h2>5. Scope of Work</h2>
            <h3>5.1 Detailed Scope</h3>
            <p>
              The project includes the following work:
            </p>
            <ul>
              <li>[Detailed task 1]</li>
              <li>[Detailed task 2]</li>
              <li>[Detailed task 3]</li>
            </ul>

            <h3>5.2 Deliverables</h3>
            <p>
              The Freelancer will provide:
            </p>
            <ul>
              <li>[Specific deliverable 1]</li>
              <li>[Specific deliverable 2]</li>
              <li>[Specific deliverable 3]</li>
            </ul>

            <h3>5.3 Exclusions</h3>
            <p>
              The following are explicitly excluded from this project scope:
            </p>
            <ul>
              <li>[Exclusion 1]</li>
              <li>[Exclusion 2]</li>
            </ul>

            <h3>5.4 Scope Changes</h3>
            <p>
              Any changes to the project scope must be agreed upon by both parties in writing through the 49GIG platform. Scope changes may affect timeline and budget.
            </p>

            <h2>6. Payment and Compensation</h2>
            <h3>6.1 Total Project Cost</h3>
            <p>
              The Client agrees to pay $[Amount] for the completion of the project, plus 49GIG service fees.
            </p>

            <h3>6.2 Milestone Payments</h3>
            <table>
              <thead>
                <tr>
                  <th>Milestone</th>
                  <th>Deliverable</th>
                  <th>Due Date</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Milestone 1</td>
                  <td>[Description]</td>
                  <td>[Date]</td>
                  <td>$[Amount]</td>
                </tr>
                <tr>
                  <td>Milestone 2</td>
                  <td>[Description]</td>
                  <td>[Date]</td>
                  <td>$[Amount]</td>
                </tr>
                <tr>
                  <td>Milestone 3</td>
                  <td>[Description]</td>
                  <td>[Date]</td>
                  <td>$[Amount]</td>
                </tr>
              </tbody>
            </table>

            <h3>6.3 Escrow System</h3>
            <p>
              All payments are held in 49GIG's secure escrow system. Funds are released to the Freelancer only upon Client approval or automatic release after 7 days.
            </p>

            <h3>6.4 Platform Fees</h3>
            <p>
              The Client will pay a 5% platform service fee on the total project value.
            </p>

            <h2>7. Timeline and Milestones</h2>
            <h3>7.1 Project Duration</h3>
            <p>
              The project will commence on [Start Date] and is expected to be completed by [End Date].
            </p>

            <h3>7.2 Milestone Schedule</h3>
            <p>
              Milestone deadlines are outlined in Section 6.2. Delays caused by Client feedback or material provision will extend deadlines accordingly.
            </p>

            <h3>7.3 Deadline Extensions</h3>
            <p>
              Either party may request deadline extensions for justifiable reasons. Extensions must be agreed upon in writing.
            </p>

            <h2>8. Approval and Revisions</h2>
            <h3>8.1 Deliverable Review</h3>
            <p>
              The Client has 7 days to review each milestone deliverable and either approve it, request revisions, or dispute it.
            </p>

            <h3>8.2 Included Revisions</h3>
            <p>
              This project includes [Number] rounds of revisions per deliverable. Revisions must be within the original scope of work.
            </p>

            <h3>8.3 Additional Revisions</h3>
            <p>
              Revisions beyond the included rounds or outside the original scope will require additional payment, to be agreed upon by both parties.
            </p>

            <h3>8.4 Automatic Approval</h3>
            <p>
              If the Client does not respond within 7 days of deliverable submission, the milestone will be automatically approved and payment released.
            </p>

            <h2>9. Intellectual Property</h2>
            <h3>9.1 Ownership Transfer</h3>
            <p>
              Upon full payment, all intellectual property rights in the work product transfer to the Client, including copyrights, trademarks, and related rights.
            </p>

            <h3>9.2 Pre-Existing Materials</h3>
            <p>
              The Freelancer retains ownership of pre-existing materials. The Client receives a non-exclusive, perpetual license to use such materials as part of the final deliverable.
            </p>

            <h3>9.3 Third-Party Materials</h3>
            <p>
              If third-party materials are used, the Freelancer warrants that proper licenses have been obtained. Additional licensing fees are the Client's responsibility unless otherwise agreed.
            </p>

            <h3>9.4 Portfolio Use</h3>
            <p>
              The Freelancer may display the work in their portfolio unless the Client objects in writing within 14 days of project completion.
            </p>

            <h2>10. Confidentiality and Non-Disclosure</h2>
            <h3>10.1 Confidential Information</h3>
            <p>
              Both parties agree to keep confidential any proprietary information, business data, and project details disclosed during the project.
            </p>

            <h3>10.2 Non-Disclosure</h3>
            <p>
              The Freelancer will not disclose Client information to third parties without written permission, except as required by law.
            </p>

            <h3>10.3 Return of Materials</h3>
            <p>
              Upon project completion, the Freelancer must return or destroy all confidential materials provided by the Client.
            </p>

            <h2>11. Warranties and Representations</h2>
            <h3>11.1 Client Warranties</h3>
            <p>
              The Client warrants that:
            </p>
            <ul>
              <li>They have authority to enter into this Agreement</li>
              <li>Funds are available for full project payment</li>
              <li>Materials provided do not infringe on third-party rights</li>
              <li>Project requirements are accurate and complete</li>
            </ul>

            <h3>11.2 Freelancer Warranties</h3>
            <p>
              The Freelancer warrants that:
            </p>
            <ul>
              <li>Work will be performed professionally and competently</li>
              <li>Deliverables will meet specifications</li>
              <li>Work is original and does not infringe on third-party rights</li>
            </ul>

            <h2>12. Termination</h2>
            <h3>12.1 Termination by Client</h3>
            <p>
              The Client may terminate this Agreement at any time with written notice. The Freelancer will be paid for completed milestones and work in progress.
            </p>

            <h3>12.2 Termination by Freelancer</h3>
            <p>
              The Freelancer may terminate with 7 days' notice if the Client fails to meet obligations or pay for completed work.
            </p>

            <h3>12.3 Termination for Cause</h3>
            <p>
              Either party may terminate immediately for material breach, fraud, or violation of this Agreement.
            </p>

            <h2>13. Dispute Resolution</h2>
            <h3>13.1 Direct Resolution</h3>
            <p>
              The parties agree to first attempt resolution through direct communication.
            </p>

            <h3>13.2 Platform Mediation</h3>
            <p>
              If direct resolution fails, either party may request 49GIG mediation support.
            </p>

            <h3>13.3 Arbitration</h3>
            <p>
              Unresolved disputes will be settled through binding arbitration in accordance with Nigerian law.
            </p>

            <h2>14. Liability and Indemnification</h2>
            <h3>14.1 Limitation of Liability</h3>
            <p>
              Except for intellectual property infringement or breach of confidentiality, each party's liability is limited to the total amount paid under this Agreement.
            </p>

            <h3>14.2 Indemnification</h3>
            <p>
              Each party agrees to indemnify the other against claims arising from their breach of this Agreement.
            </p>

            <h2>15. General Provisions</h2>
            <h3>15.1 Entire Agreement</h3>
            <p>
              This Agreement constitutes the entire agreement between the parties.
            </p>

            <h3>15.2 Amendments</h3>
            <p>
              Amendments must be made in writing and agreed upon by both parties through the 49GIG platform.
            </p>

            <h3>15.3 Governing Law</h3>
            <p>
              This Agreement is governed by the laws of Nigeria.
            </p>

            <h3>15.4 Independent Contractors</h3>
            <p>
              The relationship is that of independent contractors. No employment, partnership, or agency relationship is created.
            </p>

            <h2>16. Electronic Signatures</h2>
            <p>
              By posting a project and engaging a Freelancer on the 49GIG platform, both parties electronically sign and agree to be bound by this Agreement.
            </p>
            <ul>
              <li><strong>Client:</strong> [Name], [Date]</li>
              <li><strong>Freelancer:</strong> [Name], [Date]</li>
              <li><strong>Project ID:</strong> [49GIG Project ID]</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

