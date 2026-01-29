"use client";

import { PageHeader } from "@/components/marketing/page-header";
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="w-full">
      <PageHeader
        badge={{ icon: FileText, text: "Terms and Conditions" }}
        title="Terms and Conditions"
        description="Last updated: January 6, 2026"
      />

      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h2>1. Agreement to Terms</h2>
            <p>
              These Terms and Conditions ("Terms") constitute a legally binding agreement between you and 49GIG ("Company," "we," "our," or "us") governing your access to and use of the 49gig.com website and platform (collectively, the "Platform").
            </p>
            <p>
              By accessing or using the Platform, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Platform.
            </p>

            <h2>2. Eligibility</h2>
            <p>To use the Platform, you must:</p>
            <ul>
              <li>Be at least 18 years of age</li>
              <li>Have the legal capacity to enter into binding contracts</li>
              <li>Not be prohibited from using the Platform under applicable laws</li>
              <li>Provide accurate, current, and complete information during registration</li>
            </ul>

            <h2>3. User Accounts</h2>
            <h3>3.1 Account Creation</h3>
            <p>
              To access certain features, you must create an account. You agree to provide accurate information and keep your account information up to date.
            </p>

            <h3>3.2 Account Security</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must notify us immediately of any unauthorized use of your account.
            </p>

            <h3>3.3 Account Suspension and Termination</h3>
            <p>
              We reserve the right to suspend or terminate your account at any time, with or without notice, if we believe you have violated these Terms or engaged in fraudulent, abusive, or illegal conduct.
            </p>

            <h2>4. Platform Services</h2>
            <h3>4.1 General Description</h3>
            <p>
              49GIG is a marketplace platform connecting clients with vetted African freelancers. We facilitate connections, contracts, project management, and payments between clients and freelancers.
            </p>

            <h3>4.2 Role of 49GIG</h3>
            <p>
              49GIG acts as an intermediary platform. We do not employ freelancers, nor do we act as an agent for clients or freelancers. The contractual relationship for services is between the client and the freelancer.
            </p>

            <h3>4.3 Vetting Process</h3>
            <p>
              Freelancers undergo an automated vetting process including English proficiency and skills testing. While we strive to maintain high standards, we do not guarantee the quality, accuracy, or reliability of freelancer services.
            </p>

            <h2>5. User Obligations</h2>
            <h3>5.1 Prohibited Conduct</h3>
            <p>You agree not to:</p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights of others</li>
              <li>Post false, misleading, or fraudulent information</li>
              <li>Engage in harassment, abuse, or discriminatory behavior</li>
              <li>Circumvent the Platform to avoid fees</li>
              <li>Use the Platform for unauthorized commercial purposes</li>
              <li>Interfere with or disrupt the Platform's functionality</li>
              <li>Attempt to gain unauthorized access to Platform systems</li>
              <li>Use automated tools (bots, scrapers) without permission</li>
              <li>Solicit or spam other users</li>
            </ul>

            <h3>5.2 Content Standards</h3>
            <p>
              All content you post, upload, or submit must comply with applicable laws and must not contain illegal, offensive, defamatory, or infringing material.
            </p>

            <h2>6. Fees and Payments</h2>
            <h3>6.1 Service Fees</h3>
            <p>
              49GIG charges service fees for facilitating projects. Fee structures are outlined in our Pricing page and Payment Terms. Fees are subject to change with notice.
            </p>

            <h3>6.2 Payment Processing</h3>
            <p>
              Payments are processed through third-party payment processors. You agree to comply with their terms and policies.
            </p>

            <h3>6.3 Taxes</h3>
            <p>
              You are responsible for determining and paying all applicable taxes related to your use of the Platform and any payments you make or receive.
            </p>

            <h2>7. Intellectual Property</h2>
            <h3>7.1 Platform Content</h3>
            <p>
              The Platform and its original content, features, and functionality are owned by 49GIG and protected by international copyright, trademark, and other intellectual property laws.
            </p>

            <h3>7.2 User Content</h3>
            <p>
              You retain ownership of content you upload to the Platform. By uploading content, you grant 49GIG a non-exclusive, worldwide, royalty-free license to use, reproduce, modify, and display such content for the purpose of operating and improving the Platform.
            </p>

            <h3>7.3 Work Product</h3>
            <p>
              Intellectual property rights in work product created by freelancers are determined by the contract between the client and freelancer. 49GIG claims no ownership over such work product.
            </p>

            <h2>8. Dispute Resolution</h2>
            <h3>8.1 Disputes Between Users</h3>
            <p>
              Disputes between clients and freelancers should first be resolved directly between the parties. 49GIG may provide mediation support but is not obligated to resolve disputes.
            </p>

            <h3>8.2 Dispute Resolution Process</h3>
            <p>
              If a dispute cannot be resolved directly, either party may request 49GIG's dispute resolution support. Our decision in such matters is final and binding.
            </p>

            <h3>8.3 Arbitration</h3>
            <p>
              Any dispute arising out of or relating to these Terms or the Platform shall be resolved through binding arbitration in accordance with the laws of Nigeria.
            </p>

            <h2>9. Disclaimers and Limitations of Liability</h2>
            <h3>9.1 No Warranties</h3>
            <p>
              THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>

            <h3>9.2 Limitation of Liability</h3>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, 49GIG SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>

            <h3>9.3 Maximum Liability</h3>
            <p>
              Our total liability to you for any claims arising from your use of the Platform shall not exceed the amount of fees you paid to 49GIG in the 12 months preceding the claim.
            </p>

            <h2>10. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless 49GIG, its affiliates, officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses (including legal fees) arising out of or related to your use of the Platform, your violation of these Terms, or your violation of any rights of another party.
            </p>

            <h2>11. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on the Platform and updating the "Last updated" date. Your continued use of the Platform after changes constitutes acceptance of the modified Terms.
            </p>

            <h2>12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of Nigeria, without regard to its conflict of law provisions.
            </p>

            <h2>13. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
            </p>

            <h2>14. Entire Agreement</h2>
            <p>
              These Terms constitute the entire agreement between you and 49GIG regarding the use of the Platform and supersede all prior agreements and understandings.
            </p>

            <h2>15. Contact Information</h2>
            <p>For questions about these Terms, please contact us:</p>
            <ul>
              <li><strong>Email:</strong> legal@49gig.com</li>
              <li><strong>Address:</strong> 49GIG, Lagos, Nigeria</li>
              <li><strong>Phone:</strong> +234 (0) 123 456 7890</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

