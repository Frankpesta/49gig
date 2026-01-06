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
  Target,
  Award,
  FileCheck,
  DollarSign,
  Clock,
  Handshake,
  Zap,
  TrendingDown,
  Building2,
  Rocket,
  Globe,
  Search,
  UserCheck,
  FileText,
  BadgeCheck,
} from "lucide-react";

export default function ForClientsPage() {
  const whyChooseReasons = [
    {
      icon: Shield,
      title: "Access to Vetted, High-Quality Talent",
      description: "Every professional on 49GIG is carefully vetted through identity verification, skills testing, portfolio evaluation, and performance scoring. Only top-scoring talents are approved.",
      features: [
        "Identity verification",
        "Skills and competency testing",
        "Portfolio and experience evaluation",
        "Performance and reliability scoring",
      ],
    },
    {
      icon: Users,
      title: "Hire Individuals or Full Teams",
      description: "Whether you need a single expert or a fully assembled project team, 49GIG gives you flexible hiring options tailored to your project.",
      features: [
        "Single expert hiring",
        "Full project teams",
        "Flexible team scaling",
        "Custom team assembly",
      ],
    },
    {
      icon: DollarSign,
      title: "Affordable Global Talent",
      description: "Hiring from Africa allows you to reduce costs, maintain high quality standards, and scale efficiently. Get excellent value without compromising results.",
      features: [
        "Reduce hiring and operational costs",
        "Maintain high quality standards",
        "Scale efficiently",
        "Transparent pricing",
      ],
    },
    {
      icon: Zap,
      title: "No Job Posts. No Bidding.",
      description: "You don't waste time reviewing applications. Simply tell us what you need, review matched talent, and start working. Fast, focused, and effective.",
      features: [
        "No job posting required",
        "No bidding process",
        "Pre-matched talent",
        "Quick turnaround",
      ],
    },
  ];

  const hiringSteps = [
    {
      step: "1",
      icon: Briefcase,
      title: "Choose How to Hire",
      description: "Select whether you want to hire a single talent or a full team based on your project needs.",
      image: "https://images.unsplash.com/photo-1552664730-d307ca8849d1?w=800&q=80",
    },
    {
      step: "2",
      icon: FileText,
      title: "Share Your Project Details",
      description: "Complete a structured project intake form with your skills required, project scope, timeline, budget, and experience level.",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
    },
    {
      step: "3",
      icon: Search,
      title: "Get Matched with the Right Talent",
      description: "Our system matches you with vetted professionals based on fit, experience, and availability.",
      image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80",
    },
    {
      step: "4",
      icon: UserCheck,
      title: "Secure Contract & Onboarding",
      description: "A digital contract is generated and signed before work begins, ensuring clarity and protection for both parties.",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
    },
    {
      step: "5",
      icon: BadgeCheck,
      title: "Milestone-Based Payments",
      description: "Funds are secured upfront and payments are released only after approval. Full transparency and control throughout.",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
    },
  ];

  const protectionFeatures = [
    { icon: FileCheck, text: "Secure contracts" },
    { icon: DollarSign, text: "Milestone payments" },
    { icon: Award, text: "Performance monitoring" },
    { icon: Handshake, text: "Dispute resolution support" },
    { icon: Users, text: "Talent replacement when necessary" },
  ];

  const idealFor = [
    { icon: Rocket, text: "Startups" },
    { icon: Building2, text: "Small and medium businesses" },
    { icon: Briefcase, text: "Agencies" },
    { icon: TrendingDown, text: "Growing companies" },
    { icon: Globe, text: "Enterprises" },
  ];

  const africaAdvantages = [
    { icon: Clock, text: "Time-zone flexibility" },
    { icon: Globe, text: "Cultural adaptability" },
    { icon: Target, text: "High motivation and professionalism" },
    { icon: DollarSign, text: "Competitive pricing" },
  ];

  return (
    <div className="w-full">
      {/* PAGE HEADER */}
      <PageHeader
        badge={{
          icon: Briefcase,
          text: "For Clients",
        }}
        title="Hire Vetted African Talent & Teams With Confidence"
        description="49GIG helps companies around the world hire highly vetted African freelancers and teams—delivering global-standard work at affordable, transparent rates."
      >
        <div className="space-y-4">
          <p className="text-base text-muted-foreground font-medium max-w-2xl mx-auto">
            No job postings. No bidding. No uncertainty.<br />
            <span className="text-foreground font-semibold">Just the right talent, matched to your needs.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base h-12 px-8 shadow-lg">
              <Link href="/hire-talent">
                Hire Vetted Talent
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base h-12 px-8">
              <Link href="/hire-team">
                Hire a Team
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </PageHeader>

      {/* WHY COMPANIES CHOOSE 49GIG */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Why Companies Choose 49GIG
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We make hiring exceptional African talent simple, secure, and successful
            </p>
          </div>

          <div className="space-y-16 lg:space-y-24">
            {whyChooseReasons.map((reason, index) => (
              <div key={index} className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
                {/* Image */}
                <div className={`relative ${index % 2 === 1 ? 'lg:order-last' : ''}`}>
                  <Card className="overflow-hidden border border-border/50 shadow-lg">
                    <CardContent className="p-8 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                          <reason.icon className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground">
                          {reason.title}
                        </h3>
                      </div>
                      <p className="text-base text-muted-foreground leading-relaxed">
                        {reason.description}
                      </p>
                      <ul className="space-y-3">
                        {reason.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                            <span className="text-sm text-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Illustration/Image */}
                <div className={`relative ${index % 2 === 1 ? '' : 'lg:order-last'}`}>
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl">
                    <Image
                      src={
                        index === 0
                          ? "https://images.unsplash.com/photo-1552664730-d307ca8849d1?w=800&q=80"
                          : index === 1
                          ? "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                          : index === 2
                          ? "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"
                          : "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
                      }
                      alt={reason.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW HIRING WORKS */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30 border-y border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              How Hiring Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A simple, structured process that gets you from need to hire in days, not weeks
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

      {/* BUILT-IN CLIENT PROTECTION */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400">
                <Shield className="h-4 w-4" />
                Client Protection
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Built-In Client Protection
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Your project stays protected with our comprehensive client protection features, giving you peace of mind throughout the entire engagement.
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

            <div className="relative">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80"
                  alt="Client protection"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO 49GIG IS FOR */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30 border-y border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Who 49GIG Is For
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              If you value quality, affordability, and reliability, 49GIG is built for you
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
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

      {/* WHY AFRICA */}
      <section className="py-16 sm:py-20 lg:py-24 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="relative lg:order-first">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80"
                  alt="African professionals"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                Why Africa?
              </h2>
              <p className="text-lg text-primary-foreground/90 leading-relaxed">
                Africa is home to a rapidly growing pool of skilled, globally competitive professionals. 49GIG unlocks this talent—giving you access to exceptional value.
              </p>
              <div className="space-y-4">
                {africaAdvantages.map((advantage, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/10">
                      <advantage.icon className="h-4 w-4" />
                    </div>
                    <span className="text-base font-medium">{advantage.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Ready to Hire with Confidence?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start your project today and work with vetted African talent that delivers real results
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base h-12 px-8 shadow-lg">
              <Link href="/hire-talent">
                Hire Vetted Talent
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" asChild className="text-base h-12 px-8 shadow-lg bg-secondary hover:bg-secondary/90">
              <Link href="/hire-team">
                Hire a Team
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base h-12 px-8">
              <Link href="/contact">
                Start a Project
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

