"use client";

import { PageHero } from "@/components/marketing/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

type TermsSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

const sections: TermsSection[] = [
  {
    id: "1",
    title: "Definitions",
    bullets: [
      "Client: Any individual or company that creates a project to hire talent through 49GIG.",
      "Freelancer: Any independent professional providing services through 49GIG.",
      "Project: Any engagement created by a Client on the Platform.",
      "Milestone: A defined stage of work tied to a payment release.",
      "Escrow: Funds held securely by 49GIG until milestones are approved.",
    ],
  },
  {
    id: "2",
    title: "Platform Role",
    paragraphs: [
      "49GIG is a talent marketplace and project facilitation platform. We are not an employer, agent, or partner of Clients or Freelancers.",
    ],
    bullets: [
      "Freelancers are independent contractors, not employees of 49GIG.",
      "Clients contract directly with Freelancers through the Platform under agreed terms.",
    ],
  },
  {
    id: "3",
    title: "Eligibility",
    paragraphs: ["To use 49GIG, you must:"],
    bullets: [
      "Be at least 18 years old",
      "Have the legal capacity to enter into contracts",
      "Provide accurate and complete information during registration",
    ],
  },
  {
    id: "4",
    title: "Accounts & Access",
    bullets: [
      "Each user may maintain one account only.",
      "You are responsible for all activity under your account.",
      "You must keep your login credentials secure.",
      "49GIG may suspend or terminate accounts for violations of these Terms.",
    ],
  },
  {
    id: "5",
    title: "Project Creation & Engagement",
    bullets: [
      "Clients create projects by selecting engagement type, duration, and experience level.",
      "49GIG matches projects with vetted Freelancers or Teams.",
      "Where applicable, Clients may request optional pre-project discussions or interviews, but these are not required to proceed.",
      "All projects must be managed entirely through the Platform.",
    ],
  },
  {
    id: "6",
    title: "Payments & Fees",
    bullets: [
      "All payments must be made through 49GIG.",
      "Funds are deposited into escrow before work begins.",
      "Payments are released upon milestone approval.",
      "49GIG charges a 25% platform fee on the total project value.",
      "Freelancers receive 75% of the total project value.",
    ],
  },
  {
    id: "7",
    title: "Non-Circumvention (No Bypassing the Platform)",
    paragraphs: [
      "Users agree not to bypass 49GIG by engaging or attempting to engage Clients or Freelancers outside the Platform for work originating on 49GIG.",
      "This clause applies during the project and for a reasonable period after project completion.",
    ],
    bullets: [
      "Immediate account suspension or termination",
      "A penalty equal to 100% of the project value",
      "Recovery of unpaid platform fees",
      "Legal action where applicable",
    ],
  },
  {
    id: "8",
    title: "Intellectual Property",
    bullets: [
      "Upon full payment of approved milestones, all deliverables become the Client's intellectual property, unless otherwise agreed in writing.",
      "Freelancers retain ownership of work until payment is completed.",
      "Portfolio usage by Freelancers requires Client consent.",
    ],
  },
  {
    id: "9",
    title: "Confidentiality",
    paragraphs: ["All parties agree to keep confidential:"],
    bullets: [
      "Project details",
      "Business information",
      "Intellectual property",
      "Any non-public data shared during a project",
      "Confidentiality obligations survive project completion or termination.",
    ],
  },
  {
    id: "10",
    title: "Disputes & Resolution",
    bullets: [
      "49GIG provides a dispute resolution process for conflicts.",
      "Decisions are based on project scope, milestones, communication, and delivered work.",
      "Platform decisions are final and binding.",
    ],
  },
  {
    id: "11",
    title: "Termination",
    paragraphs: ["49GIG may suspend or terminate accounts for:"],
    bullets: [
      "Violating these Terms",
      "Fraudulent activity",
      "Non-circumvention breaches",
      "Abuse of the Platform",
      "Termination does not waive outstanding payment or legal obligations.",
    ],
  },
  {
    id: "12",
    title: "Limitation of Liability",
    paragraphs: ["To the maximum extent permitted by law:"],
    bullets: [
      "49GIG is not liable for indirect, incidental, or consequential damages.",
      "We do not guarantee project outcomes or earnings.",
      "Total liability is limited to fees paid to 49GIG in the previous 12 months.",
    ],
  },
  {
    id: "13",
    title: "Indemnification",
    paragraphs: ["You agree to indemnify and hold 49GIG harmless from claims arising from:"],
    bullets: [
      "Your use of the Platform",
      "Breach of these Terms",
      "Violation of laws or third-party rights",
    ],
  },
  {
    id: "14",
    title: "Modifications",
    paragraphs: [
      "49GIG may update these Terms from time to time. Continued use of the Platform after changes constitutes acceptance.",
    ],
  },
  {
    id: "15",
    title: "Governing Law",
    paragraphs: [
      "These Terms are governed by the laws of [Insert Jurisdiction / Nigeria], without regard to conflict-of-law principles.",
    ],
  },
  {
    id: "16",
    title: "Acceptance",
    paragraphs: [
      "By clicking Agree, Approve, or Create Project, you confirm that you have read, understood, and accepted these Terms of Service.",
    ],
  },
];

export default function TermsPage() {
  const breadcrumbs = [{ label: "Legal", href: "/legal/terms" }, { label: "Terms", icon: FileText }];

  return (
    <div className="w-full">
      <PageHero
        title="Terms of Service"
        description="These terms govern your access to and use of 49GIG."
        badge={{ icon: FileText, text: "Legal" }}
        breadcrumbs={breadcrumbs}
        imageSrc="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80"
        imageAlt="Terms document"
      />

      <section className="py-14 sm:py-18 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border/60 bg-background/90 p-6 sm:p-8">
            <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Terms of Service</h1>
            <p className="mt-2 text-sm text-muted-foreground">Effective Date: 1st March, 2026</p>
            <p className="mt-5 text-muted-foreground">
              Welcome to 49GIG ("Platform", "we", "our", "us"). These Terms of Service ("Terms") govern your access to and use of the 49GIG website, applications, and services.
            </p>
            <p className="mt-3 text-muted-foreground">
              By accessing or using 49GIG, creating an account, or approving a project, you agree to be bound by these Terms. If you do not agree, you must not use the Platform.
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
