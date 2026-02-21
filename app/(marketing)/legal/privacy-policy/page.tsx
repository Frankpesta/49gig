"use client";

import { PageHero } from "@/components/marketing/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

type PrivacySection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

const sections: PrivacySection[] = [
  {
    id: "1",
    title: "Information We Collect",
    paragraphs: [
      "We collect information necessary to operate a secure, trusted, and efficient talent platform.",
      "When you register or use the Platform, we may collect personal and project-related information.",
      "When you use the Platform, we may also collect technical and usage data automatically.",
    ],
    bullets: [
      "Full name, email address, phone number, country of residence",
      "Profile data (skills, experience, portfolio, work history)",
      "Payment/payout details (processed securely by third-party providers)",
      "Identification documents for verification and vetting",
      "Project details, messages, and platform communications",
      "IP address, device/browser info, logs, and cookie/tracking data",
    ],
  },
  {
    id: "2",
    title: "How We Use Your Information",
    bullets: [
      "Create and manage user accounts",
      "Match clients with vetted freelancers or teams",
      "Process payments, escrow, and withdrawals",
      "Conduct freelancer vetting and verification",
      "Enable contracts, milestones, and project delivery",
      "Provide support and dispute resolution",
      "Improve performance and security",
      "Prevent fraud, abuse, and unauthorized access",
      "Comply with legal and regulatory obligations",
      "We do not sell your personal data.",
    ],
  },
  {
    id: "3",
    title: "Legal Basis for Processing",
    bullets: [
      "Your consent",
      "Performance of a contract",
      "Legal obligations",
      "Legitimate business interests (security, fraud prevention, improvement)",
    ],
  },
  {
    id: "4",
    title: "Sharing of Information",
    paragraphs: ["We only share information when necessary and responsibly."],
    bullets: [
      "With other users where needed to complete projects",
      "With trusted service providers (payments, verification, hosting, analytics, security)",
      "When required by law, court order, or to protect legal rights and platform safety",
    ],
  },
  {
    id: "5",
    title: "Data Retention",
    bullets: [
      "We retain personal information only as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce agreements.",
      "When data is no longer required, it is securely deleted or anonymized.",
    ],
  },
  {
    id: "6",
    title: "Data Security",
    paragraphs: ["49GIG implements industry-standard security measures, including:"],
    bullets: [
      "Encrypted data storage and transmission",
      "Secure access controls",
      "Regular monitoring for unauthorized activity",
      "While no system is 100% secure, we take reasonable steps to protect your information.",
    ],
  },
  {
    id: "7",
    title: "Cookies and Tracking Technologies",
    paragraphs: ["We use cookies to enable functionality, improve services, and remember preferences."],
    bullets: [
      "Essential platform functionality",
      "Usage analysis and performance improvement",
      "Preference storage",
      "You can control cookies in your browser settings; some features may not work fully without cookies.",
    ],
  },
  {
    id: "8",
    title: "Your Rights",
    paragraphs: ["Depending on your location, you may have the right to:"],
    bullets: [
      "Access your personal data",
      "Correct inaccurate information",
      "Request deletion of your data",
      "Object to or restrict processing",
      "Withdraw consent at any time",
      "Requests can be made via support@49gig.com.",
    ],
  },
  {
    id: "9",
    title: "International Data Transfers",
    paragraphs: [
      "Your information may be processed and stored in countries outside your own. We apply appropriate safeguards in line with this Privacy Policy.",
    ],
  },
  {
    id: "10",
    title: "Children's Privacy",
    paragraphs: [
      "49GIG is not intended for individuals under 18 years old. We do not knowingly collect data from minors.",
    ],
  },
  {
    id: "11",
    title: "Changes to This Privacy Policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. Updates are posted on this page with a revised Last Updated date. Continued use of the Platform constitutes acceptance.",
    ],
  },
  {
    id: "12",
    title: "Contact Us",
    bullets: ["Email: support@49gig.com", "Company: 49GIG", "Address: Abuja, Nigeria", "Phone: +2349167656835"],
  },
];

export default function PrivacyPolicyPage() {
  const breadcrumbs = [{ label: "Legal", href: "/legal/terms" }, { label: "Privacy", icon: Shield }];

  return (
    <div className="w-full">
      <PageHero
        title="Privacy Policy"
        description="How 49GIG collects, uses, stores, and protects your data."
        badge={{ icon: Shield, text: "Legal" }}
        breadcrumbs={breadcrumbs}
        imageSrc="https://images.unsplash.com/photo-1633265486064-086b219458ec?w=800&q=80"
        imageAlt="Privacy and data security"
      />

      <section className="py-14 sm:py-18 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border/60 bg-background/90 p-6 sm:p-8">
            <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Privacy Policy</h1>
            <p className="mt-2 text-sm text-muted-foreground">Last Updated: 1st March, 2026</p>
            <p className="mt-5 text-muted-foreground">
              49GIG ("we", "our", "us") is committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, store, share, and protect your information when you use our platform, website, and services.
            </p>
            <p className="mt-3 text-muted-foreground">
              By accessing or using 49GIG, you agree to the collection and use of information in accordance with this Privacy Policy.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#section-${section.id}`}
                className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm text-foreground transition hover:bg-primary/10"
              >
                {section.id}. {section.title}
              </a>
            ))}
          </div>

          <div className="mt-8 space-y-4">
            {sections.map((section) => (
              <Card key={section.id} id={`section-${section.id}`} className="scroll-mt-24 border-border/60">
                <CardContent className="p-6 sm:p-7">
                  <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
                    {section.id}. {section.title}
                  </h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={`${section.id}-${paragraph}`} className="mt-3 text-muted-foreground leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets && (
                    <ul className="mt-4 space-y-2">
                      {section.bullets.map((bullet) => (
                        <li key={`${section.id}-${bullet}`} className="flex items-start gap-2 text-muted-foreground">
                          <span className="mt-1 text-primary">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
