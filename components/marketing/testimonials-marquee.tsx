"use client";

import { useState, useEffect, useCallback } from "react";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";
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
  {
    quote:
      "We were skeptical about remote hiring at first, but 49GIG made it seamless. The talent integrated quickly with our team and delivered beyond expectations.",
    role: "CTO",
    company: "Cabwire",
    country: "Canada",
    initial: "C",
  },
];

export function TestimonialsMarquee() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const go = useCallback((index: number) => {
    setCurrent((index + testimonials.length) % testimonials.length);
  }, []);

  const next = useCallback(() => go(current + 1), [go, current]);
  const prev = useCallback(() => go(current - 1), [go, current]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  return (
    <section
      className="relative overflow-hidden border-y border-border/40 bg-background py-20 sm:py-24 lg:py-28"
      aria-label="Client testimonials"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
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

        {/* Slider */}
        <div
          className="mx-auto max-w-2xl lg:max-w-5xl"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Primary active card */}
            <div
              key={`primary-${current}`}
              className="flex flex-col w-full rounded-2xl border border-border/55 lg:border-primary/20 bg-background/95 p-7 lg:p-9 shadow-sm lg:shadow-md ring-1 ring-border/30 lg:ring-primary/10 animate-in fade-in duration-300"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <Quote className="h-5 w-5 text-primary" />
              </div>

              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} className="h-4 w-4 fill-secondary text-secondary" />
                ))}
              </div>

              <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90 sm:text-[0.9375rem] lg:text-base lg:leading-7">
                &ldquo;{testimonials[current].quote}&rdquo;
              </blockquote>

              <div className="mt-6 flex items-center gap-3 border-t border-border/40 pt-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {testimonials[current].initial}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground lg:text-base">{testimonials[current].role}</p>
                  <p className="text-xs text-muted-foreground lg:text-sm">
                    {testimonials[current].company}
                    {testimonials[current].country ? ` · ${testimonials[current].country}` : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Adjacent card — dimmed on sm/md, fully styled on lg+ */}
            {(() => {
              const next_t = testimonials[(current + 1) % testimonials.length];
              return (
                <div
                  key={`secondary-${current}`}
                  className="hidden sm:flex flex-col w-full rounded-2xl border border-border/40 lg:border-border/55 bg-muted/30 lg:bg-background/95 p-7 lg:p-9 ring-1 ring-border/15 lg:ring-border/30 animate-in fade-in duration-300 opacity-60 lg:opacity-100 shadow-sm"
                  aria-hidden
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/5 lg:bg-primary/10">
                    <Quote className="h-5 w-5 text-primary/50 lg:text-primary" />
                  </div>
                  <div className="mb-4 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className="h-4 w-4 fill-secondary/40 text-secondary/40 lg:fill-secondary lg:text-secondary" />
                    ))}
                  </div>
                  <blockquote className="flex-1 text-sm leading-relaxed text-foreground/55 lg:text-foreground/90 sm:text-[0.9375rem] lg:text-base lg:leading-7 line-clamp-5 lg:line-clamp-none">
                    &ldquo;{next_t.quote}&rdquo;
                  </blockquote>
                  <div className="mt-6 flex items-center gap-3 border-t border-border/30 lg:border-border/40 pt-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/25 lg:bg-primary text-sm font-bold text-primary-foreground/60 lg:text-primary-foreground">
                      {next_t.initial}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground/60 lg:text-foreground lg:text-base">{next_t.role}</p>
                      <p className="text-xs text-muted-foreground/60 lg:text-muted-foreground lg:text-sm">
                        {next_t.company}
                        {next_t.country ? ` · ${next_t.country}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Controls */}
          <div className="mt-8 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous testimonial"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background text-foreground shadow-sm transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2" role="tablist" aria-label="Testimonial navigation">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === current}
                  aria-label={`Testimonial ${i + 1}`}
                  onClick={() => go(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === current ? "w-6 bg-primary" : "w-2 bg-border hover:bg-primary/40"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              aria-label="Next testimonial"
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
