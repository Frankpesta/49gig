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
  Target,
  Zap,
  TrendingUp,
  ArrowRight,
  Play,
  Sparkles,
  Lightbulb,
  BarChart3,
  MessageCircle,
  ThumbsUp,
  Crown,
  Layers,
  Workflow,
  UserCheck,
  FileText,
  Settings,
  Code,
  Palette,
  Database,
  PenTool,
  HeadphonesIcon,
  Search,
  Heart
} from "lucide-react";

export default function HireTeamPage() {
  const breadcrumbs = [
    { label: "Hire", href: "/hire-talent" },
    { label: "Team", icon: Users },
  ];

  const teamCompositions = [
    {
      title: "Full-Stack Development Team",
      icon: Code,
      description: "Complete web application development from concept to deployment",
      members: [
        { role: "Senior Full-Stack Developer", count: 2 },
        { role: "UI/UX Designer", count: 1 },
        { role: "DevOps Engineer", count: 1 },
        { role: "QA Engineer", count: 1 }
      ],
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80"
    },
    {
      title: "Product Design Team",
      icon: Palette,
      description: "End-to-end product design from research to implementation",
      members: [
        { role: "Product Designer", count: 2 },
        { role: "UX Researcher", count: 1 },
        { role: "Design System Lead", count: 1 },
        { role: "Frontend Developer", count: 1 }
      ],
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80"
    },
    {
      title: "Data & Analytics Team",
      icon: Database,
      description: "Comprehensive data solutions and business intelligence",
      members: [
        { role: "Data Engineer", count: 2 },
        { role: "Data Scientist", count: 1 },
        { role: "ML Engineer", count: 1 },
        { role: "Business Analyst", count: 1 }
      ],
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
    }
  ];

  const whyChooseTeam = [
    {
      icon: Users,
      title: "Cohesive Team Dynamics",
      description: "Pre-assembled teams work together seamlessly with established communication and collaboration patterns."
    },
    {
      icon: Settings,
      title: "Scalable Resources",
      description: "Easily scale your team up or down based on project needs without hiring/firing individual contributors."
    },
    {
      icon: Target,
      title: "Faster Time-to-Market",
      description: "Dedicated teams can focus entirely on your project, delivering faster results than managing freelancers individually."
    },
    {
      icon: Shield,
      title: "Single Point of Contact",
      description: "Work with one project manager who coordinates the entire team and keeps you updated on progress."
    }
  ];

  const processSteps = [
    {
      step: 1,
      title: "Define Your Project",
      description: "Share your project requirements, timeline, and team composition needs with our team.",
      icon: FileText,
      color: "from-blue-500 to-blue-600"
    },
    {
      step: 2,
      title: "Team Assembly",
      description: "We curate and assemble the perfect team based on your specific requirements and preferences.",
      icon: Users,
      color: "from-green-500 to-green-600"
    },
    {
      step: 3,
      title: "Onboarding & Setup",
      description: "Complete team onboarding, tool setup, and project kickoff within 48 hours.",
      icon: Settings,
      color: "from-purple-500 to-purple-600"
    },
    {
      step: 4,
      title: "Dedicated Development",
      description: "Your dedicated team works exclusively on your project with regular updates and milestones.",
      icon: Target,
      color: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <div className="w-full">
      <PageHero
        title="Hire Dedicated Teams"
        description="Assemble high-performing, dedicated teams of African professionals for your next big project. From development teams to design squads, get the complete package with seamless collaboration and single-point accountability."
        badge={{ icon: Layers, text: "Team Hiring" }}
        breadcrumbs={breadcrumbs}
        imageSrc="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80"
        imageAlt="Team collaboration"
        actions={
          <>
            <CTAButton href="/signup" variant="primary" className="gap-2">
              <Users className="h-5 w-5" />
              Get Started
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
            <CTAButton href="#compositions" variant="secondary" className="gap-2">
              <Layers className="h-5 w-5" />
              Team Compositions
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
          </>
        }
      />

      {/* TEAM COMPOSITIONS */}
      <section id="compositions" className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-muted/20 via-background to-muted/20 border-y border-border/30 relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-secondary/10 to-primary/10 px-6 py-3 text-sm font-bold text-secondary mb-6 border border-secondary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-secondary/20 to-primary/20">
                  <Layers className="h-3.5 w-3.5 text-secondary" />
                </div>
                Team Compositions
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                Pre-Assembled <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Expert Teams</span>
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                Choose from our curated team compositions or build a custom team tailored to your specific project requirements.
              </p>
            </div>
          </SectionTransition>

          {/* Team Composition Cards */}
          <div className="space-y-16 lg:space-y-20">
            {teamCompositions.map((team, index) => (
              <SectionTransition key={index} variant="slide" direction={index % 2 === 0 ? "left" : "right"} delay={300 + index * 200}>
                <div className={`grid gap-12 lg:grid-cols-2 lg:gap-16 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                  {/* Content Card */}
                  <div className="space-y-8">
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl scale-110" />

                      <div className="relative bg-background/80 backdrop-blur-xl border border-border/30 rounded-3xl p-8 lg:p-10 shadow-xl hover:shadow-2xl hover:shadow-secondary/10 transition-all duration-500 hover:scale-105">
                        <div className="relative space-y-8">
                          <div className="flex items-start gap-6">
                            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-secondary/10 to-primary/10 group-hover:from-secondary/20 group-hover:to-primary/20 transition-all duration-500 shadow-lg group-hover:shadow-secondary/20 group-hover:scale-110">
                              <team.icon className="h-10 w-10 text-secondary group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <div className="space-y-3 flex-1">
                              <h3 className="text-2xl lg:text-3xl font-bold text-foreground group-hover:text-secondary transition-colors duration-300 leading-tight">
                                {team.title}
                              </h3>
                              <div className="h-1 w-16 bg-gradient-to-r from-secondary to-primary rounded-full group-hover:w-24 transition-all duration-300" />
                            </div>
                          </div>

                          <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors duration-300">
                            {team.description}
                          </p>

                          {/* Team Members */}
                          <div className="space-y-4">
                            <h4 className="text-lg font-bold text-foreground">Team Composition:</h4>
                            <div className="grid gap-3">
                              {team.members.map((member, idx) => (
                                <SectionTransition key={idx} variant="slide" direction="up" delay={500 + idx * 100}>
                                  <div className="flex items-center justify-between p-4 bg-background/50 rounded-2xl border border-border/30 group-hover:border-secondary/30 transition-colors duration-300">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-emerald-500">
                                        <UserCheck className="h-4 w-4 text-white" />
                                      </div>
                                      <span className="font-medium text-foreground">{member.role}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-muted-foreground">×</span>
                                      <span className="font-bold text-secondary">{member.count}</span>
                                    </div>
                                  </div>
                                </SectionTransition>
                              ))}
                            </div>
                          </div>

                          {/* CTA */}
                          <div className="flex items-center justify-between pt-4 border-t border-border/30 group-hover:border-secondary/30 transition-colors duration-300">
                            <span className="text-sm font-medium text-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              View detailed team specs
                            </span>
                            <CTAButton href="/hire-team" variant="primary" size="sm" className="gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground border-0">
                              Hire This Team
                              <ArrowRight className="h-3 w-3" />
                            </CTAButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Image Section */}
                  <div className={`relative ${index % 2 === 1 ? '' : 'lg:order-last'}`}>
                    <div className="relative group">
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-2xl border border-border/30 group-hover:shadow-secondary/20 transition-all duration-500 group-hover:scale-105">
                        <Image
                          src={team.image}
                          alt={team.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-secondary/10 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Team stats overlay */}
                        <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm rounded-2xl px-4 py-3 border border-border/30 shadow-lg">
                          <div className="grid grid-cols-3 gap-4 text-center text-sm">
                            <div>
                              <div className="font-bold text-secondary">{team.members.length}</div>
                              <div className="text-muted-foreground">Members</div>
                            </div>
                            <div>
                              <div className="font-bold text-primary">4.9★</div>
                              <div className="text-muted-foreground">Rating</div>
                            </div>
                            <div>
                              <div className="font-bold text-green-600">98%</div>
                              <div className="text-muted-foreground">Success</div>
                            </div>
                          </div>
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

      {/* WHY CHOOSE TEAM HIRING */}
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
                Why Choose Team Hiring
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                The Power of <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Dedicated Teams</span>
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                When your project demands seamless collaboration and specialized expertise, dedicated teams deliver results that individual freelancers simply can't match.
              </p>
            </div>
          </SectionTransition>

          <BentoGrid columns={3} variant="complex" className="max-w-6xl mx-auto">
            {whyChooseTeam.map((reason, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <BentoCard colSpan={index === 0 ? 2 : 1} rowSpan={index === 0 ? 2 : 1} className="group relative bg-background/80 backdrop-blur-xl hover:shadow-primary/15 group-hover:border-primary/30 overflow-hidden">
                    <div className="relative space-y-6">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-500 shadow-lg group-hover:shadow-primary/20 group-hover:scale-110">
                        <reason.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xl lg:text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
                          {reason.title}
                        </h3>
                        <p className="text-base text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors duration-300">
                          {reason.description}
                        </p>
                      </div>
                      <div className="h-1 w-full bg-border/30 rounded-full overflow-hidden">
                        <div className="h-full w-0 bg-gradient-to-r from-primary to-secondary rounded-full group-hover:w-full transition-all duration-700 ease-out" />
                      </div>
                    </div>
                </BentoCard>
              </SectionTransition>
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* HOW TEAM HIRING WORKS */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-muted/20 via-background to-muted/20 border-y border-border/30 relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-secondary/10 to-primary/10 px-6 py-3 text-sm font-bold text-secondary mb-6 border border-secondary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-secondary/20 to-primary/20">
                  <Workflow className="h-3.5 w-3.5 text-secondary" />
                </div>
                How Team Hiring Works
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                From Concept to <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Dedicated Team</span>
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                Our streamlined process ensures you get the perfect team assembled and working on your project within days.
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

      {/* FINAL CTA SECTION */}
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
                  <Users className="h-4 w-4 text-white" />
                </div>
                Ready to Build Your Team?
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>

              <div className="space-y-6">
                <h2 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-black text-foreground leading-[0.9] tracking-tight">
                  Get a <span className="bg-gradient-to-r from-primary via-primary/90 to-secondary bg-clip-text text-transparent">Dedicated Team</span> Today
                </h2>
                <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                  Stop managing individual freelancers. Get a cohesive, dedicated team that works exclusively on your project with predictable results.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-8 justify-center pt-12">
                <SectionTransition variant="slide" direction="left" delay={600}>
                  <CTAButton href="/hire-team" variant="primary" className="gap-3">
                    <Play className="h-6 w-6" />
                    Hire a Team Now
                    <ArrowRight className="h-6 w-6" />
                  </CTAButton>
                </SectionTransition>
                <SectionTransition variant="slide" direction="right" delay={700}>
                  <CTAButton href="/hire-talent" variant="secondary" className="gap-3">
                    <Briefcase className="h-6 w-6" />
                    Hire Individual Talent
                    <ArrowRight className="h-6 w-6" />
                  </CTAButton>
                </SectionTransition>
              </div>

              <SectionTransition variant="fade" delay={800}>
                <div className="bg-background/80 backdrop-blur-xl rounded-3xl p-8 border border-border/30 shadow-xl max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-primary">3 Days</div>
                      <div className="text-sm text-muted-foreground">Team assembly</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-secondary">24/7</div>
                      <div className="text-sm text-muted-foreground">Team availability</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-green-600">100%</div>
                      <div className="text-sm text-muted-foreground">Dedicated focus</div>
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