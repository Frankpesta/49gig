"use client";

import Link from "next/link";
import Image from "next/image";
import { CTAButton } from "@/components/marketing/cta-buttons";
import { SectionTransition } from "@/components/ui/section-transition";
import {
  CheckCircle2,
  Users,
  Shield,
  Code,
  Palette,
  Database,
  ArrowRight,
  Globe,
  Award,
  Target,
  Briefcase,
  Zap,
  FileCheck,
  Handshake,
  Star,
  DollarSign,
  Search,
  UserCheck,
  Rocket,
  Trophy,
  Play,
  Check,
  Lightbulb,
  MessageCircle,
  ThumbsUp,
  Layers,
  Workflow,
  Cloud,
  Brain
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
      title: "UI/UX and Product Design",
      description: "Creative designers crafting intuitive user experiences",
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
    },
    {
      icon: Database,
      title: "Data Analytics",
      description: "Data science, analysis, and business intelligence",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    },
    {
      icon: Cloud,
      title: "DevOps & Cloud Engineering",
      description: "Infrastructure experts automating deployments",
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
    },
    {
      icon: Shield,
      title: "Cybersecurity & IT Infrastructure",
      description: "Security specialists protecting systems",
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80",
    },
    {
      icon: Brain,
      title: "AI, Machine Learning & Blockchain",
      description: "AI/ML engineers and blockchain developers",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
    },
    {
      icon: CheckCircle2,
      title: "Quality Assurance & Testing",
      description: "QA engineers ensuring software quality",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
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
      description: "Work through milestones with full transparency, real-time updates, and secure payments. Pay only when you're satisfied.",
      image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80",
    },
  ];

  return (
    <div className="w-full">
      {/* Hero - clean editorial style */}
      <section
        className="relative overflow-hidden border-b border-border/30 bg-[#f5f4f1] -mt-14 md:-mt-16 pt-14 md:pt-16"
        aria-label="Hero"
      >
        <div className="relative z-10 px-4 pb-20 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pt-36">
          <div className="mx-auto w-full max-w-5xl">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                Hire world-class African talent, faster.
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                Connect with the top 3% of vetted professionals across engineering, design, and growth. Build exceptional teams with confidence.
              </p>
            </div>

            <div className="mt-10 flex flex-nowrap gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <CTAButton
                href="/hire-talent"
                variant="primary"
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-border/60 bg-white px-5 text-sm text-foreground shadow-sm hover:bg-white"
              >
                Hire Talent
                <ArrowRight className="h-4 w-4" />
              </CTAButton>
              <CTAButton
                href="/signup/freelancer"
                variant="secondary"
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-primary/50 bg-transparent px-5 text-sm text-foreground hover:bg-primary/5"
              >
                Apply as Freelancer
                <ArrowRight className="h-4 w-4" />
              </CTAButton>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                100% vetted talent
              </span>
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                Secure payments
              </span>
              <span className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                4.9/5 rating
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats - editorial list */}
      <section className="border-b border-border/40 bg-linear-to-br from-primary/10 via-background to-secondary/10 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-3 text-2xl font-semibold text-foreground sm:text-3xl">
              Trusted by professionals worldwide
            </h2>
            <p className="max-w-2xl text-base text-muted-foreground">
              Join thousands of successful projects powered by Africa&apos;s top talent.
            </p>

            <div className="mt-10 space-y-8">
              {stats.map((stat, index) => (
                <div key={index} className="border-l border-primary/35 pl-5 sm:pl-6">
                  <div className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                    {stat.prefix && <span>{stat.prefix}</span>}
                    {stat.value}
                    {stat.suffix && <span>{stat.suffix}</span>}
                  </div>
                  <p className="mt-2 max-w-xs text-lg text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose 49GIG */}
      <section className="border-b border-border/40 bg-muted/20 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
              <Lightbulb className="h-3.5 w-3.5" />
              Why Choose 49GIG
            </div>
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl lg:text-4xl">
              Built for quality hiring at scale
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              We combine trusted vetting, rapid matching, and milestone delivery so projects move faster with less risk.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {whyChoose.map((item, index) => (
              <div
                key={index}
                className="group rounded-2xl border border-border/55 bg-background/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground sm:text-lg">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-border/60 bg-background/85 p-5 sm:p-6">
            <div className="grid gap-4 text-center sm:grid-cols-3">
              <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                  <Check className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-semibold text-foreground sm:text-base">99.9% Uptime</h4>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Reliable platform</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-semibold text-foreground sm:text-base">24/7 Support</h4>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Always here to help</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10 text-secondary-foreground">
                  <ThumbsUp className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-semibold text-foreground sm:text-base">100% Satisfaction</h4>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Your success is our priority</p>
              </div>
            </div>
          </div>
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
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground mb-5 leading-tight">
                Expert professionals across all skills
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Find expert professionals across every skill you need, all vetted and ready to work with global standards
              </p>
            </div>
          </SectionTransition>

          {/* Modern Grid Layout instead of Marquee */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 mb-16">
            {categories.map((category, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <Link href="/talent-categories" className="group relative h-full cursor-pointer block">
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
                </Link>
              </SectionTransition>
            ))}
          </div>

          {/* Modern CTA Section */}
          <SectionTransition variant="slide" direction="up" delay={600}>
            <div className="text-center space-y-8">
              <div className="bg-linear-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-3xl p-8 border border-border/30">
                <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                  Can’t find what you’re looking for?
                </h3>
                <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Our platform supports hundreds of specialized skills. Tell us your requirements and we’ll find the perfect match.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <CTAButton href="/hire-talent" variant="primary" className="gap-2">
                    <Search className="h-5 w-5" />
                    Hire Custom Talent
                  </CTAButton>
                  <CTAButton href="/talent-categories" variant="secondary" className="gap-2">
                    <Layers className="h-5 w-5" />
                    View All Categories
                  </CTAButton>
                </div>
              </div>
            </div>
          </SectionTransition>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-28">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(circle_at_85%_15%,rgba(7,18,43,0.10),transparent_32%),radial-gradient(circle_at_20%_85%,rgba(254,193,16,0.10),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="mx-auto mb-14 max-w-4xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
                <Workflow className="h-3.5 w-3.5" />
                How It Works
              </div>
              <h2 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
                From project idea to delivery in simple steps
              </h2>
              <p className="mx-auto mt-3 max-w-3xl text-base text-muted-foreground sm:text-lg">
                Our process is structured for speed and quality so you can move from brief to execution without hiring friction.
              </p>
            </div>
          </SectionTransition>

          <div className="mx-auto max-w-6xl">
            <div className="hidden lg:block h-px w-full bg-border/60 mb-8" />
            <div className="grid gap-5 lg:grid-cols-4">
              {howItWorks.map((item, index) => (
                <SectionTransition key={index} variant="slide" direction="up" delay={260 + index * 90}>
                  <div className="h-full rounded-2xl border border-border/60 bg-background/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </SectionTransition>
              ))}
            </div>
          </div>

          <SectionTransition variant="fade" delay={760}>
            <div className="mx-auto mt-12 max-w-5xl rounded-2xl border border-border/60 bg-muted/20 p-6 text-center sm:p-8">
              <h3 className="text-2xl font-semibold text-foreground">
                Ready to get started?
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
                Start your project today and get matched with vetted, high-performing talent.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-4 sm:flex-row">
                <CTAButton href="/how-it-works" variant="primary" className="gap-2">
                  <Play className="h-4 w-4" />
                  Learn More About Our Process
                  <ArrowRight className="h-4 w-4" />
                </CTAButton>
                <CTAButton href="/hire-talent" variant="secondary" className="gap-2">
                  <Rocket className="h-4 w-4" />
                  Start Your Project Now
                </CTAButton>
              </div>
            </div>
          </SectionTransition>
        </div>
      </section>

      {/* WHY FREELANCERS CHOOSE US */}
      <section className="relative overflow-hidden border-y border-border/40 bg-[#07122B] py-20 text-white sm:py-24 lg:py-28">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(circle_at_15%_20%,rgba(254,193,16,0.24),transparent_36%),radial-gradient(circle_at_90%_80%,rgba(255,255,255,0.18),transparent_34%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="slide" direction="up" delay={200}>
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="space-y-8">
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white">
                    <Users className="h-4 w-4" />
                    For Freelancers
                  </div>
                  <h2 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                    Why Freelancers Choose <span className="text-secondary">49GIG</span>
                  </h2>
                  <p className="max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
                    Join thousands of African professionals building successful global careers on our platform.
                  </p>
                </div>

                <div className="grid gap-3">
                  {[
                    { icon: DollarSign, text: "Competitive rates and secure payments" },
                    { icon: Globe, text: "Work with global clients from anywhere" },
                    { icon: Award, text: "Build your reputation with verified reviews" },
                    { icon: Handshake, text: "Fair contracts and milestone protection" },
                  ].map((item, index) => (
                    <SectionTransition key={index} variant="slide" direction="left" delay={330 + index * 80}>
                      <div className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 transition hover:bg-white/10">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                          <item.icon className="h-4 w-4 text-secondary" />
                        </div>
                        <p className="text-sm leading-relaxed text-white/90 sm:text-base">{item.text}</p>
                      </div>
                    </SectionTransition>
                  ))}
                </div>

                <SectionTransition variant="slide" direction="up" delay={720}>
                  <CTAButton
                    href="/signup/freelancer"
                    variant="secondary"
                    className="border-0 bg-white text-primary hover:bg-white/90"
                  >
                    Join as Freelancer
                  </CTAButton>
                </SectionTransition>
              </div>

              <SectionTransition variant="scale" delay={520}>
                <div className="space-y-4">
                  <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-md shadow-2xl">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Freelancer performance snapshot</p>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-xl border border-white/15 bg-black/25 px-3 py-3">
                        <div className="text-xl font-bold text-secondary sm:text-2xl">$50K+</div>
                        <div className="mt-1 text-[11px] text-white/70 sm:text-xs">Avg. Earnings</div>
                      </div>
                      <div className="rounded-xl border border-white/15 bg-black/25 px-3 py-3">
                        <div className="text-xl font-bold text-white sm:text-2xl">4.9★</div>
                        <div className="mt-1 text-[11px] text-white/70 sm:text-xs">Rating</div>
                      </div>
                      <div className="rounded-xl border border-white/15 bg-black/25 px-3 py-3">
                        <div className="text-xl font-bold text-emerald-300 sm:text-2xl">98%</div>
                        <div className="mt-1 text-[11px] text-white/70 sm:text-xs">Success Rate</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/20 bg-black/25 p-5 backdrop-blur-md shadow-xl">
                    <p className="text-sm font-semibold text-white">How freelancers grow on 49GIG</p>
                    <div className="mt-4 space-y-3">
                      {[
                        "Complete profile and verification",
                        "Get matched to serious client projects",
                        "Deliver milestones and build ratings",
                        "Earn repeatedly from global opportunities",
                      ].map((item, idx) => (
                        <div key={item} className="flex items-center gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
                            {idx + 1}
                          </span>
                          <p className="text-sm text-white/85">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/80">
                    Top freelancers are recognized with higher visibility and better-fit project recommendations.
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
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
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
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                Building Africa’s Largest Talent Network
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

      {/* FINAL CTA SECTION */}
      <section className="border-y border-border/40 bg-linear-to-br from-primary/10 via-background to-secondary/10 py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="rounded-3xl border border-border/60 bg-background/90 p-8 shadow-xl sm:p-10 lg:p-12">
              <div className="mx-auto max-w-4xl text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
                  <Rocket className="h-3.5 w-3.5" />
                  Get Started Today
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground leading-tight">
                  Ready to transform your business?
                </h2>
                <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Join thousands of companies and freelancers building success on 49GIG. Start your journey today and experience the difference quality makes.
                </p>
              </div>

              <div className="mt-8 grid gap-4 text-center sm:grid-cols-3">
                <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                    <Shield className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground sm:text-base">100% Secure</h4>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Bank-level protection</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground sm:text-base">Vetted Talent</h4>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Top 3% only</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10 text-secondary-foreground">
                    <Award className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground sm:text-base">Guaranteed Results</h4>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Money-back promise</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <CTAButton href="/hire-talent" variant="primary" className="gap-2">
                  <Briefcase className="h-4 w-4" />
                  Hire World-Class Talent
                  <ArrowRight className="h-4 w-4" />
                </CTAButton>
                <CTAButton href="/signup/freelancer" variant="secondary" className="gap-2">
                  <Rocket className="h-4 w-4" />
                  Become a Freelancer
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
