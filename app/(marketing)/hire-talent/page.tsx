import type { Metadata } from "next";
import {
  CheckCircle2,
  Users,
  Briefcase,
  Shield,
  DollarSign,
  Zap,
  Calendar,
  FileText,
  Search,
  UserCheck,
  ArrowRight,
  Code,
  Palette,
  Database,
  Cloud,
  Brain,
  Target,
  BarChart3,
  Headphones,
  PenLine,
  Layers,
  Lock,
  Star,
  RefreshCw,
  Building2,
  Rocket,
} from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { CTAButton } from "@/components/marketing/cta-buttons";
import { SectionTransition } from "@/components/ui/section-transition";
import { buildMarketingRouteMetadata } from "@/lib/seo/marketing-page-metadata";

export const metadata: Metadata = buildMarketingRouteMetadata({
  absoluteTitle: "Hire Vetted African Talent | 49GIG",
  description:
    "Work with world-class African professionals. No job posts, no bidding wars — just rigorously vetted talent, carefully matched to your project.",
  path: "/hire-talent",
});

const whyReasons = [
  {
    icon: Shield,
    title: "Strictly Vetted Professionals",
    description:
      "Every freelancer goes through identity verification, skills testing, portfolio evaluation, and performance scoring. Only top-performing professionals are approved.",
    points: [
      "Identity verification",
      "Skills and competency testing",
      "Portfolio and experience evaluation",
      "Performance and reliability scoring",
    ],
  },
  {
    icon: DollarSign,
    title: "Affordable Rates Without Compromising Quality",
    description:
      "Africa is home to a fast-growing pool of global-standard talent. You save on costs while maintaining exceptional standards.",
    points: [
      "Competitive pricing",
      "Transparent costs",
      "High-quality delivery",
    ],
  },
  {
    icon: Zap,
    title: "No Job Posting or Bidding",
    description:
      "You don't post jobs or review hundreds of applications. Just tell us what you need, get matched, choose and move forward.",
    points: [
      "Tell us what you need",
      "We match you with the right talent",
      "You choose and move forward",
    ],
  },
  {
    icon: Calendar,
    title: "Flexible Hiring: Short or Long Term",
    description:
      "Scale up or down as your needs change — from one-time projects to full-time equivalent roles.",
    points: [
      "One-time projects",
      "Ongoing work",
      "Full-time equivalent roles",
    ],
  },
];

const howItWorks = [
  {
    step: "1",
    icon: FileText,
    title: "Tell Us What You Need",
    description:
      "Fill out a short project form with required skills, scope of work, timeline, budget range, and experience level.",
  },
  {
    step: "2",
    icon: Search,
    title: "Get Matched with Vetted Talent",
    description:
      "Our system matches you with top-rated freelancers who best fit your requirements — no sifting through hundreds of profiles.",
  },
  {
    step: "3",
    icon: UserCheck,
    title: "Sign Contract & Start Work",
    description:
      "A secure digital contract is generated and signed by both parties before work begins. No ambiguity, no risk.",
  },
  {
    step: "4",
    icon: Lock,
    title: "Pay by Milestones",
    description:
      "Funds are secured upfront, payments released only after your approval. Full transparency and protection throughout.",
  },
];

const categories = [
  { icon: Code, label: "Software Development" },
  { icon: Palette, label: "UI/UX & Product Design" },
  { icon: Database, label: "Data & Analytics" },
  { icon: BarChart3, label: "Digital Marketing" },
  { icon: PenLine, label: "Writing & Content" },
  { icon: Layers, label: "Product & Project Management" },
  { icon: Headphones, label: "Customer Support" },
  { icon: Brain, label: "AI & Machine Learning" },
  { icon: Cloud, label: "DevOps & Cloud" },
];

const protections = [
  { icon: Lock, text: "Secure milestone payments" },
  { icon: Target, text: "Performance monitoring" },
  { icon: Star, text: "Rating and review system" },
  { icon: Shield, text: "Dispute resolution support" },
  { icon: RefreshCw, text: "Freelancer replacement if necessary" },
];

const clientTypes = [
  { icon: Rocket, label: "Startups" },
  { icon: Building2, label: "SMEs" },
  { icon: Briefcase, label: "Agencies" },
  { icon: Users, label: "Growing companies" },
  { icon: Layers, label: "Enterprises" },
];

export default function HireTalentPage() {
  return (
    <div className="w-full">
      <PageHero
        title="Hire Vetted African Talent"
        description="Work with world-class professionals. Pay fair, affordable rates. Get results."
        badge={{ icon: Users, text: "Hire Talent" }}
        breadcrumbs={[{ label: "Hire Talent", icon: Users }]}
        pathname="/hire-talent"
        actions={
          <>
            <CTAButton href="/signup/client" variant="primary" className="gap-2">
              Hire Talent Now
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
            <CTAButton href="/signup/client" variant="secondary" className="gap-2">
              Start a Project
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
          </>
        }
      />

      {/* Tagline strip */}
      <div className="border-b border-border/40 bg-muted/30 py-6">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-base font-medium text-foreground sm:text-lg">
            At 49GIG, we help you hire highly vetted African freelancers who are ready to deliver exceptional work — on time, on budget, and to global standards.
          </p>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            No job posts. No bidding wars. No guesswork.{" "}
            <span className="font-semibold text-foreground">Just reliable talent, carefully matched to your project.</span>
          </p>
        </div>
      </div>

      {/* WHY HIRE THROUGH 49GIG */}
      <section className="border-b border-border/40 bg-background py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
                <Shield className="h-3.5 w-3.5" />
                Why Hire Through 49GIG
              </div>
              <h2 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
                Everything you need. Nothing you don&apos;t.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                We&apos;ve removed every hiring friction point so you can focus on what matters — getting great work done.
              </p>
            </div>
          </SectionTransition>

          <div className="grid gap-6 sm:grid-cols-2">
            {whyReasons.map((reason, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <div className="group h-full rounded-2xl border border-border/55 bg-background/90 p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
                    <reason.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground sm:text-xl">{reason.title}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{reason.description}</p>
                  <ul className="space-y-2">
                    {reason.points.map((point, pi) => (
                      <li key={pi} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-sm text-foreground/80">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </SectionTransition>
            ))}
          </div>
        </div>
      </section>

      {/* HOW HIRING WORKS */}
      <section className="border-b border-border/40 bg-muted/20 py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
                <Zap className="h-3.5 w-3.5" />
                How It Works
              </div>
              <h2 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
                How hiring works on 49GIG
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Simple, efficient, and stress-free. From brief to delivery in four steps.
              </p>
            </div>
          </SectionTransition>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((step, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <div className="relative h-full rounded-2xl border border-border/55 bg-background/90 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-foreground sm:text-lg">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              </SectionTransition>
            ))}
          </div>
        </div>
      </section>

      {/* TALENT CATEGORIES */}
      <section className="border-b border-border/40 bg-background py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
                <Users className="h-3.5 w-3.5" />
                Talent Categories
              </div>
              <h2 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                Talent categories available
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
                From technical specialists to creative professionals — all rigorously vetted and ready to work.
              </p>
            </div>
          </SectionTransition>

          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 max-w-4xl mx-auto">
            {categories.map((cat, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 60}>
                <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3.5 transition hover:border-primary/30 hover:bg-primary/5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <cat.icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{cat.label}</span>
                </div>
              </SectionTransition>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">…and many more specialized fields.</p>
        </div>
      </section>

      {/* BUILT-IN PROTECTION + WHO SHOULD HIRE — side by side */}
      <section className="border-b border-border/40 bg-muted/20 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Protection */}
            <SectionTransition variant="slide" direction="left" delay={200}>
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
                  <Shield className="h-3.5 w-3.5" />
                  Client Protection
                </div>
                <h2 className="mb-3 text-2xl font-semibold text-foreground sm:text-3xl">
                  Built-in protection for clients
                </h2>
                <p className="mb-8 text-base text-muted-foreground">
                  Your project stays on track — from first milestone to final delivery.
                </p>
                <ul className="space-y-4">
                  {protections.map((item, index) => (
                    <li key={index} className="flex items-start gap-4 rounded-xl border border-border/50 bg-background/80 px-5 py-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium text-foreground leading-relaxed">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </SectionTransition>

            {/* Who should hire */}
            <SectionTransition variant="slide" direction="right" delay={300}>
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-2 text-xs font-semibold text-secondary-foreground">
                  <Target className="h-3.5 w-3.5" />
                  Who It&apos;s For
                </div>
                <h2 className="mb-3 text-2xl font-semibold text-foreground sm:text-3xl">
                  Who should hire through 49GIG
                </h2>
                <p className="mb-8 text-base text-muted-foreground">
                  If quality, affordability, and reliability matter — 49GIG is built for you.
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {clientTypes.map((type, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/80 px-5 py-4 transition hover:border-primary/30 hover:bg-primary/5"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <type.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">{type.label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-2xl border border-border/50 bg-background/80 p-6">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Whether you&apos;re a startup moving fast or an enterprise scaling globally, 49GIG gives you access to delivery-ready talent without the hiring headache.
                  </p>
                </div>
              </div>
            </SectionTransition>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-b border-border/40 bg-linear-to-br from-primary/10 via-background to-secondary/10 py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="rounded-3xl border border-border/60 bg-background/90 p-8 shadow-xl sm:p-10 lg:p-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
                <Rocket className="h-3.5 w-3.5" />
                Ready to Hire?
              </div>
              <h2 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl lg:text-5xl">
                Start your project today
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Get matched with vetted African talent that delivers — on time, on budget, and to global standards.
              </p>

              <div className="mt-8 grid gap-4 text-center sm:grid-cols-3 max-w-2xl mx-auto">
                <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Shield className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">100% Vetted</h4>
                  <p className="mt-1 text-xs text-muted-foreground">Top 3% only</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10 text-secondary-foreground">
                    <Zap className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">48hr Match</h4>
                  <p className="mt-1 text-xs text-muted-foreground">Fast placement</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                    <Lock className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">Secure Payments</h4>
                  <p className="mt-1 text-xs text-muted-foreground">Milestone protected</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <CTAButton href="/signup/client" variant="primary" className="gap-2">
                  <Briefcase className="h-4 w-4" />
                  Hire Talent Now
                  <ArrowRight className="h-4 w-4" />
                </CTAButton>
                <CTAButton href="/signup/client" variant="secondary" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Start a Project
                </CTAButton>
              </div>
            </div>
          </SectionTransition>
        </div>
      </section>
    </div>
  );
}
