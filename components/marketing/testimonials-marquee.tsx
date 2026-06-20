import { Quote, Star } from "lucide-react";
import { SectionTransition } from "@/components/ui/section-transition";

const testimonials = [
  {
    quote:
      "We reduced our engineering costs significantly without compromising on quality. The talent we hired was strong and well-prepared for the role.",
    role: "CPO",
    company: "Tubira AI",
    country: "Canada",
    initial: "T",
  },
  {
    quote:
      "We needed a backend engineer urgently and expected a long hiring cycle. 49GIG matched us with a vetted developer in just a few days. The process was fast, structured, and surprisingly smooth.",
    role: "Founder",
    company: "Zeltech",
    country: null,
    initial: "Z",
  },
  {
    quote:
      "The quality of talent on 49GIG stands out. We didn't have to filter through hundreds of CVs — the candidate we got was already properly vetted and ready to work.",
    role: "Founder",
    company: "Pfhix Enterprise",
    country: null,
    initial: "P",
  },
];

const doubled = [...testimonials, ...testimonials];

export function TestimonialsMarquee() {
  return (
    <section
      className="relative overflow-hidden border-y border-border/40 bg-background py-20 sm:py-24 lg:py-28"
      aria-label="Client testimonials"
    >
      {/* Decorative radial glows */}
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_25%_60%,rgba(7,18,43,0.06),transparent_45%),radial-gradient(circle_at_75%_40%,rgba(254,193,16,0.07),transparent_40%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTransition variant="fade" delay={200}>
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
              <Star className="h-3.5 w-3.5 fill-current" />
              Client Stories
            </div>
            <h2 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              Trusted by founders.{" "}
              <span className="italic text-secondary">Proven by results.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              From cutting costs to filling critical roles in days, here&apos;s
              what companies building with 49GIG have to say.
            </p>
          </div>
        </SectionTransition>
      </div>

      {/* Marquee track — bleeds edge to edge */}
      <div className="relative mt-2">
        {/* Edge fade masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-linear-to-r from-background to-transparent sm:w-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-linear-to-l from-background to-transparent sm:w-40" />

        <div className="overflow-hidden">
          <ul
            className="flex w-max gap-5 py-4 animate-marquee-slow"
            aria-label="Scrolling testimonials"
          >
            {doubled.map((t, i) => (
              <li
                key={i}
                aria-hidden={i >= testimonials.length}
                className="w-[21rem] shrink-0 rounded-2xl border border-border/55 bg-background/95 p-7 shadow-sm ring-1 ring-border/30 sm:w-[24rem]"
              >
                {/* Quote icon */}
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Quote className="h-5 w-5 text-primary" />
                </div>

                {/* Stars */}
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className="h-3.5 w-3.5 fill-secondary text-secondary"
                    />
                  ))}
                </div>

                {/* Quote text */}
                <blockquote className="text-sm leading-relaxed text-foreground/90 sm:text-[0.9375rem]">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                {/* Author */}
                <div className="mt-6 flex items-center gap-3 border-t border-border/40 pt-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t.role}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.company}
                      {t.country ? ` · ${t.country}` : ""}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
