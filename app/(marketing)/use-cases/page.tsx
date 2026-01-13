"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/marketing/page-header";
import {
  CheckCircle2,
  Users,
  ChevronRight,
  Code,
  TrendingUp,
  Database,
  PenTool,
  Briefcase,
  Target,
  Award,
  Shield,
  DollarSign,
  Zap,
  Rocket,
  Globe,
  Building2,
  Heart,
  GraduationCap,
  ShoppingCart,
  Laptop,
} from "lucide-react";

export default function UseCasesPage() {
  const breadcrumbs = [
    { label: "Use Cases", icon: Target },
  ];

  const clientUseCases = [
    {
      icon: Code,
      title: "Product Development",
      description: "Hire software developers, UI/UX designers, and product managers to build apps, websites, and software products. Assemble a curated team that handles end-to-end product development.",
      example: "A startup building a SaaS platform can hire a team of developers and designers, complete with project management support, all coordinated through 49GIG.",
      features: [
        "End-to-end product development",
        "Track project milestones",
        "Quality delivery assurance",
        "Efficient scaling",
      ],
    },
    {
      icon: TrendingUp,
      title: "Digital Marketing Campaigns",
      description: "Engage digital marketers, social media managers, and content strategists for SEO, SEM, email marketing, and social campaigns. Monitor campaign performance and pay based on milestones.",
      example: "An e-commerce brand can hire a marketing team to launch a 3-month social media campaign targeting international audiences.",
      features: [
        "SEO, SEM, and social campaigns",
        "Performance monitoring",
        "Milestone-based payments",
        "Scale without full-time hires",
      ],
    },
    {
      icon: Database,
      title: "Data Analytics & Insights",
      description: "Hire data analysts, data scientists, and BI experts to interpret business data and provide actionable insights. Use data to improve product decisions, marketing strategies, and operational efficiency.",
      example: "A fintech company can engage a data analytics freelancer to optimize their user acquisition funnel and reduce churn rates.",
      features: [
        "Business data interpretation",
        "Actionable insights",
        "Product decision optimization",
        "Operational efficiency",
      ],
    },
    {
      icon: PenTool,
      title: "Content Creation & Writing",
      description: "Hire copywriters, technical writers, and content strategists to produce high-quality written materials. Scale content creation for blogs, websites, email campaigns, or product documentation.",
      example: "A tech company launching a new product can hire content specialists to create user manuals, landing pages, and promotional materials.",
      features: [
        "High-quality written content",
        "Technical documentation",
        "Marketing materials",
        "Scalable content production",
      ],
    },
    {
      icon: Briefcase,
      title: "Short-Term or Specialized Projects",
      description: "Hire freelancers with specific skills for one-off tasks like graphic design, app testing, or market research. Get professional results without long-term commitments.",
      example: "A small business can hire a UX designer to redesign its website in 2 weeks while maintaining budget control.",
      features: [
        "Specific skill expertise",
        "One-off task completion",
        "Professional results",
        "No long-term commitments",
      ],
    },
  ];

  const freelancerUseCases = [
    {
      icon: Rocket,
      title: "Long-Term Client Projects",
      description: "Work with serious international clients on ongoing assignments. Build long-term relationships that lead to recurring work.",
      example: "A software developer consistently matched with startups building mobile apps can maintain stable, high-value projects.",
    },
    {
      icon: Users,
      title: "Team Collaborations",
      description: "Join curated teams to work on larger projects you couldn't handle alone. Gain experience, exposure, and higher payouts.",
      example: "A designer joins a 49GIG product team working on a full-stack web application, contributing their expertise while learning from other professionals.",
    },
    {
      icon: Target,
      title: "Specialized Short-Term Projects",
      description: "Pick projects aligned with your skills and availability. Build your portfolio and earn safely with milestone-based payments.",
      example: "A content writer completes a 4-week technical writing project for a fintech client, earning a high rating and strong review for future projects.",
    },
    {
      icon: Award,
      title: "Upskilling & Professional Growth",
      description: "Work on international projects to improve skills, learn new tools, and expand your portfolio. Performance ratings and client reviews help you attract higher-value work.",
      example: "A data analyst gains experience in AI-based analytics projects, improving their career prospects globally.",
    },
  ];

  const industries = [
    { icon: Laptop, name: "Technology & Software" },
    { icon: ShoppingCart, name: "E-commerce & Retail" },
    { icon: DollarSign, name: "Finance & Fintech" },
    { icon: TrendingUp, name: "Marketing & Advertising" },
    { icon: GraduationCap, name: "Education & eLearning" },
    { icon: Heart, name: "Healthcare & HealthTech" },
  ];

  const whyUseCasesWork = [
    { icon: Shield, text: "Vetted Talent: Only high-performing freelancers are approved" },
    { icon: Users, text: "Tailored Teams: Projects matched with the right mix of skills" },
    { icon: DollarSign, text: "Secure Payments: Milestone-based payment system protects both sides" },
    { icon: CheckCircle2, text: "Transparent Process: Track progress and communicate clearly" },
    { icon: Zap, text: "Scalable: Hire a single expert or a full team" },
  ];

  return (
    <div className="w-full">
      {/* PAGE HEADER */}
      <PageHeader
        badge={{
          icon: Briefcase,
          text: "Use Cases"
        }}
        title="How 49GIG Helps Businesses and Freelancers Succeed"
        description="49GIG is more than a freelance marketplace. It's a reliable, structured ecosystem where businesses can hire top African talent and freelancers can work with trusted international clients. Here's how our platform can be applied across different projects, industries, and scenarios."
      />

      {/* FOR CLIENTS */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              For Clients
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real-world scenarios where 49GIG delivers value for your business
            </p>
          </div>

          <div className="space-y-12">
            {clientUseCases.map((useCase, index) => (
              <Card key={index} className="border border-border/50 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="grid gap-8 lg:grid-cols-[auto,1fr]">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                      <useCase.icon className="h-8 w-8 text-primary" />
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">
                          {useCase.title}
                        </h3>
                        <p className="text-base text-muted-foreground leading-relaxed">
                          {useCase.description}
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {useCase.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                            <span className="text-sm text-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-lg bg-muted/50 border border-border/50 p-4">
                        <p className="text-sm font-semibold text-foreground mb-2">
                          Example Use Case:
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed italic">
                          {useCase.example}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FOR FREELANCERS */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30 border-y border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              For Freelancers
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              How freelancers use 49GIG to build successful global careers
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {freelancerUseCases.map((useCase, index) => (
              <Card key={index} className="border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-8 space-y-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10">
                    <useCase.icon className="h-7 w-7 text-secondary" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-3">
                      {useCase.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {useCase.description}
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted/50 border border-border/50 p-4">
                    <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
                      Example:
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                      {useCase.example}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* INDUSTRIES WE SERVE */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Industries We Serve
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              49GIG works across multiple industries. No matter the sector, we connect you with the right talent or projects.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map((industry, index) => (
              <Card key={index} className="group border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-transform duration-300 group-hover:scale-110">
                    <industry.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {industry.name}
                  </h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* WHY 49GIG USE CASES WORK */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30 border-y border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Why 49GIG Use Cases Work
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built on trust, quality, and transparent processes
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {whyUseCasesWork.map((item, index) => (
              <Card key={index} className="border border-border/50">
                <CardContent className="p-6 space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                    <item.icon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {item.text}
                  </p>
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
            Get Started
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Whether you are a business looking to hire talent or build a team, or a freelancer seeking global opportunities, 49GIG has a use case tailored for you
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="text-base h-12 px-8 shadow-lg">
              <Link href="/hire-talent">
                Hire Talent
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
              <Link href="/get-started">
                Join as a Freelancer
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

