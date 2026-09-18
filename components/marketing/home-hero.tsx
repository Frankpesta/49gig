import {
  ArrowRight,
  Check,
  Lock,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import { CTAButton } from "@/components/marketing/cta-buttons";
import { cn } from "@/lib/utils";

const trustPoints = ["No CV screening", "48-hour matching", "Escrow-secured"];

const advantages = [
  {
    icon: ShieldCheck,
    title: "Rigorous Vetting",
    tagline: "Only the top 3% of African tech talent joins our network.",
    description:
      "We carefully assess technical skills, experience and suitability before professionals join our network. This helps companies access qualified talent without having to start the search from scratch.",
    featured: true,
  },
  {
    icon: SlidersHorizontal,
    title: "Flexible Hiring",
    tagline: "Hire part-time or full-time professionals matched to your exact needs.",
    description:
      "Whether you need someone to join your team full-time or support a specific project part-time, we help you find talent that fits your role, skills and working requirements.",
  },
  {
    icon: Zap,
    title: "Fast Matching",
    tagline: "Get matched with qualified talent in as little as 48 hours.",
    description:
      "Tell us what you need, and we identify professionals who match your requirements. You spend less time searching through CVs and more time focusing on finding the right person.",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    tagline: "Secure monthly escrow payments with cost-effective global talent.",
    description:
      "We handle the payment infrastructure, including contracts and secure payment arrangements where applicable, so companies can work with global talent with greater confidence and predictable costs.",
  },
  {
    icon: RefreshCw,
    title: "Fast Replacement Support",
    tagline: "Fast replacement support when necessary.",
    description:
      "If a professional needs to be replaced, we help facilitate the replacement process so companies can maintain continuity and avoid unnecessary disruption.",
  },
];

export function HomeHero() {
  return (
    <section
      className="relative -mt-14 overflow-hidden border-b border-border/30 bg-linear-to-b from-[#f5f4f1] via-[#f8f7f4] to-background pt-14 md:-mt-16 md:pt-16 dark:from-[#0b1327] dark:via-[#0a1123] dark:to-background"
      aria-label="Hero"
    >
      {/* Subtle grid + warm glow */}
      <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,rgba(7,18,43,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(7,18,43,0.05)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black_15%,transparent_60%)] dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]" />
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[34rem] w-[60rem] -translate-x-1/2 rounded-full bg-secondary/20 blur-3xl dark:bg-secondary/10" />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pt-24 lg:px-8 lg:pb-24 lg:pt-28">
        {/* Copy */}
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-[#0a0a0a] sm:text-5xl sm:leading-[1.05] lg:text-7xl lg:leading-[1.02] dark:text-white">
            Hire the{" "}
            <span className="relative inline-block whitespace-nowrap">
              <span className="relative z-10">top 3%</span>
              <span
                className="absolute inset-x-0 bottom-1 z-0 h-3 -rotate-1 rounded-sm bg-secondary/80 sm:h-4 lg:bottom-2 lg:h-5"
                aria-hidden
              />
            </span>{" "}
            of Africa&apos;s tech talent.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#3f3f3f] sm:text-lg dark:text-zinc-300">
            49GIG is a hiring infrastructure that helps global companies hire
            highly vetted, delivery-ready professionals across Software
            Engineering, AI, DevOps, Cloud, Data, and Product Design. We handle
            vetting, compliance, contracts, and payroll, giving you a faster,
            safer, and simpler way to build your team.
          </p>

          <div className="mt-8 flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <CTAButton
              href="/signup/client"
              variant="primary"
              className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl px-6 text-sm sm:w-auto"
            >
              Hire Talent
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
            <CTAButton
              href="/signup/freelancer"
              variant="secondary"
              className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl border-primary/40 bg-transparent px-6 text-sm text-foreground hover:bg-primary/5 sm:w-auto"
            >
              Apply as a Freelancer
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
          </div>

          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {trustPoints.map((point) => (
              <li key={point} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-secondary" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Advantage cards */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:mt-20 lg:grid-cols-6 lg:gap-5">
          {advantages.map((item, index) => {
            const featured = Boolean(item.featured);
            return (
              <article
                key={item.title}
                className={cn(
                  "group relative flex h-full flex-col overflow-hidden rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 sm:p-7",
                  index < 3 ? "lg:col-span-2" : "lg:col-span-3",
                  featured
                    ? "border-transparent bg-[#07122B] text-white shadow-xl shadow-primary/20 dark:bg-[#111d3d]"
                    : "border-border/60 bg-background/90 shadow-sm backdrop-blur hover:border-primary/25 hover:shadow-xl hover:shadow-primary/10"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl transition-opacity duration-500",
                    featured
                      ? "bg-secondary/30 opacity-100"
                      : "bg-secondary/25 opacity-0 group-hover:opacity-100"
                  )}
                  aria-hidden
                />

                <div
                  className={cn(
                    "relative mb-5 flex h-11 w-11 items-center justify-center rounded-2xl transition-colors duration-300",
                    featured
                      ? "bg-secondary text-[#07122B]"
                      : "bg-secondary/15 text-[#07122B] ring-1 ring-secondary/40 group-hover:bg-secondary dark:text-secondary dark:group-hover:text-[#07122B]"
                  )}
                >
                  <item.icon className="h-5 w-5" aria-hidden />
                </div>

                <h2 className="relative text-lg font-semibold tracking-tight sm:text-xl">
                  {item.title}
                </h2>
                <p
                  className={cn(
                    "relative mt-1.5 text-[0.9375rem] font-medium leading-snug sm:text-base",
                    featured ? "text-white/95" : "text-foreground/90"
                  )}
                >
                  {item.tagline}
                </p>
                <p
                  className={cn(
                    "relative mt-3 text-sm leading-relaxed",
                    featured ? "text-white/70" : "text-muted-foreground"
                  )}
                >
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
