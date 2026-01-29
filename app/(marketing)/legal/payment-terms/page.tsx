"use client";

import { PageHeader } from "@/components/marketing/page-header";
import { DollarSign } from "lucide-react";

export default function PaymentTermsPage() {
  return (
    <div className="w-full">
      <PageHeader
        badge={{ icon: DollarSign, text: "Payment Terms" }}
        title="Payment Terms & Conditions"
        description="Last updated: January 6, 2026"
      />

      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h2>1. Overview</h2>
            <p>
              These Payment Terms govern all financial transactions on the 49GIG platform, including project payments, service fees, freelancer payouts, and related financial operations.
            </p>

            <h2>2. Service Fees</h2>
            <h3>2.1 Platform Fees</h3>
            <p>
              49GIG charges service fees for facilitating connections and managing projects:
            </p>
            <ul>
              <li><strong>Client Service Fee:</strong> 5% of total project value</li>
              <li><strong>Freelancer Service Fee:</strong> 10% of earnings (sliding scale for high earners)</li>
            </ul>

            <h3>2.2 Fee Structure Tiers</h3>
            <p>Freelancer fees decrease with cumulative lifetime earnings:</p>
            <ul>
              <li>$0 - $10,000: 10% fee</li>
              <li>$10,001 - $50,000: 8% fee</li>
              <li>$50,001+: 5% fee</li>
            </ul>

            <h3>2.3 Fee Changes</h3>
            <p>
              49GIG reserves the right to modify fee structures with 30 days' notice. Active projects are subject to the fees in effect when the project began.
            </p>

            <h2>3. Payment Methods</h2>
            <h3>3.1 Accepted Payment Methods</h3>
            <p>Clients can fund projects using:</p>
            <ul>
              <li>Credit cards (Visa, Mastercard, American Express)</li>
              <li>Debit cards</li>
              <li>Bank transfers</li>
              <li>PayPal</li>
              <li>Cryptocurrency (select currencies)</li>
            </ul>

            <h3>3.2 Payment Currency</h3>
            <p>
              All transactions are processed in USD unless otherwise specified. Currency conversion fees may apply.
            </p>

            <h3>3.3 Payment Processing</h3>
            <p>
              Payments are processed through third-party payment processors. By using the platform, you agree to comply with their terms and conditions.
            </p>

            <h2>4. Project Funding and Escrow</h2>
            <h3>4.1 Upfront Funding Requirement</h3>
            <p>
              Clients must fund the full project amount (including platform fees) in escrow before freelancers begin work.
            </p>

            <h3>4.2 Escrow Protection</h3>
            <p>
              Funds are held securely in escrow and released to freelancers only upon:
            </p>
            <ul>
              <li>Client approval of completed milestones</li>
              <li>Automatic release after dispute resolution</li>
              <li>Mutual agreement between parties</li>
            </ul>

            <h3>4.3 Milestone Structure</h3>
            <p>
              Projects are divided into milestones. Each milestone must be funded before work begins on that phase.
            </p>

            <h2>5. Payment Release and Approval</h2>
            <h3>5.1 Milestone Approval</h3>
            <p>
              Clients have 7 days to review and approve milestone deliverables. Approval triggers payment release to the freelancer.
            </p>

            <h3>5.2 Automatic Release</h3>
            <p>
              If a client does not respond within 7 days of milestone submission, funds are automatically released to the freelancer.
            </p>

            <h3>5.3 Revision Requests</h3>
            <p>
              Clients may request revisions within the scope of the original contract. Excessive or out-of-scope revision requests may require additional payment.
            </p>

            <h3>5.4 Disputed Milestones</h3>
            <p>
              If a client disputes a milestone, they must provide specific reasons and evidence. The dispute resolution process is initiated, and funds remain in escrow until resolution.
            </p>

            <h2>6. Freelancer Payouts</h2>
            <h3>6.1 Withdrawal Methods</h3>
            <p>Freelancers can withdraw earnings via:</p>
            <ul>
              <li>Bank transfer</li>
              <li>PayPal</li>
              <li>Payoneer</li>
              <li>Cryptocurrency</li>
              <li>Mobile money (select countries)</li>
            </ul>

            <h3>6.2 Minimum Withdrawal Amount</h3>
            <p>
              The minimum withdrawal amount is $50 to reduce processing fees.
            </p>

            <h3>6.3 Withdrawal Fees</h3>
            <p>
              Withdrawal fees vary by method and destination:
            </p>
            <ul>
              <li>Bank transfer: $2 - $10 depending on country</li>
              <li>PayPal: 2% + $0.30</li>
              <li>Payoneer: $3</li>
              <li>Cryptocurrency: Network fees apply</li>
            </ul>

            <h3>6.4 Processing Time</h3>
            <p>
              Withdrawals are processed within:
            </p>
            <ul>
              <li>Bank transfer: 3-7 business days</li>
              <li>PayPal: 1-3 business days</li>
              <li>Payoneer: 2-5 business days</li>
              <li>Cryptocurrency: 1-24 hours</li>
            </ul>

            <h2>7. Taxes and Compliance</h2>
            <h3>7.1 Tax Responsibility</h3>
            <p>
              Users are solely responsible for determining and paying all applicable taxes on platform earnings or project payments.
            </p>

            <h3>7.2 Tax Reporting</h3>
            <p>
              49GIG may be required to report payments to tax authorities. We will provide necessary tax documentation (e.g., 1099 forms for US users) as required by law.
            </p>

            <h3>7.3 Withholding Taxes</h3>
            <p>
              For users in certain jurisdictions, we may be required to withhold taxes on payments. Withheld amounts will be remitted to the appropriate tax authorities.
            </p>

            <h2>8. Refunds and Cancellations</h2>
            <p>
              Refund eligibility is governed by our Refund and Cancellation Policy. Please review that policy for detailed information.
            </p>

            <h2>9. Failed Payments and Insufficient Funds</h2>
            <h3>9.1 Payment Failures</h3>
            <p>
              If a client's payment method fails, we will attempt to re-process the payment. Projects will be paused until funding is successful.
            </p>

            <h3>9.2 Insufficient Funds</h3>
            <p>
              Clients must maintain sufficient funds in escrow for all active milestones. Insufficient funds may result in project suspension.
            </p>

            <h2>10. Chargebacks and Disputes</h2>
            <h3>10.1 Chargeback Policy</h3>
            <p>
              Initiating a chargeback without first using the platform's dispute resolution process violates our Terms and may result in account suspension and legal action.
            </p>

            <h3>10.2 Chargeback Fees</h3>
            <p>
              If a chargeback is initiated, a $25 administrative fee will be assessed. If the chargeback is found to be fraudulent, additional penalties may apply.
            </p>

            <h2>11. Payment Security</h2>
            <h3>11.1 Data Protection</h3>
            <p>
              Payment information is encrypted and processed through PCI-DSS compliant payment processors. 49GIG does not store complete payment card details.
            </p>

            <h3>11.2 Fraud Prevention</h3>
            <p>
              We use advanced fraud detection systems to protect against unauthorized transactions. Suspicious activity may result in payment holds or account review.
            </p>

            <h2>12. Bonus and Tip Payments</h2>
            <h3>12.1 Bonus Payments</h3>
            <p>
              Clients may award bonus payments to freelancers for exceptional work. Bonuses are subject to platform service fees.
            </p>

            <h3>12.2 Tips</h3>
            <p>
              Tips are optional payments and are subject to freelancer service fees.
            </p>

            <h2>13. Currency Conversion</h2>
            <h3>13.1 Exchange Rates</h3>
            <p>
              Currency conversions are performed at market exchange rates plus a conversion fee (typically 2-3%).
            </p>

            <h3>13.2 Conversion Timing</h3>
            <p>
              Exchange rates are locked at the time of transaction initiation.
            </p>

            <h2>14. Payment Holds</h2>
            <h3>14.1 Reasons for Holds</h3>
            <p>
              Payments may be held for:
            </p>
            <ul>
              <li>Verification requirements</li>
              <li>Suspected fraud or unusual activity</li>
              <li>Pending dispute resolution</li>
              <li>Compliance investigations</li>
              <li>Chargebacks or payment reversals</li>
            </ul>

            <h3>14.2 Hold Duration</h3>
            <p>
              Payment holds typically last 7-30 days depending on the reason. Users will be notified of holds and provided with resolution steps.
            </p>

            <h2>15. International Payments</h2>
            <h3>15.1 Cross-Border Fees</h3>
            <p>
              International payments may incur additional fees from payment processors, banks, or intermediary institutions.
            </p>

            <h3>15.2 Compliance</h3>
            <p>
              International payments are subject to applicable regulations, including sanctions, AML requirements, and foreign exchange controls.
            </p>

            <h2>16. Contact Information</h2>
            <p>For payment-related questions or issues:</p>
            <ul>
              <li><strong>Billing Team:</strong> billing@49gig.com</li>
              <li><strong>Payment Support:</strong> payments@49gig.com</li>
              <li><strong>General Support:</strong> support@49gig.com</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

