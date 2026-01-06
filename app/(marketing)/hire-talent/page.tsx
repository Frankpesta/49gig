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
  Zap,
  TrendingUp,
  Code,
  Palette,
  Database,
  PenTool,
  HeadphonesIcon,
  FileText,
  Search,
  UserCheck,
  BadgeCheck,
  Building2,
  Rocket,
} from "lucide-react";

export default function HireTalentPage() {
  const whyHireReasons = [
    {
      icon: Shield,
      title: "Strictly Vetted Professionals",
      description: "Every freelancer on 49GIG goes through a comprehensive vetting process. Only top-performing professionals are approved.",
      image: "https://images.unsplash.com/photo-1552664730-d307ca8849d1?w=800&q=80",
      features: [
        "Identity verification",
        "Skills and competency testing",
        "Portfolio and experience evaluation",
        "Performance and reliability scoring",
      ],
    },
    {
      icon: DollarSign,
      title: "Affordable Rates Without Compromising Quality",
      description: "Africa is home to a fast-growing pool of global-standard talent. You save on costs while maintaining exceptional standards.",
      image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80",
      features: [
        "Competitive pricing",
        "Transparent costs",
        "High-quality delivery",
        "No hidden fees",
      ],
    },
    {
      icon: Zap,
      title: "No Job Posting or Bidding",
      description: "You don't post jobs or review hundreds of applications. We match you with the right talent. Simple, efficient, and stress-free.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
      features: [
        "You tell us what you need",
        "We match you with the right talent",
        "You choose and move forward",
        "Fast turnaround time",
      ],
    },
    {
      icon: Clock,
      title: "Flexible Hiring: Short or Long Term",
      description: "Scale up or down as your needs change. Hire for one-time projects, ongoing work, or full-time equivalent roles.",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
      features: [
        "One-time projects",
        "Ongoing work",
        "Full-time equivalent roles",
        "Flexible scaling",
      ],
    },
  ];

  const hiringSteps = [
    {
      step: "1",
      icon: FileText,
      title: "Tell Us What You Need",
      description: "Fill out a short project form with required skills, scope of work, timeline, budget range, and experience level.",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
    },
    {
      step: "2",
      icon: Search,
      title: "Get Matched with Vetted Talent",
      description: "Our system matches you with top-rated freelancers who best fit your requirements based on skills, experience, and availability.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    },
    {
      step: "3",
      icon: UserCheck,
      title: "Sign Contract & Start Work",
      description: "A secure digital contract is generated and signed by both parties before work begins, ensuring clarity and protection.",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
    },
    {
      step: "4",
      icon: BadgeCheck,
      title: "Pay by Milestones",
      description: "Projects are broken into milestones. Funds are secured upfront and payments are released only after approval. Full transparency and protection.",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
    },
  ];

  const talentCategories = [
    { icon: Code, title: "Software Development" },
    { icon: Palette, title: "UI/UX & Product Design" },
    { icon: Database, title: "Data & Analytics" },
    { icon: TrendingUp, title: "Digital Marketing" },
    { icon: PenTool, title: "Writing & Content" },
    { icon: Users, title: "Product & Project Management" },
    { icon: HeadphonesIcon, title: "Customer Support" },
  ];

  const protectionFeatures = [
    { icon: DollarSign, text: "Secure milestone payments" },
    { icon: Award, text: "Performance monitoring" },
    { icon: FileCheck, text: "Rating and review system" },
    { icon: Shield, text: "Dispute resolution support" },
    { icon: Users, text: "Freelancer replacement if necessary" },
  ];

  const idealFor = [
    { icon: Rocket, text: "Startups" },
    { icon: Building2, text: "SMEs" },
    { icon: Briefcase, text: "Agencies" },
    { icon: TrendingUp, text: "Growing companies" },
    { icon: Building2, text: "Enterprises" },
  ];

  return (
    <div className="w-full">
      {/* PAGE HEADER */}
      <PageHeader
        badge={{
          icon: Users,
          text: "Hire Talent",
        }}
        title="Hire Vetted African Talent"
        description="Work with world-class professionals. Pay fair, affordable rates. Get results. At 49GIG, we help you hire highly vetted African freelancers who are ready to deliver exceptional work—on time, on budget, and to global standards."
      >
        <div className="space-y-4">
          <p className="text-base text-muted-foreground font-medium max-w-2xl mx-auto">
            No job posts. No bidding wars. No guesswork.<br />
            <span className="text-foreground font-semibold">Just reliable talent, carefully matched to your project.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base h-12 px-8 shadow-lg">
              <Link href="/hire-talent">
                Hire Talent Now
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
      </PageHeader>

      {/* WHY HIRE TALENT THROUGH 49GIG */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Why Hire Talent Through 49GIG
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get access to exceptional African talent with built-in quality assurance
            </p>
          </div>

          <div className="space-y-16 lg:space-y-24">
            {whyHireReasons.map((reason, index) => (
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
                  <ul className="space-y-3">
                    {reason.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
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
              How Hiring Works on 49GIG
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A simple, transparent process from requirements to delivery
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

      {/* TALENT CATEGORIES */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Talent Categories Available
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Hire expert professionals across high-demand skills…and more
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-12">
            {talentCategories.map((category, index) => (
              <Card key={index} className="group border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-transform duration-300 group-hover:scale-110">
                      <category.icon className="h-7 w-7 text-primary" />
                    </div>
                  </div>
                  <p className="text-base font-semibold text-foreground leading-tight">
                    {category.title}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" variant="outline" asChild className="text-base h-12 px-8">
              <Link href="/talent-categories">
                View All Categories
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* BUILT-IN PROTECTION */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30 border-y border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400">
                <Shield className="h-4 w-4" />
                Client Protection
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Built-In Protection for Clients
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Your project stays on track with comprehensive protection features designed to ensure successful outcomes.
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
                  src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80"
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

      {/* WHO SHOULD HIRE */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Who Should Hire Through 49GIG
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              If quality, affordability, and reliability matter—49GIG is built for you
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

      {/* FINAL CTA */}
      <section className="py-16 sm:py-20 lg:py-24 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Ready to Hire?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Start your project today and get matched with vetted African talent that delivers
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="text-base h-12 px-8 shadow-lg">
              <Link href="/hire-talent">
                Hire Talent Now
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

