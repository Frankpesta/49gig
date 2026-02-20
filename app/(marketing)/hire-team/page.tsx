"use client";

import { PageHero } from "@/components/marketing/page-hero";
import { CTAButton } from "@/components/marketing/cta-buttons";
import { SectionTransition } from "@/components/ui/section-transition";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  ArrowRight,
  Layers,
  Code,
  Palette,
  Database,
  Briefcase,
  CheckCircle2,
  Shield,
  Target,
  FileText,
  UserCheck,
  BarChart3,
  Megaphone,
} from "lucide-react";

export default function HireTeamPage() {
  const breadcrumbs = [
    { label: "Hire", href: "/hire-talent" },
    { label: "Team", icon: Users },
  ];

  const verificationChecks = [
    "Identity verification",
    "Skills and competency testing",
    "Portfolio evaluation",
    "Performance and reliability scoring",
  ];

  const oneContractItems = [
    "A single project structure",
    "Unified milestones",
    "Clear responsibilities",
    "One secure contract",
  ];

  const affordableItems = [
    "Reduce operational costs",
    "Access global-standard skills",
    "Maintain quality and speed",
  ];

  const teamStructures = [
    "Product development",
    "Design sprints",
    "Marketing campaigns",
    "Data and analytics projects",
    "Long-term engagements",
  ];

  const processSteps = [
    {
      title: "Choose “Hire a Team”",
      description: "Select the Hire a Team option to begin.",
    },
    {
      title: "Describe Your Project",
      description:
        "Complete a structured form with the key details we need to assemble the right team.",
      bullets: [
        "Roles required",
        "Skills and tools",
        "Project scope and deliverables",
        "Timeline",
        "Budget",
        "Preferred working hours or time zones",
      ],
    },
    {
      title: "Team Matching & Setup",
      description:
        "49GIG assembles a custom team based on your requirements and matches you with the best-fit professionals.",
    },
    {
      title: "Contract & Onboarding",
      description:
        "A secure digital contract is created for the team engagement. Once signed, the team is onboarded and work begins immediately.",
    },
    {
      title: "Milestone-Based Delivery & Payments",
      bullets: [
        "Projects are broken into milestones",
        "Payments are secured upfront",
        "Funds are released upon approval",
        "Full transparency throughout",
      ],
    },
  ];

  const teamRoles = [
    { icon: Code, label: "Software Developers" },
    { icon: Palette, label: "UI/UX Designers" },
    { icon: Briefcase, label: "Product Managers" },
    { icon: CheckCircle2, label: "QA Engineers" },
    { icon: Database, label: "Data Analysts" },
    { icon: Megaphone, label: "Digital Marketers" },
    { icon: FileText, label: "Content Specialists" },
  ];

  const supportItems = [
    "Performance monitoring",
    "Milestone tracking",
    "Secure payments",
    "Dispute resolution",
    "Team member replacement if needed",
  ];

  const whoShouldHire = [
    "Startups building products",
    "Agencies delivering client projects",
    "Companies scaling fast",
    "Enterprises outsourcing teams",
  ];

  const highlightCards = [
    {
      icon: Shield,
      title: "Curated, Vetted Teams",
      description:
        "Every team is built from individually vetted professionals. Only proven talents make it into 49GIG teams.",
      bullets: verificationChecks,
    },
    {
      icon: Target,
      title: "One Team. One Goal. One Contract.",
      description:
        "Instead of hiring multiple freelancers separately, we give you one coordinated structure and one secure contract.",
      bullets: oneContractItems,
    },
    {
      icon: BarChart3,
      title: "Affordable Team-Based Pricing",
      description:
        "Hiring teams from Africa helps you maximize value while maintaining quality and speed.",
      bullets: affordableItems,
    },
    {
      icon: Layers,
      title: "Flexible Team Structures",
      description:
        "Scale your team size up or down as your project evolves based on what delivery needs now.",
      bullets: teamStructures,
    },
  ];

  return (
    <div className="w-full">
      <PageHero
        title="Hire a Dedicated Team"
        description="Build high-performing teams from Africa. Scale faster. Spend smarter."
        badge={{ icon: Layers, text: "Team Hiring" }}
        breadcrumbs={breadcrumbs}
        imageSrc="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80"
        imageAlt="Team collaboration"
        actions={
          <>
            <CTAButton href="/signup/client" variant="primary" className="gap-2">
              <Users className="h-5 w-5" />
              Hire a Team
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
            <CTAButton href="#how-it-works" variant="secondary" className="gap-2">
              <Layers className="h-5 w-5" />
              How It Works
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
          </>
        }
      />

      <section className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={120}>
            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
              At 49GIG, we help companies hire fully vetted, project-ready teams made up of top African professionals—carefully assembled to match your project requirements, timeline, and budget.
            </p>
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground">
              Whether you're building a product, scaling operations, or delivering for a client, 49GIG provides the right team, ready to work.
            </p>
          </SectionTransition>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Vetting</p>
                <p className="mt-1 text-sm font-semibold text-foreground">Identity + Skills + Portfolio</p>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Delivery</p>
                <p className="mt-1 text-sm font-semibold text-foreground">One Team. One Contract.</p>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Payments</p>
                <p className="mt-1 text-sm font-semibold text-foreground">Secure Milestone Releases</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 border-y border-border/40 bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={120}>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Why Hire a Team Through 49GIG
            </h2>
          </SectionTransition>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {highlightCards.map((item, idx) => (
              <SectionTransition key={item.title} variant="slide" direction="up" delay={180 + idx * 90}>
                <Card className="h-full border-border/60 bg-background/90">
                  <CardContent className="p-6">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-3 text-muted-foreground">{item.description}</p>
                    <ul className="mt-4 space-y-2">
                      {item.bullets.map((bullet) => (
                        <li key={`${item.title}-${bullet}`} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </SectionTransition>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={120}>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              How Hiring a Team Works
            </h2>
          </SectionTransition>

          <div className="mt-8 space-y-5 border-l border-border/40 pl-4 sm:pl-6">
            {processSteps.map((step, idx) => (
              <SectionTransition key={step.title} variant="slide" direction="up" delay={180 + idx * 90}>
                <Card className="border-border/60">
                  <CardContent className="p-6">
                    <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {idx + 1}
                    </div>
                    <h3 className="mt-1 text-xl font-semibold text-foreground">{step.title}</h3>
                    {step.description && (
                      <p className="mt-2 text-muted-foreground">{step.description}</p>
                    )}
                    {step.bullets && (
                      <ul className="mt-4 space-y-2">
                        {step.bullets.map((bullet) => (
                          <li key={`${step.title}-${bullet}`} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </SectionTransition>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 border-y border-border/40 bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/60">
              <CardContent className="p-6">
                <h3 className="text-2xl font-semibold text-foreground">Team Roles Available</h3>
                <p className="mt-2 text-muted-foreground">
                  Teams are assembled based on what your project requires—nothing extra.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {teamRoles.map((role) => (
                    <div key={role.label} className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/80 px-3 py-2 text-sm text-foreground">
                      <role.icon className="h-4 w-4 text-primary" />
                      {role.label}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-6">
                <h3 className="text-2xl font-semibold text-foreground">Built-In Protection & Support</h3>
                <p className="mt-2 text-muted-foreground">
                  Your project stays protected from start to finish.
                </p>
                <ul className="mt-4 space-y-2">
                  {supportItems.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Card className="border-border/60">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Who Should Hire a Team on 49GIG
              </h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {whoShouldHire.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-muted-foreground">
                If you need structure, reliability, and cost efficiency, 49GIG teams are built for you.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 border-t border-border/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <SectionTransition variant="fade" delay={120}>
            <h2 className="text-3xl sm:text-5xl font-bold text-foreground">Ready to Build Your Team?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Tell us what you need and get matched with a vetted, high-performing team from Africa.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <CTAButton href="/signup/client" variant="primary" className="gap-2">
                Hire a Team
                <ArrowRight className="h-4 w-4" />
              </CTAButton>
              <CTAButton href="/dashboard/projects/create" variant="secondary" className="gap-2">
                Start a Team Project
                <ArrowRight className="h-4 w-4" />
              </CTAButton>
            </div>
          </SectionTransition>
        </div>
      </section>
    </div>
  );
}