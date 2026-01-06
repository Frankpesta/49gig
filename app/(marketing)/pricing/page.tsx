"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/marketing/page-header";
import {
  CheckCircle2,
  Users,
  ChevronRight,
  Shield,
  DollarSign,
  Zap,
  Target,
  FileCheck,
  Clock,
  TrendingUp,
  Award,
} from "lucide-react";

export default function PricingPage() {
  const howItWorks = [
    {
      icon: FileCheck,
      title: "Project-Based",
      description: "Each project is divided into milestones, and payments are only released after approval.",
    },
    {
      icon: Zap,
      title: "Flexible Options",
      description: "Hire individual freelancers or curated teams based on your project needs.",
    },
    {
      icon: DollarSign,
      title: "Transparent Rates",
      description: "No hidden fees, no surprises. You see exactly what you're paying for each milestone.",
    },
    {
      icon: Award,
      title: "Global Quality at Affordable Costs",
      description: "Access top-tier African talent without inflating your budget.",
    },
  ];

  const freelancerTiers = [
    {
      level: "Junior",
      rate: "$15–$25",
      period: "per hour",
      description: "Perfect for straightforward tasks and entry-level work",
      features: [
        "1-3 years of experience",
        "Core skills proficiency",
        "Supervised work delivery",
        "Standard support",
      ],
      color: "primary",
    },
    {
      level: "Mid-Level",
      rate: "$25–$50",
      period: "per hour",
      description: "Ideal for most projects requiring solid expertise",
      features: [
        "3-5 years of experience",
        "Advanced skills",
        "Independent work delivery",
        "Priority support",
      ],
      color: "primary",
      popular: true,
    },
    {
      level: "Senior",
      rate: "$50–$100",
      period: "per hour",
      description: "For complex projects needing expert-level work",
      features: [
        "5+ years of experience",
        "Expert-level mastery",
        "Strategic guidance",
        "Premium support",
      ],
      color: "primary",
    },
  ];

  const whyPricingWorks = [
    {
      icon: Shield,
      title: "Pay for approved work only",
      description: "Secure, milestone-based payments ensure you only pay when you're satisfied",
    },
    {
      icon: DollarSign,
      title: "No hidden fees",
      description: "All costs are upfront and transparent—what you see is what you pay",
    },
    {
      icon: Award,
      title: "High value at competitive rates",
      description: "Access premium talent at affordable pricing without compromising quality",
    },
    {
      icon: TrendingUp,
      title: "Flexible scaling",
      description: "Hire more talent or expand teams as your project grows—no lock-in",
    },
  ];

  return (
    <div className="w-full">
      {/* PAGE HEADER */}
      <PageHeader
        badge={{
          icon: DollarSign,
          text: "Pricing",
        }}
        title="Affordable, Transparent, and Flexible"
        description="At 49GIG, we connect you with vetted African talent—delivering world-class results at competitive, fair prices. Whether you need one expert or a full team, our pricing is transparent, milestone-based, and designed to give you peace of mind."
      />

      {/* HOW PRICING WORKS */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              How Pricing Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple, transparent, and built for your success
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((item, index) => (
              <Card key={index} className="border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING OPTIONS */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30 border-y border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Pricing Options
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the option that best fits your project needs
            </p>
          </div>

          {/* HIRE A FREELANCER */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Hire a Freelancer
              </h3>
              <p className="text-base text-muted-foreground">
                Short-term or long-term projects • Milestone-based payments
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {freelancerTiers.map((tier, index) => (
                <Card 
                  key={index} 
                  className={`relative border ${
                    tier.popular 
                      ? 'border-primary shadow-xl scale-105' 
                      : 'border-border/50 hover:border-primary/50'
                  } transition-all duration-300 hover:shadow-lg`}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg">
                        <Award className="h-3 w-3" />
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardContent className="p-8 space-y-6">
                    <div className="text-center space-y-2">
                      <h4 className="text-xl font-bold text-foreground">
                        {tier.level}
                      </h4>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-primary">
                          {tier.rate}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {tier.period}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {tier.description}
                      </p>
                    </div>

                    <ul className="space-y-3">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      asChild 
                      className="w-full" 
                      variant={tier.popular ? "default" : "outline"}
                    >
                      <Link href="/hire-talent">
                        Get Started
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* HIRE A TEAM */}
          <div className="mt-16">
            <Card className="border-2 border-primary/50 overflow-hidden">
              <CardContent className="p-8 sm:p-12">
                <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
                  <div className="space-y-6">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-4">
                        <Users className="h-4 w-4" />
                        Team Pricing
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                        Hire a Team
                      </h3>
                      <p className="text-base text-muted-foreground leading-relaxed">
                        Custom team assembly based on project requirements with unified contract for all team members and milestone-based payment system.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-foreground uppercase tracking-wide">
                        Team Pricing Includes:
                      </p>
                      <ul className="space-y-2">
                        {[
                          "Custom team assembly",
                          "Unified contract management",
                          "Milestone-based payments",
                          "Flexible team scaling",
                          "Dedicated project coordinator",
                          "Priority support",
                        ].map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                            <span className="text-sm text-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Card className="border border-border/50 bg-background">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Target className="h-5 w-5 text-primary" />
                          </div>
                          <h4 className="text-lg font-semibold text-foreground">
                            Custom Pricing
                          </h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Team rates depend on:
                        </p>
                        <ul className="space-y-2">
                          {["Team size", "Skill sets required", "Project duration", "Complexity level"].map((item, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-foreground">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Button asChild size="lg" className="w-full text-base h-12">
                      <Link href="/hire-team">
                        Get Team Quote
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* WHY 49GIG PRICING WORKS */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Why 49GIG Pricing Works for You
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Fair, transparent, and designed to maximize your value
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {whyPricingWorks.map((item, index) => (
              <Card key={index} className="border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                    <item.icon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* VALUE PROPOSITION */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30 border-y border-border/50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Award className="h-4 w-4" />
              Value Guarantee
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Quality Work at Fair Prices
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We believe in fair compensation for talent and competitive rates for clients. With 49GIG, you get world-class African professionals at rates that make sense for your business—without sacrificing quality or reliability.
            </p>
            <div className="flex flex-wrap justify-center gap-8 pt-6">
              {[
                { label: "Average Savings", value: "40-60%" },
                { label: "Client Satisfaction", value: "95%" },
                { label: "On-Time Delivery", value: "98%" },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 sm:py-20 lg:py-24 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Get Started
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Start your project today and hire vetted African talent with confidence
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="text-base h-12 px-8 shadow-lg">
              <Link href="/hire-talent">
                Hire a Talent
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild className="text-base h-12 px-8 shadow-lg bg-secondary hover:bg-secondary/90">
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
                Start Your Project
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

