"use client";

import { PageHero } from "@/components/marketing/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

type ConductSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

const sections: ConductSection[] = [
  {
    id: "1",
    title: "Introduction",
    paragraphs: [
      "49GIG is committed to fostering a professional, respectful, and trustworthy community. This Code of Conduct outlines the standards of behavior expected from all users—both clients and freelancers.",
    ],
  },
  {
    id: "2",
    title: "Core Principles",
    bullets: [
      "Professionalism: Communicate respectfully, deliver high-quality work, meet deadlines, and respond promptly.",
      "Honesty and Integrity: Provide truthful information, represent skills accurately, report genuine issues, and avoid deceptive practices.",
      "Respect and Dignity: Treat all users with respect regardless of race, ethnicity, nationality, religion, gender, sexual orientation, age, or disability. Avoid harassment, discrimination, or abusive behavior.",
    ],
  },
  {
    id: "3",
    title: "Prohibited Conduct",
    paragraphs: ["Users must not:"],
    bullets: [
      "Create fake accounts or impersonate others",
      "Submit false credentials, portfolios, or references",
      "Engage in payment fraud or chargeback abuse",
      "Manipulate ratings, reviews, or performance metrics",
      "Harass, threaten, or intimidate other users",
      "Use offensive, discriminatory, or hateful language",
      "Submit plagiarized work or infringe on intellectual property",
      "Circumvent the platform to avoid fees",
      "Create multiple accounts to gain unfair advantages",
      "Send unsolicited promotional messages or solicit off-platform transactions",
    ],
  },
  {
    id: "4",
    title: "Client-Specific Rules",
    bullets: [
      "Provide clear, detailed project specifications",
      "Set realistic deadlines and expectations",
      "Fund milestones before work begins",
      "Approve completed work in a timely manner",
      "Do not request excessive revisions beyond contract scope",
      "Provide honest, fair ratings and reviews",
    ],
  },
  {
    id: "5",
    title: "Freelancer-Specific Rules",
    bullets: [
      "Accurately represent skills and experience",
      "Only accept projects within your capabilities",
      "Deliver original, high-quality work and meet deadlines",
      "Communicate proactively about progress and issues",
      "Respond to client messages within 24 hours",
      "Complete projects or provide adequate notice if unable to continue",
    ],
  },
  {
    id: "6",
    title: "Communication Standards",
    bullets: [
      "Use clear, polite, and professional language",
      "Address conflicts calmly and professionally",
      "Focus on facts and contract terms in disputes",
      "Seek platform mediation if direct resolution fails",
    ],
  },
  {
    id: "7",
    title: "Privacy and Confidentiality",
    bullets: [
      "Respect the confidentiality of project information",
      "Do not share client information without permission",
      "Protect sensitive data and intellectual property",
      "Sign NDAs when required by clients",
    ],
  },
  {
    id: "8",
    title: "Enforcement",
    paragraphs: [
      "Users who witness or experience violations should report them through the platform's reporting tools or by contacting support@49gig.com. All reports will be reviewed thoroughly.",
      "Violations may result in warning, temporary suspension, permanent termination, withholding of payments, or legal action in severe cases.",
    ],
  },
  {
    id: "9",
    title: "Appeals",
    paragraphs: [
      "Users who believe enforcement actions were taken in error may appeal by contacting legal@49gig.com within 14 days of the action. Appeals will be reviewed by a separate team.",
    ],
  },
  {
    id: "10",
    title: "Updates to This Code",
    paragraphs: [
      "49GIG reserves the right to update this Code of Conduct at any time. Users will be notified of significant changes and continued use of the platform constitutes acceptance of the updated Code.",
    ],
  },
  {
    id: "11",
    title: "Contact",
    bullets: [
      "Email: conduct@49gig.com",
      "Support: support@49gig.com",
      "Legal: legal@49gig.com",
    ],
  },
];

export default function CodeOfConductPage() {
  const breadcrumbs = [{ label: "Legal", href: "/legal/terms" }, { label: "Code of Conduct", icon: ShieldCheck }];

  return (
    <div className="w-full">
      <PageHero
        title="Code of Conduct & Platform Rules"
        description="Standards of behavior expected from all users."
        badge={{ icon: ShieldCheck, text: "Legal" }}
        breadcrumbs={breadcrumbs}
        imageSrc="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80"
        imageAlt="Professional conduct"
      />

      <section className="py-14 sm:py-18 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border/60 bg-background/90 p-6 sm:p-8">
            <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Code of Conduct & Platform Rules</h1>
            <p className="mt-2 text-sm text-muted-foreground">Last Updated: 1st March, 2026</p>
            <p className="mt-5 text-muted-foreground">
              This Code of Conduct outlines the standards of behavior expected from all users on the 49GIG platform—both clients and freelancers.
            </p>
            <p className="mt-3 text-muted-foreground">
              By using 49GIG, you agree to uphold these standards. Violations may result in warnings, account suspension, or other enforcement actions as described in this document.
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
