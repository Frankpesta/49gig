"use client";

import { PageHeader } from "@/components/marketing/page-header";
import { FileSignature } from "lucide-react";

export default function FreelancerAgreementPage() {
  return (
    <div className="w-full">
      <PageHeader
        badge={{ icon: FileSignature, text: "Freelancer Agreement" }}
        title="Freelancer Agreement Template"
        description="Last updated: January 6, 2026"
      />

      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h2>Freelancer Services Agreement</h2>
            <p className="text-sm italic">
              This Freelancer Services Agreement ("Agreement") is entered into between the Client and the Freelancer through the 49GIG platform. By accepting a project, the Freelancer agrees to be bound by these terms.
            </p>

            <h2>1. Parties</h2>
            <p><strong>Client:</strong> [Client Name] ("Client")</p>
            <p><strong>Freelancer:</strong> [Freelancer Name] ("Freelancer")</p>
            <p><strong>Platform:</strong> 49GIG ("Platform")</p>

            <h2>2. Project Details</h2>
            <ul>
              <li><strong>Project Title:</strong> [Project Name]</li>
              <li><strong>Project Description:</strong> [Detailed scope of work]</li>
              <li><strong>Deliverables:</strong> [Specific outputs expected]</li>
              <li><strong>Project Start Date:</strong> [Date]</li>
              <li><strong>Project End Date:</strong> [Date]</li>
              <li><strong>Total Project Value:</strong> $[Amount]</li>
            </ul>

            <h2>3. Scope of Work</h2>
            <h3>3.1 Services</h3>
            <p>
              The Freelancer agrees to provide the following services:
            </p>
            <ul>
              <li>[Service description 1]</li>
              <li>[Service description 2]</li>
              <li>[Service description 3]</li>
            </ul>

            <h3>3.2 Deliverables</h3>
            <p>
              The Freelancer will deliver the following items:
            </p>
            <ul>
              <li>[Deliverable 1]</li>
              <li>[Deliverable 2]</li>
              <li>[Deliverable 3]</li>
            </ul>

            <h3>3.3 Milestones</h3>
            <table>
              <thead>
                <tr>
                  <th>Milestone</th>
                  <th>Description</th>
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

            <h2>4. Payment Terms</h2>
            <h3>4.1 Total Compensation</h3>
            <p>
              The Client agrees to pay the Freelancer $[Total Amount] for the completion of all project deliverables.
            </p>

            <h3>4.2 Payment Schedule</h3>
            <p>
              Payments will be released according to the milestone schedule outlined above. Payments are subject to 49GIG's Payment Terms and service fees.
            </p>

            <h3>4.3 Milestone Approval</h3>
            <p>
              Each milestone must be approved by the Client before payment is released. The Client has 7 days to review and approve deliverables. If no response is received within 7 days, payment will be automatically released.
            </p>

            <h3>4.4 Revisions</h3>
            <p>
              The price includes [Number] rounds of revisions per deliverable. Additional revisions may incur extra charges to be agreed upon by both parties.
            </p>

            <h2>5. Timeline and Deadlines</h2>
            <h3>5.1 Completion Timeline</h3>
            <p>
              The Freelancer agrees to complete the project by [End Date]. Milestone deadlines are specified in Section 3.3.
            </p>

            <h3>5.2 Delays</h3>
            <p>
              If the Freelancer anticipates delays, they must notify the Client immediately. Delays caused by Client feedback, approvals, or provision of materials will extend deadlines accordingly.
            </p>

            <h3>5.3 Termination for Delay</h3>
            <p>
              If the Freelancer fails to meet deadlines without justification or communication, the Client may terminate the agreement and receive a refund for incomplete work.
            </p>

            <h2>6. Intellectual Property Rights</h2>
            <h3>6.1 Ownership Transfer</h3>
            <p>
              Upon full payment, all intellectual property rights in the work product, including copyrights, trademarks, and related rights, will transfer to the Client.
            </p>

            <h3>6.2 Pre-Existing Materials</h3>
            <p>
              The Freelancer retains ownership of pre-existing materials, tools, templates, or intellectual property used in the project. The Client receives a non-exclusive, perpetual license to use such materials as part of the final deliverable.
            </p>

            <h3>6.3 Third-Party Materials</h3>
            <p>
              The Freelancer warrants that all deliverables are original or that they have obtained proper licenses for any third-party materials used.
            </p>

            <h3>6.4 Portfolio Use</h3>
            <p>
              The Freelancer may display completed work in their portfolio unless the Client objects in writing or this Agreement includes a non-disclosure provision.
            </p>

            <h2>7. Confidentiality</h2>
            <h3>7.1 Confidential Information</h3>
            <p>
              The Freelancer agrees to keep all Client information, project details, and business data confidential and not to disclose such information to third parties.
            </p>

            <h3>7.2 Exceptions</h3>
            <p>
              Confidentiality obligations do not apply to information that:
            </p>
            <ul>
              <li>Is publicly available</li>
              <li>Was known to the Freelancer prior to disclosure</li>
              <li>Is independently developed by the Freelancer</li>
              <li>Must be disclosed by law or court order</li>
            </ul>

            <h3>7.3 Return of Materials</h3>
            <p>
              Upon project completion or termination, the Freelancer must return or destroy all confidential materials provided by the Client.
            </p>

            <h2>8. Warranties and Representations</h2>
            <h3>8.1 Freelancer Warranties</h3>
            <p>
              The Freelancer warrants that:
            </p>
            <ul>
              <li>Work will be performed professionally and competently</li>
              <li>Deliverables will meet the specifications outlined</li>
              <li>Work is original and does not infringe on third-party rights</li>
              <li>Freelancer has the right and authority to enter into this Agreement</li>
            </ul>

            <h3>8.2 Client Warranties</h3>
            <p>
              The Client warrants that:
            </p>
            <ul>
              <li>Funds are available to pay for the project</li>
              <li>Materials provided to Freelancer do not infringe on third-party rights</li>
              <li>Client has authority to enter into this Agreement</li>
            </ul>

            <h2>9. Independent Contractor Relationship</h2>
            <h3>9.1 No Employment</h3>
            <p>
              The Freelancer is an independent contractor, not an employee of the Client or 49GIG. This Agreement does not create an employment, partnership, or agency relationship.
            </p>

            <h3>9.2 Taxes and Benefits</h3>
            <p>
              The Freelancer is responsible for all taxes, insurance, and benefits. The Client will not withhold taxes or provide employee benefits.
            </p>

            <h3>9.3 Control and Supervision</h3>
            <p>
              The Freelancer controls the means and methods of work performance, subject to delivering the agreed-upon results.
            </p>

            <h2>10. Termination</h2>
            <h3>10.1 Termination by Client</h3>
            <p>
              The Client may terminate this Agreement at any time by providing written notice. The Freelancer will be paid for completed milestones and work in progress.
            </p>

            <h3>10.2 Termination by Freelancer</h3>
            <p>
              The Freelancer may terminate this Agreement with 7 days' notice. Payments for completed milestones remain due.
            </p>

            <h3>10.3 Termination for Cause</h3>
            <p>
              Either party may terminate immediately for material breach, fraud, or violation of this Agreement.
            </p>

            <h2>11. Liability and Indemnification</h2>
            <h3>11.1 Limitation of Liability</h3>
            <p>
              The Freelancer's liability is limited to the total amount paid under this Agreement.
            </p>

            <h3>11.2 Indemnification</h3>
            <p>
              The Freelancer agrees to indemnify the Client against claims arising from intellectual property infringement, breach of confidentiality, or negligent performance.
            </p>

            <h2>12. Dispute Resolution</h2>
            <h3>12.1 Good Faith Negotiations</h3>
            <p>
              The parties agree to attempt to resolve disputes through good faith negotiations.
            </p>

            <h3>12.2 Platform Mediation</h3>
            <p>
              If direct negotiations fail, either party may request 49GIG mediation support.
            </p>

            <h3>12.3 Arbitration</h3>
            <p>
              Unresolved disputes will be settled through binding arbitration in accordance with the laws of Nigeria.
            </p>

            <h2>13. General Provisions</h2>
            <h3>13.1 Entire Agreement</h3>
            <p>
              This Agreement constitutes the entire agreement between the parties and supersedes all prior agreements.
            </p>

            <h3>13.2 Amendments</h3>
            <p>
              Amendments must be made in writing and agreed upon by both parties through the 49GIG platform.
            </p>

            <h3>13.3 Governing Law</h3>
            <p>
              This Agreement is governed by the laws of Nigeria.
            </p>

            <h3>13.4 Severability</h3>
            <p>
              If any provision is found to be unenforceable, the remaining provisions remain in effect.
            </p>

            <h2>14. Signatures</h2>
            <p>
              By accepting this project on the 49GIG platform, both parties electronically sign and agree to be bound by this Agreement.
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

