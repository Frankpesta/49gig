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
  return (
    <div className="w-full">
      {/* MODERN HERO SECTION - Enhanced PageHeader */}
      <PageHeader
        badge={{
          icon: Workflow,
          text: "How It Works"
        }}
        title="From Idea to Hired Talent in Minutes"
        description="49GIG removes the stress from hiring and working remotely by using a vetted talent system, smart matching, and milestone-based delivery—so both clients and freelancers can work with confidence."
      >
        {/* Enhanced Feature Pills with Better Design */}
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          {[
            { icon: Shield, text: "100% Vetted", color: "from-blue-500 to-blue-600" },
            { icon: Target, text: "Smart Matching", color: "from-green-500 to-green-600" },
            { icon: FileCheck, text: "Milestone Delivery", color: "from-purple-500 to-purple-600" },
            { icon: DollarSign, text: "Secure Payments", color: "from-orange-500 to-orange-600" },
          ].map((item, index) => (
            <SectionTransition key={index} variant="scale" delay={200 + index * 100}>
              <div className="group flex items-center gap-3 rounded-2xl bg-background/95 backdrop-blur-xl border border-border/30 px-6 py-3 shadow-xl hover:shadow-primary/20 transition-all duration-500 hover:border-primary/40 hover:scale-105 cursor-pointer">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-bold text-foreground">{item.text}</span>
                  <div className="h-0.5 w-0 bg-primary group-hover:w-full transition-all duration-300 rounded-full" />
                </div>
              </div>
            </SectionTransition>
          ))}
        </div>

        {/* Enhanced CTA Buttons with Better Design */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <HoverButton size="lg" glow className="text-lg h-16 px-10 shadow-2xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
            <Link href="#clients" className="flex items-center gap-3">
              <Briefcase className="h-5 w-5" />
              For Clients
              <ArrowRight className="h-5 w-5" />
            </Link>
          </HoverButton>
          <HoverButton
            size="lg"
            variant="outline"
            className="text-lg h-16 px-10 bg-background/95 backdrop-blur-xl border-2 border-secondary/30 hover:bg-secondary/5 hover:border-secondary shadow-xl"
          >
            <Link href="#freelancers" className="flex items-center gap-3">
              <Users className="h-5 w-5" />
              For Freelancers
              <ArrowRight className="h-5 w-5" />
            </Link>
          </HoverButton>
        </div>

        {/* Trust Indicators */}
        <SectionTransition variant="fade" delay={600}>
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Zero setup fees</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>Start in minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-secondary-foreground" />
              <span>100% secure</span>
            </div>
          </div>
        </SectionTransition>
      </PageHeader>

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

          {/* Modern Interactive Timeline */}
          <div className="relative max-w-6xl mx-auto">
            {/* Central Timeline Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-secondary to-primary transform -translate-x-1/2 hidden lg:block" />

            <div className="space-y-16 lg:space-y-20">
              {[
                {
                  step: 1,
                  title: "Choose How You Want to Hire",
                  description: "Select one option:",
                  items: ["Hire a Talent", "Hire a Team"],
                  note: "No job postings. No bidding. No noise.",
                  image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
                  icon: Search,
                  color: "from-blue-500 to-blue-600"
                },
                {
                  step: 2,
                  title: "Share Your Project Details",
                  description: "Complete a structured project form covering:",
                  items: ["Skills required", "Project scope and deliverables", "Timeline", "Budget", "Experience level"],
                  image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
                  icon: FileText,
                  color: "from-green-500 to-green-600"
                },
                {
                  step: 3,
                  title: "Get Matched with Vetted Professionals",
                  description: "Our system matches you with top-rated freelancers or curated teams that fit your requirements.",
                  subtitle: "Matches are based on:",
                  items: ["Skills and specialization", "Vetting score", "Performance history", "Availability"],
                  image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80",
                  icon: UserCheck,
                  color: "from-purple-500 to-purple-600"
                },
                {
                  step: 4,
                  title: "Contract & Onboarding",
                  description: "",
                  items: ["A secure digital contract is generated and signed by all parties", "Once signed, the project workspace is activated"],
                  image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
                  icon: Handshake,
                  color: "from-orange-500 to-orange-600"
                },
                {
                  step: 5,
                  title: "Milestones, Delivery & Payments",
                  description: "",
                  items: ["Projects are divided into milestones", "Payments are secured upfront", "Funds are released only after approval", "Full visibility at every stage"],
                  image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
                  icon: DollarSign,
                  color: "from-teal-500 to-teal-600"
                }
              ].map((item, index) => (
                <SectionTransition key={index} variant="slide" direction={index % 2 === 0 ? "left" : "right"} delay={300 + index * 150}>
                  <div className={`relative grid gap-8 lg:grid-cols-2 lg:gap-16 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                    {/* Timeline Node */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 hidden lg:block">
                      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} shadow-2xl border-4 border-background`}>
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
                            <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} shadow-lg`}>
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
                            {item.description && (
                              <p className="text-lg text-muted-foreground leading-relaxed">
                                {item.description}
                              </p>
                            )}
                            {item.subtitle && (
                              <p className="text-base font-medium text-foreground">
                                {item.subtitle}
                              </p>
                            )}
                          </div>

                          {/* Enhanced Feature Tags */}
                          <div className="space-y-3">
                            {item.items.map((listItem, idx) => (
                              <div key={idx} className="flex items-start gap-3 group">
                                <div className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r ${item.color} mt-0.5 group-hover:scale-110 transition-transform duration-200`}>
                                  <CheckCircle2 className="h-3 w-3 text-white" />
                                </div>
                                <span className="text-base text-foreground leading-relaxed">{listItem}</span>
                              </div>
                            ))}
                          </div>

                          {item.note && (
                            <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
                              <p className="text-sm text-primary font-medium italic">
                                💡 {item.note}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Image Section */}
                    <div className="relative group lg:block hidden">
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-2xl border border-border/30 group-hover:shadow-primary/20 transition-all duration-500 group-hover:scale-105">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Success metrics overlay */}
                        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-2xl px-4 py-2 border border-border/30 shadow-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-foreground">Success Rate: 98%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionTransition>
              ))}
            </div>
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
                  <HoverButton size="lg" glow className="text-lg h-16 px-10 shadow-2xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
                    <Link href="/hire-talent" className="flex items-center gap-3">
                      <Play className="h-5 w-5" />
                      Start a Project
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </HoverButton>
                  <HoverButton
                    size="lg"
                    variant="outline"
                    className="text-lg h-16 px-10 bg-background/95 backdrop-blur-xl border-2 border-primary/30 hover:bg-primary/5 hover:border-primary shadow-xl"
                  >
                    <Link href="/hire-talent" className="flex items-center gap-3">
                      <Users className="h-5 w-5" />
                      Hire Vetted Talent
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </HoverButton>
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

          {/* Modern Interactive Timeline */}
          <div className="relative max-w-6xl mx-auto">
            {/* Central Timeline Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-secondary via-primary to-secondary transform -translate-x-1/2 hidden lg:block" />

            <div className="space-y-16 lg:space-y-20">
              {[
                {
                  step: 1,
                  title: "Apply to Join 49GIG",
                  description: "Create your freelancer account and submit:",
                  items: ["Personal information", "Skills and experience", "Portfolio"],
                  image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80",
                  icon: UserCheck,
                  color: "from-pink-500 to-rose-500"
                },
                {
                  step: 2,
                  title: "Automated Vetting Process",
                  description: "All freelancers go through a strict, automated vetting process that includes:",
                  items: ["Identity verification", "Skills testing", "Portfolio evaluation"],
                  note: "Only top-scoring professionals are approved.",
                  image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
                  icon: Shield,
                  color: "from-indigo-500 to-blue-500"
                },
                {
                  step: 3,
                  title: "Get Matched to Projects",
                  description: "You don't bid for jobs. Projects are assigned based on:",
                  items: ["Skills", "Vetting score", "Performance rating", "Availability"],
                  image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
                  icon: Target,
                  color: "from-cyan-500 to-teal-500"
                },
                {
                  step: 4,
                  title: "Sign Contract & Start Work",
                  description: "Once selected, you sign a digital contract and begin work immediately.",
                  items: [],
                  image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
                  icon: Handshake,
                  color: "from-emerald-500 to-green-500"
                },
                {
                  step: 5,
                  title: "Deliver Work & Get Paid",
                  description: "",
                  items: ["Complete milestones", "Submit deliverables", "Get paid after client approval", "Secure, transparent payouts"],
                  image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
                  icon: DollarSign,
                  color: "from-amber-500 to-orange-500"
                }
              ].map((item, index) => (
                <SectionTransition key={index} variant="slide" direction={index % 2 === 0 ? "left" : "right"} delay={300 + index * 150}>
                  <div className={`relative grid gap-8 lg:grid-cols-2 lg:gap-16 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                    {/* Timeline Node */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 hidden lg:block">
                      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} shadow-2xl border-4 border-background`}>
                        <item.icon className="h-7 w-7 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-lg font-bold shadow-lg border-4 border-background">
                        {item.step}
                      </div>
                    </div>

                    {/* Content Card */}
                    <div className={`lg:${index % 2 === 0 ? 'pr-16' : 'pl-16'} space-y-6`}>
                      <div className="bg-background/80 backdrop-blur-xl border border-border/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-secondary/10 transition-all duration-500 hover:scale-105">
                        <div className="space-y-6">
                          {/* Mobile Step Indicator */}
                          <div className="flex items-center gap-4 lg:hidden">
                            <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} shadow-lg`}>
                              <item.icon className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-lg font-bold shadow-lg">
                              {item.step}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                              {item.title}
                            </h3>
                            {item.description && (
                              <p className="text-lg text-muted-foreground leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>

                          {/* Enhanced Feature Tags */}
                          {item.items.length > 0 && (
                            <div className="space-y-3">
                              {item.items.map((listItem, idx) => (
                                <div key={idx} className="flex items-start gap-3 group">
                                  <div className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r ${item.color} mt-0.5 group-hover:scale-110 transition-transform duration-200`}>
                                    <CheckCircle2 className="h-3 w-3 text-white" />
                                  </div>
                                  <span className="text-base text-foreground leading-relaxed">{listItem}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {item.note && (
                            <div className="bg-secondary/10 rounded-2xl p-4 border border-secondary/20">
                              <p className="text-sm text-secondary-foreground font-medium">
                                ⭐ {item.note}
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
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-secondary/10 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Success metrics overlay */}
                        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-2xl px-4 py-2 border border-border/30 shadow-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-foreground">Avg. Earnings: $50K+</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionTransition>
              ))}
            </div>
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
                  <HoverButton size="lg" glow className="text-lg h-16 px-10 shadow-2xl bg-gradient-to-r from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary">
                    <Link href="/signup" className="flex items-center gap-3">
                      <Rocket className="h-5 w-5" />
                      Apply as Freelancer
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </HoverButton>
                  <HoverButton
                    size="lg"
                    variant="outline"
                    className="text-lg h-16 px-10 bg-background/95 backdrop-blur-xl border-2 border-secondary/30 hover:bg-secondary/5 hover:border-secondary shadow-xl"
                  >
                    <Link href="/signup" className="flex items-center gap-3">
                      <Users className="h-5 w-5" />
                      Join 49GIG Community
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </HoverButton>
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

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Shield,
                title: "Quality First",
                description: "Only vetted professionals are allowed on the platform.",
                color: "from-blue-500 to-blue-600",
                metric: "Top 3%"
              },
              {
                icon: FileText,
                title: "Transparent Process",
                description: "Clear contracts, milestones, and expectations from day one.",
                color: "from-green-500 to-green-600",
                metric: "100% Clear"
              },
              {
                icon: Award,
                title: "Built-In Protection",
                description: "Secure payments, dispute resolution, and performance tracking.",
                color: "from-purple-500 to-purple-600",
                metric: "Bank-Level"
              },
              {
                icon: DollarSign,
                title: "Fair & Affordable",
                description: "Clients get great value. Freelancers get fair pay.",
                color: "from-orange-500 to-orange-600",
                metric: "Best Value"
              },
            ].map((item, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <div className="group relative h-full">
                  {/* Enhanced Hover Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl scale-110" />

                  <div className="relative h-full bg-background/80 backdrop-blur-xl border border-border/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-primary/15 transition-all duration-500 hover:scale-105 group-hover:border-primary/30 overflow-hidden">
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
                  </div>
                </div>
              </SectionTransition>
            ))}
          </div>

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
                  <div className="group">
                    <HoverButton
                      size="lg"
                      glow
                      className="text-lg h-18 px-12 shadow-2xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary border-0 group-hover:scale-105 transition-all duration-300"
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
                      className="text-lg h-18 px-12 bg-background/95 backdrop-blur-xl border-2 border-secondary/30 hover:bg-secondary/5 hover:border-secondary shadow-2xl group-hover:scale-105 transition-all duration-300"
                    >
                      <Link href="/signup" className="flex items-center gap-3">
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
