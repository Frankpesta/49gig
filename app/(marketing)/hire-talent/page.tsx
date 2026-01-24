"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/marketing/page-header";
import { CTAButton } from "@/components/marketing/cta-buttons";
import { SectionTransition } from "@/components/ui/section-transition";
import {
  CheckCircle2,
  Users,
  Briefcase,
  Shield,
  Star,
  DollarSign,
  Clock,
  Award,
  Search,
  Filter,
  ChevronRight,
  ArrowRight,
  Crown,
  Zap,
  Target,
  TrendingUp,
  MessageCircle,
  Calendar,
  CheckSquare,
  FileText,
  UserCheck,
  Heart,
  MapPin,
  Globe,
  ThumbsUp,
  Sparkles,
  Play,
  Building2,
  Lightbulb,
  Workflow,
  BarChart3,
  Rocket
} from "lucide-react";

export default function HireTalentPage() {
  const breadcrumbs = [
    { label: "Services", href: "/hire-talent" },
    { label: "Hire Talent", icon: Users },
  ];

  const stats = [
    { value: "48hrs", label: "Average Hire Time", icon: Clock },
    { value: "95%", label: "Client Satisfaction", icon: Star },
    { value: "10K+", label: "Vetted Professionals", icon: Users },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$25",
      period: "per hour",
      description: "Perfect for small tasks and short-term projects",
      features: [
        "Up to 10 hours of work",
        "Basic skill verification",
        "Email support",
        "Basic project tracking",
        "Payment protection",
      ],
      popular: false,
      color: "border-border/50"
    },
    {
      name: "Professional",
      price: "$50",
      period: "per hour",
      description: "Ideal for complex projects and ongoing work",
      features: [
        "Up to 40 hours of work",
        "Advanced skill verification",
        "Priority support",
        "Advanced project tracking",
        "Payment protection",
        "Milestone management",
        "Portfolio review"
      ],
      popular: true,
      color: "border-primary/50 bg-primary/5"
    },
    {
      name: "Enterprise",
      price: "$100",
      period: "per hour",
      description: "For large-scale projects and dedicated work",
      features: [
        "Unlimited hours",
        "Premium skill verification",
        "Dedicated account manager",
        "Custom project tracking",
        "Payment protection",
        "Milestone management",
        "Portfolio review",
        "Contract customization",
        "Priority matching"
      ],
      popular: false,
      color: "border-secondary/50 bg-secondary/5"
    }
  ];

  const talentShowcase = [
    {
      name: "Sarah Johnson",
      role: "Senior Full-Stack Developer",
      skills: ["React", "Node.js", "Python", "AWS"],
      rating: 4.9,
      completedProjects: 127,
      hourlyRate: 65,
      location: "Nigeria",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&q=80",
      verified: true,
      available: true
    },
    {
      name: "David Kiprop",
      role: "UI/UX Designer",
      skills: ["Figma", "Adobe XD", "Prototyping", "User Research"],
      rating: 4.8,
      completedProjects: 89,
      hourlyRate: 45,
      location: "Kenya",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
      verified: true,
      available: true
    },
    {
      name: "Amara Okafor",
      role: "Data Scientist",
      skills: ["Python", "Machine Learning", "SQL", "Tableau"],
      rating: 5.0,
      completedProjects: 156,
      hourlyRate: 70,
      location: "South Africa",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
      verified: true,
      available: false
    }
  ];

  const whyChooseIndividual = [
    {
      icon: Target,
      title: "Precise Matching",
      description: "Our AI matches you with freelancers who have the exact skills and experience you need."
    },
    {
      icon: Zap,
      title: "Quick Start",
      description: "Get started in hours, not weeks. Most projects begin within 48 hours of hiring."
    },
    {
      icon: Shield,
      title: "Risk-Free Hiring",
      description: "30-day money-back guarantee. Pay only for work that meets your standards."
    },
    {
      icon: TrendingUp,
      title: "Scale as Needed",
      description: "Start with one freelancer and scale up as your project requirements grow."
    }
  ];

  const processSteps = [
    {
      step: 1,
      title: "Post Your Project",
      description: "Tell us about your requirements, timeline, and budget. Our smart form takes just 5 minutes.",
      icon: FileText,
      color: "from-blue-500 to-blue-600"
    },
    {
      step: 2,
      title: "Get Matched Instantly",
      description: "Receive curated profiles of qualified freelancers who match your project needs.",
      icon: Search,
      color: "from-green-500 to-green-600"
    },
    {
      step: 3,
      title: "Interview & Hire",
      description: "Review portfolios, conduct interviews, and hire your perfect match with confidence.",
      icon: UserCheck,
      color: "from-purple-500 to-purple-600"
    },
    {
      step: 4,
      title: "Work & Pay Securely",
      description: "Track progress, approve milestones, and pay securely. Full transparency throughout.",
      icon: Shield,
      color: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Hire Individual Talent"
        description="Find and hire skilled African professionals for your next project. From developers to designers, marketers to data scientists—access world-class talent at competitive rates."
        badge={{
          icon: Users,
          text: "Individual Hiring"
        }}
        breadcrumbs={breadcrumbs}
      >
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-black text-primary">10K+</div>
              <div className="text-sm text-muted-foreground">Verified Freelancers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-black text-secondary">48hrs</div>
              <div className="text-sm text-muted-foreground">Average Hire Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-black text-green-600">98%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-black text-purple-600">4.9★</div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <CTAButton href="#pricing" variant="primary" className="gap-3">
              <Briefcase className="h-5 w-5" />
              Start Hiring Now
              <ArrowRight className="h-5 w-5" />
            </CTAButton>
            <CTAButton href="#talent" variant="secondary" className="gap-3">
              <Users className="h-5 w-5" />
              Browse Talent
              <ArrowRight className="h-5 w-5" />
            </CTAButton>
          </div>
        </div>
      </PageHeader>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-background via-primary/5 to-background relative overflow-hidden">
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
                  <DollarSign className="h-3.5 w-3.5 text-primary" />
                </div>
                Transparent Pricing
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                Simple, Transparent <br className="hidden lg:block" />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Pricing</span>
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                Choose the perfect plan for your project. No hidden fees, no surprises. Pay only for the hours you need.
              </p>
            </div>
          </SectionTransition>

          {/* Pricing Cards */}
          <div className="grid gap-8 md:grid-cols-3 mb-16">
            {pricingPlans.map((plan, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <div className={`relative group ${plan.popular ? 'scale-105' : ''}`}>
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <div className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                        Most Popular
                      </div>
                    </div>
                  )}

                  <div className={`relative h-full bg-background/80 backdrop-blur-xl border-2 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-primary/15 transition-all duration-500 ${plan.color} ${plan.popular ? 'ring-2 ring-primary/20' : ''}`}>
                    {/* Header */}
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                      <div className="flex items-baseline justify-center gap-2 mb-4">
                        <span className="text-4xl lg:text-5xl font-black text-foreground">{plan.price}</span>
                        <span className="text-lg text-muted-foreground">/{plan.period}</span>
                      </div>
                      <p className="text-muted-foreground">{plan.description}</p>
                    </div>

                    {/* Features */}
                    <div className="space-y-4 mb-8">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20 mt-0.5">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          </div>
                          <span className="text-foreground text-sm leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <CTAButton
                      href="/signup"
                      variant="primary"
                      size="lg"
                      className="w-full justify-center gap-2"
                    >
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </CTAButton>
                  </div>
                </div>
              </SectionTransition>
            ))}
          </div>

          {/* Money Back Guarantee */}
          <SectionTransition variant="fade" delay={600}>
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-3xl p-8 border border-green-500/20">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">30-Day Money-Back Guarantee</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Not satisfied with your hire? Get a full refund within 30 days. Your satisfaction is our guarantee.
                </p>
              </div>
            </div>
          </SectionTransition>
        </div>
      </section>

      {/* TALENT SHOWCASE */}
      <section id="talent" className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-muted/20 via-background to-muted/20 border-y border-border/30 relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-secondary/10 to-primary/10 px-6 py-3 text-sm font-bold text-secondary mb-6 border border-secondary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-secondary/20 to-primary/20">
                  <Users className="h-3.5 w-3.5 text-secondary" />
                </div>
                Featured Talent
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                Meet Top <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">African Talent</span>
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                Browse through our curated selection of verified professionals ready to work on your next project.
              </p>
            </div>
          </SectionTransition>

          {/* Talent Cards */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
            {talentShowcase.map((talent, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <div className="group relative">
                  <div className="relative bg-background/80 backdrop-blur-xl border border-border/30 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:shadow-primary/15 transition-all duration-500 hover:scale-105 overflow-hidden">
                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative">
                      {/* Profile Header */}
                      <div className="flex items-start gap-4 mb-6">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden">
                            <Image
                              src={talent.image}
                              alt={talent.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          {talent.verified && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-foreground truncate">{talent.name}</h3>
                          <p className="text-primary font-medium text-sm">{talent.role}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{talent.rating}</span>
                            <span className="text-sm text-muted-foreground">({talent.completedProjects} projects)</span>
                          </div>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="mb-6">
                        <div className="flex flex-wrap gap-2">
                          {talent.skills.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                              {skill}
                            </span>
                          ))}
                          {talent.skills.length > 3 && (
                            <span className="px-3 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full">
                              +{talent.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-border/30">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{talent.location}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-lg font-bold text-foreground">${talent.hourlyRate}/hr</div>
                          </div>
                          {talent.available ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              <span className="text-xs font-medium">Available</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs">Busy</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="mt-6">
                        <CTAButton href="/talent-categories" variant="primary" size="sm" className="w-full justify-center gap-2">
                          View Profile
                          <ArrowRight className="h-3 w-3" />
                        </CTAButton>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionTransition>
            ))}
          </div>

          {/* Browse More CTA */}
          <SectionTransition variant="fade" delay={600}>
            <div className="text-center">
              <div className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-3xl p-8 border border-border/30">
                <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                  Find Your Perfect Match
                </h3>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Browse through thousands of verified professionals across all skill categories and experience levels.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <CTAButton href="/talent-categories" variant="primary" className="gap-3">
                    <Search className="h-5 w-5" />
                    Browse All Talent
                    <ArrowRight className="h-5 w-5" />
                  </CTAButton>
                  <CTAButton href="/hire-talent" variant="secondary" className="gap-3">
                    <Filter className="h-5 w-5" />
                    Advanced Search
                    <ArrowRight className="h-5 w-5" />
                  </CTAButton>
                </div>
              </div>
            </div>
          </SectionTransition>
        </div>
      </section>

      {/* WHY CHOOSE INDIVIDUAL TALENT */}
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
                Why Choose Individual Talent
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                The Power of <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Individual Expertise</span>
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                When you need specialized skills for a specific project, hiring individual talent gives you focused expertise and flexibility.
              </p>
            </div>
          </SectionTransition>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {whyChooseIndividual.map((reason, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <div className="group relative h-full">
                  <div className="relative h-full bg-background/80 backdrop-blur-xl border border-border/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-primary/15 transition-all duration-500 hover:scale-105 group-hover:border-primary/30 overflow-hidden">
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

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

      {/* HOW IT WORKS */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-muted/20 via-background to-muted/20 border-y border-border/30 relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-secondary/10 to-primary/10 px-6 py-3 text-sm font-bold text-secondary mb-6 border border-secondary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-secondary/20 to-primary/20">
                  <Workflow className="h-3.5 w-3.5 text-secondary" />
                </div>
                How It Works
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                From Hire to <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Success</span>
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                Our streamlined process ensures you find and work with the right talent quickly and securely.
              </p>
            </div>
          </SectionTransition>

          {/* Process Steps */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <div className="group relative">
                  <div className="relative bg-background/80 backdrop-blur-xl border border-border/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-primary/15 transition-all duration-500 hover:scale-105 overflow-hidden">
                    {/* Step Number */}
                    <div className="absolute -top-4 -right-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white font-bold text-lg shadow-lg">
                      {step.step}
                    </div>

                    {/* Animated Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.color.replace('from-', 'from-').replace('to-', 'to-')} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                    <div className="relative space-y-6">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-500 shadow-lg group-hover:shadow-primary/20">
                        <step.icon className="h-7 w-7 text-primary group-hover:scale-110 transition-transform duration-300" />
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
                          {step.title}
                        </h3>
                        <p className="text-base text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors duration-300">
                          {step.description}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="h-1 w-full bg-border/30 rounded-full overflow-hidden">
                          <div className={`h-full w-0 bg-gradient-to-r ${step.color} rounded-full group-hover:w-full transition-all duration-700 ease-out`} />
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

      {/* FINAL CTA */}
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
                  <Rocket className="h-4 w-4 text-white" />
                </div>
                Ready to Hire?
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>

              <div className="space-y-6">
                <h2 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-black text-foreground leading-[0.9] tracking-tight">
                  Find Your <span className="bg-gradient-to-r from-primary via-primary/90 to-secondary bg-clip-text text-transparent">Perfect Match</span>
                </h2>
                <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                  Start your project today with confidence. Get matched with verified African talent that delivers exceptional results.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-8 justify-center pt-12">
                <SectionTransition variant="slide" direction="left" delay={600}>
                  <CTAButton href="/hire-talent" variant="primary" className="gap-3">
                    <Briefcase className="h-6 w-6" />
                    Hire Individual Talent
                    <ArrowRight className="h-6 w-6" />
                  </CTAButton>
                </SectionTransition>
                <SectionTransition variant="slide" direction="right" delay={700}>
                  <CTAButton href="/hire-team" variant="secondary" className="gap-3">
                    <Users className="h-6 w-6" />
                    Hire a Full Team
                    <ArrowRight className="h-6 w-6" />
                  </CTAButton>
                </SectionTransition>
              </div>

              <SectionTransition variant="fade" delay={800}>
                <div className="bg-background/80 backdrop-blur-xl rounded-3xl p-8 border border-border/30 shadow-xl max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-primary">Free</div>
                      <div className="text-sm text-muted-foreground">Project posting</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-secondary">48hrs</div>
                      <div className="text-sm text-muted-foreground">Average matching time</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-green-600">100%</div>
                      <div className="text-sm text-muted-foreground">Payment protection</div>
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