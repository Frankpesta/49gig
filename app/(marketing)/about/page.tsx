"use client";

import Image from "next/image";
import { PageHero } from "@/components/marketing/page-hero";
import { CTAButton } from "@/components/marketing/cta-buttons";
import { SectionTransition } from "@/components/ui/section-transition";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import {
  Users,
  Briefcase,
  Shield,
  Award,
  ArrowRight,
  Zap,
  Target,
  Heart,
  Building2,
  Rocket,
  Eye,
  Handshake,
  Sparkles
} from "lucide-react";

export default function AboutPage() {
  const breadcrumbs = [
    { label: "About", icon: Building2 },
  ];

  const values = [
    {
      icon: Award,
      title: "Excellence",
      description: "We deliver and expect high-quality results in every project, maintaining the highest standards of professionalism."
    },
    {
      icon: Shield,
      title: "Trust",
      description: "Transparent processes and verified talent create reliability for clients and freelancers alike, building long-term confidence."
    },
    {
      icon: Heart,
      title: "Empowerment",
      description: "We give African professionals the opportunity to thrive globally while helping businesses scale with world-class talent."
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "Leveraging technology to streamline hiring, vetting, and project management processes for better outcomes."
    },
    {
      icon: Handshake,
      title: "Collaboration",
      description: "We foster mutually beneficial relationships between clients and freelancers, creating value for everyone involved."
    }
  ];

  const pillars = [
    { icon: Target, title: "Mission-Driven", description: "Connecting exceptional African talent with global opportunities." },
    { icon: Shield, title: "Quality First", description: "Rigorous vetting ensures only top performers join our platform." },
    { icon: Zap, title: "Innovation", description: "Technology that streamlines hiring and project management." },
  ];

  return (
    <div className="w-full">
      <PageHero
        title="Building Global Opportunities"
        description="49GIG connects exceptional African talent with world-class opportunities. We're redefining freelancing by prioritizing vetted quality, transparent relationships, and sustainable careers."
        badge={{ icon: Building2, text: "About 49GIG" }}
        breadcrumbs={breadcrumbs}
        imageSrc="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
        imageAlt="African professionals collaborating"
        actions={
          <>
            <CTAButton href="/hire-talent" variant="primary" className="gap-2">
              Hire Talent
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
            <CTAButton href="/signup" variant="secondary" className="gap-2">
              Join as Freelancer
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
          </>
        }
      />

      {/* MISSION & VISION */}
      <section className="py-20 sm:py-24 lg:py-32 bg-linear-to-br from-background via-primary/5 to-background relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-20 items-center">
            <SectionTransition variant="slide" direction="left" delay={200}>
              <div className="space-y-8">
                <div className="inline-flex items-center gap-3 rounded-full bg-linear-to-r from-primary/10 to-secondary/10 px-6 py-3 text-sm font-bold text-primary border border-primary/20 shadow-lg">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-r from-primary/20 to-secondary/20">
                    <Target className="h-3.5 w-3.5 text-primary" />
                  </div>
                  Our Mission
                </div>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-foreground">
                  Unlocking Africa&apos;s <br className="hidden lg:block" />
                  <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">Talent Potential</span>
                </h2>
                <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
                  Our mission is to connect exceptional African professionals with global opportunities, creating economic prosperity across the continent while delivering world-class results to clients worldwide.
                </p>
                <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
                  We believe in the power of African talent to drive innovation, solve complex problems, and build the future of work—one project at a time.
                </p>
              </div>
            </SectionTransition>

            <SectionTransition variant="scale" delay={400}>
              <div className="relative group">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-2xl border border-border/30 group-hover:shadow-primary/20 transition-all duration-500 group-hover:scale-105">
                  <Image
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                    alt="African professionals collaborating"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-primary/10 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            </SectionTransition>
          </div>

          <div className="grid gap-16 lg:grid-cols-2 lg:gap-20 items-center mt-20">
            <SectionTransition variant="slide" direction="left" delay={600}>
              <div className="relative group order-2 lg:order-1">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-2xl border border-border/30 group-hover:shadow-secondary/20 transition-all duration-500 group-hover:scale-105">
                  <Image
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"
                    alt="Global business success"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-secondary/10 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            </SectionTransition>

            <SectionTransition variant="slide" direction="right" delay={400}>
              <div className="space-y-8 order-1 lg:order-2">
                <div className="inline-flex items-center gap-3 rounded-full bg-linear-to-r from-secondary/10 to-primary/10 px-6 py-3 text-sm font-bold text-secondary border border-secondary/20 shadow-lg">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-r from-secondary/20 to-primary/20">
                    <Eye className="h-3.5 w-3.5 text-secondary" />
                  </div>
                  Our Vision
                </div>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-foreground">
                  Building Africa&apos;s <br className="hidden lg:block" />
                  <span className="bg-linear-to-r from-secondary to-primary bg-clip-text text-transparent">Largest Talent Network</span>
                </h2>
                <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
                  We envision a future where African talent is the first choice for companies worldwide—recognized not just for affordability, but for exceptional quality, innovation, and reliability.
                </p>
                <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
                  By 2030, we aim to facilitate $1 billion in freelance earnings for African professionals, creating sustainable careers and driving continental growth.
                </p>
              </div>
            </SectionTransition>
          </div>
        </div>
      </section>

      {/* OUR VALUES */}
      <section className="py-20 sm:py-24 lg:py-32 bg-linear-to-br from-muted/20 via-background to-muted/20 border-y border-border/30 relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-linear-to-r from-primary/10 to-secondary/10 px-6 py-3 text-sm font-bold text-primary mb-6 border border-primary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-r from-primary/20 to-secondary/20">
                  <Heart className="h-3.5 w-3.5 text-primary" />
                </div>
                Our Values
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                What Drives <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">Everything We Do</span>
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                Our values guide every decision we make and every relationship we build, ensuring we create lasting value for our community.
              </p>
            </div>
          </SectionTransition>

          <BentoGrid columns={3} variant="complex" className="max-w-6xl mx-auto">
            {values.map((value, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <BentoCard
                  colSpan={index === 0 ? 2 : 1}
                  rowSpan={index === 0 ? 2 : 1}
                  className="group relative bg-background/80 backdrop-blur-xl hover:shadow-primary/15 group-hover:border-primary/30"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-500 shadow-lg group-hover:shadow-primary/20 group-hover:scale-110">
                    <value.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="space-y-3 mt-4">
                    <h3 className="text-xl lg:text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
                      {value.title}
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors duration-300">
                      {value.description}
                    </p>
                  </div>
                  <div className="h-1 w-full bg-border/30 rounded-full overflow-hidden mt-4">
                    <div className="h-full w-0 bg-gradient-to-r from-primary to-secondary rounded-full group-hover:w-full transition-all duration-700 ease-out" />
                  </div>
                </BentoCard>
              </SectionTransition>
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* PILLARS - Bento Grid */}
      <section className="py-16 sm:py-20 lg:py-24 bg-linear-to-br from-muted/20 via-background to-muted/20 border-y border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3">
                What We Stand For
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Our core pillars guide everything we do.
              </p>
            </div>
          </SectionTransition>
          <BentoGrid columns={3} variant="complex" className="max-w-6xl mx-auto">
            {pillars.map((item, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <BentoCard
                  colSpan={index === 0 ? 2 : 1}
                  rowSpan={1}
                  className="bg-card hover:border-primary/30"
                >
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

      {/* FINAL CTA */}
      <section className="py-20 sm:py-24 lg:py-32 bg-linear-to-br from-primary/10 via-background to-secondary/10 border-y border-border/30 relative overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center space-y-12">
              <div className="inline-flex items-center gap-3 rounded-full bg-linear-to-r from-primary/10 to-secondary/10 px-8 py-4 text-sm font-bold text-primary border border-primary/20 shadow-2xl">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-r from-primary to-secondary">
                  <Rocket className="h-4 w-4 text-white" />
                </div>
                Join Our Mission
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>

              <div className="space-y-6">
                <h2 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-black text-foreground leading-[0.9] tracking-tight">
                  Be Part of <span className="bg-linear-to-r from-primary via-primary/90 to-secondary bg-clip-text text-transparent">Something Bigger</span>
                </h2>
                <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                  Whether you&apos;re a business looking for talent or a professional ready to work globally, 49GIG is here to connect you with opportunities that matter.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-8 justify-center pt-12">
                <SectionTransition variant="slide" direction="left" delay={600}>
                  <CTAButton href="/hire-talent" variant="primary" className="gap-3">
                    <Briefcase className="h-6 w-6" />
                    Hire Top Talent
                    <ArrowRight className="h-6 w-6" />
                  </CTAButton>
                </SectionTransition>
                <SectionTransition variant="slide" direction="right" delay={700}>
                  <CTAButton href="/signup" variant="secondary" className="gap-3">
                    <Users className="h-6 w-6" />
                    Join as Freelancer
                    <ArrowRight className="h-6 w-6" />
                  </CTAButton>
                </SectionTransition>
              </div>
            </div>
          </SectionTransition>
        </div>
      </section>
    </div>
  );
}
