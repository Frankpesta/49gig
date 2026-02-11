"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/marketing/page-header";
import { CTAButton } from "@/components/marketing/cta-buttons";
import { DollarSign, Check } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <PageHeader
        title="Pricing"
        description="Transparent pricing for hiring vetted talent. One platform fee, no hidden costs."
        breadcrumbs={[{ label: "Pricing", icon: DollarSign }]}
      />
      <section className="container py-16">
        <div className="mx-auto max-w-3xl text-center space-y-8">
          <p className="text-lg text-muted-foreground">
            49GIG charges a single 25% platform fee on project value. This includes vetting, escrow, contracts, and support.
          </p>
          <ul className="text-left space-y-3 max-w-md mx-auto">
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary shrink-0" />
              Vetting and matching
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary shrink-0" />
              Secure escrow payments
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary shrink-0" />
              Contracts and dispute resolution
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary shrink-0" />
              Talent receives 75% of project value
            </li>
          </ul>
          <div className="pt-6 flex flex-wrap justify-center gap-4">
            <CTAButton href="/signup/client" variant="primary">
              Get started as a client
            </CTAButton>
            <Button variant="outline" asChild>
              <Link href="/dashboard/pricing">View detailed pricing (dashboard)</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
