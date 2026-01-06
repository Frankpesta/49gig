"use client";

import { PageHeader } from "@/components/marketing/page-header";
import { Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full">
      <PageHeader
        badge={{ icon: Shield, text: "Privacy Policy" }}
        title="Privacy Policy"
        description="Last updated: January 6, 2026"
      />

      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h2>1. Introduction</h2>
            <p>
              Welcome to 49GIG ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform at 49gig.com (the "Platform").
            </p>
            <p>
              By using the Platform, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, please do not use our Platform.
            </p>

            <h2>2. Information We Collect</h2>
            <h3>2.1 Personal Information</h3>
            <p>We collect personal information that you voluntarily provide to us when you:</p>
            <ul>
              <li>Register for an account</li>
              <li>Create a user profile</li>
              <li>Apply to become a freelancer</li>
              <li>Post a project or hire talent</li>
              <li>Make payments or receive payouts</li>
              <li>Contact us for support</li>
            </ul>
            <p>This information may include:</p>
            <ul>
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Physical address</li>
              <li>Date of birth</li>
              <li>Government-issued ID (for verification)</li>
              <li>Payment information (credit card, bank account details)</li>
              <li>Professional qualifications, skills, and work history</li>
              <li>Portfolio samples and work examples</li>
            </ul>

            <h3>2.2 Automatically Collected Information</h3>
            <p>When you use our Platform, we automatically collect certain information, including:</p>
            <ul>
              <li>IP address and location data</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Pages visited and time spent on pages</li>
              <li>Referring website addresses</li>
              <li>Clickstream data and usage patterns</li>
            </ul>

            <h3>2.3 Cookies and Tracking Technologies</h3>
            <p>
              We use cookies, web beacons, and similar tracking technologies to track activity on our Platform and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Platform.
            </p>

            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect for various purposes, including:</p>
            <ul>
              <li>To create and maintain your account</li>
              <li>To verify your identity and conduct vetting processes</li>
              <li>To match clients with suitable freelancers</li>
              <li>To facilitate contracts, payments, and project management</li>
              <li>To communicate with you about projects, updates, and support</li>
              <li>To process transactions and send transaction notifications</li>
              <li>To improve our Platform and user experience</li>
              <li>To detect, prevent, and address fraud and security issues</li>
              <li>To comply with legal obligations and enforce our terms</li>
              <li>To send marketing communications (with your consent)</li>
            </ul>

            <h2>4. How We Share Your Information</h2>
            <p>We may share your information in the following situations:</p>

            <h3>4.1 With Other Users</h3>
            <p>
              When you create a profile as a freelancer, certain information (name, skills, portfolio, ratings) will be visible to clients. When you post a project as a client, certain information may be visible to freelancers.
            </p>

            <h3>4.2 With Service Providers</h3>
            <p>
              We share information with third-party service providers who perform services on our behalf, including payment processing, identity verification, data analytics, email delivery, hosting services, and customer support.
            </p>

            <h3>4.3 For Legal Reasons</h3>
            <p>We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., court orders, government agencies).</p>

            <h3>4.4 Business Transfers</h3>
            <p>
              If we are involved in a merger, acquisition, asset sale, or bankruptcy, your information may be transferred as part of that transaction.
            </p>

            <h3>4.5 With Your Consent</h3>
            <p>We may share your information for any other purpose with your explicit consent.</p>

            <h2>5. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your information, we will securely delete or anonymize it.
            </p>

            <h2>6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>

            <h2>7. Your Privacy Rights</h2>
            <p>Depending on your location, you may have the following rights:</p>
            <ul>
              <li><strong>Access:</strong> Request access to the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request a copy of your information in a structured, machine-readable format</li>
              <li><strong>Objection:</strong> Object to certain processing of your information</li>
              <li><strong>Restriction:</strong> Request restriction of processing your information</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
            </ul>
            <p>
              To exercise these rights, please contact us at privacy@49gig.com. We will respond to your request within 30 days.
            </p>

            <h2>8. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
            </p>

            <h2>9. Children's Privacy</h2>
            <p>
              Our Platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>

            <h2>10. Third-Party Links</h2>
            <p>
              Our Platform may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.
            </p>

            <h2>11. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of the Platform after changes constitutes acceptance of the revised policy.
            </p>

            <h2>12. Contact Us</h2>
            <p>If you have questions or concerns about this Privacy Policy, please contact us:</p>
            <ul>
              <li><strong>Email:</strong> privacy@49gig.com</li>
              <li><strong>Address:</strong> 49GIG, Lagos, Nigeria</li>
              <li><strong>Phone:</strong> +234 (0) 123 456 7890</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

