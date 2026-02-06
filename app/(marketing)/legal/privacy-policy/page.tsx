"use client";

import { PageHeader } from "@/components/marketing/page-header";
import { Shield, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
  expanded?: boolean;
}

export default function PrivacyPolicyPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["1"]));

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
      title: "Introduction",
      content: (
        <div className="space-y-4 text-muted-foreground">
          <p>
            Welcome to 49GIG ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform at 49gig.com (the "Platform").
          </p>
          <p>
            By using the Platform, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, please do not use our Platform.
          </p>
        </div>
      )
    },
    {
      id: "2",
      title: "Information We Collect",
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-foreground mb-2">Personal Information</h4>
            <p className="text-muted-foreground mb-3">We collect personal information that you voluntarily provide to us when you:</p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Register for an account or create a user profile</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Apply to become a freelancer or post a project</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Make payments or receive payouts</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Contact us for support</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">Automatically Collected Information</h4>
            <p className="text-muted-foreground">When you use our Platform, we automatically collect: IP address and location data, browser type, device information, pages visited, referral sources, and usage patterns.</p>
          </div>
        </div>
      )
    },
    {
      id: "3",
      title: "How We Use Your Information",
      content: (
        <div className="space-y-3 text-muted-foreground">
          <p>We use the information we collect for various purposes:</p>
          <ul className="space-y-2">
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">•</span>
              <span>To create and maintain your account</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">•</span>
              <span>To verify your identity and conduct vetting processes</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">•</span>
              <span>To match clients with suitable freelancers</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">•</span>
              <span>To facilitate contracts, payments, and project management</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">•</span>
              <span>To detect, prevent, and address fraud and security issues</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: "4",
      title: "How We Share Your Information",
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-foreground mb-2">With Other Users</h4>
            <p className="text-muted-foreground">When you create a profile as a freelancer, certain information (name, skills, portfolio, ratings) will be visible to clients. Project information may be visible to freelancers.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">With Service Providers</h4>
            <p className="text-muted-foreground">We share information with third-party service providers who perform services on our behalf, including payment processing, verification and vetting, data analytics, and customer support.</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">For Legal Reasons</h4>
            <p className="text-muted-foreground">We may disclose your information if required to do so by law or in response to valid requests by public authorities.</p>
          </div>
        </div>
      )
    },
    {
      id: "5",
      title: "Data Security",
      content: (
        <div className="space-y-4 text-muted-foreground">
          <p>
            We implement appropriate technical and organizational security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. However, no method of transmission over the internet is 100% secure.
          </p>
          <p>
            We use industry-standard encryption protocols to secure sensitive information like payment details and personal identification data.
          </p>
        </div>
      )
    },
    {
      id: "6",
      title: "Your Privacy Rights",
      content: (
        <div className="space-y-4 text-muted-foreground">
          <p>Depending on your location, you may have the following rights:</p>
          <ul className="space-y-2">
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">•</span>
              <span><strong>Access:</strong> Request access to the personal information we hold about you</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">•</span>
              <span><strong>Correction:</strong> Request correction of inaccurate or incomplete information</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">•</span>
              <span><strong>Deletion:</strong> Request deletion of your personal information</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">•</span>
              <span><strong>Portability:</strong> Request a copy of your information in a structured format</span>
            </li>
          </ul>
          <p className="pt-2">To exercise these rights, please contact us at privacy@49gig.com. We will respond within 30 days.</p>
        </div>
      )
    },
    {
      id: "7",
      title: "Contact Us",
      content: (
        <div className="space-y-4 text-muted-foreground">
          <p>If you have questions or concerns about this Privacy Policy, please contact us:</p>
          <ul className="space-y-2">
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">•</span>
              <span><strong>Email:</strong> privacy@49gig.com</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">•</span>
              <span><strong>Address:</strong> 49GIG, Lagos, Nigeria</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">•</span>
              <span><strong>Phone:</strong> +234 (0) 123 456 7890</span>
            </li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="w-full">
      <PageHeader
        badge={{ icon: Shield, text: "Privacy Policy" }}
        title="Your Privacy Matters"
        description="We take data protection seriously. This privacy policy explains how we collect, use, and protect your information."
      />

      <section className="py-20 sm:py-24 lg:py-32 bg-background relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Table of Contents */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Table of Contents</h2>
            <div className="grid gap-3 sm:grid-cols-2">
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
                      <CardContent className="p-6">
                        {section.content}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Last Updated */}
          <div className="mt-12 pt-8 border-t border-border/30 text-center">
            <p className="text-sm text-muted-foreground">
              Last updated: January 6, 2026
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
