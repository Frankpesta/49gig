"use client";

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
  ArrowRight,
  Sparkles,
  Lightbulb,
  TrendingUp,
  BarChart3,
  MessageCircle,
  ThumbsUp,
  Crown,
  Zap,
  Target,
  FileText,
  Settings,
  Globe,
  Heart,
  Check
} from "lucide-react";

export default function PricingPage() {
  const breadcrumbs = [
    { label: "Pricing", icon: DollarSign },
  ];

  const pricingPlans = [
    {
      name: "Individual Talent",
      subtitle: "Hire skilled freelancers",
      icon: Users,
      plans: [
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
            "Payment protection"
          ],
          popular: false
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
          popular: true
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
          popular: false
        }
      ]
    },
    {
      name: "Dedicated Teams",
      subtitle: "Assemble full development teams",
      icon: Briefcase,
      plans: [
        {
          name: "Startup Team",
          price: "$2,500",
          period: "per month",
          description: "Perfect for early-stage startups and small projects",
          teamSize: "3-5 members",
          features: [
            "Product Manager",
            "2 Developers",
            "UI/UX Designer",
            "Basic project management",
            "Weekly standups",
            "Monthly reports",
            "Email support"
          ],
          popular: false
        },
        {
          name: "Growth Team",
          price: "$5,000",
          period: "per month",
          description: "Ideal for growing companies scaling their products",
          teamSize: "5-8 members",
          features: [
            "Senior Product Manager",
            "4 Full-stack Developers",
            "2 UI/UX Designers",
            "QA Engineer",
            "DevOps Engineer",
            "Advanced project management",
            "Daily standups",
            "Bi-weekly reports",
            "Priority support"
          ],
          popular: true
        },
        {
          name: "Enterprise Team",
          price: "Custom",
          period: "pricing",
          description: "For large-scale projects and dedicated development",
          teamSize: "10+ members",
          features: [
            "Technical Lead",
            "8+ Developers",
            "3 UI/UX Designers",
            "2 QA Engineers",
            "DevOps & Security",
            "Product Manager",
            "Project Manager",
            "Dedicated account manager",
            "24/7 support",
            "Custom integrations"
          ],
          popular: false
        }
      ]
    }
  ];

  const comparisonFeatures = [
    {
      category: "Talent Quality",
      features: [
        { name: "Vetting Process", individual: "Basic to Premium", team: "Premium" },
        { name: "Skill Verification", individual: "✓", team: "✓" },
        { name: "Portfolio Review", individual: "Professional+", team: "✓" },
        { name: "Background Check", individual: "Enterprise", team: "✓" }
      ]
    },
    {
      category: "Project Management",
      features: [
        { name: "Project Tracking", individual: "Basic to Advanced", team: "Advanced" },
        { name: "Milestone Management", individual: "Professional+", team: "✓" },
        { name: "Progress Reports", individual: "Professional+", team: "✓" },
        { name: "Dedicated Manager", individual: "Enterprise", team: "✓" }
      ]
    },
    {
      category: "Support & Communication",
      features: [
        { name: "Email Support", individual: "✓", team: "✓" },
        { name: "Chat Support", individual: "Professional+", team: "✓" },
        { name: "Video Calls", individual: "Enterprise", team: "✓" },
        { name: "Dedicated Account Manager", individual: "Enterprise", team: "✓" }
      ]
    },
    {
      category: "Payment & Security",
      features: [
        { name: "Secure Payments", individual: "✓", team: "✓" },
        { name: "Milestone Payments", individual: "Professional+", team: "✓" },
        { name: "Payment Protection", individual: "✓", team: "✓" },
        { name: "Money-back Guarantee", individual: "✓", team: "✓" }
      ]
    }
  ];

  const faqs = [
    {
      question: "How does the payment system work?",
      answer: "We use milestone-based payments to ensure both client and freelancer protection. Funds are held securely until work is approved and delivered."
    },
    {
      question: "Can I change my plan or cancel anytime?",
      answer: "Yes, you can upgrade, downgrade, or cancel your subscription at any time. For individual hires, you only pay for hours worked."
    },
    {
      question: "What if I&apos;m not satisfied with the work?",
      answer: "We offer a 30-day money-back guarantee. If you&apos;re not satisfied, we&apos;ll work to resolve the issue or provide a full refund."
    },
    {
      question: "Do you offer custom pricing for large projects?",
      answer: "Yes, we offer custom pricing for enterprise clients and large-scale projects. Contact our sales team for a personalized quote."
    },
    {
      question: "Are there any setup fees?",
      answer: "No setup fees for any of our plans. You only pay for the work delivered or the subscription period."
    },
    {
      question: "Can I hire freelancers for one-time projects?",
      answer: "Absolutely! Our individual talent plans are perfect for one-time projects, short-term work, or ongoing collaborations."
    }
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Simple, Transparent Pricing"
        description="Choose the perfect plan for your project needs. No hidden fees, no surprises. Pay only for what you need with full protection and support."
        badge={{
          icon: DollarSign,
          text: "Transparent Pricing"
        }}
        breadcrumbs={breadcrumbs}
      >
        <div className="space-y-8">
          {/* Quick Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-6 bg-background/80 backdrop-blur-xl rounded-2xl border border-border/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="font-bold text-foreground">100% Secure</div>
                <div className="text-sm text-muted-foreground">Payment protection</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 bg-background/80 backdrop-blur-xl rounded-2xl border border-border/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-bold text-foreground">48hr Setup</div>
                <div className="text-sm text-muted-foreground">Quick start</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-6 bg-background/80 backdrop-blur-xl rounded-2xl border border-border/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/20">
                <ThumbsUp className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <div className="font-bold text-foreground">30-Day Guarantee</div>
                <div className="text-sm text-muted-foreground">Money-back promise</div>
              </div>
            </div>
          </div>
        </div>
      </PageHeader>

      {/* INDIVIDUAL TALENT PRICING */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-background via-primary/5 to-background relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-3 text-sm font-bold text-primary mb-6 border border-primary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-primary/20 to-secondary/20">
                  <Users className="h-3.5 w-3.5 text-primary" />
                </div>
                Individual Talent
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                Hire Skilled <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Freelancers</span>
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                Find and hire individual professionals for your specific project needs. Pay per hour with complete flexibility.
              </p>
            </div>
          </SectionTransition>

          {/* Individual Pricing Cards */}
          <div className="grid gap-8 md:grid-cols-3 mb-16">
            {pricingPlans[0].plans.map((plan, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <div className={`relative group ${plan.popular ? 'scale-105' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <div className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                        Most Popular
                      </div>
                    </div>
                  )}

                  <div className={`relative h-full bg-background/80 backdrop-blur-xl border-2 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-primary/15 transition-all duration-500 ${plan.popular ? 'ring-2 ring-primary/20 border-primary/50 bg-primary/5' : 'border-border/50'}`}>
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                      <div className="flex items-baseline justify-center gap-2 mb-4">
                        <span className="text-4xl lg:text-5xl font-black text-foreground">{plan.price}</span>
                        <span className="text-lg text-muted-foreground">/{plan.period}</span>
                      </div>
                      <p className="text-muted-foreground">{plan.description}</p>
                    </div>

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

                    <CTAButton href="/hire-talent" variant="primary" size="lg" className="w-full justify-center gap-2">
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </CTAButton>
                  </div>
                </div>
              </SectionTransition>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM PRICING */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-muted/20 via-background to-muted/20 border-y border-border/30 relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-secondary/10 to-primary/10 px-6 py-3 text-sm font-bold text-secondary mb-6 border border-secondary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-secondary/20 to-primary/20">
                  <Briefcase className="h-3.5 w-3.5 text-secondary" />
                </div>
                Dedicated Teams
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                Assemble <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Full Teams</span>
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                Get dedicated teams with predictable monthly pricing. Perfect for ongoing projects and complex development needs.
              </p>
            </div>
          </SectionTransition>

          {/* Team Pricing Cards */}
          <div className="grid gap-8 md:grid-cols-3 mb-16">
            {pricingPlans[1].plans.map((plan, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <div className={`relative group ${plan.popular ? 'scale-105' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <div className="bg-gradient-to-r from-secondary to-primary text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                        Most Popular
                      </div>
                    </div>
                  )}

                  <div className={`relative h-full bg-background/80 backdrop-blur-xl border-2 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-secondary/15 transition-all duration-500 ${plan.popular ? 'ring-2 ring-secondary/20 border-secondary/50 bg-secondary/5' : 'border-border/50'}`}>
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                      <div className="flex items-baseline justify-center gap-2 mb-4">
                        <span className="text-4xl lg:text-5xl font-black text-foreground">
                          {plan.price === "Custom" ? "Custom" : `$${plan.price}`}
                        </span>
                        {plan.period !== "pricing" && (
                          <span className="text-lg text-muted-foreground">/{plan.period}</span>
                        )}
                      </div>
                      {'teamSize' in plan && plan.teamSize && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-sm font-medium text-primary mb-4">
                          <Users className="h-4 w-4" />
                          {plan.teamSize}
                        </div>
                      )}
                      <p className="text-muted-foreground">{plan.description}</p>
                    </div>

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

                    <CTAButton
                      href={plan.price === "Custom" ? "/contact" : "/hire-team"}
                      variant="primary"
                      size="lg"
                      className={`w-full justify-center gap-2 ${plan.popular ? "bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90 border-0" : ""}`}
                    >
                      {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
                      <ArrowRight className="h-4 w-4" />
                    </CTAButton>
                  </div>
                </div>
              </SectionTransition>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE COMPARISON */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-background via-primary/5 to-background relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-3 text-sm font-bold text-primary mb-6 border border-primary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-primary/20 to-secondary/20">
                  <BarChart3 className="h-3.5 w-3.5 text-primary" />
                </div>
                Feature Comparison
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                Choose the <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Right Plan</span> for You
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                Compare features across our individual talent and team plans to find the perfect fit for your project.
              </p>
            </div>
          </SectionTransition>

          {/* Comparison Table */}
          <div className="space-y-12">
            {comparisonFeatures.map((category, categoryIndex) => (
              <SectionTransition key={categoryIndex} variant="fade" delay={300 + categoryIndex * 100}>
                <div className="bg-background/80 backdrop-blur-xl rounded-3xl border border-border/30 shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-8 py-6 border-b border-border/30">
                    <h3 className="text-xl font-bold text-foreground">{category.category}</h3>
                  </div>

                  <div className="divide-y divide-border/30">
                    {category.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8 py-6">
                        <div className="font-medium text-foreground">{feature.name}</div>
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-primary/10 rounded-full text-sm font-medium text-primary">
                            Individual: {feature.individual}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-secondary/10 rounded-full text-sm font-medium text-secondary-foreground">
                            Team: {feature.team}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionTransition>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-muted/20 via-background to-muted/20 border-y border-border/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-3 text-sm font-bold text-primary mb-6 border border-primary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-primary/20 to-secondary/20">
                  <MessageCircle className="h-3.5 w-3.5 text-primary" />
                </div>
                Frequently Asked Questions
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground mb-4">
                Got Questions?
              </h2>
              <p className="text-lg text-muted-foreground">
                Find answers to common questions about our pricing and services.
              </p>
            </div>
          </SectionTransition>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 50}>
                <div className="bg-background/80 backdrop-blur-xl rounded-2xl border border-border/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-primary/30">
                  <div className="p-8">
                    <h3 className="text-lg font-bold text-foreground mb-4">{faq.question}</h3>
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </SectionTransition>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-y border-border/30 relative overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center space-y-12">
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 px-8 py-4 text-sm font-bold text-primary border border-primary/20 shadow-2xl">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                Ready to Get Started?
                <Heart className="h-5 w-5 animate-pulse" />
              </div>

              <div className="space-y-6">
                <h2 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-black text-foreground leading-[0.9] tracking-tight">
                  Start Your <span className="bg-gradient-to-r from-primary via-primary/90 to-secondary bg-clip-text text-transparent">Project Today</span>
                </h2>
                <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                  Choose the plan that fits your needs and start working with top African talent immediately.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-8 justify-center pt-12">
                <SectionTransition variant="slide" direction="left" delay={600}>
                  <CTAButton href="/hire-talent" variant="primary" className="gap-3">
                    <Users className="h-6 w-6" />
                    Hire Individual Talent
                    <ArrowRight className="h-6 w-6" />
                  </CTAButton>
                </SectionTransition>
                <SectionTransition variant="slide" direction="right" delay={700}>
                  <CTAButton href="/hire-team" variant="secondary" className="gap-3">
                    <Briefcase className="h-6 w-6" />
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
                      <div className="text-sm text-muted-foreground">No setup fees</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-secondary">30-Day</div>
                      <div className="text-sm text-muted-foreground">Money-back guarantee</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-green-600">24/7</div>
                      <div className="text-sm text-muted-foreground">Support available</div>
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