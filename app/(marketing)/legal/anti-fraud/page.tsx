"use client";

import { PageHeader } from "@/components/marketing/page-header";
import { ShieldAlert } from "lucide-react";

export default function AntiFraudPage() {
  return (
    <div className="w-full">
      <PageHeader
        badge={{ icon: ShieldAlert, text: "Anti-Fraud Policy" }}
        title="Anti-Fraud & Anti-Money Laundering Policy"
        description="Last updated: January 6, 2026"
      />

      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h2>1. Introduction</h2>
            <p>
              49GIG is committed to maintaining a secure, trustworthy platform free from fraud, money laundering, and financial crime. This Anti-Fraud and Anti-Money Laundering (AML) Policy outlines our commitment to compliance and the measures we take to detect, prevent, and respond to fraudulent activity.
            </p>

            <h2>2. Scope and Applicability</h2>
            <p>
              This policy applies to all users of the 49GIG platform, including clients, freelancers, and any third parties conducting transactions through our services.
            </p>

            <h2>3. Regulatory Compliance</h2>
            <p>
              49GIG complies with applicable anti-fraud and anti-money laundering regulations, including:
            </p>
            <ul>
              <li>Nigerian Financial Intelligence Unit (NFIU) regulations</li>
              <li>Central Bank of Nigeria (CBN) AML guidelines</li>
              <li>International Financial Action Task Force (FATF) recommendations</li>
              <li>Local and international payment regulations</li>
            </ul>

            <h2>4. Know Your Customer (KYC) Procedures</h2>
            <h3>4.1 Freelancer Verification</h3>
            <p>
              Freelancers must complete English proficiency and skills testing before accessing platform features. Verification includes:
            </p>
            <ul>
              <li>English proficiency test (grammar, comprehension, writing)</li>
              <li>Skills assessments (coding, MCQ, or portfolio as applicable)</li>
              <li>Minimum score requirements; accounts may be removed if requirements are not met</li>
            </ul>

            <h3>4.2 Enhanced Due Diligence</h3>
            <p>
              We may conduct enhanced due diligence for:
            </p>
            <ul>
              <li>High-value transactions</li>
              <li>Users from high-risk jurisdictions</li>
              <li>Unusual or suspicious activity patterns</li>
              <li>Politically exposed persons (PEPs)</li>
            </ul>

            <h3>4.3 Business Verification</h3>
            <p>
              Corporate clients must provide:
            </p>
            <ul>
              <li>Business registration documents</li>
              <li>Tax identification numbers</li>
              <li>Beneficial ownership information</li>
              <li>Authorized signatory details</li>
            </ul>

            <h2>5. Prohibited Activities</h2>
            <h3>5.1 Fraudulent Conduct</h3>
            <p>The following activities are strictly prohibited:</p>
            <ul>
              <li>Creating fake accounts or using false identities</li>
              <li>Submitting fraudulent credentials, portfolios, or work samples</li>
              <li>Payment fraud, including stolen credit cards or unauthorized transactions</li>
              <li>Chargeback fraud or abuse</li>
              <li>Phishing, social engineering, or impersonation</li>
              <li>Manipulating ratings, reviews, or platform systems</li>
            </ul>

            <h3>5.2 Money Laundering</h3>
            <p>Users must not:</p>
            <ul>
              <li>Use the platform to launder proceeds of crime</li>
              <li>Structure transactions to avoid reporting thresholds</li>
              <li>Facilitate transactions on behalf of sanctioned individuals or entities</li>
              <li>Use the platform for terrorist financing</li>
            </ul>

            <h3>5.3 Prohibited Transactions</h3>
            <p>Transactions involving the following are prohibited:</p>
            <ul>
              <li>Illegal goods or services</li>
              <li>Gambling or gaming services (where prohibited)</li>
              <li>Adult or explicit content services</li>
              <li>Pharmaceuticals or controlled substances</li>
              <li>Weapons or explosives</li>
              <li>Ponzi schemes or pyramid schemes</li>
            </ul>

            <h2>6. Transaction Monitoring</h2>
            <h3>6.1 Automated Monitoring</h3>
            <p>
              We use automated systems to monitor transactions for suspicious patterns, including:
            </p>
            <ul>
              <li>Unusual transaction volumes or frequencies</li>
              <li>Rapid movement of funds</li>
              <li>Transactions inconsistent with user profiles</li>
              <li>Multiple accounts linked to the same individual</li>
              <li>Connections to high-risk jurisdictions</li>
            </ul>

            <h3>6.2 Manual Review</h3>
            <p>
              Flagged transactions are subject to manual review by our compliance team. We may request additional information or documentation to verify transaction legitimacy.
            </p>

            <h3>6.3 Transaction Limits</h3>
            <p>
              We may impose transaction limits based on:
            </p>
            <ul>
              <li>User verification level</li>
              <li>Account age and history</li>
              <li>Risk assessment</li>
              <li>Regulatory requirements</li>
            </ul>

            <h2>7. Suspicious Activity Reporting</h2>
            <h3>7.1 Internal Reporting</h3>
            <p>
              Employees who identify suspicious activity must immediately report it to the Compliance Officer.
            </p>

            <h3>7.2 Regulatory Reporting</h3>
            <p>
              We are required to file Suspicious Activity Reports (SARs) with relevant authorities when we detect potential money laundering or fraud. Users will not be notified of such reports to avoid tipping off potential criminals.
            </p>

            <h3>7.3 User Reporting</h3>
            <p>
              Users who suspect fraudulent activity should report it immediately to fraud@49gig.com or through the platform's reporting tools.
            </p>

            <h2>8. Sanctions Screening</h2>
            <p>
              We screen all users against international sanctions lists, including:
            </p>
            <ul>
              <li>United Nations Security Council (UNSC) sanctions</li>
              <li>US Office of Foreign Assets Control (OFAC)</li>
              <li>European Union (EU) sanctions</li>
              <li>UK HM Treasury sanctions</li>
            </ul>
            <p>
              Users matching sanctioned individuals or entities will be prohibited from using the platform.
            </p>

            <h2>9. Record Keeping</h2>
            <p>
              We maintain detailed records of:
            </p>
            <ul>
              <li>Verification and vetting results (English and skills scores)</li>
              <li>Transaction history and details</li>
              <li>Communications and correspondence</li>
              <li>Suspicious activity reports</li>
              <li>Compliance investigations</li>
            </ul>
            <p>
              Records are retained for a minimum of 7 years or as required by applicable law.
            </p>

            <h2>10. Consequences of Violations</h2>
            <h3>10.1 Account Actions</h3>
            <p>
              Violations of this policy may result in:
            </p>
            <ul>
              <li>Immediate account suspension or termination</li>
              <li>Withholding or forfeiture of funds</li>
              <li>Permanent ban from the platform</li>
              <li>Reporting to law enforcement authorities</li>
            </ul>

            <h3>10.2 Legal Action</h3>
            <p>
              49GIG reserves the right to pursue civil or criminal action against users engaged in fraud, money laundering, or financial crime. We cooperate fully with law enforcement investigations.
            </p>

            <h3>10.3 Recovery of Losses</h3>
            <p>
              We may seek to recover losses resulting from fraudulent activity, including legal fees and investigation costs.
            </p>

            <h2>11. User Responsibilities</h2>
            <p>All users must:</p>
            <ul>
              <li>Provide accurate and truthful information</li>
              <li>Maintain the security of their accounts</li>
              <li>Report unauthorized access or suspicious activity immediately</li>
              <li>Cooperate with verification and compliance requests</li>
              <li>Not facilitate or participate in fraudulent schemes</li>
            </ul>

            <h2>12. Red Flags for Fraud</h2>
            <p>Be aware of common fraud indicators:</p>
            <ul>
              <li>Requests to transact outside the platform</li>
              <li>Unusual urgency or pressure to complete transactions</li>
              <li>Offers that seem too good to be true</li>
              <li>Requests for personal or financial information</li>
              <li>Poor communication or inconsistent information</li>
              <li>Refusal to complete verification tests</li>
            </ul>

            <h2>13. Training and Awareness</h2>
            <p>
              49GIG provides regular training to employees on fraud detection, AML compliance, and suspicious activity reporting. Users are encouraged to educate themselves on fraud prevention best practices.
            </p>

            <h2>14. Third-Party Service Providers</h2>
            <p>
              We work with reputable third-party service providers for payment processing and fraud detection. All service providers are required to comply with applicable AML and fraud prevention regulations.
            </p>

            <h2>15. Updates to This Policy</h2>
            <p>
              We may update this Anti-Fraud and AML Policy from time to time to reflect changes in regulations, industry best practices, or platform operations. Users will be notified of material changes.
            </p>

            <h2>16. Contact Information</h2>
            <p>For questions or to report suspicious activity:</p>
            <ul>
              <li><strong>Fraud Team:</strong> fraud@49gig.com</li>
              <li><strong>Compliance Officer:</strong> compliance@49gig.com</li>
              <li><strong>Support:</strong> support@49gig.com</li>
              <li><strong>Legal:</strong> legal@49gig.com</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

