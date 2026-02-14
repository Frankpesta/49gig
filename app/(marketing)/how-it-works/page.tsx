"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { PageHero } from "@/components/marketing/page-hero";
import { CTAButton } from "@/components/marketing/cta-buttons";
import { SectionTransition } from "@/components/ui/section-transition";
import {
  CheckCircle2,
  Users,
  Briefcase,
  FileText,
  Handshake,
  DollarSign,
  Shield,
  ChevronRight,
  Target,
  Award,
  FileCheck,
  Clock,
  Sparkles,
  ArrowRight,
  Play,
  Search,
  UserCheck,
  Rocket,
  Workflow,
  Lightbulb,
  TrendingUp,
  Star,
  MapPin,
  MessageCircle,
  ThumbsUp
} from "lucide-react";

export default function HowItWorksPage() {
  const breadcrumbs = [{ label: "How It Works", icon: Workflow }];

  return (
    <div className="w-full">
      <PageHero
        title="From Idea to Hired Talent in Minutes"
        description="49GIG removes the stress from hiring and working remotely by using a vetted talent system, smart matching, and milestone-based delivery—so both clients and freelancers can work with confidence."
        badge={{ icon: Workflow, text: "How It Works" }}
        breadcrumbs={breadcrumbs}
        imageSrc="https://images.unsplash.com/photo-1552664730-d307ca8849d1?w=800&q=80"
        imageAlt="Team collaboration"
        actions={
          <>
            <CTAButton href="#clients" variant="primary" className="gap-2">
              <Briefcase className="h-5 w-5" />
              For Clients
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
            <CTAButton href="#freelancers" variant="secondary" className="gap-2">
              <Users className="h-5 w-5" />
              For Freelancers
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
          </>
        }
      />

      {/* MODERN FOR CLIENTS SECTION - Interactive Timeline */}
      <section id="clients" className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-background via-primary/5 to-background relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-3 text-sm font-bold text-primary mb-6 border border-primary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-primary/20 to-secondary/20">
                  <Briefcase className="h-3.5 w-3.5 text-primary" />
                </div>
                For Clients
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                Hire Talent Without <br className="hidden lg:block" />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">the Hassle</span>
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                Get matched with vetted African professionals in just 5 simple steps. No job postings, no bidding wars, just results.
              </p>
            </div>
          </SectionTransition>

          {/* Complex Bento Grid - For Clients (editorial: hero, tall, wide, small) */}
          <div className="max-w-6xl mx-auto">
            <BentoGrid columns={3} variant="complex">
              {[
                {
                  step: 1,
                  title: "Choose How You Want to Hire",
                  description: "Select one option:",
                  items: ["Hire a Talent", "Hire a Team"],
                  note: "No job postings. No bidding. No noise.",
                  icon: Search,
                  color: "from-blue-500 to-blue-600",
                  colSpan: 2 as const,
                  rowSpan: 2 as const,
                  placement: { col: 1, row: 1 },
                },
                {
                  step: 2,
                  title: "Share Your Project Details",
                  description: "Complete a structured project form covering:",
                  items: ["Skills required", "Project scope", "Timeline", "Budget"],
                  icon: FileText,
                  color: "from-green-500 to-green-600",
                  colSpan: 1 as const,
                  rowSpan: 2 as const,
                  placement: { col: 3, row: 1 },
                },
                {
                  step: 3,
                  title: "Get Matched with Vetted Professionals",
                  description: "Our system matches you with top-rated freelancers or curated teams.",
                  items: ["Skills", "Vetting score", "Performance", "Availability"],
                  icon: UserCheck,
                  color: "from-purple-500 to-purple-600",
                  colSpan: 2 as const,
                  rowSpan: 1 as const,
                  placement: { col: 1, row: 3 },
                },
                {
                  step: 4,
                  title: "Contract & Onboarding",
                  description: "Secure digital contract signed by all parties. Project workspace activated.",
                  items: [] as string[],
                  icon: Handshake,
                  color: "from-orange-500 to-orange-600",
                  colSpan: 1 as const,
                  rowSpan: 1 as const,
                  placement: { col: 3, row: 3 },
                },
                {
                  step: 5,
                  title: "Milestones, Delivery & Payments",
                  description: "Projects divided into milestones. Payments secured upfront. Funds released after approval.",
                  items: [] as string[],
                  icon: DollarSign,
                  color: "from-teal-500 to-teal-600",
                  colSpan: 3 as const,
                  rowSpan: 1 as const,
                  placement: { col: 1, row: 4 },
                },
              ].map((item, index) => (
                <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                  <BentoCard colSpan={item.colSpan} rowSpan={item.rowSpan} placement={item.placement} className="bg-background/80 backdrop-blur-xl hover:shadow-primary/10">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} shadow-lg`}>
                        <item.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                      </div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold text-foreground leading-tight mb-2">{item.title}</h3>
                    {item.description && <p className="text-muted-foreground leading-relaxed mb-4">{item.description}</p>}
                    {item.items.length > 0 && (
                      <div className="space-y-2">
                        {item.items.map((listItem, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className={`h-4 w-4 shrink-0 text-green-600`} />
                            <span className="text-sm text-foreground">{listItem}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {item.note && (
                      <div className="mt-4 bg-primary/10 rounded-xl p-3 border border-primary/20">
                        <p className="text-sm text-primary font-medium">💡 {item.note}</p>
                      </div>
                    )}
                  </BentoCard>
                </SectionTransition>
              ))}
            </BentoGrid>
          </div>

          {/* Enhanced Client CTA Section */}
          <SectionTransition variant="fade" delay={800}>
            <div className="mt-20 text-center space-y-8">
              <div className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-3xl p-8 border border-border/30">
                <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                  Ready to Hire Your Next Talent?
                </h3>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Start your project today and get matched with vetted African professionals who deliver exceptional results.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <CTAButton href="/hire-talent" variant="primary" className="gap-3">
                    <Play className="h-5 w-5" />
                    Start a Project
                    <ArrowRight className="h-5 w-5" />
                  </CTAButton>
                  <CTAButton href="/hire-team" variant="secondary" className="gap-3">
                    <Users className="h-5 w-5" />
                    Hire a Team
                    <ArrowRight className="h-5 w-5" />
                  </CTAButton>
                </div>
              </div>
            </div>
          </SectionTransition>
        </div>
      </section>

      {/* MODERN FOR FREELANCERS SECTION - Interactive Timeline */}
      <section id="freelancers" className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-secondary/10 via-background to-primary/5 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-secondary/10 to-primary/10 px-6 py-3 text-sm font-bold text-secondary-foreground mb-6 border border-secondary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-secondary/20 to-primary/20">
                  <Users className="h-3.5 w-3.5 text-secondary-foreground" />
                </div>
                For Freelancers
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                Work Globally. Get Paid. <br className="hidden lg:block" />
                <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Grow Your Career</span>
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                Join thousands of African professionals working with global clients. No bidding, no uncertainty—just fair pay and career growth.
              </p>
            </div>
          </SectionTransition>

          {/* Complex Bento Grid - For Freelancers */}
          <div className="max-w-6xl mx-auto">
            <BentoGrid columns={3} variant="complex">
              {[
                {
                  step: 1,
                  title: "Apply to Join 49GIG",
                  description: "Create your freelancer account and submit:",
                  items: ["Personal information", "Skills and experience", "Portfolio"],
                  icon: UserCheck,
                  color: "from-pink-500 to-rose-500",
                  colSpan: 2 as const,
                  rowSpan: 2 as const,
                  placement: { col: 1, row: 1 },
                },
                {
                  step: 2,
                  title: "Automated Vetting Process",
                  description: "All freelancers go through a strict vetting process:",
                  items: ["English proficiency test", "Skills testing"],
                  note: "Only top-scoring professionals are approved.",
                  icon: Shield,
                  color: "from-indigo-500 to-blue-500",
                  colSpan: 1 as const,
                  rowSpan: 2 as const,
                  placement: { col: 3, row: 1 },
                },
                {
                  step: 3,
                  title: "Get Matched to Projects",
                  description: "You don't bid. Projects are assigned based on:",
                  items: ["Skills", "Vetting score", "Performance", "Availability"],
                  icon: Target,
                  color: "from-cyan-500 to-teal-500",
                  colSpan: 2 as const,
                  rowSpan: 1 as const,
                  placement: { col: 1, row: 3 },
                },
                {
                  step: 4,
                  title: "Sign Contract & Start Work",
                  description: "Once selected, sign a digital contract and begin work immediately.",
                  items: [] as string[],
                  icon: Handshake,
                  color: "from-emerald-500 to-green-500",
                  colSpan: 1 as const,
                  rowSpan: 1 as const,
                  placement: { col: 3, row: 3 },
                },
                {
                  step: 5,
                  title: "Deliver Work & Get Paid",
                  description: "Complete milestones, submit deliverables, get paid after approval.",
                  items: ["Secure payouts", "Transparent process"],
                  icon: DollarSign,
                  color: "from-amber-500 to-orange-500",
                  colSpan: 3 as const,
                  rowSpan: 1 as const,
                  placement: { col: 1, row: 4 },
                },
              ].map((item, index) => (
                <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                  <BentoCard colSpan={item.colSpan} rowSpan={item.rowSpan} placement={item.placement} className="bg-background/80 backdrop-blur-xl hover:shadow-secondary/10">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} shadow-lg`}>
                        <item.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                      </div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-sm font-bold">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold text-foreground leading-tight mb-2">{item.title}</h3>
                    {item.description && <p className="text-muted-foreground leading-relaxed mb-4">{item.description}</p>}
                    {item.items.length > 0 && (
                      <div className="space-y-2">
                        {item.items.map((listItem, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                            <span className="text-sm text-foreground">{listItem}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {item.note && (
                      <div className="mt-4 bg-secondary/10 rounded-xl p-3 border border-secondary/20">
                        <p className="text-sm text-secondary-foreground font-medium">⭐ {item.note}</p>
                      </div>
                    )}
                  </BentoCard>
                </SectionTransition>
              ))}
            </BentoGrid>
          </div>

          {/* Enhanced Freelancer CTA Section */}
          <SectionTransition variant="fade" delay={800}>
            <div className="mt-20 text-center space-y-8">
              <div className="bg-gradient-to-r from-secondary/5 via-primary/5 to-secondary/5 rounded-3xl p-8 border border-border/30">
                <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                  Ready to Start Your Global Freelance Career?
                </h3>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join 49GIG today and get matched with serious international clients who value your skills.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <CTAButton href="/signup" variant="primary" className="gap-3">
                    <Rocket className="h-5 w-5" />
                    Apply as Freelancer
                    <ArrowRight className="h-5 w-5" />
                  </CTAButton>
                  <CTAButton href="/for-freelancers" variant="secondary" className="gap-3">
                    <Users className="h-5 w-5" />
                    Learn More for Freelancers
                    <ArrowRight className="h-5 w-5" />
                  </CTAButton>
                </div>
              </div>
            </div>
          </SectionTransition>
        </div>
      </section>

      {/* MODERN WHY 49GIG WORKS BETTER */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-background via-muted/10 to-background relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-3 text-sm font-bold text-primary mb-6 border border-primary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-primary/20 to-secondary/20">
                  <Lightbulb className="h-3.5 w-3.5 text-primary" />
                </div>
                Why Choose 49GIG
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                Why 49GIG <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Works Better</span>
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                Experience the difference with our proven platform that prioritizes quality, security, and success for everyone.
              </p>
            </div>
          </SectionTransition>

          <BentoGrid columns={3} variant="complex" className="max-w-6xl mx-auto">
            {[
              {
                icon: Shield,
                title: "Quality First",
                description: "Only vetted professionals are allowed on the platform.",
                color: "from-blue-500 to-blue-600",
                metric: "Top 3%",
                colSpan: 2 as const,
                rowSpan: 2 as const,
                placement: { col: 1, row: 1 },
              },
              {
                icon: FileText,
                title: "Transparent Process",
                description: "Clear contracts, milestones, and expectations from day one.",
                color: "from-green-500 to-green-600",
                metric: "100% Clear",
                colSpan: 1 as const,
                rowSpan: 2 as const,
                placement: { col: 3, row: 1 },
              },
              {
                icon: Award,
                title: "Built-In Protection",
                description: "Secure payments, dispute resolution, and performance tracking.",
                color: "from-purple-500 to-purple-600",
                metric: "Bank-Level",
                colSpan: 1 as const,
                rowSpan: 1 as const,
                placement: { col: 1, row: 3 },
              },
              {
                icon: DollarSign,
                title: "Fair & Affordable",
                description: "Clients get great value. Freelancers get fair pay.",
                color: "from-orange-500 to-orange-600",
                metric: "Best Value",
                colSpan: 2 as const,
                rowSpan: 1 as const,
                placement: { col: 2, row: 3 },
              },
            ].map((item, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <BentoCard colSpan={item.colSpan} rowSpan={item.rowSpan} placement={item.placement} className="group relative bg-background/80 backdrop-blur-xl hover:shadow-primary/15 group-hover:border-primary/30 overflow-hidden">
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative space-y-6">
                      {/* Enhanced Icon with Gradient */}
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-500 shadow-lg group-hover:shadow-primary/20 group-hover:scale-110">
                        <item.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                      </div>

                      {/* Content */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl lg:text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
                            {item.title}
                          </h3>
                          <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${item.color} text-white text-xs font-bold shadow-lg`}>
                            {item.metric}
                          </div>
                        </div>
                        <p className="text-base text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors duration-300">
                          {item.description}
                        </p>
                      </div>

                      {/* Progress Bar Animation */}
                      <div className="space-y-2">
                        <div className="h-1 w-full bg-border/30 rounded-full overflow-hidden">
                          <div className="h-full w-0 bg-gradient-to-r from-primary to-secondary rounded-full group-hover:w-full transition-all duration-700 ease-out" />
                        </div>
                      </div>

                      {/* Call to Action */}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Learn more
                        </span>
                        <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>
                </BentoCard>
              </SectionTransition>
            ))}
          </BentoGrid>

          {/* Success Metrics */}
          <SectionTransition variant="fade" delay={600}>
            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-6 border border-border/30 hover:border-primary/30 transition-colors duration-300">
                <div className="text-3xl font-black text-primary mb-2">98%</div>
                <div className="text-sm text-muted-foreground">Project Success Rate</div>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-6 border border-border/30 hover:border-secondary/30 transition-colors duration-300">
                <div className="text-3xl font-black text-secondary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">Support Available</div>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-6 border border-border/30 hover:border-green-500/30 transition-colors duration-300">
                <div className="text-3xl font-black text-green-600 mb-2">$2M+</div>
                <div className="text-sm text-muted-foreground">Paid to Freelancers</div>
              </div>
            </div>
          </SectionTransition>
        </div>
      </section>

      {/* MODERN FINAL CTA SECTION */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-y border-border/30 relative overflow-hidden">
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "2s" }} />
          <div className="absolute bottom-1/3 right-1/3 w-20 h-20 bg-secondary/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "3s" }} />
        </div>

        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23345478' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center space-y-12">
              {/* Enhanced Badge */}
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 px-8 py-4 text-sm font-bold text-primary border border-primary/20 shadow-2xl">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary">
                  <Rocket className="h-4 w-4 text-white" />
                </div>
                Ready to Get Started?
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>

              {/* Enhanced Headline */}
              <div className="space-y-6">
                <h2 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-black text-foreground leading-[0.9] tracking-tight">
                  Your Success <span className="bg-gradient-to-r from-primary via-primary/90 to-secondary bg-clip-text text-transparent">Starts Here</span>
                </h2>
                <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                  Whether you're hiring world-class talent or building your freelance career, 49GIG makes it simple, secure, and successful.
                </p>
              </div>

              {/* Enhanced Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12 pt-8">
                <div className="group flex items-center gap-4 rounded-2xl bg-background/90 backdrop-blur-xl px-6 py-4 border border-border/30 shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:border-primary/40 hover:scale-105">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 group-hover:from-green-500/30 group-hover:to-emerald-500/30 transition-all duration-300 shadow-lg">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-foreground">Zero Setup Fees</div>
                    <div className="text-xs text-muted-foreground">Start immediately</div>
                  </div>
                </div>

                <div className="group flex items-center gap-4 rounded-2xl bg-background/90 backdrop-blur-xl px-6 py-4 border border-border/30 shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:border-primary/40 hover:scale-105">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/30 group-hover:from-primary/30 group-hover:to-primary/40 transition-all duration-300 shadow-lg">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-foreground">100% Secure</div>
                    <div className="text-xs text-muted-foreground">Bank-level protection</div>
                  </div>
                </div>

                <div className="group flex items-center gap-4 rounded-2xl bg-background/90 backdrop-blur-xl px-6 py-4 border border-border/30 shadow-xl hover:shadow-secondary/20 transition-all duration-300 hover:border-secondary/40 hover:scale-105">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/30 group-hover:from-secondary/30 group-hover:to-secondary/40 transition-all duration-300 shadow-lg">
                    <Award className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-foreground">Guaranteed Results</div>
                    <div className="text-xs text-muted-foreground">Money-back promise</div>
                  </div>
                </div>
              </div>

              {/* Enhanced CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-8 justify-center pt-12">
                <SectionTransition variant="slide" direction="left" delay={600}>
                  <CTAButton href="/hire-talent" variant="primary" className="gap-3">
                    <Briefcase className="h-6 w-6" />
                    Hire World-Class Talent
                    <ArrowRight className="h-6 w-6" />
                  </CTAButton>
                </SectionTransition>
                <SectionTransition variant="slide" direction="right" delay={700}>
                  <CTAButton href="/signup" variant="secondary" className="gap-3">
                    <Rocket className="h-6 w-6" />
                    Become a Freelancer
                    <ArrowRight className="h-6 w-6" />
                  </CTAButton>
                </SectionTransition>
              </div>

              {/* Enhanced Guarantee Section */}
              <SectionTransition variant="fade" delay={800}>
                <div className="bg-background/80 backdrop-blur-xl rounded-3xl p-8 border border-border/30 shadow-xl max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-primary">Free</div>
                      <div className="text-sm text-muted-foreground">No setup fees</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-secondary">Instant</div>
                      <div className="text-sm text-muted-foreground">Start in minutes</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-green-600">Guaranteed</div>
                      <div className="text-sm text-muted-foreground">Success or refund</div>
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
