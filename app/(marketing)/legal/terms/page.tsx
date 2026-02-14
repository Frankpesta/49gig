"use client";

import { PageHero } from "@/components/marketing/page-hero";
import { FileText, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface Section {
  id: string;
  title: string;
  subsections?: { title: string; content: string }[];
  content?: string;
}

export default function TermsPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["1", "2"]));

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  const sections: Section[] = [
    {
      id: "1",
      title: "Agreement to Terms",
      content: "These Terms and Conditions constitute a legally binding agreement between you and 49GIG governing your access to and use of our platform. By accessing or using the Platform, you agree to be bound by these Terms."
    },
    {
      id: "2",
      title: "Eligibility",
      content: "To use the Platform, you must be at least 18 years of age, have the legal capacity to enter into binding contracts, and provide accurate information during registration."
    },
    {
      id: "3",
      title: "User Accounts",
      subsections: [
        { title: "Account Creation", content: "You must provide accurate information and keep your account information up to date." },
        { title: "Account Security", content: "You are responsible for maintaining the confidentiality of your credentials and for all activities under your account." },
        { title: "Account Suspension", content: "We reserve the right to suspend or terminate your account if you violate these Terms or engage in fraudulent conduct." }
      ]
    },
    {
      id: "4",
      title: "Platform Services",
      subsections: [
        { title: "General Description", content: "49GIG is a marketplace platform connecting clients with vetted African freelancers. We facilitate connections, contracts, and payments." },
        { title: "Role of 49GIG", content: "49GIG acts as an intermediary platform. We do not employ freelancers, nor do we act as an agent for either party." },
        { title: "Vetting Process", content: "Freelancers undergo an automated vetting process including English proficiency and skills testing." }
      ]
    },
    {
      id: "5",
      title: "User Obligations",
      subsections: [
        { title: "Prohibited Conduct", content: "You agree not to violate laws, infringe intellectual property rights, post false information, engage in harassment, or circumvent the Platform." },
        { title: "Content Standards", content: "All content you post must comply with applicable laws and must not contain illegal, offensive, or infringing material." }
      ]
    },
    {
      id: "6",
      title: "Fees and Payments",
      subsections: [
        { title: "Service Fees", content: "49GIG charges service fees for facilitating projects. Fee structures are outlined in our Payment Terms." },
        { title: "Taxes", content: "You are responsible for determining and paying all applicable taxes related to your use of the Platform." }
      ]
    },
    {
      id: "7",
      title: "Intellectual Property",
      subsections: [
        { title: "Platform Content", content: "The Platform and its original content are owned by 49GIG and protected by international copyright and trademark laws." },
        { title: "Work Product", content: "Intellectual property rights in work product created by freelancers are determined by the contract between the client and freelancer." }
      ]
    },
    {
      id: "8",
      title: "Dispute Resolution",
      subsections: [
        { title: "Process", content: "Disputes between clients and freelancers should be resolved directly between the parties or through our mediation support." },
        { title: "Arbitration", content: "Any dispute shall be resolved through binding arbitration in accordance with the laws of Nigeria." }
      ]
    },
    {
      id: "9",
      title: "Disclaimers and Limitations",
      subsections: [
        { title: "No Warranties", content: "THE PLATFORM IS PROVIDED 'AS IS' WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED." },
        { title: "Limitation of Liability", content: "49GIG SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES." }
      ]
    },
    {
      id: "10",
      title: "Governing Law",
      content: "These Terms shall be governed by and construed in accordance with the laws of Nigeria."
    }
  ];

  const breadcrumbs = [{ label: "Legal", href: "/legal/terms" }, { label: "Terms", icon: FileText }];

  return (
    <div className="w-full">
      <PageHero
        title="Terms and Conditions"
        description="Please read these terms carefully. By using our platform, you agree to be bound by these terms."
        badge={{ icon: FileText, text: "Terms & Conditions" }}
        breadcrumbs={breadcrumbs}
        imageSrc="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80"
        imageAlt="Legal documents"
      />

      <section className="py-12 sm:py-16 lg:py-20 bg-background relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Table of Contents */}
          <div className="mb-10">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">Table of Contents</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => toggleSection(section.id)}
                  className="text-left text-sm text-primary hover:text-primary/80 transition-colors py-2 px-3 rounded-lg hover:bg-primary/10"
                >
                  {section.id}. {section.title}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.id}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full group"
                >
                  <Card className="border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 text-left">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0 mt-0.5">
                            <span className="text-sm font-semibold text-primary">{section.id}</span>
                          </div>
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                            {section.title}
                          </h3>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform duration-300 flex-shrink-0 ${
                            expandedSections.has(section.id) ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </button>

                {/* Expanded Content */}
                {expandedSections.has(section.id) && (
                  <div className="mt-2 ml-0 pl-0 sm:pl-4 border-l border-primary/30 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Card className="border border-border/30 bg-muted/30">
                      <CardContent className="p-6 space-y-6">
                        {section.content ? (
                          <p className="text-muted-foreground">{section.content}</p>
                        ) : section.subsections ? (
                          section.subsections.map((subsection, idx) => (
                            <div key={idx} className="space-y-2">
                              <h4 className="font-semibold text-foreground text-sm">{subsection.title}</h4>
                              <p className="text-muted-foreground text-sm">{subsection.content}</p>
                            </div>
                          ))
                        ) : null}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-12 pt-8 border-t border-border/30 space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Contact Information</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><span className="font-medium text-foreground">Email:</span> legal@49gig.com</p>
                <p><span className="font-medium text-foreground">Address:</span> 49GIG, Lagos, Nigeria</p>
                <p><span className="font-medium text-foreground">Phone:</span> +234 (0) 123 456 7890</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Last updated: January 6, 2026
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
