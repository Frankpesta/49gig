"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/marketing/page-header";
import { CTAButton } from "@/components/marketing/cta-buttons";
import { SectionTransition } from "@/components/ui/section-transition";
import {
  Users,
  Briefcase,
  Shield,
  Star,
  DollarSign,
  Award,
  ArrowRight,
  Sparkles,
  TrendingUp,
  ThumbsUp,
  Zap,
  Target,
  Heart,
  Building2,
  Rocket,
  Eye,
  Handshake
} from "lucide-react";

export default function AboutPage() {
  const breadcrumbs = [
    { label: "About", icon: Building2 },
  ];

  const stats = [
    { value: "10,000+", label: "Freelancers Onboarded", icon: Users },
    { value: "$2M+", label: "Paid to Talent", icon: DollarSign },
    { value: "500+", label: "Happy Clients", icon: ThumbsUp },
    { value: "4.9★", label: "Average Rating", icon: Star }
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

  const milestones = [
    {
      year: "2020",
      title: "The Beginning",
      description: "49GIG was founded with a simple mission: to connect exceptional African talent with global opportunities.",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80"
    },
    {
      year: "2021",
      title: "First 1,000 Freelancers",
      description: "We reached our first major milestone by onboarding 1,000 verified African professionals to our platform.",
      image: "https://images.unsplash.com/photo-1552664730-d307ca8849d1?w=600&q=80"
    },
    {
      year: "2022",
      title: "Global Expansion",
      description: "Expanded our reach to serve clients in 50+ countries while maintaining our commitment to African talent excellence.",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&q=80"
    },
    {
      year: "2023",
      title: "$1M Paid to Talent",
      description: "Celebrated paying over $1 million directly to African freelancers, creating sustainable careers across the continent.",
      image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80"
    },
    {
      year: "2024",
      title: "Innovation & Growth",
      description: "Launched team hiring capabilities and enhanced our platform with AI-powered matching and advanced project management.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80"
    }
  ];

  const team = [
    {
      name: "Sarah Johnson",
      role: "CEO & Co-Founder",
      bio: "Former tech executive with 15+ years in building global platforms. Passionate about connecting African talent with world-class opportunities.",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&q=80",
      linkedin: "#"
    },
    {
      name: "David Kiprop",
      role: "CTO & Co-Founder",
      bio: "Serial entrepreneur and engineer with expertise in scalable systems. Focused on leveraging technology to solve real-world talent challenges.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
      linkedin: "#"
    },
    {
      name: "Amara Okafor",
      role: "Head of Talent",
      bio: "Former HR executive with deep experience in talent acquisition and development. Committed to empowering African professionals globally.",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
      linkedin: "#"
    }
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Our Story"
        description="We&apos;re on a mission to unlock Africa&apos;s vast talent potential by connecting skilled, vetted professionals with global opportunities—delivering exceptional value, trust, and results for companies while empowering freelancers to thrive internationally."
        badge={{
          icon: Building2,
          text: "About 49GIG"
        }}
        breadcrumbs={breadcrumbs}
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

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <div className="group relative h-full">
                  <div className="absolute inset-0 bg-linear-to-br from-primary/10 to-secondary/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl scale-110" />

                  <div className="relative h-full bg-background/80 backdrop-blur-xl border border-border/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-primary/15 transition-all duration-500 hover:scale-105 group-hover:border-primary/30 overflow-hidden">
                    <div className="relative space-y-6">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-500 shadow-lg group-hover:shadow-primary/20 group-hover:scale-110">
                        <value.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-xl lg:text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
                          {value.title}
                        </h3>
                        <p className="text-base text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors duration-300">
                          {value.description}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="h-1 w-full bg-border/30 rounded-full overflow-hidden">
                          <div className="h-full w-0 bg-linear-to-r from-primary to-secondary rounded-full group-hover:w-full transition-all duration-700 ease-out" />
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

      {/* OUR JOURNEY */}
      <section className="py-20 sm:py-24 lg:py-32 bg-linear-to-br from-background via-primary/5 to-background relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-linear-to-r from-secondary/10 to-primary/10 px-6 py-3 text-sm font-bold text-secondary mb-6 border border-secondary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-r from-secondary/20 to-primary/20">
                  <TrendingUp className="h-3.5 w-3.5 text-secondary" />
                </div>
                Our Journey
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                From Vision to <span className="bg-linear-to-r from-secondary to-primary bg-clip-text text-transparent">Global Impact</span>
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                See how we&apos;ve grown from a small startup to a platform connecting thousands of African professionals with global opportunities.
              </p>
            </div>
          </SectionTransition>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-linear-to-b from-primary via-secondary to-primary transform -translate-x-1/2 hidden lg:block" />

            <div className="space-y-16 lg:space-y-20">
              {milestones.map((milestone, index) => (
                <SectionTransition key={index} variant="slide" direction={index % 2 === 0 ? "left" : "right"} delay={300 + index * 150}>
                  <div className={`relative grid gap-8 lg:grid-cols-2 lg:gap-16 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                    {/* Timeline Node */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 hidden lg:block">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-secondary shadow-2xl border-4 border-background">
                        <span className="text-white font-bold text-lg">{milestone.year.slice(-2)}</span>
                      </div>
                      <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold shadow-lg border-4 border-background">
                        {milestone.year.slice(2)}
                      </div>
                    </div>

                    {/* Content Card */}
                    <div className={`lg:${index % 2 === 0 ? 'pr-16' : 'pl-16'} space-y-6`}>
                      <div className="bg-background/80 backdrop-blur-xl border border-border/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:scale-105">
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-primary to-secondary">
                              <span className="text-white font-bold">{milestone.year}</span>
                            </div>
                            <div>
                              <h3 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                                {milestone.title}
                              </h3>
                            </div>
                          </div>
                          <p className="text-lg text-muted-foreground leading-relaxed">
                            {milestone.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Image */}
                    <div className="relative group lg:block hidden">
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-2xl border border-border/30 group-hover:shadow-secondary/20 transition-all duration-500 group-hover:scale-105">
                        <Image
                          src={milestone.image}
                          alt={milestone.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-linear-to-tr from-primary/10 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>
                  </div>
                </SectionTransition>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* IMPACT STATS */}
      <section className="py-20 sm:py-24 lg:py-32 bg-linear-to-br from-muted/20 via-background to-muted/20 border-y border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
                Our Impact
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Numbers that tell the story of our commitment to connecting African talent with global opportunities.
              </p>
            </div>
          </SectionTransition>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <div className="group text-center">
                  <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-linear-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300 shadow-lg group-hover:shadow-primary/20 mb-4">
                    <stat.icon className="h-7 w-7 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="text-3xl lg:text-4xl font-black text-foreground group-hover:text-primary transition-colors duration-300 mb-2">
                    {stat.value}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                    {stat.label}
                  </p>
                </div>
              </SectionTransition>
            ))}
          </div>
        </div>
      </section>

      {/* OUR TEAM */}
      <section className="py-20 sm:py-24 lg:py-32 bg-linear-to-br from-background via-primary/5 to-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-linear-to-r from-primary/10 to-secondary/10 px-6 py-3 text-sm font-bold text-primary mb-6 border border-primary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-r from-primary/20 to-secondary/20">
                  <Users className="h-3.5 w-3.5 text-primary" />
                </div>
                Meet Our Team
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                The People <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">Behind 49GIG</span>
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                Our diverse team combines deep expertise in technology, talent acquisition, and business development to deliver exceptional results.
              </p>
            </div>
          </SectionTransition>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {team.map((member, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <div className="group relative">
                  <div className="relative bg-background/80 backdrop-blur-xl border border-border/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-primary/15 transition-all duration-500 hover:scale-105 overflow-hidden">
                    <div className="relative text-center space-y-6">
                      <div className="relative mx-auto w-24 h-24">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden">
                          <Image
                            src={member.image}
                            alt={member.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-foreground">{member.name}</h3>
                        <p className="text-primary font-medium">{member.role}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
                      </div>

                      <div className="pt-4">
                        <Button variant="outline" size="sm" asChild className="border-primary/30 hover:bg-primary/5">
                          <Link href={member.linkedin} className="flex items-center gap-2" target="_blank" rel="noopener noreferrer">
                            LinkedIn
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionTransition>
            ))}
          </div>
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