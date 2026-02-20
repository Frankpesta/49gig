"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/marketing/page-hero";
import { CTAButton } from "@/components/marketing/cta-buttons";
import { SectionTransition } from "@/components/ui/section-transition";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import {
  CheckCircle2,
  Users,
  Briefcase,
  Shield,
  Star,
  DollarSign,
  Clock,
  Award,
  Search,
  ChevronRight,
  ArrowRight,
  Crown,
  Zap,
  Target,
  TrendingUp,
  MessageCircle,
  Calendar,
  CheckSquare,
  FileText,
  UserCheck,
  Heart,
  MapPin,
  Globe,
  ThumbsUp,
  Sparkles,
  Play,
  Building2,
  Lightbulb,
  Workflow,
  BarChart3,
  Rocket
} from "lucide-react";

export default function HireTalentPage() {
  const breadcrumbs = [
    { label: "Services", href: "/hire-talent" },
    { label: "Hire Talent", icon: Users },
  ];

  const whyChooseIndividual = [
    {
      icon: Target,
      title: "Precise Matching",
      description: "Our AI matches you with freelancers who have the exact skills and experience you need."
    },
    {
      icon: Zap,
      title: "Quick Start",
      description: "Get started in hours, not weeks. Most projects begin within 48 hours of hiring."
    },
    {
      icon: Shield,
      title: "Risk-Free Hiring",
      description: "30-day money-back guarantee. Pay only for work that meets your standards."
    },
    {
      icon: TrendingUp,
      title: "Scale as Needed",
      description: "Start with one freelancer and scale up as your project requirements grow."
    }
  ];

  const processSteps = [
    {
      step: 1,
      title: "Post Your Project",
      description: "Tell us about your requirements, timeline, and budget. Our smart form takes just 5 minutes.",
      icon: FileText,
      color: "from-blue-500 to-blue-600"
    },
    {
      step: 2,
      title: "Get Matched Instantly",
      description: "Receive curated profiles of qualified freelancers who match your project needs.",
      icon: Search,
      color: "from-green-500 to-green-600"
    },
    {
      step: 3,
      title: "Interview & Hire",
      description: "Review portfolios, conduct interviews, and hire your perfect match with confidence.",
      icon: UserCheck,
      color: "from-purple-500 to-purple-600"
    },
    {
      step: 4,
      title: "Work & Pay Securely",
      description: "Track progress, approve milestones, and pay securely. Full transparency throughout.",
      icon: Shield,
      color: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <div className="w-full">
      <PageHero
        title="Hire Individual Talent"
        description="Find and hire skilled African professionals for your next project. From developers to designers, marketers to data scientists—access world-class talent matched to your needs."
        badge={{ icon: Users, text: "Individual Hiring" }}
        breadcrumbs={breadcrumbs}
        imageSrc="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80"
        imageAlt="Professional collaboration"
        actions={
          <>
            <CTAButton href="/signup/client" variant="primary" className="gap-2">
              <Briefcase className="h-5 w-5" />
              Start Hiring Now
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
            <CTAButton href="/talent-categories" variant="secondary" className="gap-2">
              <Users className="h-5 w-5" />
              Browse Categories
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
          </>
        }
      />

      {/* WHY CHOOSE INDIVIDUAL - Bento Grid */}
      <section id="talent" className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-muted/20 via-background to-muted/20 border-y border-border/30 relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3">
                Why Hire Individual Talent
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Get matched with vetted professionals who fit your project needs.
              </p>
            </div>
          </SectionTransition>

          <BentoGrid columns={3} variant="complex" className="mb-16 max-w-6xl mx-auto">
            {whyChooseIndividual.map((item, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <BentoCard colSpan={index === 0 ? 2 : 1} rowSpan={index === 0 ? 2 : 1} className="bg-card">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </BentoCard>
              </SectionTransition>
            ))}
          </BentoGrid>

        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-muted/20 via-background to-muted/20 border-y border-border/30 relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-secondary/10 to-primary/10 px-6 py-3 text-sm font-bold text-secondary mb-6 border border-secondary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-secondary/20 to-primary/20">
                  <Workflow className="h-3.5 w-3.5 text-secondary" />
                </div>
                How It Works
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                From Hire to <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Success</span>
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                Our streamlined process ensures you find and work with the right talent quickly and securely.
              </p>
            </div>
          </SectionTransition>

          {/* Process Steps - Bento Grid */}
          <BentoGrid columns={3} variant="complex" className="max-w-6xl mx-auto">
            {processSteps.map((step, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <BentoCard colSpan={index === 0 ? 2 : 1} rowSpan={index === 0 ? 2 : 1} className="group relative bg-background/80 backdrop-blur-xl hover:shadow-primary/15 overflow-hidden">
                  <div className="absolute -top-4 -right-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white font-bold text-lg shadow-lg">
                    {step.step}
                  </div>
                  <div className="relative space-y-6">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${step.color} shadow-lg`}>
                      <step.icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
                        {step.title}
                      </h3>
                      <p className="text-base text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors duration-300">
                        {step.description}
                      </p>
                    </div>
                    <div className="h-1 w-full bg-border/30 rounded-full overflow-hidden">
                      <div className={`h-full w-0 bg-gradient-to-r ${step.color} rounded-full group-hover:w-full transition-all duration-700 ease-out`} />
                    </div>
                  </div>
                </BentoCard>
              </SectionTransition>
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-y border-border/30 relative overflow-hidden">
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "2s" }} />
          <div className="absolute bottom-1/3 right-1/3 w-20 h-20 bg-secondary/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "3s" }} />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center space-y-12">
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 px-8 py-4 text-sm font-bold text-primary border border-primary/20 shadow-2xl">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary">
                  <Rocket className="h-4 w-4 text-white" />
                </div>
                Ready to Hire?
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>

              <div className="space-y-6">
                <h2 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-black text-foreground leading-[0.9] tracking-tight">
                  Find Your <span className="bg-gradient-to-r from-primary via-primary/90 to-secondary bg-clip-text text-transparent">Perfect Match</span>
                </h2>
                <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                  Start your project today with confidence. Get matched with verified African talent that delivers exceptional results.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-8 justify-center pt-12">
                <SectionTransition variant="slide" direction="left" delay={600}>
                  <CTAButton href="/hire-talent" variant="primary" className="gap-3">
                    <Briefcase className="h-6 w-6" />
                    Hire Individual Talent
                    <ArrowRight className="h-6 w-6" />
                  </CTAButton>
                </SectionTransition>
                <SectionTransition variant="slide" direction="right" delay={700}>
                  <CTAButton href="/hire-team" variant="secondary" className="gap-3">
                    <Users className="h-6 w-6" />
                    Hire a Full Team
                    <ArrowRight className="h-6 w-6" />
                  </CTAButton>
                </SectionTransition>
              </div>

              <SectionTransition variant="fade" delay={800}>
                <div className="bg-background/80 backdrop-blur-xl rounded-3xl p-8 border border-border/30 shadow-xl max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-primary">Free</div>
                      <div className="text-sm text-muted-foreground">Project posting</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-secondary">48hrs</div>
                      <div className="text-sm text-muted-foreground">Average matching time</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-green-600">100%</div>
                      <div className="text-sm text-muted-foreground">Payment protection</div>
                    </div>
                  </div>
                </div>
              </SectionTransition>
            </div>
          </SectionTransition>
        </div>
      </section>
    </div>
  );
}