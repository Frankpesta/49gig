"use client";

import { PageHero } from "@/components/marketing/page-hero";
import { CTAButton } from "@/components/marketing/cta-buttons";
import { SectionTransition } from "@/components/ui/section-transition";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Layers,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

export default function Why49GigPage() {
  const breadcrumbs = [
    { label: "Why 49GIG", icon: Sparkles },
  ];

  const sections = [
    {
      title: "1. Access Vetted African Talent",
      body: "Africa is home to an incredible pool of skilled professionals, but accessing verified talent has historically been a challenge.",
      bullets: [
        "Automating the vetting process with skills testing, identity verification, and portfolio review",
        "Approving only professionals who meet high-quality standards",
        "Maintaining a performance rating system to ensure consistent quality",
      ],
      closing:
        "Whether you need developers, designers, marketers, or content specialists, 49GIG ensures you work only with trusted professionals.",
    },
    {
      title: "2. Hire Individuals or Curated Teams",
      body: "Different projects have different needs. That’s why 49GIG gives you the flexibility to:",
      bullets: [
        "Hire a single expert for focused tasks",
        "Hire a fully managed team for larger projects",
      ],
      closing:
        "Our system matches you with the best-fit professionals, saving time and ensuring your project runs smoothly.",
    },
    {
      title: "3. Affordable, Transparent, and Fair Pricing",
      body: "Hiring globally doesn’t have to break your budget. At 49GIG, you get:",
      bullets: [
        "Competitive rates for high-quality African talent",
        "Milestone-based payments to protect both clients and freelancers",
        "Transparent cost structure—no hidden fees, no surprises",
      ],
      closing: "Save on costs without compromising on results.",
    },
    {
      title: "4. No Job Posts. No Bidding.",
      body: "We simplify hiring:",
      bullets: [
        "Clients don’t post jobs",
        "Freelancers don’t bid endlessly",
        "Our system automatically matches projects to top talent",
      ],
      closing:
        "This ensures efficiency, quality, and focus for both clients and freelancers.",
    },
    {
      title: "5. Secure, Milestone-Based Work",
      body: "Every project on 49GIG follows a structured workflow:",
      bullets: [
        "Work is divided into milestones",
        "Funds are secured upfront",
        "Payments are released only after client approval",
      ],
      closing:
        "This builds trust, transparency, and accountability throughout every project.",
    },
    {
      title: "6. Built-In Protection & Support",
      body: "49GIG is designed to reduce risk for both clients and freelancers:",
      bullets: [
        "Performance monitoring and rating system",
        "Dispute resolution process",
        "Talent replacement if needed",
        "Secure digital contracts",
      ],
      closing:
        "You can hire confidently, knowing your project is protected from start to finish.",
    },
    {
      title: "7. Grow Your Career or Business",
      body: "For Freelancers:",
      bullets: [
        "Access serious global projects",
        "Build long-term relationships with clients",
        "Grow your portfolio and performance rating",
      ],
      body2: "For Clients:",
      bullets2: [
        "Scale projects efficiently",
        "Access a wide pool of highly skilled professionals",
        "Focus on results while we manage the matching and vetting",
      ],
    },
    {
      title: "8. Our Mission-Driven Approach",
      body: "49GIG isn’t just a platform—it’s a movement to empower African talent while helping global businesses succeed. We believe in:",
      bullets: [
        "Quality over quantity",
        "Trust, reliability, and transparency",
        "Sustainable careers for freelancers",
        "Real impact for clients",
      ],
    },
  ];

  return (
    <div className="w-full">
      <PageHero
        title="Why 49GIG"
        description="The Smart Choice for Hiring African Talent"
        badge={{ icon: Sparkles, text: "Why 49GIG" }}
        breadcrumbs={breadcrumbs}
        imageSrc="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80"
        imageAlt="High-performing team in discussion"
        actions={
          <>
            <CTAButton href="/signup/client" variant="primary" className="gap-2">
              Hire Talent
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
            <CTAButton href="/hire-team" variant="secondary" className="gap-2">
              Hire a Team
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
          </>
        }
      />

      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={120}>
            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
              At 49GIG, we believe hiring top-quality African professionals should be simple, reliable, and rewarding. We built a platform that connects global companies with vetted, skilled freelancers and teams—delivering world-class results at affordable rates.
            </p>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-muted-foreground">
              Here's why 49GIG stands out:
            </p>
          </SectionTransition>
        </div>
      </section>

      <section className="border-y border-border/40 bg-muted/20 py-10 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <Card className="border-border/60 bg-background/90">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Quality</p>
                <p className="mt-2 text-lg font-semibold text-foreground">Vetted Professionals Only</p>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-background/90">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Trust</p>
                <p className="mt-2 text-lg font-semibold text-foreground">Milestone-Based Protection</p>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-background/90">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Speed</p>
                <p className="mt-2 text-lg font-semibold text-foreground">Auto-Matching, No Bidding</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-14 lg:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-border/60 bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">On this page</p>
              <ul className="mt-3 space-y-2">
                {sections.map((section, index) => (
                  <li key={`toc-${section.title}`}>
                    <a
                      href={`#why-${index + 1}`}
                      className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-background hover:text-foreground"
                    >
                      {section.title.replace(/^\d+\.\s/, "")}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="space-y-5">
            {sections.map((section, index) => (
              <SectionTransition key={section.title} variant="slide" direction="up" delay={120 + index * 55}>
                <Card id={`why-${index + 1}`} className="scroll-mt-24 border-border/60 bg-background/95 shadow-sm transition hover:shadow-md">
                  <CardContent className="p-6 sm:p-7">
                    <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground">{section.title.replace(/^\d+\.\s/, "")}</h2>
                    <p className="mt-3 text-muted-foreground">{section.body}</p>

                    <ul className="mt-4 space-y-2">
                      {section.bullets.map((bullet) => (
                        <li key={`${section.title}-${bullet}`} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>

                    {"body2" in section && section.body2 && (
                      <>
                        <p className="mt-4 text-muted-foreground">{section.body2}</p>
                        <ul className="mt-3 space-y-2">
                          {"bullets2" in section &&
                            section.bullets2?.map((bullet) => (
                              <li key={`${section.title}-${bullet}`} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                <span>{bullet}</span>
                              </li>
                            ))}
                        </ul>
                      </>
                    )}

                    {"closing" in section && section.closing && (
                      <p className="mt-4 text-foreground/90">{section.closing}</p>
                    )}
                  </CardContent>
                </Card>
              </SectionTransition>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <SectionTransition variant="fade" delay={120}>
            <h2 className="text-3xl sm:text-5xl font-bold text-foreground">
              Ready to Experience the 49GIG Difference?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Whether you want to hire a freelancer, build a team, or join as a professional, 49GIG gives you the tools, talent, and support to succeed.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <CTAButton href="/signup/client" variant="primary" className="gap-2">
                <Briefcase className="h-4 w-4" />
                Hire Talent
              </CTAButton>
              <CTAButton href="/hire-team" variant="secondary" className="gap-2">
                <Users className="h-4 w-4" />
                Hire a Team
              </CTAButton>
              <CTAButton href="/signup/freelancer" variant="secondary" className="gap-2">
                <Layers className="h-4 w-4" />
                Join as a Freelancer
              </CTAButton>
            </div>
          </SectionTransition>
        </div>
      </section>
    </div>
  );
}

