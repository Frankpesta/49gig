"use client";

import { PageHeader } from "@/components/marketing/page-header";
import { RefreshCw } from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <div className="w-full">
      <PageHeader
        badge={{ icon: RefreshCw, text: "Refund Policy" }}
        title="Refund & Cancellation Policy"
        description="Last updated: January 6, 2026"
      />

      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h2>1. Overview</h2>
            <p>
              This Refund and Cancellation Policy outlines the conditions under which clients may receive refunds and how project cancellations are handled on the 49GIG platform.
            </p>

            <h2>2. Service Fees</h2>
            <h3>2.1 Non-Refundable Service Fees</h3>
            <p>
              Platform service fees charged by 49GIG are generally non-refundable once a project has commenced and contracts have been signed.
            </p>

            <h3>2.2 Exceptions</h3>
            <p>
              Service fees may be refunded in the following circumstances:
            </p>
            <ul>
              <li>Technical error or duplicate charge</li>
              <li>49GIG fails to match you with a freelancer within the agreed timeframe</li>
              <li>Freelancer is unable to commence work after contract signing</li>
            </ul>

            <h2>3. Project Payments</h2>
            <h3>3.1 Milestone-Based System</h3>
            <p>
              All project payments are held in escrow and released to freelancers upon milestone completion and client approval.
            </p>

            <h3>3.2 Refund Eligibility for Project Work</h3>
            <p>Clients may be eligible for refunds if:</p>
            <ul>
              <li>The freelancer fails to deliver agreed-upon work</li>
              <li>Deliverables do not meet the specifications outlined in the contract</li>
              <li>The freelancer abandons the project without notice</li>
              <li>Work delivered contains plagiarism or copyright infringement</li>
            </ul>

            <h3>3.3 Non-Refundable Situations</h3>
            <p>Refunds will not be provided in the following cases:</p>
            <ul>
              <li>Client dissatisfaction based on subjective preferences not outlined in contract</li>
              <li>Changes in project scope or requirements after contract signing</li>
              <li>Client's failure to provide necessary information or feedback</li>
              <li>Milestones already approved and paid</li>
            </ul>

            <h2>4. Cancellation Policy</h2>
            <h3>4.1 Cancellation Before Work Begins</h3>
            <p>
              If a project is cancelled before work begins and no contract has been signed, a full refund of project funds (minus platform fees) will be issued within 5-7 business days.
            </p>

            <h3>4.2 Cancellation After Work Begins</h3>
            <p>
              Once work has commenced:
            </p>
            <ul>
              <li>Completed and approved milestones are non-refundable</li>
              <li>In-progress milestones will be evaluated for partial completion</li>
              <li>Remaining unstarted milestones may be refunded</li>
            </ul>

            <h3>4.3 Mutual Cancellation</h3>
            <p>
              If both client and freelancer mutually agree to cancel the project, funds will be distributed fairly based on work completed and documented progress.
            </p>

            <h2>5. Dispute Resolution</h2>
            <h3>5.1 Initiating a Dispute</h3>
            <p>
              If you believe you are entitled to a refund, you must initiate a dispute through the 49GIG platform within 14 days of the issue occurring.
            </p>

            <h3>5.2 Review Process</h3>
            <p>
              49GIG will review all evidence, communications, deliverables, and contract terms. Both parties will have the opportunity to present their case.
            </p>

            <h3>5.3 Resolution Timeline</h3>
            <p>
              Disputes are typically resolved within 10-15 business days. Complex cases may take longer.
            </p>

            <h2>6. Refund Processing</h2>
            <h3>6.1 Approved Refunds</h3>
            <p>
              If a refund is approved, funds will be returned to the original payment method within 7-10 business days.
            </p>

            <h3>6.2 Partial Refunds</h3>
            <p>
              In cases where work has been partially completed, 49GIG may approve partial refunds based on the work delivered and accepted.
            </p>

            <h2>7. Freelancer Withdrawals</h2>
            <h3>7.1 Earned Payments</h3>
            <p>
              Freelancers may withdraw earned funds (approved milestones) at any time, subject to payment processing timelines.
            </p>

            <h3>7.2 Withdrawal Fees</h3>
            <p>
              Withdrawal fees may apply depending on the payment method and destination country. These fees are non-refundable.
            </p>

            <h2>8. Chargebacks</h2>
            <h3>8.1 Prohibited Action</h3>
            <p>
              Initiating a chargeback with your payment provider without first attempting to resolve the issue through 49GIG's dispute resolution process is a violation of our Terms and Conditions.
            </p>

            <h3>8.2 Consequences</h3>
            <p>
              Chargebacks may result in account suspension or termination, withholding of funds, and legal action to recover losses.
            </p>

            <h2>9. Exceptions and Special Circumstances</h2>
            <p>
              49GIG reserves the right to make exceptions to this policy on a case-by-case basis for extraordinary circumstances, including:
            </p>
            <ul>
              <li>Natural disasters or emergencies</li>
              <li>Serious illness or death</li>
              <li>Platform technical failures</li>
              <li>Fraud or security breaches</li>
            </ul>

            <h2>10. Changes to This Policy</h2>
            <p>
              We reserve the right to modify this Refund and Cancellation Policy at any time. Changes will be posted on this page with an updated "Last updated" date.
            </p>

            <h2>11. Contact Us</h2>
            <p>For refund requests or questions about this policy, please contact:</p>
            <ul>
              <li><strong>Email:</strong> billing@49gig.com</li>
              <li><strong>Support:</strong> support@49gig.com</li>
              <li><strong>Phone:</strong> +234 (0) 123 456 7890</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

