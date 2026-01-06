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
  Globe,
  TrendingUp,
  Code,
  Palette,
  Database,
  PenTool,
  HeadphonesIcon,
  Search,
  UserCheck,
  FileText,
  BadgeCheck,
  Star,
  MessageSquare,
  CheckSquare,
  AlertCircle,
} from "lucide-react";

export default function ForFreelancersPage() {
  const whyChooseReasons = [
    {
      icon: BadgeCheck,
      title: "Work With Verified Global Clients",
      description: "All clients on 49GIG are verified and committed to real projects with secured budgets. No fake jobs. No unpaid work. No uncertainty.",
      image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80",
    },
    {
      icon: Target,
      title: "No Bidding, No Race to the Bottom",
      description: "You don't compete on price. Projects are assigned based on your skills, expertise, vetting score, performance, reliability, and availability. Your quality speaks for you.",
      image: "https://images.unsplash.com/photo-1552664730-d307ca8849d1?w=800&q=80",
      features: [
        "Skills and expertise",
        "Vetting score",
        "Performance and reliability",
        "Availability",
      ],
    },
    {
      icon: DollarSign,
      title: "Fair Pay & Secure Payments",
      description: "You focus on delivering great work—we handle payment protection with transparent milestone-based payments, secured funds, and timely payouts.",
      image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80",
      features: [
        "Transparent milestone-based payments",
        "Funds secured before work begins",
        "Timely and reliable payouts",
        "Multiple withdrawal options",
      ],
    },
    {
      icon: TrendingUp,
      title: "Build a Strong Global Reputation",
      description: "Your performance score, ratings, and completed projects help you access higher-value work, get long-term engagements, and grow your professional credibility.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
      features: [
        "Access higher-value work",
        "Get long-term engagements",
        "Grow your professional credibility",
        "Build a verified track record",
      ],
    },
  ];

  const skillCategories = [
    { icon: Code, title: "Software Development", color: "primary" },
    { icon: Palette, title: "UI/UX & Product Design", color: "primary" },
    { icon: Database, title: "Data & Analytics", color: "primary" },
    { icon: TrendingUp, title: "Digital Marketing", color: "secondary" },
    { icon: PenTool, title: "Writing & Content", color: "secondary" },
    { icon: Users, title: "Product & Project Management", color: "secondary" },
    { icon: HeadphonesIcon, title: "Customer Support", color: "secondary" },
  ];

  const howItWorksSteps = [
    {
      step: "1",
      icon: FileText,
      title: "Apply to Join",
      description: "Create your account and submit your personal information, skills and experience, and portfolio or work samples.",
      image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80",
    },
    {
      step: "2",
      icon: Shield,
      title: "Automated Vetting Process",
      description: "All freelancers go through a strict, automated vetting process including identity verification, skills testing, and portfolio evaluation. Only top-scoring applicants are approved.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    },
    {
      step: "3",
      icon: Search,
      title: "Get Matched to Projects",
      description: "Once approved, you'll be matched to projects based on skill fit, performance rating, and availability. You don't apply or bid—projects come to you.",
      image: "https://images.unsplash.com/photo-1552664730-d307ca8849d1?w=800&q=80",
    },
    {
      step: "4",
      icon: UserCheck,
      title: "Sign Contract & Start Working",
      description: "A digital contract is created for every project. Once signed, you begin work immediately with clear expectations and milestones.",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
    },
    {
      step: "5",
      icon: BadgeCheck,
      title: "Deliver Work & Get Paid",
      description: "Complete milestones, submit deliverables, get paid after approval, and withdraw earnings securely through your preferred method.",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
    },
  ];

  const expectations = [
    { icon: MessageSquare, text: "Communicate professionally" },
    { icon: Clock, text: "Meet deadlines" },
    { icon: Award, text: "Deliver high-quality work" },
    { icon: CheckSquare, text: "Follow project requirements" },
    { icon: Star, text: "Maintain performance standards" },
  ];

  const protectionFeatures = [
    { icon: FileCheck, text: "Clear contracts" },
    { icon: Target, text: "Performance transparency" },
    { icon: Handshake, text: "Dispute resolution support" },
    { icon: Award, text: "Fair rating system" },
  ];

  return (
    <div className="w-full">
      {/* PAGE HEADER */}
      <PageHeader
        badge={{
          icon: Users,
          text: "For Freelancers",
        }}
        title="Work With Global Clients. Get Paid Securely. Build a Global Career."
        description="49GIG is a platform built for skilled African freelancers who want access to serious international clients, fair pay, and structured projects—without job bidding or endless competition."
      >
        <div className="space-y-4">
          <p className="text-base text-muted-foreground font-medium max-w-2xl mx-auto">
            <span className="text-foreground font-semibold">If you value quality, professionalism, and growth, 49GIG is built for you.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base h-12 px-8 shadow-lg">
              <Link href="/get-started">
                Apply as a Freelancer
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base h-12 px-8">
              <Link href="/how-it-works#freelancers">
                How It Works
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </PageHeader>

      {/* WHY FREELANCERS CHOOSE 49GIG */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Why Freelancers Choose 49GIG
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of African professionals building successful global careers
            </p>
          </div>

          <div className="space-y-16 lg:space-y-24">
            {whyChooseReasons.map((reason, index) => (
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
                  {reason.features && (
                    <ul className="space-y-3">
                      {reason.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO CAN JOIN 49GIG */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30 border-y border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Who Can Join 49GIG
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              49GIG is for skilled professionals across multiple disciplines. Only professionals who meet our quality standards are approved.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {skillCategories.map((category, index) => (
              <Card key={index} className="group border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${
                      category.color === "primary" ? "bg-primary/10" : "bg-secondary/10"
                    } transition-transform duration-300 group-hover:scale-110`}>
                      <category.icon className={`h-7 w-7 ${
                        category.color === "primary" ? "text-primary" : "text-secondary"
                      }`} />
                    </div>
                  </div>
                  <p className="text-base font-semibold text-foreground leading-tight">
                    {category.title}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS FOR FREELANCERS */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              How It Works for Freelancers
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A simple, transparent process from application to getting paid
            </p>
          </div>

          <div className="space-y-16 lg:space-y-20">
            {howItWorksSteps.map((step, index) => (
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
                  <div className="absolute -top-4 -left-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-2xl font-bold shadow-lg border-4 border-background">
                    {step.step}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                      <step.icon className="h-6 w-6 text-secondary" />
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

      {/* WHAT WE EXPECT FROM YOU */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30 border-y border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="relative">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                  alt="Professional standards"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                Professional Standards
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                What We Expect From You
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                To maintain quality on the platform, freelancers must uphold high professional standards. High performers are rewarded with better opportunities.
              </p>
              <div className="space-y-4">
                {expectations.map((expectation, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                      <expectation.icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <span className="text-base font-medium text-foreground">{expectation.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SUPPORT & PROTECTION */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400">
                <Shield className="h-4 w-4" />
                Your Protection
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Support & Protection
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                49GIG protects professionals who do great work. We provide comprehensive support and fair systems to ensure your success.
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

            <div className="relative lg:order-last">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80"
                  alt="Support and protection"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 sm:py-20 lg:py-24 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Ready to Work Globally?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join 49GIG and start building a sustainable freelance career with international clients
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="text-base h-12 px-8 shadow-lg">
              <Link href="/get-started">
                Apply as a Freelancer
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="text-base h-12 px-8 bg-primary-foreground/10 border-2 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <Link href="/how-it-works#freelancers">
                Learn How It Works
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

