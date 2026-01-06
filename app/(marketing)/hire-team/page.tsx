"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/marketing/page-header";
import {
  CheckCircle2,
  Users,
  Briefcase,
  Shield,
  ChevronRight,
  Award,
  FileCheck,
  DollarSign,
  Clock,
  TrendingUp,
  Code,
  Palette,
  Database,
  PenTool,
  FileText,
  Search,
  UserCheck,
  BadgeCheck,
  Building2,
  Rocket,
  Target,
} from "lucide-react";

export default function HireTeamPage() {
  const whyHireTeamReasons = [
    {
      icon: Shield,
      title: "Curated, Vetted Teams",
      description: "Every team is built from individually vetted professionals who have passed identity verification, skills testing, portfolio evaluation, and performance scoring. Only proven talents make it into 49GIG teams.",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
    },
    {
      icon: FileCheck,
      title: "One Team. One Goal. One Contract.",
      description: "Instead of hiring multiple freelancers separately, 49GIG gives you a single project structure, unified milestones, clear responsibilities, and one secure contract. We simplify team hiring so you can focus on delivery.",
      image: "https://images.unsplash.com/photo-1552664730-d307ca8849d1?w=800&q=80",
    },
    {
      icon: DollarSign,
      title: "Affordable Team-Based Pricing",
      description: "Hiring teams from Africa allows you to reduce operational costs, access global-standard skills, and maintain quality and speed. You get maximum value without inflated rates.",
      image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80",
    },
    {
      icon: Users,
      title: "Flexible Team Structures",
      description: "Scale your team size up or down as your project evolves. Hire teams for product development, design sprints, marketing campaigns, data projects, or long-term engagements.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    },
  ];

  const hiringSteps = [
    {
      step: "1",
      icon: Briefcase,
      title: "Choose 'Hire a Team'",
      description: "Select the Hire a Team option to begin assembling your custom project team.",
      image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
    },
    {
      step: "2",
      icon: FileText,
      title: "Describe Your Project",
      description: "Complete a structured form covering roles required, skills and tools, project scope and deliverables, timeline, budget, and preferred working hours or time zones.",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
    },
    {
      step: "3",
      icon: Search,
      title: "Team Matching & Setup",
      description: "49GIG assembles a custom team based on your requirements and matches you with the best-fit professionals for your project.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    },
    {
      step: "4",
      icon: UserCheck,
      title: "Contract & Onboarding",
      description: "A secure digital contract is created for the team engagement. Once signed, the team is onboarded and work begins immediately.",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
    },
    {
      step: "5",
      icon: BadgeCheck,
      title: "Milestone-Based Delivery & Payments",
      description: "Projects are broken into milestones, payments are secured upfront, and funds are released upon approval. Full transparency throughout.",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
    },
  ];

  const teamRoles = [
    { icon: Code, title: "Software Developers" },
    { icon: Palette, title: "UI/UX Designers" },
    { icon: Users, title: "Product Managers" },
    { icon: CheckCircle2, title: "QA Engineers" },
    { icon: Database, title: "Data Analysts" },
    { icon: TrendingUp, title: "Digital Marketers" },
    { icon: PenTool, title: "Content Specialists" },
  ];

  const protectionFeatures = [
    { icon: Award, text: "Performance monitoring" },
    { icon: Target, text: "Milestone tracking" },
    { icon: DollarSign, text: "Secure payments" },
    { icon: Shield, text: "Dispute resolution" },
    { icon: Users, text: "Team member replacement if needed" },
  ];

  const idealFor = [
    { icon: Rocket, text: "Startups building products" },
    { icon: Briefcase, text: "Agencies delivering client projects" },
    { icon: TrendingUp, text: "Companies scaling fast" },
    { icon: Building2, text: "Enterprises outsourcing teams" },
  ];

  return (
    <div className="w-full">
      {/* PAGE HEADER */}
      <PageHeader
        badge={{
          icon: Users,
          text: "Hire a Team",
        }}
        title="Hire a Dedicated Team"
        description="Build high-performing teams from Africa. Scale faster. Spend smarter. At 49GIG, we help companies hire fully vetted, project-ready teams made up of top African professionals—carefully assembled to match your project requirements, timeline, and budget."
      >
        <div className="space-y-4">
          <p className="text-base text-muted-foreground font-medium max-w-2xl mx-auto">
            <span className="text-foreground font-semibold">Whether you're building a product, scaling operations, or delivering for a client, 49GIG provides the right team, ready to work.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base h-12 px-8 shadow-lg">
              <Link href="/hire-team">
                Hire a Team
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base h-12 px-8">
              <Link href="/contact">
                Start a Team Project
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </PageHeader>

      {/* WHY HIRE A TEAM THROUGH 49GIG */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Why Hire a Team Through 49GIG
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get a complete, vetted team assembled specifically for your project
            </p>
          </div>

          <div className="space-y-16 lg:space-y-24">
            {whyHireTeamReasons.map((reason, index) => (
              <div key={index} className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
                {/* Image */}
                <div className={`relative ${index % 2 === 1 ? 'lg:order-last' : ''}`}>
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl border border-border/50">
                    <Image
                      src={reason.image}
                      alt={reason.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                      <reason.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                      {reason.title}
                    </h3>
                  </div>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {reason.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW HIRING A TEAM WORKS */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30 border-y border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              How Hiring a Team Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A streamlined process to assemble your perfect team
            </p>
          </div>

          <div className="space-y-16 lg:space-y-20">
            {hiringSteps.map((step, index) => (
              <div key={index} className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
                {/* Image */}
                <div className={`relative ${index % 2 === 1 ? 'lg:order-last' : ''}`}>
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl border border-border/50">
                    <Image
                      src={step.image}
                      alt={step.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                  {/* Step Number Badge */}
                  <div className="absolute -top-4 -left-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold shadow-lg border-4 border-background">
                    {step.step}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM ROLES AVAILABLE */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Team Roles Available
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Teams are assembled based on what your project requires—nothing extra
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {teamRoles.map((role, index) => (
              <Card key={index} className="group border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-transform duration-300 group-hover:scale-110">
                      <role.icon className="h-7 w-7 text-primary" />
                    </div>
                  </div>
                  <p className="text-base font-semibold text-foreground leading-tight">
                    {role.title}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* BUILT-IN PROTECTION */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30 border-y border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="relative">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                  alt="Team protection"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400">
                <Shield className="h-4 w-4" />
                Team Protection
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Built-In Protection & Support
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Your project stays protected from start to finish with comprehensive team management and support features.
              </p>
              <div className="space-y-4">
                {protectionFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                      <feature.icon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-base font-medium text-foreground">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO SHOULD HIRE A TEAM */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Who Should Hire a Team on 49GIG
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              If you need structure, reliability, and cost efficiency, 49GIG teams are built for you
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {idealFor.map((item, index) => (
              <Card key={index} className="border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                      <item.icon className="h-7 w-7 text-primary" />
                    </div>
                  </div>
                  <p className="text-base font-semibold text-foreground">{item.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 sm:py-20 lg:py-24 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Ready to Build Your Team?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Tell us what you need and get matched with a vetted, high-performing team from Africa
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="text-base h-12 px-8 shadow-lg">
              <Link href="/hire-team">
                Hire a Team
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="text-base h-12 px-8 bg-primary-foreground/10 border-2 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <Link href="/contact">
                Start a Team Project
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

