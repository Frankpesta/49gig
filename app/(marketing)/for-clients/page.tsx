"use client";

import Image from "next/image";
import { PageHero } from "@/components/marketing/page-hero";
import { CTAButton } from "@/components/marketing/cta-buttons";
import { SectionTransition } from "@/components/ui/section-transition";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import {
  CheckCircle2,
  Users,
  Briefcase,
  Shield,
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
  TrendingUp,
  Star,
  Heart,
  ArrowRight,
  Play,
  Lightbulb,
  BarChart3,
  MessageCircle,
  ThumbsUp,
  MapPin,
  Workflow
} from "lucide-react";

export default function ForClientsPage() {
  const clientStats = [
    { value: "95", label: "Client Satisfaction", suffix: "%", icon: Star },
    { value: "48", label: "Hours to Hire", suffix: "hrs", icon: Clock },
    { value: "500", label: "Companies Served", suffix: "+", icon: Building2 },
    { value: "3", label: "Days Average", suffix: "days", icon: Zap },
  ];
  const whyChooseReasons = [
    {
      icon: Shield,
      title: "Access to Vetted, High-Quality Talent",
      description: "Every professional on 49GIG is carefully vetted through English proficiency and skills testing. Only top-scoring talents are approved.",
      features: [
        "English proficiency & skills testing",
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
        "Secure payments",
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
    { icon: DollarSign, text: "Competitive rates" },
  ];

  const breadcrumbs = [{ label: "For Clients", icon: Briefcase }];

  return (
    <div className="w-full">
      <PageHero
        title="Hire Vetted African Talent & Teams With Confidence"
        description="49GIG helps companies around the world hire highly vetted African freelancers and teams—delivering global-standard work at transparent rates. No job postings. No bidding. Just the right talent, matched to your needs."
        badge={{ icon: Briefcase, text: "For Clients" }}
        breadcrumbs={breadcrumbs}
        imageSrc="https://images.unsplash.com/photo-1552664730-d307ca8849d1?w=800&q=80"
        imageAlt="Team collaboration"
        actions={
          <>
            <CTAButton href="/signup/client" variant="primary" className="gap-2">
              <Briefcase className="h-5 w-5" />
              Hire Vetted Talent
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
            <CTAButton href="/hire-team" variant="secondary" className="gap-2">
              <Users className="h-5 w-5" />
              Hire a Team
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
          </>
        }
      />

      {/* Stats */}
      <section className="py-8 sm:py-10 border-b border-border/30 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {clientStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 mx-auto items-center justify-center rounded-xl bg-primary/10 mb-3">
                  <stat.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}{stat.suffix}</div>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODERN WHY COMPANIES CHOOSE 49GIG */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-background via-primary/5 to-background relative overflow-hidden">
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
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground mb-5 leading-tight">
                Why Companies Choose <br className="hidden lg:block" />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">49GIG</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                We make hiring exceptional African talent simple, secure, and successful with our proven platform and process.
              </p>
            </div>
          </SectionTransition>

          <div className="space-y-20 lg:space-y-24">
            {whyChooseReasons.map((reason, index) => (
              <SectionTransition key={index} variant="slide" direction={index % 2 === 0 ? "left" : "right"} delay={300 + index * 200}>
                <div className={`grid gap-12 lg:grid-cols-2 lg:gap-16 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                  {/* Modern Content Card */}
                  <div className="space-y-8">
                    <div className="group relative">
                      {/* Hover Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl scale-110" />

                      <div className="relative bg-background/80 backdrop-blur-xl border border-border/30 rounded-3xl p-8 lg:p-10 shadow-xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:scale-105">
                        {/* Animated Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />

                        <div className="relative space-y-8">
                          <div className="flex items-start gap-6">
                            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-500 shadow-lg group-hover:shadow-primary/20 group-hover:scale-110">
                              <reason.icon className="h-10 w-10 text-primary group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <div className="space-y-3 flex-1">
                              <h3 className="text-2xl lg:text-3xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
                                {reason.title}
                              </h3>
                              <div className="h-1 w-16 bg-gradient-to-r from-primary to-secondary rounded-full group-hover:w-24 transition-all duration-300" />
                            </div>
                          </div>

                          <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors duration-300">
                            {reason.description}
                          </p>

                          <div className="space-y-4">
                            {reason.features.map((feature, idx) => (
                              <SectionTransition key={idx} variant="slide" direction="up" delay={500 + idx * 100}>
                                <div className="flex items-start gap-4 group/item">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 group-hover/item:from-green-600 group-hover/item:to-emerald-600 transition-all duration-300 shadow-lg group-hover/item:scale-110 mt-1">
                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                  </div>
                                  <span className="text-base font-medium text-foreground leading-relaxed group-hover/item:text-primary transition-colors duration-300 flex-1">
                                    {feature}
                                  </span>
                                </div>
                              </SectionTransition>
                            ))}
                          </div>

                          {/* Call to Action */}
                          <div className="flex items-center justify-between pt-4 border-t border-border/30 group-hover:border-primary/30 transition-colors duration-300">
                            <span className="text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              Learn more about this benefit
                            </span>
                            <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Image Section */}
                  <div className={`relative ${index % 2 === 1 ? '' : 'lg:order-last'}`}>
                    <div className="relative group">
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-2xl border border-border/30 group-hover:shadow-primary/20 transition-all duration-500 group-hover:scale-105">
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
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Success overlay */}
                        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-2xl px-4 py-2 border border-border/30 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-foreground">Proven results</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionTransition>
            ))}
          </div>

          {/* Social Proof Section */}
          <SectionTransition variant="fade" delay={600}>
            <div className="mt-20 text-center">
              <div className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-3xl p-8 border border-border/30">
                <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                  Trusted by Industry Leaders
                </h3>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join hundreds of companies who have successfully hired top African talent through 49GIG
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                  <div className="space-y-2">
                    <div className="text-3xl font-semibold text-primary">500+</div>
                    <div className="text-sm text-muted-foreground">Companies Served</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-semibold text-secondary">95%</div>
                    <div className="text-sm text-muted-foreground">Client Satisfaction</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-semibold text-green-600">48hrs</div>
                    <div className="text-sm text-muted-foreground">Average Hire Time</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-semibold text-purple-600">120+</div>
                    <div className="text-sm text-muted-foreground">Countries Reached</div>
                  </div>
                </div>
              </div>
            </div>
          </SectionTransition>
        </div>
      </section>

      {/* MODERN HOW HIRING WORKS - Interactive Timeline */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-muted/20 via-background to-muted/20 border-y border-border/30 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-3 text-sm font-bold text-primary mb-6 border border-primary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-primary/20 to-secondary/20">
                  <Workflow className="h-3.5 w-3.5 text-primary" />
                </div>
                How Hiring Works
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground mb-5 leading-tight">
                From Need to Hire in <br className="hidden lg:block" />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Just 5 Steps</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Our streamlined process gets you from project idea to working with vetted talent in days, not weeks.
              </p>
            </div>
          </SectionTransition>

          {/* Complex Bento Grid - How Hiring Works */}
          <div className="max-w-6xl mx-auto">
            <BentoGrid columns={3} variant="complex">
              {[
                { stepIndex: 0, colSpan: 2 as const, rowSpan: 2 as const, placement: { col: 1, row: 1 } },
                { stepIndex: 1, colSpan: 1 as const, rowSpan: 2 as const, placement: { col: 3, row: 1 } },
                { stepIndex: 2, colSpan: 2 as const, rowSpan: 1 as const, placement: { col: 1, row: 3 } },
                { stepIndex: 4, colSpan: 1 as const, rowSpan: 1 as const, placement: { col: 3, row: 3 } },
                { stepIndex: 3, colSpan: 3 as const, rowSpan: 1 as const, placement: { col: 1, row: 4 } },
              ].map(({ stepIndex, colSpan, rowSpan, placement }) => {
                const step = hiringSteps[stepIndex];
                const colors = ['from-blue-500 to-blue-600', 'from-green-500 to-green-600', 'from-purple-500 to-purple-600', 'from-orange-500 to-orange-600', 'from-teal-500 to-teal-600'];
                const notes = [
                  "No job postings or bidding. Get matched directly with pre-vetted talent.",
                  "Our intake form takes about 5 minutes and captures your exact needs.",
                  "Get matched in 48 hours with professionals aligned to your project.",
                  "Secure contracts protect both parties with clear terms and expectations.",
                  "Pay only for approved work with transparent milestone tracking.",
                ];
                return (
                  <SectionTransition key={stepIndex} variant="slide" direction="up" delay={300 + stepIndex * 100}>
                    <BentoCard colSpan={colSpan} rowSpan={rowSpan} placement={placement} className="bg-background/80 backdrop-blur-xl hover:shadow-primary/10">
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${colors[stepIndex]} shadow-lg`}>
                          <step.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                        </div>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          {step.step}
                        </span>
                      </div>
                      <h3 className="text-xl lg:text-2xl font-semibold text-foreground leading-tight mb-2">{step.title}</h3>
                      <p className="text-muted-foreground leading-relaxed mb-4">{step.description}</p>
                      <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
                        <p className="text-sm text-primary font-medium">{notes[stepIndex]}</p>
                      </div>
                    </BentoCard>
                  </SectionTransition>
                );
              })}
            </BentoGrid>
          </div>

          {/* Process Overview */}
          <SectionTransition variant="fade" delay={800}>
            <div className="mt-20 text-center">
              <div className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-3xl p-8 border border-border/30">
                <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                  The Complete Hiring Journey
                </h3>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  From project brief to successful delivery, we handle every step so you can focus on your business.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-primary">3 Days</div>
                    <div className="text-sm text-muted-foreground">Average time to hire</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-secondary">0 Risk</div>
                    <div className="text-sm text-muted-foreground">Money-back guarantee</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-green-600">24/7</div>
                    <div className="text-sm text-muted-foreground">Support throughout</div>
                  </div>
                </div>
              </div>
            </div>
          </SectionTransition>
        </div>
      </section>

      {/* MODERN CLIENT PROTECTION SECTION */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-background via-green-500/5 to-background relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-8">
              <SectionTransition variant="fade" delay={200}>
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 px-6 py-3 text-sm font-bold text-green-700 border border-green-500/20 shadow-lg">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20">
                      <Shield className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    100% Client Protection
                  </div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground leading-tight">
                    Your Project, <br className="hidden lg:block" />
                    <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Fully Protected</span>
                  </h2>
                  <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
                    Comprehensive protection features ensure your project stays secure from start to finish, with guaranteed results and peace of mind.
                  </p>
                </div>
              </SectionTransition>

              <div className="space-y-6">
                {protectionFeatures.map((feature, index) => (
                  <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                    <div className="group flex items-start gap-4 p-4 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/30 hover:border-green-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 group-hover:from-green-500/30 group-hover:to-emerald-500/30 transition-all duration-300 shadow-lg group-hover:scale-110">
                        <feature.icon className="h-6 w-6 text-green-600 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <span className="text-base font-bold text-foreground group-hover:text-green-700 transition-colors duration-300">{feature.text}</span>
                        <div className="h-0.5 w-0 bg-green-500 group-hover:w-full transition-all duration-300 rounded-full" />
                      </div>
                    </div>
                  </SectionTransition>
                ))}
              </div>

              <SectionTransition variant="fade" delay={600}>
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-3xl p-6 border border-green-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-bold text-green-700">Money-Back Guarantee</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Not satisfied with the work? Get a full refund. Your satisfaction is our guarantee.
                  </p>
                </div>
              </SectionTransition>
            </div>

            <SectionTransition variant="scale" delay={400}>
              <div className="relative group">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-2xl border border-border/30 group-hover:shadow-green-500/20 transition-all duration-500 group-hover:scale-105">
                  <Image
                    src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80"
                    alt="Client protection"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-green-500/10 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Protection metrics overlay */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-background/95 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-border/30">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">99.9%</div>
                        <div className="text-xs text-muted-foreground">Uptime</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-primary">$2M+</div>
                        <div className="text-xs text-muted-foreground">Protected</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-secondary">24/7</div>
                        <div className="text-xs text-muted-foreground">Support</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionTransition>
          </div>
        </div>
      </section>

      {/* MODERN WHO 49GIG IS FOR SECTION */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-muted/20 via-background to-muted/20 border-y border-border/30 relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-3 text-sm font-bold text-primary mb-6 border border-primary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-primary/20 to-secondary/20">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                </div>
                Perfect For
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground mb-5 leading-tight">
                Built For <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Every Business</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                From startups to enterprises, if you value quality, affordability, and reliability, 49GIG is designed for you.
              </p>
            </div>
          </SectionTransition>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {idealFor.map((item, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <div className="group relative h-full">
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl scale-110" />

                  <div className="relative h-full bg-background/80 backdrop-blur-xl border border-border/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-primary/15 transition-all duration-500 hover:scale-105 group-hover:border-primary/30 overflow-hidden">
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative text-center space-y-6">
                      <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-500 shadow-lg group-hover:shadow-primary/20 group-hover:scale-110">
                        <item.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-lg lg:text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                          {item.text}
                        </h3>
                        <p className="text-sm text-muted-foreground group-hover:text-foreground/90 transition-colors duration-300 leading-relaxed">
                          {index === 0 && "Fast-moving teams needing quick talent solutions"}
                          {index === 1 && "Growing businesses scaling operations efficiently"}
                          {index === 2 && "Creative agencies delivering client projects"}
                          {index === 3 && "Expanding companies building new capabilities"}
                          {index === 4 && "Large organizations outsourcing specialized work"}
                        </p>
                      </div>

                      {/* Progress Bar Animation */}
                      <div className="space-y-2">
                        <div className="h-1 w-full bg-border/30 rounded-full overflow-hidden">
                          <div className="h-full w-0 bg-gradient-to-r from-primary to-secondary rounded-full group-hover:w-full transition-all duration-700 ease-out" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionTransition>
            ))}
          </div>
        </div>
      </section>

      {/* MODERN WHY AFRICA SECTION */}
      <section className="py-20 sm:py-24 lg:py-32 bg-linear-to-br from-primary via-primary/95 to-secondary text-primary-foreground relative overflow-hidden">
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 right-20 w-4 h-4 bg-secondary/30 rounded-full animate-pulse" />
        <div className="absolute bottom-32 left-16 w-3 h-3 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 right-10 w-2 h-2 bg-secondary/20 rounded-full animate-pulse" style={{ animationDelay: "2s" }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
            <SectionTransition variant="slide" direction="left" delay={200}>
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-3 rounded-full bg-primary-foreground/10 px-6 py-3 text-sm font-bold text-primary-foreground border border-primary-foreground/20 shadow-lg">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-secondary to-primary">
                      <MapPin className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                    Why Africa
                  </div>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight">
                    Unlocking Africa's <br className="hidden lg:block" />
                    <span className="text-secondary">World-Class Talent</span>
                  </h2>
                  <p className="text-xl text-primary-foreground/90 leading-relaxed">
                    Africa is home to a rapidly growing pool of skilled, globally competitive professionals. 49GIG unlocks this talent—giving you exceptional value at competitive rates.
                  </p>
                </div>

                <div className="space-y-5">
                  {africaAdvantages.map((advantage, index) => (
                    <SectionTransition key={index} variant="slide" direction="left" delay={400 + index * 100}>
                      <div className="flex items-start gap-4 group">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/20 to-primary/20 group-hover:from-secondary/30 group-hover:to-primary/30 transition-all duration-300 shadow-lg group-hover:scale-110">
                          <advantage.icon className="h-5 w-5 text-primary-foreground group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-lg font-semibold leading-relaxed">{advantage.text}</span>
                          <div className="h-0.5 w-0 bg-secondary group-hover:w-full transition-all duration-300 rounded-full" />
                        </div>
                      </div>
                    </SectionTransition>
                  ))}
                </div>

                <SectionTransition variant="fade" delay={700}>
                  <div className="bg-primary-foreground/10 rounded-3xl p-6 border border-primary-foreground/20">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-semibold text-secondary">1.4B</div>
                        <div className="text-sm text-primary-foreground/80">Population</div>
                      </div>
                      <div>
                        <div className="text-2xl font-semibold text-secondary">54</div>
                        <div className="text-sm text-primary-foreground/80">Countries</div>
                      </div>
                    </div>
                  </div>
                </SectionTransition>
              </div>
            </SectionTransition>

            <SectionTransition variant="scale" delay={600}>
              <div className="relative group">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-2xl border border-primary-foreground/20 group-hover:shadow-secondary/20 transition-all duration-500 group-hover:scale-105">
                  <Image
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80"
                    alt="African professionals"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-secondary/10" />
                </div>

                {/* Success metrics overlay */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-primary-foreground/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-primary-foreground/20">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-xl font-bold text-primary">500K+</div>
                        <div className="text-xs text-primary-foreground/70">Skilled Professionals</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-secondary">4.9★</div>
                        <div className="text-xs text-primary-foreground/70">Average Rating</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-green-600">35%</div>
                        <div className="text-xs text-primary-foreground/70">Cost Savings</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionTransition>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="border-y border-border/40 bg-linear-to-br from-primary/10 via-background to-secondary/10 py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="rounded-3xl border border-border/60 bg-background/90 p-8 shadow-xl sm:p-10 lg:p-12">
              <div className="mx-auto max-w-4xl text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
                  <Rocket className="h-3.5 w-3.5" />
                  Ready to Hire
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground leading-tight">
                  Build your team with vetted African talent
                </h2>
                <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Start your project with a trusted hiring workflow, transparent milestones, and professionals matched to your exact needs.
                </p>
              </div>

              <div className="mt-8 grid gap-4 text-center sm:grid-cols-3">
                <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground sm:text-base">100% Vetted</h4>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Screened for skill and reliability</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Shield className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground sm:text-base">Secure Payments</h4>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Milestone-based protection</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10 text-secondary-foreground">
                    <Award className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground sm:text-base">Fast Matching</h4>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Qualified talent in as little as 48 hours</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <CTAButton href="/signup/client" variant="primary" className="gap-2">
                  <Briefcase className="h-4 w-4" />
                  Hire Vetted Talent
                  <ArrowRight className="h-4 w-4" />
                </CTAButton>
                <CTAButton href="/hire-team" variant="secondary" className="gap-2">
                  <Users className="h-4 w-4" />
                  Hire a Team
                  <ArrowRight className="h-4 w-4" />
                </CTAButton>
                <CTAButton href="/contact" variant="secondary" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Contact Sales
                  <ArrowRight className="h-4 w-4" />
                </CTAButton>
              </div>
            </div>
          </SectionTransition>
        </div>
      </section>
    </div>
  );
}

