"use client";

import { PageHero } from "@/components/marketing/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Cookie } from "lucide-react";

type CookieSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

const sections: CookieSection[] = [
  {
    id: "1",
    title: "What Are Cookies?",
    paragraphs: [
      "Cookies are small text files stored on your device (computer, tablet, or mobile phone) when you visit a website.",
      "They help websites function properly, improve user experience, and provide insights into platform usage.",
      "Cookies do not give us access to your device or personal files.",
    ],
  },
  {
    id: "2",
    title: "Why 49GIG Uses Cookies",
    bullets: [
      "Ensure the platform functions correctly",
      "Secure user accounts and sessions",
      "Improve performance and user experience",
      "Understand how users interact with the platform",
      "Remember preferences and settings",
    ],
  },
  {
    id: "3",
    title: "Types of Cookies We Use",
    paragraphs: [
      "a. Strictly Necessary Cookies: Required for core functionality such as authentication, security, and navigation.",
      "b. Performance & Analytics Cookies: Help us improve reliability, usability, and performance through aggregated usage data.",
      "c. Functional Cookies: Remember preferences such as language, region, and saved options.",
      "d. Third-Party Cookies: Set by trusted providers used for analytics, performance, and security.",
    ],
  },
  {
    id: "4",
    title: "How Long Cookies Stay on Your Device",
    bullets: [
      "Session cookies: Deleted when you close your browser",
      "Persistent cookies: Stored for a set period or until deleted manually",
      "Duration depends on the cookie purpose",
    ],
  },
  {
    id: "5",
    title: "Managing or Disabling Cookies",
    paragraphs: [
      "You can control or disable cookies through your browser settings.",
      "Disabling certain cookies may affect platform functionality, and some features may not work properly.",
    ],
  },
  {
    id: "6",
    title: "Data Protection & Privacy",
    paragraphs: [
      "Any personal data collected through cookies is handled in accordance with our Privacy Policy.",
      "We do not use cookies to collect sensitive personal information without your consent.",
    ],
  },
  {
    id: "7",
    title: "Changes to This Cookie Policy",
    paragraphs: [
      "We may update this Cookie Policy from time to time to reflect changes in technology, law, or platform functionality.",
      "Updates will be posted on this page with a revised Last Updated date.",
    ],
  },
  {
    id: "8",
    title: "Contact Us",
    bullets: ["Email: support@49gig.com", "Website: www.49gig.com", "Address: Abuja, Nigeria", "Phone: +2349167656835"],
  },
];

export default function CookiePolicyPage() {
  const breadcrumbs = [{ label: "Legal", href: "/legal/terms" }, { label: "Cookies", icon: Cookie }];

  return (
    <div className="w-full">
      <PageHero
        title="Cookie Policy"
        description="How 49GIG uses cookies and similar technologies."
        badge={{ icon: Cookie, text: "Legal" }}
        breadcrumbs={breadcrumbs}
        imageSrc="https://images.unsplash.com/photo-1633265486064-086b219458ec?w=800&q=80"
        imageAlt="Cookie policy"
      />

      <section className="py-14 sm:py-18 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border/60 bg-background/90 p-6 sm:p-8">
            <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Cookie Policy</h1>
            <p className="mt-2 text-sm text-muted-foreground">Last Updated: 1st March, 2026</p>
            <p className="mt-5 text-muted-foreground">
              This Cookie Policy explains how 49GIG ("we", "us", "our") uses cookies and similar technologies when you visit or use our website and platform.
            </p>
            <p className="mt-3 text-muted-foreground">
              By continuing to use 49GIG, you agree to the use of cookies as described in this policy unless you disable them through your browser or cookie settings.
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
