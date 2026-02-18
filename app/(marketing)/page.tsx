"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CTAButton } from "@/components/marketing/cta-buttons";
import { SectionTransition } from "@/components/ui/section-transition";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import {
  CheckCircle2,
  Users,
  Shield,
  Code,
  Palette,
  Database,
  TrendingUp,
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
  Workflow,
  Cloud,
  Brain
} from "lucide-react";
import { heroPoster } from "@/lib/african-tech-images";

const HERO_VIDEO_SRC =
  "https://videos.pexels.com/video-files/3130284/3130284-sd_640_360_24fps.mp4";
const HERO_VIDEO_POSTER = heroPoster;

function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string>("/videos/hero.mp4");

  const play = () => {
    const v = videoRef.current;
    if (!v) return;
    const p = v.play();
    if (p?.catch) p.catch(() => {});
  };

  useEffect(() => {
    play();
  }, [src]);

  const handleError = () => {
    if (src === "/videos/hero.mp4") setSrc(HERO_VIDEO_SRC);
  };

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster={HERO_VIDEO_POSTER}
      src={src}
      className="absolute inset-0 h-full w-full object-cover"
      onCanPlay={play}
      onLoadedData={play}
      onError={handleError}
    />
  );
}

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
      {/* Hero – Hostinger-style: full-bleed video background */}
      <section
        className="relative min-h-[88vh] overflow-hidden border-b border-transparent -mt-14 md:-mt-16 pt-14 md:pt-16"
        aria-label="Hero"
      >
        <HeroVideo />
        <div
          className="absolute inset-0 bg-black/60 sm:bg-black/55 md:bg-black/50"
          aria-hidden
        />
        <div className="relative z-10 flex min-h-[88vh] flex-col justify-center px-4 pt-14 md:pt-16 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
              <Crown className="h-3.5 w-3.5" />
              Africa&apos;s premier freelance network
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Hire world-class African talent, faster.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
              Connect with the top 3% of vetted professionals across engineering, design, and growth. Build exceptional teams with confidence.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <CTAButton
                href="/hire-talent"
                variant="primary"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-6 text-sm text-primary hover:bg-white/95 border-0"
              >
                Hire Talent
                <ArrowRight className="h-4 w-4" />
              </CTAButton>
              <CTAButton
                href="/signup"
                variant="secondary"
                className="inline-flex h-11 items-center gap-2 rounded-lg border-2 border-white/80 bg-white/10 px-6 text-sm text-white backdrop-blur-sm hover:bg-white/20 hover:border-white hover:text-white"
              >
                Apply as Freelancer
                <ArrowRight className="h-4 w-4" />
              </CTAButton>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/85">
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

      {/* Trusted by – Hostinger-style */}
      <section className="border-b border-border/40 bg-muted/20 py-6 overflow-hidden">
        <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
          Trusted by leading companies worldwide
        </p>
        <div className="flex animate-marquee whitespace-nowrap">
          {[...trustedCompanies, ...trustedCompanies].map((company, index) => (
            <div key={index} className="mx-6 flex items-center justify-center">
              <span className="text-base font-semibold text-muted-foreground/50">
                {company}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Stats – Hostinger-style: clean, aligned */}
      <section className="py-16 sm:py-20 border-b border-border/40 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary mb-3">
              <BarChart3 className="h-3.5 w-3.5" />
              Proven results
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">
              Trusted by professionals worldwide
            </h2>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              Join thousands of successful projects powered by Africa&apos;s top talent.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="rounded-xl border border-border/50 bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mx-auto mb-3">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-foreground">
                  {stat.prefix && <span className="text-lg">{stat.prefix}</span>}
                  {stat.value}
                  {stat.suffix && <span className="text-base font-medium">{stat.suffix}</span>}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose 49GIG – Hostinger-style: clean grid */}
      <section className="py-16 sm:py-20 lg:py-24 border-b border-border/40 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary mb-3">
              <Lightbulb className="h-3.5 w-3.5" />
              Why Choose 49GIG
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-foreground mb-3">
              Why businesses choose us
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              We make hiring exceptional African talent simple, secure, and successful.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyChoose.map((item, index) => (
              <div
                key={index}
                className="rounded-xl border border-border/50 bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-600 mx-auto mb-2">
                <Check className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-foreground">99.9% Uptime</h4>
              <p className="text-sm text-muted-foreground mt-1">Reliable platform</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mx-auto mb-2">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-foreground">24/7 Support</h4>
              <p className="text-sm text-muted-foreground mt-1">Always here to help</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary-foreground mx-auto mb-2">
                <ThumbsUp className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-foreground">100% Satisfaction</h4>
              <p className="text-sm text-muted-foreground mt-1">Your success is our priority</p>
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
                  Can&apos;t find what you&apos;re looking for?
                </h3>
                <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Our platform supports hundreds of specialized skills. Tell us your requirements and we&apos;ll find the perfect match.
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

          {/* Bento Grid - Varied card sizes */}
          <BentoGrid columns={3} variant="complex" className="max-w-6xl mx-auto">
            {howItWorks.map((item, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <BentoCard
                  colSpan={index === 0 ? 2 : 1}
                  rowSpan={index === 0 ? 2 : 1}
                  className="bg-background/90 backdrop-blur-xl hover:shadow-primary/10"
                >
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary mb-4">
                    <item.icon className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold mb-3">
                    {item.step}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </BentoCard>
              </SectionTransition>
            ))}
          </BentoGrid>

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
                  <CTAButton href="/how-it-works" variant="primary" className="gap-3">
                    <Play className="h-5 w-5" />
                    Learn More About Our Process
                    <ArrowRight className="h-5 w-5" />
                  </CTAButton>
                  <CTAButton href="/hire-talent" variant="secondary" className="gap-3">
                    <Rocket className="h-5 w-5" />
                    Start Your Project Now
                  </CTAButton>
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
                  <CTAButton href="/signup" variant="secondary" className="bg-white text-primary hover:bg-white/90 border-0 hover:border-0">
                    Join as Freelancer
                  </CTAButton>
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

              {/* Enhanced Guarantee Section removed (Free / Instant / Flexible) */}
            </div>
          </SectionTransition>
        </div>
      </section>
    </div>
  );
}
