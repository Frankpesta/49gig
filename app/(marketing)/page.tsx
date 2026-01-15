"use client";

import Link from "next/link";
import Image from "next/image";
import { HoverButton } from "@/components/ui/hover-button";
import { SectionTransition } from "@/components/ui/section-transition";
import {
  CheckCircle2,
  Users,
  Shield,
  Code,
  Palette,
  Database,
  TrendingUp,
  PenTool,
  ArrowRight,
  Globe,
  Award,
  Target,
  Briefcase,
  Zap,
  Clock,
  FileCheck,
  Handshake,
  Star,
  DollarSign,
  Search,
  UserCheck,
  Rocket,
  Sparkles,
  Trophy,
  Heart,
  Play,
  Check,
  BarChart3,
  Lightbulb,
  MessageCircle,
  ThumbsUp,
  TrendingUp as TrendingUpIcon,
  Crown,
  Layers,
  Workflow
} from "lucide-react";

export default function Home() {

  const stats = [
    { value: "10,000", label: "Vetted Professionals", suffix: "+", icon: Users },
    { value: "95", label: "Client Satisfaction", suffix: "%", icon: Trophy },
    { value: "120", label: "Countries Served", suffix: "+", icon: Globe },
    { value: "50", label: "Paid to Freelancers", prefix: "$", suffix: "M+", icon: DollarSign },
  ];

  const categories = [
    {
      icon: Code,
      title: "Software Development",
      description: "Full-stack, mobile, and specialized developers",
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
    },
    {
      icon: Palette,
      title: "Design & Creative",
      description: "UI/UX, graphic design, and creative direction",
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
    },
    {
      icon: TrendingUp,
      title: "Marketing & Growth",
      description: "Digital marketing, SEO, and growth strategy",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    },
    {
      icon: Database,
      title: "Data & Analytics",
      description: "Data science, analysis, and business intelligence",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    },
    {
      icon: PenTool,
      title: "Content & Writing",
      description: "Technical writing, copywriting, and content strategy",
      image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80",
    },
    {
      icon: Users,
      title: "Product & Project Management",
      description: "Product managers, scrum masters, and project leads",
      image: "https://images.unsplash.com/photo-1552664730-d307ca8849d1?w=800&q=80",
    },
  ];

  const whyChoose = [
    {
      icon: Shield,
      title: "100% Vetted Talent",
      description: "Every freelancer undergoes rigorous technical and soft skills assessment. Only the top 3% make it through.",
    },
    {
      icon: Zap,
      title: "Fast Matching",
      description: "Get matched with qualified professionals in 48 hours. Start your project immediately with pre-vetted talent.",
    },
    {
      icon: FileCheck,
      title: "Quality Guaranteed",
      description: "Milestone-based delivery ensures you only pay for work that meets your standards. Full refund protection.",
    },
    {
      icon: Globe,
      title: "Global Talent Pool",
      description: "Access top African talent working across 120+ countries. Work with professionals in your timezone.",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      icon: Briefcase,
      title: "Post Your Project",
      description: "Tell us about your project requirements, timeline, and budget. Our smart form takes less than 5 minutes to complete.",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
    },
    {
      step: "2",
      icon: Search,
      title: "Get Matched",
      description: "Our AI-powered system analyzes your needs and matches you with the best-fit professionals from our vetted talent pool.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    },
    {
      step: "3",
      icon: UserCheck,
      title: "Interview & Hire",
      description: "Review curated profiles, conduct interviews if needed, and hire your perfect match. Your project workspace is ready instantly.",
      image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80",
    },
    {
      step: "4",
      icon: Rocket,
      title: "Deliver Results",
      description: "Work through milestones with full transparency, real-time updates, and secure payments. Pay only when you&apos;re satisfied.",
      image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80",
    },
  ];

  // Trusted companies (for marquee)
  const trustedCompanies = [
    "Microsoft", "Google", "Amazon", "Meta", "Apple",
    "Netflix", "Spotify", "Airbnb", "Uber", "Stripe",
    "Shopify", "Adobe", "Tesla", "PayPal", "Salesforce"
  ];


  return (
    <div className="w-full">
      {/* CLEAN HERO SECTION */}
      <section className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-linear-to-br from-primary/8 via-background to-secondary/8" />
          <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_1px_1px,rgba(52,84,120,0.2)_1px,transparent_0)] bg-size-[24px_24px]" />
          <div className="absolute top-0 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
            <SectionTransition variant="slide" direction="left" delay={150}>
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Crown className="h-4 w-4 text-primary" />
                  Africa&apos;s Premier Freelance Network
                </div>

                <div className="space-y-5">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground">
                    Hire world-class African talent, faster.
                  </h1>
                  <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl">
                    Connect with the top 3% of vetted professionals across engineering, design, and growth. Build exceptional teams with confidence.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <HoverButton size="lg" glow className="h-12 px-7 text-base bg-linear-to-r from-primary to-primary/90 border-0">
                    <Link href="/hire-talent" className="flex items-center gap-2">
                      Hire Talent
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </HoverButton>
                  <HoverButton size="lg" variant="outline" className="h-12 px-7 text-base bg-background/90 border-border/50">
                    <Link href="/get-started" className="flex items-center gap-2">
                      Apply as Freelancer
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </HoverButton>
                </div>

                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    100% vetted talent
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Secure payments
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-secondary-foreground fill-secondary-foreground" />
                    4.9/5 average rating
                  </div>
                </div>
              </div>
            </SectionTransition>

            <SectionTransition variant="slide" direction="right" delay={250}>
              <div className="relative">
                <div className="relative aspect-4/5 overflow-hidden rounded-3xl border border-border/40 bg-muted/30 shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=80"
                    alt="Team collaboration"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-background/80 via-transparent to-transparent" />
                </div>

                <div className="absolute -left-6 bottom-6 rounded-2xl border border-border/40 bg-background/95 px-5 py-4 shadow-xl">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Average match time</div>
                  <div className="text-2xl font-semibold text-foreground">48 hours</div>
                </div>
                <div className="absolute -right-4 top-6 rounded-2xl border border-border/40 bg-background/95 px-5 py-4 shadow-xl">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Top talent</div>
                  <div className="text-2xl font-semibold text-foreground">3%</div>
                </div>
              </div>
            </SectionTransition>
          </div>
        </div>
      </section>

      {/* TRUSTED BY MARQUEE */}
      <section className="bg-muted/30 py-8 border-b border-border/50 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-4">
          <p className="text-center text-sm text-muted-foreground font-medium">
            Trusted by leading companies worldwide
          </p>
        </div>
        <div className="relative">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...trustedCompanies, ...trustedCompanies].map((company, index) => (
              <div
                key={index}
                className="mx-8 flex items-center justify-center"
              >
                <span className="text-xl font-semibold text-muted-foreground/60">
                  {company}
              </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODERN INTERACTIVE STATS SECTION */}
      <section className="bg-linear-to-br from-muted/20 via-background to-muted/20 py-20 sm:py-24 border-b border-border/30 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Floating Elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-4">
                <BarChart3 className="h-4 w-4" />
                Proven Results
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Trusted by Professionals Worldwide
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join thousands of successful projects powered by Africa&apos;s top talent
              </p>
            </div>
          </SectionTransition>

          <SectionTransition variant="slide" direction="up" delay={300}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="group relative">
                  <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-secondary/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                  <div className="relative bg-background/80 backdrop-blur-xl border border-border/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:scale-105 group-hover:border-primary/30">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300 shadow-lg group-hover:shadow-primary/20">
                        <stat.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div className="space-y-2">
                        <div className="text-3xl lg:text-4xl font-black text-foreground group-hover:text-primary transition-colors duration-300">
                          {stat.prefix && <span className="text-2xl">{stat.prefix}</span>}
                          {stat.value}
                          {stat.suffix && <span className="text-lg font-medium">{stat.suffix}</span>}
                        </div>
                        <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                          {stat.label}
                        </p>
                      </div>
                    </div>

                    {/* Animated border */}
                    <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-primary/20 via-transparent to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-sm" />
                  </div>
                </div>
              ))}
            </div>
          </SectionTransition>
        </div>
      </section>

      {/* MODERN WHY CHOOSE 49GIG SECTION */}
      <section className="py-20 sm:py-24 lg:py-32 bg-linear-to-br from-background via-muted/10 to-background relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-linear-to-r from-primary/10 to-secondary/10 px-6 py-3 text-sm font-bold text-primary mb-6 border border-primary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-r from-primary/20 to-secondary/20">
                  <Lightbulb className="h-3.5 w-3.5 text-primary" />
                </div>
                Why Choose 49GIG
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                Why Businesses <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">Choose Us</span>
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                We make hiring exceptional African talent simple, secure, and successful with our proven platform
              </p>
            </div>
          </SectionTransition>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {whyChoose.map((item, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <div className="group relative h-full">
                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-secondary/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl scale-110" />

                  <div className="relative h-full bg-background/80 backdrop-blur-xl border border-border/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:scale-105 group-hover:border-primary/30 overflow-hidden">
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative space-y-8">
                      {/* Icon with Enhanced Design */}
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-500 shadow-lg group-hover:shadow-primary/20 group-hover:scale-110">
                        <item.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                      </div>

                      {/* Content */}
                      <div className="space-y-4">
                        <h3 className="text-xl lg:text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
                          {item.title}
                        </h3>
                        <p className="text-base text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors duration-300">
                          {item.description}
                        </p>
                      </div>

                      {/* Progress Bar Animation */}
                      <div className="space-y-2">
                        <div className="h-1 w-full bg-border/30 rounded-full overflow-hidden">
                          <div className="h-full w-0 bg-linear-to-r from-primary to-secondary rounded-full group-hover:w-full transition-all duration-700 ease-out" />
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
                  </div>
                </div>
              </SectionTransition>
            ))}
          </div>

          {/* Additional Trust Indicators */}
          <SectionTransition variant="fade" delay={600}>
            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center space-y-3 p-6 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/30">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="text-lg font-bold text-foreground">99.9% Uptime</h4>
                <p className="text-sm text-muted-foreground">Reliable platform you can count on</p>
              </div>
              <div className="flex flex-col items-center space-y-3 p-6 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/30">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-lg font-bold text-foreground">24/7 Support</h4>
                <p className="text-sm text-muted-foreground">Always here to help you succeed</p>
              </div>
              <div className="flex flex-col items-center space-y-3 p-6 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/30">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                  <ThumbsUp className="h-6 w-6 text-secondary-foreground" />
                </div>
                <h4 className="text-lg font-bold text-foreground">100% Satisfaction</h4>
                <p className="text-sm text-muted-foreground">Your success is our priority</p>
              </div>
            </div>
          </SectionTransition>
        </div>
      </section>

      {/* MODERN TALENT CATEGORIES SECTION */}
      <section className="py-20 sm:py-24 lg:py-32 bg-linear-to-br from-background via-primary/5 to-secondary/5 border-y border-border/30 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23345478' fill-opacity='0.1'%3E%3Cpath d='M50 50c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm-30 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-linear-to-r from-primary/10 to-secondary/10 px-6 py-3 text-sm font-bold text-primary mb-6 border border-primary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-r from-primary/20 to-secondary/20">
                  <Users className="h-3.5 w-3.5 text-primary" />
                </div>
                Talent Categories
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                Expert Professionals <br className="hidden lg:block" />
                <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">Across All Skills</span>
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                Find expert professionals across every skill you need, all vetted and ready to work with global standards
              </p>
            </div>
          </SectionTransition>

          {/* Modern Grid Layout instead of Marquee */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 mb-16">
            {categories.map((category, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <div className="group relative h-full cursor-pointer">
                  {/* Enhanced Hover Glow Effect */}
                  <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-secondary/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl scale-110" />

                  <div className="relative h-full bg-background/90 backdrop-blur-xl border border-border/30 rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-primary/15 transition-all duration-500 hover:scale-105 group-hover:border-primary/30 overflow-hidden">
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Image Section */}
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={category.image}
                        alt={category.title}
                        fill
                        className="object-cover transition-all duration-700 group-hover:scale-110"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-background/90 via-background/30 to-transparent group-hover:from-primary/10 group-hover:via-primary/5 transition-all duration-500" />

                      {/* Enhanced Category Icon */}
                      <div className="absolute top-4 right-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-background/95 backdrop-blur-xl border border-border/50 group-hover:bg-primary group-hover:border-primary transition-all duration-300 shadow-lg group-hover:shadow-primary/30">
                        <category.icon className="h-7 w-7 text-primary group-hover:text-white transition-colors duration-300" />
                      </div>

                      {/* Skill Count Badge */}
                      <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-background/90 backdrop-blur-sm px-3 py-1 border border-border/30">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-medium text-foreground">1000+ Experts</span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-8 space-y-6">
                      <div className="space-y-3">
                        <h3 className="text-xl lg:text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
                          {category.title}
                        </h3>
                        <p className="text-base text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors duration-300">
                          {category.description}
                        </p>
                      </div>

                      {/* Enhanced CTA */}
                      <div className="flex items-center justify-between pt-4 border-t border-border/30 group-hover:border-primary/30 transition-colors duration-300">
                        <div className="flex items-center gap-2 text-primary font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <span>Explore talent</span>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground group-hover:text-primary transition-colors duration-300">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">4.9</span>
                        </div>
                      </div>
                    </div>

                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 bg-linear-to-br from-primary/0 via-secondary/0 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  </div>
                </div>
              </SectionTransition>
            ))}
          </div>

          {/* Modern CTA Section */}
          <SectionTransition variant="slide" direction="up" delay={600}>
            <div className="text-center space-y-8">
              <div className="bg-linear-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-3xl p-8 border border-border/30">
                <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                  Can&apos;t find what you&apos;re looking for?
                </h3>
                <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Our platform supports hundreds of specialized skills. Tell us your requirements and we&apos;ll find the perfect match.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <HoverButton size="lg" className="text-base h-14 px-8 bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-2xl">
                    <Link href="/hire-talent" className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Hire Custom Talent
                    </Link>
                  </HoverButton>
                  <HoverButton size="lg" variant="outline" className="text-base h-14 px-8 bg-background/95 backdrop-blur-xl border-2 border-primary/30 hover:bg-primary/5 hover:border-primary shadow-xl">
                    <Link href="/talent-categories" className="flex items-center gap-2">
                      <Layers className="h-5 w-5" />
                      View All Categories
                    </Link>
                  </HoverButton>
                </div>
              </div>
            </div>
          </SectionTransition>
        </div>
      </section>

      {/* MODERN HOW IT WORKS SECTION */}
      <section className="py-20 sm:py-24 lg:py-32 bg-linear-to-br from-background to-muted/10 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-linear-to-r from-primary/10 to-secondary/10 px-6 py-3 text-sm font-bold text-primary mb-6 border border-primary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-r from-primary/20 to-secondary/20">
                  <Workflow className="h-3.5 w-3.5 text-primary" />
                </div>
                How It Works
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                From Idea to <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">Hired Talent</span> in Minutes
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                Our streamlined process gets you from project idea to working with vetted African talent in just days, not weeks
              </p>
            </div>
          </SectionTransition>

          {/* Modern Timeline Design */}
          <div className="relative max-w-6xl mx-auto">
            {/* Central Timeline Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-linear-to-b from-primary via-secondary to-primary transform -translate-x-1/2 hidden lg:block" />

            <div className="space-y-16 lg:space-y-20">
              {howItWorks.map((item, index) => (
                <SectionTransition key={index} variant="slide" direction={index % 2 === 0 ? "left" : "right"} delay={300 + index * 150}>
                  <div className={`relative grid gap-8 lg:grid-cols-2 lg:gap-16 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                    {/* Timeline Node */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 hidden lg:block">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-secondary shadow-2xl border-4 border-background">
                        <item.icon className="h-7 w-7 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold shadow-lg border-4 border-background">
                        {item.step}
                      </div>
                    </div>

                    {/* Content Card */}
                    <div className={`lg:${index % 2 === 0 ? 'pr-16' : 'pl-16'} space-y-6`}>
                      <div className="bg-background/80 backdrop-blur-xl border border-border/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:scale-105">
                        <div className="space-y-6">
                          {/* Mobile Step Indicator */}
                          <div className="flex items-center gap-4 lg:hidden">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-primary to-secondary shadow-lg">
                              <item.icon className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold shadow-lg">
                              {item.step}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                              {item.title}
                            </h3>
                            <div className="h-1 w-16 bg-linear-to-r from-primary to-secondary rounded-full" />
                            <p className="text-lg text-muted-foreground leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          {/* Enhanced Feature Tags */}
                          <div className="flex flex-wrap gap-3">
                            {index === 0 && [
                              { text: "Project details", icon: FileCheck, color: "from-blue-500 to-blue-600" },
                              { text: "Budget range", icon: DollarSign, color: "from-green-500 to-green-600" },
                              { text: "Timeline", icon: Clock, color: "from-purple-500 to-purple-600" },
                              { text: "Skills needed", icon: Target, color: "from-orange-500 to-orange-600" }
                            ].map((tag, idx) => (
                              <div key={idx} className={`inline-flex items-center gap-2 rounded-full bg-linear-to-r ${tag.color} px-4 py-2 text-sm font-medium text-white shadow-lg hover:scale-105 transition-transform duration-200`}>
                                <tag.icon className="h-3 w-3" />
                                {tag.text}
                              </div>
                            ))}

                            {index === 1 && [
                              { text: "AI matching", icon: Search, color: "from-primary to-primary/80" },
                              { text: "Skill assessment", icon: CheckCircle2, color: "from-secondary to-secondary/80" },
                              { text: "Availability check", icon: Clock, color: "from-green-500 to-green-600" },
                              { text: "Experience level", icon: Star, color: "from-yellow-500 to-yellow-600" }
                            ].map((tag, idx) => (
                              <div key={idx} className={`inline-flex items-center gap-2 rounded-full bg-linear-to-r ${tag.color} px-4 py-2 text-sm font-medium text-white shadow-lg hover:scale-105 transition-transform duration-200`}>
                                <tag.icon className="h-3 w-3" />
                                {tag.text}
                              </div>
                            ))}

                            {index === 2 && [
                              { text: "Review profiles", icon: UserCheck, color: "from-indigo-500 to-indigo-600" },
                              { text: "Check portfolios", icon: Briefcase, color: "from-pink-500 to-pink-600" },
                              { text: "Conduct interviews", icon: MessageCircle, color: "from-cyan-500 to-cyan-600" },
                              { text: "Make offers", icon: Handshake, color: "from-emerald-500 to-emerald-600" }
                            ].map((tag, idx) => (
                              <div key={idx} className={`inline-flex items-center gap-2 rounded-full bg-linear-to-r ${tag.color} px-4 py-2 text-sm font-medium text-white shadow-lg hover:scale-105 transition-transform duration-200`}>
                                <tag.icon className="h-3 w-3" />
                                {tag.text}
                              </div>
                            ))}

                            {index === 3 && [
                              { text: "Milestone tracking", icon: TrendingUpIcon, color: "from-violet-500 to-violet-600" },
                              { text: "Secure payments", icon: Shield, color: "from-teal-500 to-teal-600" },
                              { text: "Quality assurance", icon: Award, color: "from-amber-500 to-amber-600" },
                              { text: "24/7 support", icon: Heart, color: "from-rose-500 to-rose-600" }
                            ].map((tag, idx) => (
                              <div key={idx} className={`inline-flex items-center gap-2 rounded-full bg-linear-to-r ${tag.color} px-4 py-2 text-sm font-medium text-white shadow-lg hover:scale-105 transition-transform duration-200`}>
                                <tag.icon className="h-3 w-3" />
                                {tag.text}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Image Section */}
                    <div className="relative group lg:block hidden">
                      <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl shadow-2xl border border-border/30 group-hover:shadow-primary/20 transition-all duration-500 group-hover:scale-105">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-linear-to-tr from-primary/10 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Floating success indicators */}
                        <div className="absolute top-4 right-4 bg-background/95 backdrop-blur-sm rounded-2xl px-4 py-2 border border-border/30 shadow-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-foreground">Success Rate: 98%</span>
                          </div>
                        </div>
                      </div>

                      {/* Floating elements */}
                      <div className="absolute -top-4 -right-4 w-8 h-8 bg-primary/20 rounded-full animate-bounce shadow-lg" style={{ animationDelay: `${index * 0.5}s` }} />
                      <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-secondary/20 rounded-full animate-bounce shadow-lg" style={{ animationDelay: `${index * 0.5 + 0.3}s` }} />
                    </div>
                  </div>
                </SectionTransition>
              ))}
            </div>
          </div>

          {/* Enhanced CTA Section */}
          <SectionTransition variant="fade" delay={800}>
            <div className="mt-20 text-center space-y-8">
              <div className="bg-linear-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-3xl p-8 border border-border/30">
                <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                  Ready to Get Started?
                </h3>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join thousands of successful projects. Start your journey today and experience the difference quality makes.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <HoverButton size="lg" glow className="text-lg h-16 px-10 shadow-2xl bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
                    <Link href="/how-it-works" className="flex items-center gap-3">
                      <Play className="h-5 w-5" />
                      Learn More About Our Process
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </HoverButton>
                  <HoverButton
                    size="lg"
                    variant="outline"
                    className="text-lg h-16 px-10 bg-background/95 backdrop-blur-xl border-2 border-primary/30 hover:bg-primary/5 hover:border-primary shadow-xl"
                  >
                    <Link href="/hire-talent" className="flex items-center gap-3">
                      <Rocket className="h-5 w-5" />
                      Start Your Project Now
                    </Link>
                  </HoverButton>
                </div>
              </div>
            </div>
          </SectionTransition>
        </div>
      </section>

      {/* ENHANCED WHY FREELANCERS CHOOSE US */}
      <section className="py-20 sm:py-24 lg:py-28 bg-linear-to-br from-primary via-primary/95 to-secondary text-primary-foreground relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 right-20 w-4 h-4 bg-secondary/30 rounded-full animate-pulse" />
        <div className="absolute bottom-32 left-16 w-3 h-3 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 right-10 w-2 h-2 bg-secondary/20 rounded-full animate-pulse" style={{ animationDelay: "2s" }} />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="slide" direction="up" delay={200}>
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-20 items-center">
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm font-medium text-primary-foreground">
                    <Users className="h-4 w-4" />
                    For Freelancers
                  </div>
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                    Why Freelancers Choose <span className="text-secondary">49GIG</span>
                  </h2>
                  <p className="text-xl text-primary-foreground/90 leading-relaxed max-w-lg">
                    Join thousands of African professionals building successful global careers on our platform
                  </p>
                </div>

                <div className="space-y-5">
                  {[
                    { icon: DollarSign, text: "Competitive rates and secure payments", color: "from-green-400 to-green-600" },
                    { icon: Globe, text: "Work with global clients from anywhere", color: "from-blue-400 to-blue-600" },
                    { icon: Award, text: "Build your reputation with verified reviews", color: "from-yellow-400 to-yellow-600" },
                    { icon: Handshake, text: "Fair contracts and milestone protection", color: "from-purple-400 to-purple-600" },
                  ].map((item, index) => (
                    <SectionTransition key={index} variant="slide" direction="left" delay={400 + index * 100}>
                      <div className="flex items-start gap-4 group">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br ${item.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <item.icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-lg font-semibold leading-relaxed">{item.text}</span>
                          <div className="h-0.5 w-0 bg-secondary group-hover:w-full transition-all duration-300 rounded-full" />
                        </div>
                      </div>
                    </SectionTransition>
                  ))}
                </div>

                <SectionTransition variant="slide" direction="up" delay={800}>
                  <HoverButton size="lg" variant="secondary" className="text-base h-14 px-10 shadow-2xl bg-white text-primary hover:bg-white/90">
                    <Link href="/get-started">
                      Join as Freelancer
                    </Link>
                  </HoverButton>
                </SectionTransition>
              </div>

              <SectionTransition variant="scale" delay={600}>
                <div className="relative group">
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl shadow-2xl border border-primary-foreground/20 group-hover:shadow-primary/20 transition-all duration-500 group-hover:scale-105">
                    <Image
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&q=80"
                      alt="Freelancer working"
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-primary/20 via-transparent to-secondary/10" />
                  </div>

                  {/* Success metrics overlay */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-background/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-border/50">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-primary">$50K+</div>
                          <div className="text-xs text-muted-foreground">Avg. Earnings</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-secondary">4.9★</div>
                          <div className="text-xs text-muted-foreground">Rating</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">98%</div>
                          <div className="text-xs text-muted-foreground">Success Rate</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionTransition>
            </div>
          </SectionTransition>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Target className="h-4 w-4" />
                Our Mission
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Empowering African Talent Globally
          </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Our mission is to connect exceptional African professionals with global opportunities, creating economic prosperity across the continent while delivering world-class results to clients worldwide.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                We believe in the power of African talent to drive innovation, solve complex problems, and build the future of work—one project at a time.
              </p>
            </div>

            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-sm font-medium text-secondary">
                <Zap className="h-4 w-4" />
                Our Vision
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Building Africa&apos;s Largest Talent Network
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                We envision a future where African talent is the first choice for companies worldwide—recognized not just for affordability, but for exceptional quality, innovation, and reliability.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                By 2030, we aim to facilitate $1 billion in freelance earnings for African professionals, creating sustainable careers and driving continental growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MODERN FINAL CTA SECTION */}
      <section className="py-20 sm:py-24 lg:py-32 bg-linear-to-br from-primary/10 via-background to-secondary/10 border-y border-border/30 relative overflow-hidden">
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
              <div className="inline-flex items-center gap-3 rounded-full bg-linear-to-r from-primary/10 to-secondary/10 px-8 py-4 text-sm font-bold text-primary border border-primary/20 shadow-2xl">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-r from-primary to-secondary">
                  <Rocket className="h-4 w-4 text-white" />
                </div>
                Get Started Today
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>

              {/* Enhanced Headline */}
              <div className="space-y-6">
                <h2 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-black text-foreground leading-[0.9] tracking-tight">
                  Ready to <span className="bg-linear-to-r from-primary via-primary/90 to-secondary bg-clip-text text-transparent">Transform</span>{" "}
                  <br className="hidden lg:block" />
                  Your Business?
                </h2>
                <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                  Join thousands of companies and freelancers building success on 49GIG.
                  Start your journey today and experience the difference quality makes.
                </p>
              </div>

              {/* Enhanced Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12 pt-8">
                <div className="group flex items-center gap-4 rounded-2xl bg-background/90 backdrop-blur-xl px-6 py-4 border border-border/30 shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:border-primary/40 hover:scale-105">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-green-500/20 to-emerald-500/20 group-hover:from-green-500/30 group-hover:to-emerald-500/30 transition-all duration-300 shadow-lg">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-foreground">100% Secure</div>
                    <div className="text-xs text-muted-foreground">Bank-level protection</div>
                  </div>
                </div>

                <div className="group flex items-center gap-4 rounded-2xl bg-background/90 backdrop-blur-xl px-6 py-4 border border-border/30 shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:border-primary/40 hover:scale-105">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/30 group-hover:from-primary/30 group-hover:to-primary/40 transition-all duration-300 shadow-lg">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-foreground">Vetted Talent</div>
                    <div className="text-xs text-muted-foreground">Top 3% only</div>
                  </div>
                </div>

                <div className="group flex items-center gap-4 rounded-2xl bg-background/90 backdrop-blur-xl px-6 py-4 border border-border/30 shadow-xl hover:shadow-secondary/20 transition-all duration-300 hover:border-secondary/40 hover:scale-105">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-secondary/20 to-secondary/30 group-hover:from-secondary/30 group-hover:to-secondary/40 transition-all duration-300 shadow-lg">
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
                  <div className="group">
                    <HoverButton
                      size="lg"
                      glow
                      className="text-lg h-18 px-12 shadow-2xl bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary border-0 group-hover:scale-105 transition-all duration-300"
                    >
                      <Link href="/hire-talent" className="flex items-center gap-3">
                        <Briefcase className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                        Hire World-Class Talent
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
                      className="text-lg h-18 px-12 bg-background/95 backdrop-blur-xl border-2 border-primary/30 hover:bg-primary/5 hover:border-primary shadow-2xl group-hover:scale-105 transition-all duration-300"
                    >
                      <Link href="/get-started" className="flex items-center gap-3">
                        <Rocket className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                        Become a Freelancer
                        <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                      </Link>
                    </HoverButton>
                  </div>
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
                      <div className="text-sm text-muted-foreground">Start immediately</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-green-600">Flexible</div>
                      <div className="text-sm text-muted-foreground">Cancel anytime</div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-border/30">
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>30-day money-back guarantee</span>
                      </div>
                      <div className="w-1 h-1 bg-border rounded-full" />
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span>SSL encrypted & secure</span>
                      </div>
                      <div className="w-1 h-1 bg-border rounded-full" />
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                        <span>Loved by 500+ companies</span>
                      </div>
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
