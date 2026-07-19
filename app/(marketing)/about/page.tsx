
import Image from "next/image";
import { PageHero } from "@/components/marketing/page-hero";
import { CTAButton } from "@/components/marketing/cta-buttons";
import { SectionTransition } from "@/components/ui/section-transition";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import {
  Users,
  Briefcase,
  Shield,
  Award,
  ArrowRight,
  Zap,
  Target,
  Heart,
  Building2,
  Rocket,
  Eye,
  Handshake,
} from "lucide-react";
import type { Metadata } from "next";
import { buildMarketingRouteMetadata } from "@/lib/seo/marketing-page-metadata";

export const metadata: Metadata = buildMarketingRouteMetadata({
  absoluteTitle: "About 49GIG | African talent marketplace",
  description:
    "49GIG connects exceptional African talent with global opportunities through vetting, transparent relationships, milestone delivery, and fair careers.",
  path: "/about",
});

export default function AboutPage() {
  const breadcrumbs = [
    { label: "About", icon: Building2 },
  ];

  const values = [
    {
      icon: Award,
      title: "Excellence",
      description: "We deliver and expect high-quality results in every project, maintaining the highest standards of professionalism."
    },
    {
      icon: Shield,
      title: "Trust",
      description: "Transparent processes and verified talent create reliability for clients and freelancers alike, building long-term confidence."
    },
    {
      icon: Heart,
      title: "Empowerment",
      description: "We give African professionals the opportunity to thrive globally while helping businesses scale with world-class talent."
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "Leveraging technology to streamline hiring, vetting, and project management processes for better outcomes."
    },
    {
      icon: Handshake,
      title: "Collaboration",
      description: "We foster mutually beneficial relationships between clients and freelancers, creating value for everyone involved."
    }
  ];

  const pillars = [
    { icon: Target, title: "Mission-Driven", description: "Connecting exceptional African talent with global opportunities." },
    { icon: Shield, title: "Quality First", description: "Rigorous vetting ensures only top performers join our platform." },
    { icon: Zap, title: "Innovation", description: "Technology that streamlines hiring and project management." },
  ];

  return (
    <div className="w-full">
      <PageHero
        title="The Infrastructure Behind Africa's Global Talent"
        description="49GIG is the infrastructure that powers remote hiring from Africa — vetting, matching, contracts, and payments built into one reliable system for global companies and African professionals alike."
        badge={{ icon: Building2, text: "About 49GIG" }}
        breadcrumbs={breadcrumbs}
        pathname="/about"
        imageSrc="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
        imageAlt="African professionals collaborating"
        actions={
          <>
            <CTAButton href="/signup/client" variant="primary" className="gap-2">
              Hire Talent
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
            <CTAButton href="/signup/freelancer" variant="secondary" className="gap-2">
              Join as Freelancer
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
          </>
        }
      />

      {/* MISSION & VISION */}
      <section className="border-b border-border/40 bg-background py-20 sm:py-24 lg:py-28">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-20 items-center">
            <SectionTransition variant="slide" direction="left" delay={200}>
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15">
                    <Target className="h-3.5 w-3.5 text-primary" />
                  </div>
                  Our Mission
                </div>
                <h2 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
                  Unlocking Africa&apos;s <br className="hidden lg:block" />
                  <span className="text-primary">talent potential</span>
                </h2>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Our mission is to connect exceptional African professionals with global opportunities, creating economic prosperity across the continent while delivering world-class results to clients worldwide.
                </p>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                  We believe in the power of African talent to drive innovation, solve complex problems, and build the future of work—one project at a time.
                </p>
              </div>
            </SectionTransition>

            <SectionTransition variant="scale" delay={400}>
              <div className="relative group">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/40 shadow-lg">
                  <Image
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                    alt="African professionals collaborating"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-primary/15 via-transparent to-transparent" />
                </div>
              </div>
            </SectionTransition>
          </div>

          <div className="grid gap-16 lg:grid-cols-2 lg:gap-20 items-center mt-20">
            <SectionTransition variant="slide" direction="left" delay={600}>
              <div className="relative group order-2 lg:order-1">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/40 shadow-lg">
                  <Image
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"
                    alt="Global business success"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-secondary/15 via-transparent to-transparent" />
                </div>
              </div>
            </SectionTransition>

            <SectionTransition variant="slide" direction="right" delay={400}>
              <div className="space-y-8 order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-2 text-xs font-semibold text-secondary-foreground">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary/20">
                    <Eye className="h-3.5 w-3.5 text-secondary" />
                  </div>
                  Our Vision
                </div>
                <h2 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
                  Building Africa&apos;s <br className="hidden lg:block" />
                  <span className="text-primary">most trusted talent network</span>
                </h2>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                  We envision a future where African talent is the first choice for companies worldwide—recognized not just for affordability, but for exceptional quality, innovation, and reliability.
                </p>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                  We are building sustainable careers for African professionals while helping global companies work with trusted, delivery-ready teams.
                </p>
              </div>
            </SectionTransition>
          </div>
        </div>
      </section>

      {/* OUR VALUES */}
      <section className="border-b border-border/40 bg-muted/20 py-20 sm:py-24 lg:py-28">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15">
                  <Heart className="h-3.5 w-3.5 text-primary" />
                </div>
                Our Values
              </div>
              <h2 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
                What drives everything we do
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Our values guide every decision we make and every relationship we build, ensuring we create lasting value for our community.
              </p>
            </div>
          </SectionTransition>

          <BentoGrid columns={3} variant="complex" className="max-w-6xl mx-auto">
            {values.map((value, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <BentoCard
                  colSpan={index === 0 ? 2 : 1}
                  rowSpan={index === 0 ? 2 : 1}
                  className="border-border/60 bg-background/95 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <value.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-3 mt-4">
                    <h3 className="text-xl font-semibold text-foreground leading-tight">
                      {value.title}
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </BentoCard>
              </SectionTransition>
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* PILLARS - Bento Grid */}
      <section className="border-b border-border/40 bg-background py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl font-semibold text-foreground sm:text-3xl lg:text-4xl">
                What We Stand For
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Our core pillars guide everything we do.
              </p>
            </div>
          </SectionTransition>
          <BentoGrid columns={3} variant="complex" className="max-w-6xl mx-auto">
            {pillars.map((item, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <BentoCard
                  colSpan={index === 0 ? 2 : 1}
                  rowSpan={1}
                  className="bg-card hover:border-primary/30"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </BentoCard>
              </SectionTransition>
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-b border-border/40 bg-linear-to-br from-primary/10 via-background to-secondary/10 py-20 sm:py-24 lg:py-28">
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
                <Rocket className="h-3.5 w-3.5" />
                Join Our Mission
              </div>

              <div className="mx-auto mt-5 max-w-4xl">
                <h2 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">
                  Be part of something bigger
                </h2>
                <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Whether you&apos;re a business looking for talent or a professional ready to work globally, 49GIG is here to connect you with opportunities that matter.
                </p>
              </div>

              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <SectionTransition variant="slide" direction="left" delay={600}>
                  <CTAButton href="/signup/client" variant="primary" className="gap-3">
                    <Briefcase className="h-6 w-6" />
                    Hire Top Talent
                    <ArrowRight className="h-6 w-6" />
                  </CTAButton>
                </SectionTransition>
                <SectionTransition variant="slide" direction="right" delay={700}>
                  <CTAButton href="/signup/freelancer" variant="secondary" className="gap-3">
                    <Users className="h-6 w-6" />
                    Join as Freelancer
                    <ArrowRight className="h-6 w-6" />
                  </CTAButton>
                </SectionTransition>
              </div>
            </div>
          </SectionTransition>
        </div>
      </section>
    </div>
  );
}
