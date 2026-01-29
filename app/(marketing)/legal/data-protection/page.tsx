"use client";

import { PageHeader } from "@/components/marketing/page-header";
import { Lock } from "lucide-react";

export default function DataProtectionPage() {
  return (
    <div className="w-full">
      <PageHeader
        badge={{ icon: Lock, text: "Data Protection" }}
        title="Data Protection Policy (GDPR Compliance)"
        description="Last updated: January 6, 2026"
      />

      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h2>1. Introduction</h2>
            <p>
              49GIG ("we," "our," or "us") is committed to protecting the personal data of all users, including those in the European Union (EU) and European Economic Area (EEA). This Data Protection Policy outlines how we comply with the General Data Protection Regulation (GDPR) and other applicable data protection laws.
            </p>

            <h2>2. Data Controller</h2>
            <p>
              49GIG acts as the data controller for personal data collected through our platform. Our contact details are:
            </p>
            <ul>
              <li><strong>Company Name:</strong> 49GIG</li>
              <li><strong>Address:</strong> Lagos, Nigeria</li>
              <li><strong>Email:</strong> privacy@49gig.com</li>
              <li><strong>DPO Email:</strong> dpo@49gig.com</li>
            </ul>

            <h2>3. Legal Basis for Processing</h2>
            <p>We process personal data under the following legal bases:</p>

            <h3>3.1 Contractual Necessity</h3>
            <p>
              Processing is necessary to perform our contract with you or to take steps at your request before entering into a contract (e.g., account creation, project matching, payment processing).
            </p>

            <h3>3.2 Legitimate Interests</h3>
            <p>
              Processing is necessary for our legitimate interests (e.g., fraud prevention, platform security, service improvement) provided it does not override your rights and interests.
            </p>

            <h3>3.3 Legal Obligation</h3>
            <p>
              Processing is necessary to comply with legal obligations (e.g., tax reporting, anti-money laundering).
            </p>

            <h3>3.4 Consent</h3>
            <p>
              Where required by law, we obtain your explicit consent before processing certain personal data (e.g., marketing communications, optional features).
            </p>

            <h2>4. Data We Collect</h2>
            <h3>4.1 Identity Data</h3>
            <ul>
              <li>Full name</li>
              <li>Date of birth</li>
              <li>Government-issued ID</li>
              <li>Photograph</li>
            </ul>

            <h3>4.2 Contact Data</h3>
            <ul>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Mailing address</li>
            </ul>

            <h3>4.3 Financial Data</h3>
            <ul>
              <li>Payment card details</li>
              <li>Bank account information</li>
              <li>Transaction history</li>
              <li>Tax information</li>
            </ul>

            <h3>4.4 Professional Data</h3>
            <ul>
              <li>Skills and expertise</li>
              <li>Work experience</li>
              <li>Portfolio samples</li>
              <li>Qualifications and certifications</li>
            </ul>

            <h3>4.5 Technical Data</h3>
            <ul>
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Cookie data</li>
            </ul>

            <h3>4.6 Usage Data</h3>
            <ul>
              <li>Platform activity</li>
              <li>Pages visited</li>
              <li>Search queries</li>
              <li>Communication history</li>
            </ul>

            <h2>5. How We Use Your Data</h2>
            <p>We process personal data for the following purposes:</p>
            <ul>
              <li>Account registration and management</li>
              <li>Freelancer verification and vetting (English and skills tests)</li>
              <li>Matching clients with freelancers</li>
              <li>Facilitating contracts and project management</li>
              <li>Processing payments and payouts</li>
              <li>Providing customer support</li>
              <li>Fraud prevention and security</li>
              <li>Platform improvement and analytics</li>
              <li>Legal compliance</li>
              <li>Marketing (with consent)</li>
            </ul>

            <h2>6. Data Sharing and Transfers</h2>
            <h3>6.1 Within the Platform</h3>
            <p>
              Profile information is shared with potential clients or freelancers as necessary for matching and project execution.
            </p>

            <h3>6.2 Service Providers</h3>
            <p>
              We share data with trusted third-party service providers who process data on our behalf, including:
            </p>
            <ul>
              <li>Payment processors</li>
              <li>Verification and vetting services</li>
              <li>Cloud hosting providers</li>
              <li>Email and communication services</li>
              <li>Analytics providers</li>
            </ul>

            <h3>6.3 Legal Requirements</h3>
            <p>
              We may disclose data to law enforcement, regulators, or other authorities when required by law or to protect our legal rights.
            </p>

            <h3>6.4 International Transfers</h3>
            <p>
              Your data may be transferred to countries outside the EU/EEA. We ensure appropriate safeguards are in place, including:
            </p>
            <ul>
              <li>EU Standard Contractual Clauses</li>
              <li>Adequacy decisions by the European Commission</li>
              <li>Binding Corporate Rules</li>
            </ul>

            <h2>7. Your Rights Under GDPR</h2>
            <p>You have the following rights regarding your personal data:</p>

            <h3>7.1 Right to Access</h3>
            <p>
              You can request a copy of all personal data we hold about you.
            </p>

            <h3>7.2 Right to Rectification</h3>
            <p>
              You can request correction of inaccurate or incomplete data.
            </p>

            <h3>7.3 Right to Erasure (Right to be Forgotten)</h3>
            <p>
              You can request deletion of your personal data in certain circumstances.
            </p>

            <h3>7.4 Right to Restriction</h3>
            <p>
              You can request that we temporarily suspend processing of your data.
            </p>

            <h3>7.5 Right to Data Portability</h3>
            <p>
              You can request your data in a structured, commonly used, machine-readable format.
            </p>

            <h3>7.6 Right to Object</h3>
            <p>
              You can object to processing based on legitimate interests or for direct marketing purposes.
            </p>

            <h3>7.7 Right to Withdraw Consent</h3>
            <p>
              Where processing is based on consent, you can withdraw consent at any time.
            </p>

            <h3>7.8 Right to Lodge a Complaint</h3>
            <p>
              You have the right to lodge a complaint with your local supervisory authority if you believe your data protection rights have been violated.
            </p>

            <h2>8. Exercising Your Rights</h2>
            <p>To exercise any of these rights, please contact us at:</p>
            <ul>
              <li><strong>Email:</strong> privacy@49gig.com or dpo@49gig.com</li>
              <li><strong>Subject Line:</strong> "GDPR Data Subject Request"</li>
            </ul>
            <p>
              We will respond to your request within 30 days. We may request additional information to verify your identity before processing your request.
            </p>

            <h2>9. Data Retention</h2>
            <p>
              We retain personal data for as long as necessary to fulfill the purposes for which it was collected, unless a longer retention period is required by law.
            </p>
            <ul>
              <li><strong>Active Accounts:</strong> Data retained while account is active</li>
              <li><strong>Inactive Accounts:</strong> Data may be deleted after 3 years of inactivity</li>
              <li><strong>Financial Records:</strong> Retained for 7 years for tax and legal compliance</li>
              <li><strong>Legal Disputes:</strong> Data retained until resolution and appeal period expires</li>
            </ul>

            <h2>10. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect personal data, including:
            </p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Access controls and authentication</li>
              <li>Regular security audits and assessments</li>
              <li>Employee training on data protection</li>
              <li>Incident response procedures</li>
            </ul>

            <h2>11. Data Breach Notification</h2>
            <p>
              In the event of a data breach that poses a risk to your rights and freedoms, we will notify you and the relevant supervisory authority within 72 hours of becoming aware of the breach.
            </p>

            <h2>12. Children's Data</h2>
            <p>
              Our platform is not intended for individuals under 18 years of age. We do not knowingly collect data from children. If we become aware that we have collected data from a child, we will delete it immediately.
            </p>

            <h2>13. Automated Decision-Making</h2>
            <p>
              We use automated systems to match clients with freelancers. You have the right to request human review of automated decisions that significantly affect you.
            </p>

            <h2>14. Updates to This Policy</h2>
            <p>
              We may update this Data Protection Policy from time to time. We will notify you of material changes by email or through a prominent notice on the platform.
            </p>

            <h2>15. Contact Information</h2>
            <p>For questions about data protection:</p>
            <ul>
              <li><strong>Data Protection Officer:</strong> dpo@49gig.com</li>
              <li><strong>Privacy Team:</strong> privacy@49gig.com</li>
              <li><strong>General Inquiries:</strong> legal@49gig.com</li>
            </ul>

            <h2>16. Supervisory Authority</h2>
            <p>
              If you are located in the EU/EEA, you have the right to lodge a complaint with your local data protection authority. A list of supervisory authorities is available at: <a href="https://edpb.europa.eu/about-edpb/board/members_en" target="_blank" rel="noopener noreferrer">https://edpb.europa.eu/about-edpb/board/members_en</a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

