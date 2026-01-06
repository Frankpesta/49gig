"use client";

import { PageHeader } from "@/components/marketing/page-header";
import { ShieldCheck } from "lucide-react";

export default function CodeOfConductPage() {
  return (
    <div className="w-full">
      <PageHeader
        badge={{ icon: ShieldCheck, text: "Code of Conduct" }}
        title="Code of Conduct & Platform Rules"
        description="Last updated: January 6, 2026"
      />

      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h2>1. Introduction</h2>
            <p>
              49GIG is committed to fostering a professional, respectful, and trustworthy community. This Code of Conduct outlines the standards of behavior expected from all users—both clients and freelancers.
            </p>

            <h2>2. Core Principles</h2>
            <h3>2.1 Professionalism</h3>
            <p>All users must:</p>
            <ul>
              <li>Communicate respectfully and professionally</li>
              <li>Deliver high-quality work as agreed</li>
              <li>Meet deadlines and commitments</li>
              <li>Respond promptly to messages and requests</li>
            </ul>

            <h3>2.2 Honesty and Integrity</h3>
            <ul>
              <li>Provide truthful and accurate information</li>
              <li>Represent skills and experience honestly</li>
              <li>Report genuine issues and concerns</li>
              <li>Avoid deceptive or misleading practices</li>
            </ul>

            <h3>2.3 Respect and Dignity</h3>
            <ul>
              <li>Treat all users with respect regardless of race, ethnicity, nationality, religion, gender, sexual orientation, age, or disability</li>
              <li>Avoid harassment, discrimination, or abusive behavior</li>
              <li>Value diverse perspectives and backgrounds</li>
            </ul>

            <h2>3. Prohibited Conduct</h2>
            <h3>3.1 Fraudulent Behavior</h3>
            <p>Users must not:</p>
            <ul>
              <li>Create fake accounts or impersonate others</li>
              <li>Submit false credentials, portfolios, or references</li>
              <li>Engage in payment fraud or chargeback abuse</li>
              <li>Manipulate ratings, reviews, or performance metrics</li>
            </ul>

            <h3>3.2 Harassment and Abuse</h3>
            <p>Users must not:</p>
            <ul>
              <li>Harass, threaten, or intimidate other users</li>
              <li>Use offensive, discriminatory, or hateful language</li>
              <li>Engage in unwanted romantic or sexual advances</li>
              <li>Bully or demean others</li>
            </ul>

            <h3>3.3 Intellectual Property Violations</h3>
            <p>Users must not:</p>
            <ul>
              <li>Submit plagiarized work</li>
              <li>Use copyrighted materials without permission</li>
              <li>Infringe on trademarks or patents</li>
              <li>Misrepresent ownership of work</li>
            </ul>

            <h3>3.4 Platform Manipulation</h3>
            <p>Users must not:</p>
            <ul>
              <li>Circumvent the platform to avoid fees</li>
              <li>Collude to manipulate matching or pricing systems</li>
              <li>Create multiple accounts to gain unfair advantages</li>
              <li>Use bots, scrapers, or automated tools</li>
            </ul>

            <h3>3.5 Spam and Solicitation</h3>
            <p>Users must not:</p>
            <ul>
              <li>Send unsolicited promotional messages</li>
              <li>Advertise competing services</li>
              <li>Solicit users for off-platform transactions</li>
              <li>Share contact information to bypass the platform</li>
            </ul>

            <h2>4. Client-Specific Rules</h2>
            <h3>4.1 Project Requirements</h3>
            <ul>
              <li>Provide clear, detailed project specifications</li>
              <li>Set realistic deadlines and expectations</li>
              <li>Respond to freelancer questions promptly</li>
              <li>Review deliverables within agreed timeframes</li>
            </ul>

            <h3>4.2 Payment Obligations</h3>
            <ul>
              <li>Fund milestones before work begins</li>
              <li>Approve completed work in a timely manner</li>
              <li>Provide constructive feedback on deliverables</li>
              <li>Honor contractual payment terms</li>
            </ul>

            <h3>4.3 Fair Treatment</h3>
            <ul>
              <li>Do not request excessive revisions beyond contract scope</li>
              <li>Respect freelancer expertise and professional judgment</li>
              <li>Provide honest, fair ratings and reviews</li>
            </ul>

            <h2>5. Freelancer-Specific Rules</h2>
            <h3>5.1 Skill Representation</h3>
            <ul>
              <li>Accurately represent your skills and experience</li>
              <li>Only accept projects within your capabilities</li>
              <li>Maintain an up-to-date, honest portfolio</li>
            </ul>

            <h3>5.2 Work Quality and Delivery</h3>
            <ul>
              <li>Deliver original, high-quality work</li>
              <li>Meet agreed-upon deadlines</li>
              <li>Communicate proactively about progress and issues</li>
              <li>Provide deliverables as specified in contracts</li>
            </ul>

            <h3>5.3 Professional Conduct</h3>
            <ul>
              <li>Maintain availability as indicated in your profile</li>
              <li>Respond to client messages within 24 hours</li>
              <li>Report issues or concerns immediately</li>
              <li>Complete projects or provide adequate notice if unable to continue</li>
            </ul>

            <h2>6. Communication Standards</h2>
            <h3>6.1 Professional Communication</h3>
            <ul>
              <li>Use clear, polite, and professional language</li>
              <li>Avoid excessive slang, jargon, or informal speech</li>
              <li>Proofread messages before sending</li>
              <li>Maintain professional boundaries</li>
            </ul>

            <h3>6.2 Dispute Communication</h3>
            <ul>
              <li>Address conflicts calmly and professionally</li>
              <li>Focus on facts and contract terms</li>
              <li>Avoid emotional or accusatory language</li>
              <li>Seek platform mediation if direct resolution fails</li>
            </ul>

            <h2>7. Privacy and Confidentiality</h2>
            <ul>
              <li>Respect the confidentiality of project information</li>
              <li>Do not share client information without permission</li>
              <li>Protect sensitive data and intellectual property</li>
              <li>Sign NDAs when required by clients</li>
            </ul>

            <h2>8. Enforcement</h2>
            <h3>8.1 Reporting Violations</h3>
            <p>
              Users who witness or experience violations of this Code of Conduct should report them immediately through the platform's reporting tools or by contacting support@49gig.com.
            </p>

            <h3>8.2 Investigation Process</h3>
            <p>
              All reports will be reviewed thoroughly. 49GIG may request additional information, review communications, and interview involved parties.
            </p>

            <h3>8.3 Consequences</h3>
            <p>Violations may result in:</p>
            <ul>
              <li>Warning and required corrective action</li>
              <li>Temporary account suspension</li>
              <li>Permanent account termination</li>
              <li>Withholding or forfeiture of payments</li>
              <li>Legal action in severe cases</li>
            </ul>

            <h2>9. Appeals</h2>
            <p>
              Users who believe enforcement actions were taken in error may appeal by contacting legal@49gig.com within 14 days of the action. Appeals will be reviewed by a separate team.
            </p>

            <h2>10. Updates to This Code</h2>
            <p>
              49GIG reserves the right to update this Code of Conduct at any time. Users will be notified of significant changes and continued use of the platform constitutes acceptance of the updated Code.
            </p>

            <h2>11. Contact</h2>
            <p>For questions or to report violations:</p>
            <ul>
              <li><strong>Email:</strong> conduct@49gig.com</li>
              <li><strong>Support:</strong> support@49gig.com</li>
              <li><strong>Legal:</strong> legal@49gig.com</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

