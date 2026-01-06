"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/marketing/page-header";
import {
  CheckCircle2,
  Users,
  ChevronRight,
  Shield,
  Target,
  Award,
  Zap,
  Globe,
  Heart,
  Lightbulb,
  Handshake,
  TrendingUp,
  FileCheck,
  Search,
  Rocket,
  DollarSign,
} from "lucide-react";

export default function AboutPage() {
  const whatWeDo = [
    {
      icon: Shield,
      title: "Vetted Freelancers",
      description: "All professionals undergo automated vetting including identity verification, skills testing, and portfolio review.",
    },
    {
      icon: Target,
      title: "Tailored Matching",
      description: "Our platform matches clients with talent based on skills, experience, ratings, and project requirements.",
    },
    {
      icon: Users,
      title: "Flexible Hiring Options",
      description: "Hire a single expert or a full, curated team depending on project needs.",
    },
    {
      icon: DollarSign,
      title: "Secure, Transparent Payments",
      description: "Milestone-based payment system ensures both client and freelancer protection.",
    },
    {
      icon: Award,
      title: "Support & Protection",
      description: "Dispute resolution, performance monitoring, and freelancer replacement when necessary.",
    },
  ];

  const whyDifferent = [
    {
      icon: Award,
      title: "Quality Over Quantity",
      description: "Only top-performing, vetted talent is approved.",
    },
    {
      icon: Zap,
      title: "No Job Bidding",
      description: "Clients don't post jobs; our system automatically matches them with the best-fit professionals.",
    },
    {
      icon: Globe,
      title: "Affordable Global Talent",
      description: "Access skilled African professionals at competitive rates without compromising quality.",
    },
    {
      icon: Shield,
      title: "Trust & Reliability",
      description: "Every interaction is secured, tracked, and transparent, building long-term confidence.",
    },
    {
      icon: TrendingUp,
      title: "Empowering African Professionals",
      description: "We help freelancers grow careers, earn fairly, and work with global clients.",
    },
  ];

  const values = [
    {
      icon: Award,
      title: "Excellence",
      description: "We deliver and expect high-quality results in every project.",
      color: "primary",
    },
    {
      icon: Shield,
      title: "Trust",
      description: "Transparent processes and verified talent create reliability for clients and freelancers alike.",
      color: "primary",
    },
    {
      icon: Rocket,
      title: "Empowerment",
      description: "We give African professionals the opportunity to thrive globally.",
      color: "secondary",
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "Leveraging technology to streamline hiring, vetting, and project management.",
      color: "secondary",
    },
    {
      icon: Handshake,
      title: "Collaboration",
      description: "We foster mutually beneficial relationships between clients and freelancers.",
      color: "secondary",
    },
  ];

  const howWeWork = [
    {
      step: "1",
      icon: FileCheck,
      title: "Client Engagement",
      description: "Companies select whether to hire a freelancer or a team and provide project details.",
    },
    {
      step: "2",
      icon: Search,
      title: "Automated Matching",
      description: "Our system matches clients with the best-fit talent based on requirements and availability.",
    },
    {
      step: "3",
      icon: Rocket,
      title: "Project Execution",
      description: "Contracts, milestones, and secure payments ensure smooth delivery from start to finish.",
    },
    {
      step: "4",
      icon: TrendingUp,
      title: "Performance Monitoring",
      description: "Freelancers' work is tracked and rated for continuous quality assurance.",
    },
  ];

  const commitments = [
    { text: "Companies hire confidently" },
    { text: "Freelancers grow sustainably" },
    { text: "Projects succeed consistently" },
  ];

  return (
    <div className="w-full">
      {/* PAGE HEADER */}
      <PageHeader
        badge={{
          icon: Globe,
          text: "About 49GIG",
        }}
        title="Connecting Africa's Best Freelancers to the World"
        description="At 49GIG, we believe Africa is home to some of the world's most talented, creative, and hardworking professionals. Yet, many of these highly skilled individuals face barriers to accessing global opportunities. Our platform bridges this gap—connecting vetted African freelancers with companies worldwide, enabling businesses to scale efficiently and freelancers to build sustainable global careers."
      />

      {/* MISSION & VISION */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Mission */}
            <Card className="border-2 border-primary/50 overflow-hidden">
              <CardContent className="p-8 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  <Target className="h-4 w-4" />
                  Our Mission
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Unlock Africa's Vast Talent Potential
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed">
                  To unlock Africa's vast talent potential by connecting skilled, vetted professionals with global opportunities—delivering exceptional value, trust, and results for companies while empowering freelancers to thrive internationally.
                </p>
              </CardContent>
            </Card>

            {/* Vision */}
            <Card className="border-2 border-secondary/50 overflow-hidden">
              <CardContent className="p-8 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-sm font-medium text-secondary">
                  <Rocket className="h-4 w-4" />
                  Our Vision
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Africa's Most Trusted Talent Marketplace
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed">
                  To become the most trusted African talent marketplace globally, enabling businesses to scale smarter and freelancers to achieve long-term success beyond borders.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* WHAT WE DO */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30 border-y border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              What We Do
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              49GIG is more than a freelance marketplace. We are a structured, reliable ecosystem designed to ensure successful outcomes for both clients and freelancers.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {whatWeDo.map((item, index) => (
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

      {/* WHY 49GIG IS DIFFERENT */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Why 49GIG is Different
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're building something fundamentally better for both clients and freelancers
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {whyDifferent.map((item, index) => (
              <div key={index} className="space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUR VALUES */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30 border-y border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Our Values
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value, index) => (
              <Card key={index} className="group border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      value.color === "primary" ? "bg-primary/10" : "bg-secondary/10"
                    } transition-transform duration-300 group-hover:scale-110`}>
                      <value.icon className={`h-6 w-6 ${
                        value.color === "primary" ? "text-primary" : "text-secondary"
                      }`} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-muted-foreground/30">
                        {index + 1}
                      </span>
                      <h3 className="text-lg font-semibold text-foreground">
                        {value.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* HOW WE WORK */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              How We Work
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A streamlined process designed for successful outcomes
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {howWeWork.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold shadow-lg">
                    {step.step}
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {index < howWeWork.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OUR COMMITMENT */}
      <section className="py-16 sm:py-20 lg:py-24 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm font-medium">
                <Heart className="h-4 w-4" />
                Our Commitment
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                Building Bridges, Not Barriers
              </h2>
              <p className="text-lg text-primary-foreground/90 leading-relaxed">
                At 49GIG, we are committed to creating a trusted global marketplace where companies hire confidently, freelancers grow sustainably, and projects succeed consistently.
              </p>
              <div className="space-y-4">
                {commitments.map((commitment, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/10">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <span className="text-base font-medium">{commitment.text}</span>
                  </div>
                ))}
              </div>
              <p className="text-base text-primary-foreground/90 leading-relaxed pt-4">
                We believe in building bridges, not barriers—connecting top African talent with opportunities worldwide, creating value for everyone involved.
              </p>
            </div>

            <div className="relative">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                  alt="Team collaboration"
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
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Join Us
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Whether you are a company looking to hire, or a freelancer seeking global projects, 49GIG is the platform designed for you
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base h-12 px-8 shadow-lg">
              <Link href="/hire-talent">
                Hire Talent
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

