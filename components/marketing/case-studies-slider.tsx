"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  TrendingUp,
  Quote,
  DollarSign,
  Shield,
  RefreshCw,
  Zap,
  ChevronLeft,
  ChevronRight,
  Target,
} from "lucide-react";
import { SectionTransition } from "@/components/ui/section-transition";

const studies = [
  {
    number: "01",
    flag: "🌍",
    country: "Africa",
    badge: { label: "Fast Hiring", icon: Zap, color: "primary" as const },
    title: "MVP Launch in Record Time",
    overview:
      "A Lagos-based fintech needed a backend engineer in days, not weeks. 49GIG delivered a vetted match in under 72 hours.",
    challenge: [
      "No internal engineering team",
      "Needed to start quickly",
      "Couldn't afford long recruitment cycles",
    ],
    solution: {
      intro: "49GIG matched them with a vetted backend engineer within days.",
      points: [
        "Pre-vetted talent — no CV filtering needed",
        "Optional interview after matching",
        "Escrow-secured engagement",
      ],
    },
    result: [
      "Engineer onboarded in under 72 hours",
      "MVP development started immediately",
      "Weeks of hiring time saved",
    ],
    quote:
      "49GIG removed the hiring friction completely. We focused on building instead of recruiting.",
  },
  {
    number: "02",
    flag: "🇰🇪",
    country: "Kenya",
    badge: { label: "Cost Efficiency", icon: DollarSign, color: "secondary" as const },
    title: "Scale Without Burning the Runway",
    overview:
      "A Nairobi startup needed senior engineers to scale without blowing their runway. 49GIG provided two vetted engineers at a fraction of local cost.",
    challenge: [
      "High cost of senior local engineers",
      "Slow hiring pipeline",
      "Need for reliable long-term talent",
    ],
    solution: {
      intro:
        "49GIG provided part-time and full-time engineers across backend and cloud.",
      points: [
        "Rigorous vetting already done",
        "Monthly engagement model",
        "Secure escrow payments",
      ],
    },
    result: [
      "2 engineers onboarded in 1 week",
      "Significant cost reduction",
      "Faster product iteration",
    ],
    quote:
      "We got senior-level output at a fraction of the cost, without compromising quality.",
  },
  {
    number: "03",
    flag: "🇨🇦",
    country: "Canada",
    badge: { label: "Quality Vetting", icon: Shield, color: "primary" as const },
    title: "No More CV Screening",
    overview:
      "Tubira AI needed a vetted professional without drowning in unqualified applications. 49GIG's pre-screening did all the heavy lifting.",
    challenge: [
      "Hundreds of unqualified applicants",
      "No time for lengthy interviews",
      "Needed strong technical + communication skills",
    ],
    solution: {
      intro: "49GIG provided pre-vetted engineering talent ready to perform.",
      points: [
        "Technical screening already completed",
        "Communication and experience evaluated",
        "Optional interview after matching",
      ],
    },
    result: [
      "Candidate matched in days",
      "Smooth onboarding",
      "Strong performance from week one",
    ],
    quote:
      "We reduced our engineering costs significantly without compromising on quality.",
  },
  {
    number: "04",
    flag: "🇨🇦",
    country: "Canada",
    badge: { label: "Remote Hiring", icon: RefreshCw, color: "secondary" as const },
    title: "Seamless Remote Onboarding",
    overview:
      "Cabwire was skeptical of remote hiring. 49GIG matched them with talent that integrated quickly and delivered beyond expectations.",
    challenge: [
      "Skepticism around remote team integration",
      "Previous bad experience with unvetted hires",
      "Needed fast team culture alignment",
    ],
    solution: {
      intro:
        "49GIG activated its talent matching and onboarding support system.",
      points: [
        "Immediate talent reassignment if needed",
        "Ongoing project monitoring",
        "Structured kickoff and integration support",
      ],
    },
    result: [
      "Talent integrated in the first week",
      "Delivered beyond initial expectations",
      "Client now fully committed to remote hiring",
    ],
    quote:
      "We were skeptical about remote hiring at first, but 49GIG made it seamless.",
  },
];

export function CaseStudiesSlider() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback((index: number) => {
    setCurrent((index + studies.length) % studies.length);
  }, []);

  const next = useCallback(() => go(current + 1), [go, current]);
  const prev = useCallback(() => go(current - 1), [go, current]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % studies.length);
    }, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAutoPlaying]);

  const cs = studies[current];
  const BadgeIcon = cs.badge.icon;
  const isPrimary = cs.badge.color === "primary";

  return (
    <section
      className="relative overflow-hidden border-b border-border/40 bg-background py-20 sm:py-24 lg:py-28"
      aria-label="Case studies"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_20%_50%,rgba(7,18,43,0.04),transparent_45%),radial-gradient(circle_at_80%_50%,rgba(254,193,16,0.05),transparent_40%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTransition variant="fade" delay={200}>
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
              <Target className="h-3.5 w-3.5" />
              Case Studies
            </div>
            <h2 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              Companies hiring better with 49GIG
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              From Africa to Canada, here&apos;s how companies across the globe
              are solving their toughest hiring challenges.
            </p>
          </div>
        </SectionTransition>

        {/* Slider */}
        <div className="mx-auto max-w-2xl lg:max-w-4xl">
          {/* Card */}
          <div
            key={current}
            className="relative overflow-hidden rounded-2xl border border-border/55 bg-background/95 shadow-sm ring-1 ring-border/20 animate-in fade-in duration-300"
          >
            <span
              className="pointer-events-none absolute right-5 top-3 select-none text-[5rem] lg:text-[7rem] font-black leading-none text-foreground/[0.04]"
              aria-hidden
            >
              {cs.number}
            </span>

            {/* Mobile / tablet: single column. lg+: two columns */}
            <div className="relative p-7 lg:p-10 lg:grid lg:grid-cols-2 lg:gap-10">
              {/* Left column: header + overview + quote */}
              <div className="flex flex-col">
                <div className="mb-5 flex flex-wrap items-start gap-3">
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${isPrimary ? "border-primary/25 bg-primary/10 text-primary" : "border-secondary/40 bg-secondary/10 text-secondary-foreground"}`}
                  >
                    <BadgeIcon className="h-3 w-3" />
                    {cs.badge.label}
                  </div>
                  <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/60">
                    <span>{cs.flag}</span>
                    <span className="uppercase tracking-widest">{cs.country}</span>
                  </span>
                </div>

                <h3 className="mb-3 text-xl font-bold text-foreground lg:text-2xl">{cs.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground lg:text-base lg:leading-7">{cs.overview}</p>

                {/* Quote — pushed to bottom on lg */}
                <div className="mt-6 lg:mt-auto lg:pt-8 flex items-start gap-3 rounded-xl border border-border/40 bg-muted/20 px-5 py-4">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isPrimary ? "bg-primary/10" : "bg-secondary/15"}`}
                  >
                    <Quote
                      className={`h-3.5 w-3.5 ${isPrimary ? "text-primary" : "text-secondary-foreground"}`}
                    />
                  </div>
                  <blockquote className="text-xs leading-relaxed text-foreground italic lg:text-sm lg:leading-6">
                    &ldquo;{cs.quote}&rdquo;
                  </blockquote>
                </div>
              </div>

              {/* Right column: challenge / solution / result blocks */}
              {/* On mobile these render below (normal flow). On lg they sit in the right col. */}
              <div className="mt-6 lg:mt-0 space-y-3">
                <div className="rounded-xl border border-border/50 bg-muted/25 p-4 lg:p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500/10">
                      <AlertCircle className="h-3 w-3 text-orange-500" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400">
                      Challenge
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {cs.challenge.map((point, pi) => (
                      <li key={pi} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-400" />
                        <span className="text-xs leading-snug text-foreground/80 lg:text-sm">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 lg:p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15">
                      <Lightbulb className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
                      Solution
                    </span>
                  </div>
                  <p className="mb-2 text-xs leading-snug text-foreground/80 lg:text-sm">{cs.solution.intro}</p>
                  <ul className="space-y-1.5">
                    {cs.solution.points.map((point, pi) => (
                      <li key={pi} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                        <span className="text-xs leading-snug text-foreground/80 lg:text-sm">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-green-200/60 bg-green-50/40 p-4 lg:p-5 dark:border-green-900/40 dark:bg-green-950/20">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-green-500/10">
                      <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-green-700 dark:text-green-400">
                      Result
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {cs.result.map((point, pi) => (
                      <li key={pi} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-green-600 dark:text-green-400" />
                        <span className="text-xs leading-snug text-foreground/80 lg:text-sm">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-8 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous case study"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background text-foreground shadow-sm transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2" role="tablist" aria-label="Case study navigation">
              {studies.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === current}
                  aria-label={`Case study ${i + 1}`}
                  onClick={() => go(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === current
                      ? "w-6 bg-primary"
                      : "w-2 bg-border hover:bg-primary/40"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              aria-label="Next case study"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background text-foreground shadow-sm transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
