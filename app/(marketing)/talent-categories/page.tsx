"use client";

import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/marketing/page-hero";
import { CTAButton } from "@/components/marketing/cta-buttons";
import { SectionTransition } from "@/components/ui/section-transition";
import {
  CheckCircle2,
  Users,
  Briefcase,
  ArrowRight,
  Layers,
  Code,
  Palette,
  Database,
  Cloud,
  Shield,
  Brain,
} from "lucide-react";

export default function TalentCategoriesPage() {
  const breadcrumbs = [
    { label: "Talent", href: "/talent-categories" },
    { label: "Categories", icon: Layers },
  ];

  const categories = [
    {
      title: "1. Software Development",
      icon: Code,
      roles: [
        "Web Developers (Frontend, Backend, Fullstack)",
        "Mobile App Developers (iOS, Android, React Native)",
        "Software Engineers",
        "DevOps Specialists",
        "API and Integration Engineers",
      ],
      description:
        "Deliver scalable, high-quality software solutions for any project.",
    },
    {
      title: "2. UI/UX and Product Design",
      icon: Palette,
      roles: [
        "UI/UX Designers",
        "Product Designers",
        "Graphic Designers",
        "Motion & Animation Designers",
        "Branding & Visual Identity Experts",
      ],
      description:
        "Create intuitive, visually stunning products that users love.",
    },
    {
      title: "3. Data Analytics",
      icon: Database,
      roles: [
        "Data Analysts",
        "Data Scientists",
        "Business Intelligence Specialists",
        "Machine Learning Engineers",
        "Database Administrators",
      ],
      description:
        "Turn data into actionable insights and drive smarter business decisions.",
    },
    {
      title: "4. DevOps & Cloud Engineering",
      icon: Cloud,
      roles: [
        "DevOps Engineers",
        "Cloud Infrastructure Engineers",
        "Site Reliability Engineers (SRE)",
        "CI/CD Automation Specialists",
        "Platform Engineers",
      ],
      description:
        "Build resilient infrastructure and automate delivery with cloud-native practices.",
    },
    {
      title: "5. Cybersecurity & IT Infrastructure",
      icon: Shield,
      roles: [
        "Security Engineers",
        "SOC and Incident Response Specialists",
        "Network and Systems Administrators",
        "Cloud Security Specialists",
        "IT Support and Infrastructure Engineers",
      ],
      description:
        "Protect systems, data, and operations with modern security and IT expertise.",
    },
    {
      title: "6. AI, Machine Learning & Blockchain",
      icon: Brain,
      roles: [
        "Machine Learning Engineers",
        "AI Application Developers",
        "NLP and Computer Vision Specialists",
        "Data and MLOps Engineers",
        "Blockchain Developers",
      ],
      description:
        "Create intelligent products and decentralized solutions for next-generation use cases.",
    },
    {
      title: "7. Quality Assurance & Testing",
      icon: CheckCircle2,
      roles: [
        "Manual QA Engineers",
        "Automation Test Engineers",
        "Performance Test Specialists",
        "QA Leads",
        "Test Analysts",
      ],
      description:
        "Ensure reliable product releases through strong test coverage and quality processes.",
    },
  ];

  const whyHire = [
    "Every professional is vetted and verified",
    "Projects are matched automatically to top talent",
    "Flexible hiring: individuals or full teams",
    "Transparent pricing and milestone-based payments",
    "Secure contracts and built-in protection",
  ];

  return (
    <div className="w-full">
      <PageHero
        title="Talent Categories"
        description="Hire Africa’s Top Freelancers Across High-Demand Skills"
        badge={{ icon: Layers, text: "All Categories" }}
        breadcrumbs={breadcrumbs}
        imageSrc="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80"
        imageAlt="Professional collaboration"
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

      <section className="py-14 sm:py-18">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
            At 49GIG, we connect global companies with highly vetted African professionals in key high-demand fields.
          </p>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-muted-foreground">
            Whether you need a single expert or a full project team, our talent categories make it easy to find the right match for your project.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((category) => (
              <a
                key={`jump-${category.title}`}
                href={`#${category.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                className="rounded-full border border-border/60 bg-muted/20 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-primary/10"
              >
                {category.title.replace(/^\d+\.\s/, "")}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 border-y border-border/40 bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Our Launch Talent Categories</h2>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {categories.map((category, index) => (
              <SectionTransition key={category.title} variant="slide" direction="up" delay={120 + index * 90}>
                <Card
                  id={category.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                  className="h-full scroll-mt-24 border-border/60 bg-background/90 shadow-sm transition hover:shadow-md"
                >
                  <CardContent className="p-6">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <category.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{category.title}</h3>
                    <ul className="mt-4 space-y-2">
                      {category.roles.map((role) => (
                        <li key={`${category.title}-${role}`} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                          <span>{role}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-sm text-foreground/90">{category.description}</p>
                  </CardContent>
                </Card>
              </SectionTransition>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Card className="border-border/60">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Why Hire Through 49GIG?</h2>
              <ul className="mt-5 space-y-3">
                {whyHire.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 sm:py-20 border-t border-border/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <SectionTransition variant="fade" delay={120}>
            <h2 className="text-3xl sm:text-5xl font-bold text-foreground">Ready to Find Talent?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Tell us what you need and get matched with Africa’s top vetted professionals.
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
              <CTAButton href="/dashboard/projects/create" variant="secondary" className="gap-2">
                Start Your Project
                <ArrowRight className="h-4 w-4" />
              </CTAButton>
            </div>
          </SectionTransition>
        </div>
      </section>
    </div>
  );
}