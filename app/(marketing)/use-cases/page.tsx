import { CTAButton } from "@/components/marketing/cta-buttons";
import { PageHero } from "@/components/marketing/page-hero";
import { SectionTransition } from "@/components/ui/section-transition";
import {
  CheckCircle2,
  Users,
  ChevronRight,
  Briefcase,
  Target,
  Shield,
  Zap,
  DollarSign,
  RefreshCw,
  Lightbulb,
  TrendingUp,
  AlertCircle,
  Quote,
  ArrowRight,
  Rocket,
} from "lucide-react";
import type { Metadata } from "next";
import { buildMarketingRouteMetadata } from "@/lib/seo/marketing-page-metadata";

export const metadata: Metadata = buildMarketingRouteMetadata({
  absoluteTitle: "Case Studies | 49GIG",
  description:
    "Real hiring stories from founders and product leaders who found exceptional African tech talent — faster, smarter, and more cost-effectively.",
  path: "/use-cases",
});

const caseStudies = [
  {
    number: "01",
    badge: { icon: Zap, label: "Fast Hiring", color: "primary" as const },
    title: "Fast Hiring for a Startup MVP",
    overview:
      "A UK-based early-stage SaaS startup needed a backend engineer to build their MVP under tight timelines.",
    challenge: [
      "No internal engineering team",
      "Needed to start quickly",
      "Didn't want long recruitment cycles or CV screening",
    ],
    solution: {
      intro:
        "49GIG matched them with a vetted backend engineer from Africa within a few days.",
      points: [
        "Pre-vetted talent — no CV filtering needed",
        "Optional interview conducted after matching",
        "Escrow-secured monthly engagement",
      ],
    },
    result: [
      "Engineer onboarded in under 72 hours",
      "MVP development started immediately",
      "Founding team saved weeks of hiring time",
    ],
    quote:
      "49GIG removed the hiring friction completely. We focused on building instead of recruiting.",
  },
  {
    number: "02",
    badge: { icon: DollarSign, label: "Cost Efficiency", color: "secondary" as const },
    title: "Cost-Efficient Engineering Team Build",
    overview:
      "A US-based startup wanted to scale its engineering team without increasing burn rate.",
    challenge: [
      "High cost of US-based engineers",
      "Slow hiring pipeline",
      "Need for reliable long-term talent",
    ],
    solution: {
      intro:
        "49GIG provided part-time and full-time engineers across backend and cloud roles.",
      points: [
        "Rigorous vetting process",
        "Monthly engagement model",
        "Secure escrow payments",
      ],
    },
    result: [
      "2 engineers onboarded in 1 week",
      "Reduced hiring cost significantly",
      "Faster iteration on product development",
    ],
    quote:
      "We got senior-level output at a fraction of the cost, without compromising quality.",
  },
  {
    number: "03",
    badge: { icon: RefreshCw, label: "Talent Continuity", color: "primary" as const },
    title: "Rapid Replacement & Continuity",
    overview:
      "A remote startup needed a replacement engineer after an initial mismatch in role fit.",
    challenge: [
      "Initial hire wasn't aligned with expectations",
      "Project timelines at risk",
      "Needed fast resolution",
    ],
    solution: {
      intro: "49GIG activated its replacement support system.",
      points: [
        "Immediate talent reassignment",
        "No downtime in hiring process",
        "Continuous project monitoring",
      ],
    },
    result: [
      "Replacement provided quickly",
      "No major delay in project timeline",
      "Client maintained delivery schedule",
    ],
    quote:
      "The replacement process was fast and handled professionally. That gave us confidence to continue using 49GIG.",
  },
  {
    number: "04",
    badge: { icon: Shield, label: "Quality Vetting", color: "secondary" as const },
    title: "High-Quality Vetted Talent Network",
    overview:
      "A fintech startup needed a data engineer with strong technical and communication skills.",
    challenge: [
      "Difficulty finding vetted candidates",
      "Too many unqualified applicants in traditional hiring",
    ],
    solution: {
      intro: "49GIG provided pre-vetted data engineering talent.",
      points: [
        "Technical screening already completed",
        "Communication and experience evaluated",
        "Optional interview after matching",
      ],
    },
    result: [
      "Candidate matched in days",
      "Smooth onboarding",
      "Strong performance in early weeks",
    ],
    quote: "The vetting process saved us from wasting time on interviews.",
  },
];

export default function UseCasesPage() {
  const breadcrumbs = [{ label: "Case Studies", icon: Target }];

  return (
    <div className="w-full">
      <PageHero
        title="How Companies Hire Better with 49GIG"
        description="Real hiring stories from founders and product leaders who found exceptional African tech talent — faster, smarter, and more cost-effectively."
        badge={{ icon: Briefcase, text: "Case Studies" }}
        breadcrumbs={breadcrumbs}
        pathname="/use-cases"
        imageSrc="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
        imageAlt="Business team collaboration"
        actions={
          <>
            <CTAButton href="/signup/client" variant="primary" className="gap-2">
              <Briefcase className="h-5 w-5" />
              Hire Talent
              <ChevronRight className="h-4 w-4" />
            </CTAButton>
            <CTAButton href="/signup/freelancer" variant="secondary" className="gap-2">
              <Users className="h-5 w-5" />
              Join as Freelancer
              <ChevronRight className="h-4 w-4" />
            </CTAButton>
          </>
        }
      />

      {/* CASE STUDIES */}
      <section className="relative bg-background py-20 sm:py-24 lg:py-28">
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_20%_30%,rgba(7,18,43,0.05),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(254,193,16,0.05),transparent_40%)]" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <SectionTransition variant="fade" delay={150}>
            <div className="mb-16 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
                <Target className="h-3.5 w-3.5" />
                Client Case Studies
              </div>
              <h2 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
                Proof over promises
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Four companies. Four challenges. One platform that delivered.
              </p>
            </div>
          </SectionTransition>

          {/* Case study cards */}
          <div className="space-y-8 lg:space-y-10">
            {caseStudies.map((cs, index) => {
              const BadgeIcon = cs.badge.icon;
              const isPrimary = cs.badge.color === "primary";

              return (
                <SectionTransition
                  key={index}
                  variant="slide"
                  direction="up"
                  delay={200 + index * 100}
                >
                  <article className="group relative overflow-hidden rounded-2xl border border-border/55 bg-background/95 shadow-sm ring-1 ring-border/20 transition hover:shadow-md hover:ring-primary/20">
                    {/* Decorative large number — background */}
                    <span
                      className="pointer-events-none absolute right-6 top-4 select-none text-[6rem] font-black leading-none text-foreground/[0.04] sm:text-[8rem]"
                      aria-hidden
                    >
                      {cs.number}
                    </span>

                    <div className="relative p-7 sm:p-8 lg:p-10">
                      {/* Card header */}
                      <div className="mb-6 flex flex-wrap items-start gap-3">
                        <div
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                            isPrimary
                              ? "border-primary/25 bg-primary/10 text-primary"
                              : "border-secondary/40 bg-secondary/10 text-secondary-foreground"
                          }`}
                        >
                          <BadgeIcon className="h-3 w-3" />
                          {cs.badge.label}
                        </div>
                        <span className="ml-auto text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                          Case Study {cs.number}
                        </span>
                      </div>

                      <h3 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">
                        {cs.title}
                      </h3>

                      {/* Overview */}
                      <p className="mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground">
                        {cs.overview}
                      </p>

                      {/* Challenge / Solution / Result — 3-col grid */}
                      <div className="grid gap-4 sm:grid-cols-3">
                        {/* Challenge */}
                        <div className="rounded-xl border border-border/50 bg-muted/25 p-5">
                          <div className="mb-4 flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10">
                              <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400">
                              Challenge
                            </span>
                          </div>
                          <ul className="space-y-2.5">
                            {cs.challenge.map((point, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                                <span className="text-sm leading-snug text-foreground/80">
                                  {point}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Solution */}
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                          <div className="mb-4 flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
                              <Lightbulb className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wide text-primary">
                              Solution
                            </span>
                          </div>
                          <p className="mb-3 text-sm leading-snug text-foreground/80">
                            {cs.solution.intro}
                          </p>
                          <ul className="space-y-2.5">
                            {cs.solution.points.map((point, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                <span className="text-sm leading-snug text-foreground/80">
                                  {point}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Result */}
                        <div className="rounded-xl border border-green-200/60 bg-green-50/40 p-5 dark:border-green-900/40 dark:bg-green-950/20">
                          <div className="mb-4 flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/10">
                              <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wide text-green-700 dark:text-green-400">
                              Result
                            </span>
                          </div>
                          <ul className="space-y-2.5">
                            {cs.result.map((point, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
                                <span className="text-sm leading-snug text-foreground/80">
                                  {point}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Outcome quote */}
                      <div className="mt-7 flex items-start gap-4 rounded-xl border border-border/40 bg-muted/20 px-6 py-5">
                        <div
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            isPrimary
                              ? "bg-primary/10"
                              : "bg-secondary/15"
                          }`}
                        >
                          <Quote
                            className={`h-4 w-4 ${
                              isPrimary ? "text-primary" : "text-secondary-foreground"
                            }`}
                          />
                        </div>
                        <blockquote className="text-sm leading-relaxed text-foreground sm:text-[0.9375rem]">
                          <span className="italic">&ldquo;{cs.quote}&rdquo;</span>
                        </blockquote>
                      </div>
                    </div>
                  </article>
                </SectionTransition>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-y border-border/40 bg-linear-to-br from-primary/10 via-background to-secondary/10 py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="rounded-3xl border border-border/60 bg-background/90 p-8 text-center shadow-xl sm:p-10 lg:p-12">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
                <Rocket className="h-3.5 w-3.5" />
                Start Today
              </div>
              <h2 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
                Ready to write your own success story?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Join the companies that stopped searching and started building — with vetted African tech talent matched to their exact needs.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <CTAButton href="/signup/client" variant="primary" className="gap-2">
                  <Briefcase className="h-4 w-4" />
                  Hire Talent
                  <ArrowRight className="h-4 w-4" />
                </CTAButton>
                <CTAButton href="/signup/freelancer" variant="secondary" className="gap-2">
                  <Users className="h-4 w-4" />
                  Join as a Freelancer
                  <ChevronRight className="h-4 w-4" />
                </CTAButton>
              </div>
            </div>
          </SectionTransition>
        </div>
      </section>
    </div>
  );
}
