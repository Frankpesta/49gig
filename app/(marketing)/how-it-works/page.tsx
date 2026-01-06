"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="w-full">
      {/* HERO SECTION - Clean Professional */}
      <section className="bg-background py-16 sm:py-20 lg:py-24 border-b border-border/50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground mb-6">
            How It Works
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Simple. Secure. Structured.
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            49GIG removes the stress from hiring and working remotely by using a vetted talent system, smart matching, and milestone-based delivery—so both clients and freelancers can work with confidence.
          </p>

          <div className="flex flex-wrap justify-center gap-6 mb-8">
            {[
              { icon: Shield, text: "Vetted Talent" },
              { icon: Target, text: "Smart Matching" },
              { icon: FileCheck, text: "Milestone Delivery" },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base h-12 px-8">
              <Link href="#clients">
                For Clients
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base h-12 px-8">
              <Link href="#freelancers">
                For Freelancers
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FOR CLIENTS SECTION */}
      <section id="clients" className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              For Clients
            </h2>
            <p className="text-lg text-muted-foreground">
              Hire Talent or Teams Without the Hassle
            </p>
          </div>

          <div className="space-y-16 lg:space-y-24">
            {/* Step 1 */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold shadow-lg">
                    1
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Choose How You Want to Hire
                  </h3>
                </div>
                <p className="text-base text-muted-foreground">
                  Select one option:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-base text-foreground">Hire a Talent</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-base text-foreground">Hire a Team</span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground italic">
                  No job postings. No bidding. No noise.
                </p>
              </div>
              <div className="relative">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl">
                  <Image
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                    alt="Choose hiring option"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* Step 2 */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="relative lg:order-first">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl">
                  <Image
                    src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80"
                    alt="Project details"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold shadow-lg">
                    2
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Share Your Project Details
                  </h3>
                </div>
                <p className="text-base text-muted-foreground">
                  Complete a structured project form covering:
                </p>
                <ul className="space-y-3">
                  {["Skills required", "Project scope and deliverables", "Timeline", "Budget", "Experience level"].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                      <span className="text-base text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* Step 3 */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold shadow-lg">
                    3
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Get Matched with Vetted Professionals
                  </h3>
                </div>
                <p className="text-base text-muted-foreground">
                  Our system matches you with top-rated freelancers or curated teams that fit your requirements.
                </p>
                <p className="text-sm font-medium text-foreground">
                  Matches are based on:
                </p>
                <ul className="space-y-3">
                  {["Skills and specialization", "Vetting score", "Performance history", "Availability"].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                      <span className="text-base text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl">
                  <Image
                    src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80"
                    alt="Matching process"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* Step 4 */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="relative lg:order-first">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl">
                  <Image
                    src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80"
                    alt="Contract signing"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold shadow-lg">
                    4
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Contract & Onboarding
                  </h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-base text-foreground">
                      A secure digital contract is generated and signed by all parties.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <span className="text-base text-foreground">
                      Once signed, the project workspace is activated.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* Step 5 */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold shadow-lg">
                    5
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Milestones, Delivery & Payments
                  </h3>
                </div>
                <ul className="space-y-3">
                  {[
                    "Projects are divided into milestones",
                    "Payments are secured upfront",
                    "Funds are released only after approval",
                    "Full visibility at every stage",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                      <span className="text-base text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl">
                  <Image
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80"
                    alt="Payments and milestones"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Client CTA */}
          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="text-base h-12 px-8">
              <Link href="/hire-talent">
                Start a Project
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base h-12 px-8">
              <Link href="/hire-talent">
                Hire Vetted Talent
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="border-t border-border/50" />

      {/* FOR FREELANCERS SECTION */}
      <section id="freelancers" className="py-16 sm:py-20 lg:py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              For Freelancers
            </h2>
            <p className="text-lg text-muted-foreground">
              Work with Global Clients. Get Paid Securely. Grow Your Career.
            </p>
          </div>

          <div className="space-y-16 lg:space-y-24">
            {/* Step 1 */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground text-2xl font-bold shadow-lg">
                    1
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Apply to Join 49GIG
                  </h3>
                </div>
                <p className="text-base text-muted-foreground">
                  Create your freelancer account and submit:
                </p>
                <ul className="space-y-3">
                  {["Personal information", "Skills and experience", "Portfolio"].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-secondary" />
                      <span className="text-base text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl">
                  <Image
                    src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80"
                    alt="Apply to join"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* Step 2 */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="relative lg:order-first">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl">
                  <Image
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
                    alt="Vetting process"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground text-2xl font-bold shadow-lg">
                    2
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Automated Vetting
                  </h3>
                </div>
                <p className="text-base text-muted-foreground">
                  All freelancers go through a strict, automated vetting process that includes:
                </p>
                <ul className="space-y-3">
                  {["Identity verification", "Skills testing", "Portfolio evaluation"].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-secondary" />
                      <span className="text-base text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm font-medium text-foreground">
                  Only top-scoring professionals are approved.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* Step 3 */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground text-2xl font-bold shadow-lg">
                    3
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Get Matched to Projects
                  </h3>
                </div>
                <p className="text-base text-muted-foreground italic mb-4">
                  You don&apos;t bid for jobs.
                </p>
                <p className="text-sm font-medium text-foreground">
                  Projects are assigned based on:
                </p>
                <ul className="space-y-3">
                  {["Skills", "Vetting score", "Performance rating", "Availability"].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-secondary" />
                      <span className="text-base text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl">
                  <Image
                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80"
                    alt="Project matching"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* Step 4 */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="relative lg:order-first">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl">
                  <Image
                    src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80"
                    alt="Start work"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground text-2xl font-bold shadow-lg">
                    4
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Sign Contract & Start Work
                  </h3>
                </div>
                <p className="text-base text-foreground">
                  Once selected, you sign a digital contract and begin work immediately.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* Step 5 */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground text-2xl font-bold shadow-lg">
                    5
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Deliver Work & Get Paid
                  </h3>
                </div>
                <ul className="space-y-3">
                  {[
                    "Complete milestones",
                    "Submit deliverables",
                    "Get paid after client approval",
                    "Secure, transparent payouts",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-secondary" />
                      <span className="text-base text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl">
                  <Image
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80"
                    alt="Get paid"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Freelancer CTA */}
          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="text-base h-12 px-8 bg-secondary hover:bg-secondary/90">
              <Link href="/get-started">
                Apply as a Freelancer
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base h-12 px-8">
              <Link href="/get-started">
                Join 49GIG
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* WHY 49GIG WORKS BETTER */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Why 49GIG Works Better
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Shield,
                title: "Quality First",
                description: "Only vetted professionals are allowed on the platform.",
              },
              {
                icon: FileText,
                title: "Transparent Process",
                description: "Clear contracts, milestones, and expectations from day one.",
              },
              {
                icon: Award,
                title: "Built-In Protection",
                description: "Secure payments, dispute resolution, and performance tracking.",
              },
              {
                icon: DollarSign,
                title: "Fair & Affordable",
                description: "Clients get great value. Freelancers get fair pay.",
              },
            ].map((item, index) => (
              <Card key={index} className="border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-8 space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 sm:py-20 bg-muted/30 border-t border-border/50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Whether you&apos;re hiring or looking for global work, 49GIG makes it simple, secure, and effective.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base h-12 px-8">
              <Link href="/hire-talent">
                Hire Talent or Teams
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base h-12 px-8">
              <Link href="/get-started">
                Become a Freelancer
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
