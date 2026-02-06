"use client";

import { PageHeader } from "@/components/marketing/page-header";
import { RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SectionTransition } from "@/components/ui/section-transition";

export default function RefundPolicyPage() {
  const refundCases = [
    {
      icon: CheckCircle2,
      title: "Eligible for Refund",
      color: "from-green-500 to-green-600",
      items: [
        "Freelancer fails to deliver agreed-upon work",
        "Deliverables don't meet contract specifications",
        "Freelancer abandons the project",
        "Work contains plagiarism or copyright infringement"
      ]
    },
    {
      icon: XCircle,
      title: "Not Eligible for Refund",
      color: "from-red-500 to-red-600",
      items: [
        "Client dissatisfaction based on subjective preferences",
        "Changes in project scope after contract signing",
        "Client's failure to provide necessary information",
        "Milestones already approved and paid"
      ]
    }
  ];

  const timeline = [
    {
      title: "Before Work Begins",
      description: "Full refund of project funds (minus platform fees) within 5-7 business days",
      icon: "⏱️"
    },
    {
      title: "After Work Begins",
      description: "Completed milestones are non-refundable; in-progress ones evaluated partially; unstarted milestones may be refunded",
      icon: "⚙️"
    },
    {
      title: "Dispute Resolution",
      description: "Disputes resolved within 10-15 business days through our review process",
      icon: "⚖️"
    }
  ];

  return (
    <div className="w-full">
      <PageHeader
        badge={{ icon: RefreshCw, text: "Refund Policy" }}
        title="Refund & Cancellation Policy"
        description="Clear, transparent guidelines for refunds and cancellations on the 49GIG platform."
      />

      <section className="py-20 sm:py-24 lg:py-32 bg-background relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Overview */}
          <SectionTransition variant="fade" delay={200}>
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">Overview</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                This Refund and Cancellation Policy outlines the conditions under which clients may receive refunds and how project cancellations are handled on the 49GIG platform. We believe in fair, transparent practices that protect both clients and freelancers.
              </p>
            </div>
          </SectionTransition>

          {/* Refund Eligibility */}
          <SectionTransition variant="fade" delay={300}>
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-8">Refund Eligibility</h2>
              <div className="grid gap-8 sm:grid-cols-2">
                {refundCases.map((caseItem, index) => {
                  const Icon = caseItem.icon;
                  return (
                    <SectionTransition key={index} variant="slide" direction="up" delay={400 + index * 100}>
                      <Card className="border border-border/50 hover:shadow-lg transition-all duration-300 h-full">
                        <CardContent className="p-6 space-y-6 h-full flex flex-col">
                          <div className="flex items-start gap-3">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${caseItem.color} flex-shrink-0`}>
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">{caseItem.title}</h3>
                          </div>
                          <ul className="space-y-2 flex-1">
                            {caseItem.items.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                                <span className="text-primary mt-1">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </SectionTransition>
                  );
                })}
              </div>
            </div>
          </SectionTransition>

          {/* Cancellation Timeline */}
          <SectionTransition variant="fade" delay={500}>
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-8">Cancellation Timeline</h2>
              <div className="space-y-6">
                {timeline.map((item, index) => (
                  <SectionTransition key={index} variant="slide" direction="left" delay={600 + index * 100}>
                    <Card className="border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="text-3xl flex-shrink-0">{item.icon}</div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                            <p className="text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </SectionTransition>
                ))}
              </div>
            </div>
          </SectionTransition>

          {/* Service Fees */}
          <SectionTransition variant="fade" delay={700}>
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-6">Platform Service Fees</h2>
              <div className="space-y-4">
                <Card className="border border-border/50">
                  <CardContent className="p-6 space-y-3">
                    <h3 className="font-semibold text-foreground">Generally Non-Refundable</h3>
                    <p className="text-muted-foreground">
                      Platform service fees are generally non-refundable once a project has commenced and contracts have been signed.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-primary/30 bg-primary/5">
                  <CardContent className="p-6 space-y-3">
                    <h3 className="font-semibold text-foreground">Exceptions</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-3">
                        <span className="text-primary mt-1">•</span>
                        <span>Technical error or duplicate charge</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary mt-1">•</span>
                        <span>49GIG fails to match you with freelancer within agreed timeframe</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-primary mt-1">•</span>
                        <span>Freelancer unable to commence work after contract signing</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </SectionTransition>

          {/* Dispute Resolution */}
          <SectionTransition variant="fade" delay={800}>
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-6">Dispute Resolution Process</h2>
              <div className="space-y-4">
                <Card className="border border-border/50">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-foreground mb-2">How to Initiate</h3>
                    <p className="text-muted-foreground text-sm">
                      You must initiate a dispute through the 49GIG platform within 14 days of the issue occurring.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-border/50">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-foreground mb-2">Review Process</h3>
                    <p className="text-muted-foreground text-sm">
                      49GIG will review all evidence, communications, deliverables, and contract terms. Both parties have the opportunity to present their case.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </SectionTransition>

          {/* Footer */}
          <div className="pt-8 border-t border-border/30 text-center">
            <p className="text-sm text-muted-foreground">
              For questions about refunds or cancellations, contact us at <span className="text-primary font-medium">support@49gig.com</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: January 6, 2026
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
