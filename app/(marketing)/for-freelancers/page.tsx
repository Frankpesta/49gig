"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/marketing/page-header";
import { HoverButton } from "@/components/ui/hover-button";
import { SectionTransition } from "@/components/ui/section-transition";
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
  ArrowRight,
  Play,
  Sparkles,
  Lightbulb,
  BarChart3,
  MessageCircle,
  ThumbsUp,
  Rocket,
  Workflow,
  MapPin,
  Heart
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
      {/* MODERN PAGE HEADER */}
      <PageHeader
        badge={{
          icon: Users,
          text: "For Freelancers"
        }}
        title="Work With Global Clients. Get Paid Securely. Build a Global Career."
        description="49GIG is a platform built for skilled African freelancers who want access to serious international clients, fair pay, and structured projects—without job bidding or endless competition."
      >
        <div className="space-y-10">
          {/* Enhanced Trust Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-secondary/10 via-primary/5 to-secondary/10 backdrop-blur-xl px-8 py-4 text-base font-bold text-secondary border border-secondary/20 shadow-2xl">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-secondary to-primary">
                <Sparkles className="h-3.5 w-3.5 text-white animate-pulse" />
              </div>
              If you value quality, professionalism, and growth, 49GIG is built for you.
              <Heart className="h-5 w-5 animate-pulse" />
            </div>
          </div>

          {/* Enhanced Value Proposition */}
          <div className="text-center space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-background/80 backdrop-blur-xl rounded-2xl p-6 border border-border/30 shadow-xl">
                <div className="text-3xl font-black text-secondary mb-2">$50K+</div>
                <div className="text-sm text-muted-foreground">Avg. Annual Earnings</div>
              </div>
              <div className="bg-background/80 backdrop-blur-xl rounded-2xl p-6 border border-border/30 shadow-xl">
                <div className="text-3xl font-black text-primary mb-2">4.9★</div>
                <div className="text-sm text-muted-foreground">Client Satisfaction</div>
              </div>
              <div className="bg-background/80 backdrop-blur-xl rounded-2xl p-6 border border-border/30 shadow-xl">
                <div className="text-3xl font-black text-green-600 mb-2">98%</div>
                <div className="text-sm text-muted-foreground">Payment Success</div>
              </div>
            </div>
          </div>

          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <HoverButton size="lg" glow className="text-lg h-16 px-12 shadow-2xl bg-gradient-to-r from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary border-0 group">
              <Link href="/signup" className="flex items-center gap-3">
                <Rocket className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                Apply as Freelancer
                <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
              </Link>
            </HoverButton>
            <HoverButton
              size="lg"
              variant="outline"
              className="text-lg h-16 px-12 bg-background/95 backdrop-blur-xl border-2 border-primary/30 hover:bg-primary/5 hover:border-primary shadow-xl group"
            >
              <Link href="/how-it-works#freelancers" className="flex items-center gap-3">
                <Workflow className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                See How It Works
                <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
              </Link>
            </HoverButton>
          </div>

          {/* Trust Indicators */}
          <SectionTransition variant="fade" delay={600}>
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Secure payments</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-secondary-foreground" />
                <span>Global clients</span>
              </div>
            </div>
          </SectionTransition>
        </div>
      </PageHeader>

      {/* MODERN WHY FREELANCERS CHOOSE 49GIG */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-background via-secondary/5 to-background relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-secondary/10 to-primary/10 px-6 py-3 text-sm font-bold text-secondary border border-secondary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-secondary/20 to-primary/20">
                  <Lightbulb className="h-3.5 w-3.5 text-secondary" />
                </div>
                Why Choose 49GIG
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                Why Freelancers Choose <br className="hidden lg:block" />
                <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">49GIG</span>
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                Join thousands of African professionals building successful global careers with verified clients and fair pay.
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
                      <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl scale-110" />

                      <div className="relative bg-background/80 backdrop-blur-xl border border-border/30 rounded-3xl p-8 lg:p-10 shadow-xl hover:shadow-2xl hover:shadow-secondary/10 transition-all duration-500 hover:scale-105">
                        {/* Animated Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />

                        <div className="relative space-y-8">
                          <div className="flex items-start gap-6">
                            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-secondary/10 to-primary/10 group-hover:from-secondary/20 group-hover:to-primary/20 transition-all duration-500 shadow-lg group-hover:shadow-secondary/20 group-hover:scale-110">
                              <reason.icon className="h-10 w-10 text-secondary group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <div className="space-y-3 flex-1">
                              <h3 className="text-2xl lg:text-3xl font-bold text-foreground group-hover:text-secondary transition-colors duration-300 leading-tight">
                                {reason.title}
                              </h3>
                              <div className="h-1 w-16 bg-gradient-to-r from-secondary to-primary rounded-full group-hover:w-24 transition-all duration-300" />
                            </div>
                          </div>

                          <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors duration-300">
                            {reason.description}
                          </p>

                          {reason.features && (
                            <div className="space-y-4">
                              {reason.features.map((feature, idx) => (
                                <SectionTransition key={idx} variant="slide" direction="up" delay={500 + idx * 100}>
                                  <div className="flex items-start gap-4 group/item">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 group-hover/item:from-green-600 group-hover/item:to-emerald-600 transition-all duration-300 shadow-lg group-hover/item:scale-110">
                                      <CheckCircle2 className="h-4 w-4 text-white" />
                                    </div>
                                    <span className="text-base font-medium text-foreground leading-relaxed group-hover/item:text-green-700 transition-colors duration-300 flex-1">
                                      {feature}
                                    </span>
                                  </div>
                                </SectionTransition>
                              ))}
                            </div>
                          )}

                          {/* Call to Action */}
                          <div className="flex items-center justify-between pt-4 border-t border-border/30 group-hover:border-secondary/30 transition-colors duration-300">
                            <span className="text-sm font-medium text-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              Learn more about this benefit
                            </span>
                            <ArrowRight className="h-4 w-4 text-secondary opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Image Section */}
                  <div className={`relative ${index % 2 === 1 ? '' : 'lg:order-last'}`}>
                    <div className="relative group">
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-2xl border border-border/30 group-hover:shadow-secondary/20 transition-all duration-500 group-hover:scale-105">
                        <Image
                          src={reason.image}
                          alt={reason.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-secondary/10 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Success metrics overlay */}
                        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-2xl px-4 py-2 border border-border/30 shadow-lg">
                          <div className="flex items-center gap-2">
                            <ThumbsUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-foreground">
                              {index === 0 && "100% Verified Clients"}
                              {index === 1 && "No Bidding Required"}
                              {index === 2 && "Secure Payments"}
                              {index === 3 && "Career Growth"}
                            </span>
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
              <div className="bg-gradient-to-r from-secondary/5 via-primary/5 to-secondary/5 rounded-3xl p-8 border border-border/30">
                <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                  Join a Growing Community
                </h3>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Thousands of African freelancers have already built successful careers on 49GIG. Join them today.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                  <div className="space-y-2">
                    <div className="text-3xl font-black text-secondary">10K+</div>
                    <div className="text-sm text-muted-foreground">Active Freelancers</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-black text-primary">50+</div>
                    <div className="text-sm text-muted-foreground">Countries Served</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-black text-green-600">$2M+</div>
                    <div className="text-sm text-muted-foreground">Paid to Freelancers</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-black text-purple-600">4.9★</div>
                    <div className="text-sm text-muted-foreground">Average Rating</div>
                  </div>
                </div>
              </div>
            </div>
          </SectionTransition>
        </div>
      </section>

      {/* MODERN WHO CAN JOIN 49GIG */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-muted/20 via-background to-muted/20 border-y border-border/30 relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-3 text-sm font-bold text-primary mb-6 border border-primary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-primary/20 to-secondary/20">
                  <Users className="h-3.5 w-3.5 text-primary" />
                </div>
                Skill Categories
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                Who Can Join <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">49GIG</span>
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                49GIG is for skilled professionals across multiple disciplines. Only professionals who meet our quality standards are approved.
              </p>
            </div>
          </SectionTransition>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {skillCategories.map((category, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <div className="group relative h-full">
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl scale-110" />

                  <div className="relative h-full bg-background/80 backdrop-blur-xl border border-border/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-primary/15 transition-all duration-500 hover:scale-105 group-hover:border-primary/30 overflow-hidden">
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative text-center space-y-6">
                      <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-500 shadow-lg group-hover:shadow-primary/20 group-hover:scale-110">
                        <category.icon className={`h-8 w-8 ${category.color === "primary" ? "text-primary" : "text-secondary"} group-hover:scale-110 transition-transform duration-300`} />
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-lg lg:text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
                          {category.title}
                        </h3>
                        <p className="text-sm text-muted-foreground group-hover:text-foreground/90 transition-colors duration-300 leading-relaxed">
                          {index === 0 && "Build websites, apps, and software solutions"}
                          {index === 1 && "Create stunning designs and user experiences"}
                          {index === 2 && "Analyze data and drive business insights"}
                          {index === 3 && "Grow brands and increase online presence"}
                          {index === 4 && "Write compelling content and copy"}
                          {index === 5 && "Lead projects and manage teams"}
                          {index === 6 && "Provide excellent customer support"}
                          {index === 7 && "Deliver exceptional client service"}
                        </p>
                      </div>

                      {/* Progress Bar Animation */}
                      <div className="space-y-2">
                        <div className="h-1 w-full bg-border/30 rounded-full overflow-hidden">
                          <div className="h-full w-0 bg-gradient-to-r from-primary to-secondary rounded-full group-hover:w-full transition-all duration-700 ease-out" />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="pt-2">
                        <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium text-primary">
                            {index === 0 && "1,000+ Devs"}
                            {index === 1 && "500+ Designers"}
                            {index === 2 && "300+ Analysts"}
                            {index === 3 && "400+ Marketers"}
                            {index === 4 && "600+ Writers"}
                            {index === 5 && "200+ Managers"}
                            {index === 6 && "150+ Support"}
                            {index === 7 && "800+ Experts"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionTransition>
            ))}
          </div>

          {/* CTA Section */}
          <SectionTransition variant="fade" delay={600}>
            <div className="mt-20 text-center">
              <div className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-3xl p-8 border border-border/30">
                <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                  Don't See Your Skill?
                </h3>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  We support hundreds of specialized skills. Apply anyway—we might have opportunities that match your expertise.
                </p>
                <HoverButton size="lg" className="text-lg h-16 px-10 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-2xl">
                  <Link href="/signup" className="flex items-center gap-3">
                    <Rocket className="h-5 w-5" />
                    Apply for Any Skill
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </HoverButton>
              </div>
            </div>
          </SectionTransition>
        </div>
      </section>

      {/* MODERN HOW IT WORKS FOR FREELANCERS - Interactive Timeline */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-background via-primary/5 to-secondary/5 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-secondary/10 to-primary/10 px-6 py-3 text-sm font-bold text-secondary border border-secondary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-secondary/20 to-primary/20">
                  <Workflow className="h-3.5 w-3.5 text-secondary" />
                </div>
                How It Works
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                From Application to <br className="hidden lg:block" />
                <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Getting Paid</span>
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                A simple, transparent process from application to getting paid. No bidding, no uncertainty—just fair work and reliable payments.
              </p>
            </div>
          </SectionTransition>

          {/* Interactive Timeline */}
          <div className="relative max-w-6xl mx-auto">
            {/* Central Timeline Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-secondary via-primary to-secondary transform -translate-x-1/2 hidden lg:block" />

            <div className="space-y-16 lg:space-y-20">
              {howItWorksSteps.map((step, index) => (
                <SectionTransition key={index} variant="slide" direction={index % 2 === 0 ? "left" : "right"} delay={300 + index * 150}>
                  <div className={`relative grid gap-8 lg:grid-cols-2 lg:gap-16 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                    {/* Timeline Node */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 hidden lg:block">
                      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${index === 0 ? 'from-pink-500 to-rose-500' :
                        index === 1 ? 'from-indigo-500 to-blue-500' :
                        index === 2 ? 'from-cyan-500 to-teal-500' :
                        index === 3 ? 'from-emerald-500 to-green-500' :
                        'from-amber-500 to-orange-500'} shadow-2xl border-4 border-background`}>
                        <step.icon className="h-7 w-7 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-lg font-bold shadow-lg border-4 border-background">
                        {step.step}
                      </div>
                    </div>

                    {/* Content Card */}
                    <div className={`lg:${index % 2 === 0 ? 'pr-16' : 'pl-16'} space-y-6`}>
                      <div className="bg-background/80 backdrop-blur-xl border border-border/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-secondary/10 transition-all duration-500 hover:scale-105">
                        <div className="space-y-6">
                          {/* Mobile Step Indicator */}
                          <div className="flex items-center gap-4 lg:hidden">
                            <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${index === 0 ? 'from-pink-500 to-rose-500' :
                              index === 1 ? 'from-indigo-500 to-blue-500' :
                              index === 2 ? 'from-cyan-500 to-teal-500' :
                              index === 3 ? 'from-emerald-500 to-green-500' :
                              'from-amber-500 to-orange-500'} shadow-lg`}>
                              <step.icon className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-lg font-bold shadow-lg">
                              {step.step}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                              {step.title}
                            </h3>
                            <div className="h-1 w-16 bg-gradient-to-r from-secondary to-primary rounded-full" />
                            <p className="text-lg text-muted-foreground leading-relaxed">
                              {step.description}
                            </p>
                          </div>

                          {/* Step-specific features */}
                          {index === 0 && (
                            <div className="bg-pink-500/10 rounded-2xl p-4 border border-pink-500/20">
                              <p className="text-sm text-pink-700 font-medium">
                                📝 Submit your portfolio, skills, and experience. Our AI reviews your application in minutes.
                              </p>
                            </div>
                          )}
                          {index === 1 && (
                            <div className="bg-indigo-500/10 rounded-2xl p-4 border border-indigo-500/20">
                              <p className="text-sm text-indigo-700 font-medium">
                                ✅ Only top-scoring freelancers are approved. We maintain the highest quality standards.
                              </p>
                            </div>
                          )}
                          {index === 2 && (
                            <div className="bg-cyan-500/10 rounded-2xl p-4 border border-cyan-500/20">
                              <p className="text-sm text-cyan-700 font-medium">
                                🎯 Projects come to you based on your skills and ratings. No more endless job searching.
                              </p>
                            </div>
                          )}
                          {index === 3 && (
                            <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20">
                              <p className="text-sm text-emerald-700 font-medium">
                                🚀 Start working immediately with clear contracts and expectations.
                              </p>
                            </div>
                          )}
                          {index === 4 && (
                            <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/20">
                              <p className="text-sm text-amber-700 font-medium">
                                💰 Get paid securely after client approval. Withdraw anytime through your preferred method.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Image Section */}
                    <div className="relative group lg:block hidden">
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-2xl border border-border/30 group-hover:shadow-secondary/20 transition-all duration-500 group-hover:scale-105">
                        <Image
                          src={step.image}
                          alt={step.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-secondary/10 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Time indicator */}
                        <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm rounded-2xl px-4 py-2 border border-border/30 shadow-lg">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-secondary" />
                            <span className="text-sm font-medium text-foreground">
                              {index === 0 && '5 min'}
                              {index === 1 && '24-48 hrs'}
                              {index === 2 && 'Instant'}
                              {index === 3 && 'Immediate'}
                              {index === 4 && 'After approval'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionTransition>
              ))}
            </div>
          </div>

          {/* Process Overview */}
          <SectionTransition variant="fade" delay={800}>
            <div className="mt-20 text-center">
              <div className="bg-gradient-to-r from-secondary/5 via-primary/5 to-secondary/5 rounded-3xl p-8 border border-border/30">
                <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                  The Complete Freelancer Journey
                </h3>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  From application to building a successful freelance career, we support you every step of the way.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-secondary">5 Days</div>
                    <div className="text-sm text-muted-foreground">Average approval time</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-primary">24/7</div>
                    <div className="text-sm text-muted-foreground">Platform support</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-green-600">$2M+</div>
                    <div className="text-sm text-muted-foreground">Paid to freelancers</div>
                  </div>
                </div>
              </div>
            </div>
          </SectionTransition>
        </div>
      </section>

      {/* MODERN PROFESSIONAL STANDARDS SECTION */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-muted/20 via-background to-muted/20 border-y border-border/30 relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <SectionTransition variant="slide" direction="left" delay={200}>
              <div className="space-y-8">
                <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-6 py-3 text-sm font-bold text-amber-700 border border-amber-500/20 shadow-lg">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  Professional Standards
                </div>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground leading-tight">
                  What We Expect <br className="hidden lg:block" />
                  <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">From You</span>
                </h2>
                <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
                  To maintain the highest quality on our platform, freelancers must uphold professional standards. High performers are rewarded with better opportunities and higher rates.
                </p>

                <div className="space-y-6">
                  {expectations.map((expectation, index) => (
                    <SectionTransition key={index} variant="slide" direction="up" delay={400 + index * 100}>
                      <div className="flex items-start gap-4 group p-4 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/30 hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 group-hover:from-amber-500/30 group-hover:to-orange-500/30 transition-all duration-300 shadow-lg group-hover:scale-110">
                          <expectation.icon className="h-6 w-6 text-amber-600 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <span className="text-base font-bold text-foreground group-hover:text-amber-700 transition-colors duration-300">{expectation.text}</span>
                          <div className="h-0.5 w-0 bg-amber-500 group-hover:w-full transition-all duration-300 rounded-full" />
                        </div>
                      </div>
                    </SectionTransition>
                  ))}
                </div>

                <SectionTransition variant="fade" delay={700}>
                  <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-3xl p-6 border border-amber-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <Award className="h-5 w-5 text-amber-600" />
                      <span className="text-sm font-bold text-amber-700">High Performers Get Rewarded</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Top-rated freelancers get priority access to high-value projects and can earn up to 3x more than average performers.
                    </p>
                  </div>
                </SectionTransition>
              </div>
            </SectionTransition>

            <SectionTransition variant="scale" delay={400}>
              <div className="relative group">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-2xl border border-border/30 group-hover:shadow-amber-500/20 transition-all duration-500 group-hover:scale-105">
                  <Image
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                    alt="Professional standards"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Quality metrics overlay */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-background/95 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-border/30">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-amber-600">4.9★</div>
                        <div className="text-xs text-muted-foreground">Avg. Rating</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-primary">98%</div>
                        <div className="text-xs text-muted-foreground">Success Rate</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">$50K</div>
                        <div className="text-xs text-muted-foreground">Avg. Earnings</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionTransition>
          </div>
        </div>
      </section>

      {/* MODERN SUPPORT & PROTECTION SECTION */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-background via-green-500/5 to-background relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <SectionTransition variant="slide" direction="left" delay={200}>
              <div className="space-y-8">
                <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 px-6 py-3 text-sm font-bold text-green-700 border border-green-500/20 shadow-lg">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20">
                    <Shield className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  Your Protection
                </div>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground leading-tight">
                  Support & <br className="hidden lg:block" />
                  <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Protection</span>
                </h2>
                <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
                  49GIG protects professionals who do great work. We provide comprehensive support and fair systems to ensure your success and security.
                </p>

                <div className="space-y-6">
                  {protectionFeatures.map((feature, index) => (
                    <SectionTransition key={index} variant="slide" direction="up" delay={400 + index * 100}>
                      <div className="flex items-start gap-4 group p-4 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/30 hover:border-green-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
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

                <SectionTransition variant="fade" delay={700}>
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-3xl p-6 border border-green-500/20">
                    <div className="flex items-center gap-3 mb-3">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-bold text-green-700">24/7 Support Team</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Our dedicated support team is always here to help you succeed. Get assistance with projects, payments, or any platform questions.
                    </p>
                  </div>
                </SectionTransition>
              </div>
            </SectionTransition>

            <SectionTransition variant="scale" delay={400}>
              <div className="relative group">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-2xl border border-border/30 group-hover:shadow-green-500/20 transition-all duration-500 group-hover:scale-105">
                  <Image
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80"
                    alt="Support and protection"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Support metrics overlay */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-background/95 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-border/30">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">24/7</div>
                        <div className="text-xs text-muted-foreground">Support</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-primary">5 min</div>
                        <div className="text-xs text-muted-foreground">Avg. Response</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-secondary">98%</div>
                        <div className="text-xs text-muted-foreground">Resolution Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionTransition>
          </div>
        </div>
      </section>

      {/* MODERN FINAL CTA SECTION */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-secondary via-secondary/95 to-primary text-secondary-foreground relative overflow-hidden">
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23345478' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 right-20 w-4 h-4 bg-primary/30 rounded-full animate-pulse" />
        <div className="absolute bottom-32 left-16 w-3 h-3 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 right-10 w-2 h-2 bg-primary/20 rounded-full animate-pulse" style={{ animationDelay: "2s" }} />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center space-y-12">
              {/* Enhanced Badge */}
              <div className="inline-flex items-center gap-3 rounded-full bg-secondary-foreground/10 px-8 py-4 text-sm font-bold text-secondary-foreground border border-secondary-foreground/20 shadow-2xl">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary">
                  <Rocket className="h-4 w-4 text-secondary-foreground" />
                </div>
                Ready to Work Globally?
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>

              {/* Enhanced Headline */}
              <div className="space-y-6">
                <h2 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-black text-secondary-foreground leading-[0.9] tracking-tight">
                  Start Your <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">Global Career</span>
                </h2>
                <p className="text-xl lg:text-2xl text-secondary-foreground/90 max-w-4xl mx-auto leading-relaxed font-medium">
                  Join 49GIG and start building a sustainable freelance career with international clients, fair pay, and professional growth.
                </p>
              </div>

              {/* Enhanced Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12 pt-8">
                <div className="group flex items-center gap-4 rounded-2xl bg-secondary-foreground/10 backdrop-blur-xl px-6 py-4 border border-secondary-foreground/20 shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:border-primary/40 hover:scale-105">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 group-hover:from-green-500/30 group-hover:to-emerald-500/30 transition-all duration-300 shadow-lg">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-secondary-foreground">Verified Clients</div>
                    <div className="text-xs text-secondary-foreground/70">100% legitimate</div>
                  </div>
                </div>

                <div className="group flex items-center gap-4 rounded-2xl bg-secondary-foreground/10 backdrop-blur-xl px-6 py-4 border border-secondary-foreground/20 shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:border-primary/40 hover:scale-105">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/30 group-hover:from-primary/30 group-hover:to-primary/40 transition-all duration-300 shadow-lg">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-secondary-foreground">Secure Payments</div>
                    <div className="text-xs text-secondary-foreground/70">Milestone-based</div>
                  </div>
                </div>

                <div className="group flex items-center gap-4 rounded-2xl bg-secondary-foreground/10 backdrop-blur-xl px-6 py-4 border border-secondary-foreground/20 shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:border-primary/40 hover:scale-105">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/30 group-hover:from-secondary/30 group-hover:to-secondary/40 transition-all duration-300 shadow-lg">
                    <Award className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-secondary-foreground">Career Growth</div>
                    <div className="text-xs text-secondary-foreground/70">Build reputation</div>
                  </div>
                </div>
              </div>

              {/* Enhanced CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-8 justify-center pt-12">
                <SectionTransition variant="slide" direction="left" delay={600}>
                  <div className="group">
                    <HoverButton size="lg" glow className="text-lg h-18 px-12 shadow-2xl bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 border-0 group-hover:scale-105 transition-all duration-300">
                      <Link href="/signup" className="flex items-center gap-3">
                        <Play className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                        Apply as Freelancer
                        <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                      </Link>
                    </HoverButton>
                  </div>
                </SectionTransition>

                <SectionTransition variant="slide" direction="right" delay={700}>
                  <div className="group">
                    <HoverButton
                      size="lg"
                      variant="outline"
                      className="text-lg h-18 px-12 bg-secondary-foreground/10 backdrop-blur-xl border-2 border-secondary-foreground/30 hover:bg-secondary-foreground/5 hover:border-secondary shadow-2xl group-hover:scale-105 transition-all duration-300"
                    >
                      <Link href="/how-it-works#freelancers" className="flex items-center gap-3">
                        <Workflow className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                        See How It Works
                        <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                      </Link>
                    </HoverButton>
                  </div>
                </SectionTransition>
              </div>

              {/* Enhanced Guarantee Section */}
              <SectionTransition variant="fade" delay={800}>
                <div className="bg-secondary-foreground/10 backdrop-blur-xl rounded-3xl p-8 border border-secondary-foreground/20 shadow-xl max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-primary">Free</div>
                      <div className="text-sm text-secondary-foreground/80">Application & onboarding</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-secondary">5 Days</div>
                      <div className="text-sm text-secondary-foreground/80">Average approval time</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-green-600">$2M+</div>
                      <div className="text-sm text-secondary-foreground/80">Paid to freelancers</div>
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

