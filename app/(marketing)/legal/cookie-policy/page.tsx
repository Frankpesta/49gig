"use client";

import { PageHero } from "@/components/marketing/page-hero";
import { Cookie } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SectionTransition } from "@/components/ui/section-transition";

export default function CookiePolicyPage() {
  const sections = [
    {
      title: "What Are Cookies?",
      icon: "🍪",
      content: "Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners."
    },
    {
      title: "Essential Cookies",
      icon: "🔒",
      content: "These cookies are necessary for the Platform to function properly. They enable core functionality such as security, network management, authentication, session management, and accessibility features."
    },
    {
      title: "Performance & Analytics",
      icon: "📊",
      content: "These cookies help us understand how visitors interact with the Platform by collecting and reporting information anonymously. This includes page view tracking and user behavior analysis through Google Analytics."
    },
    {
      title: "Functionality Cookies",
      icon: "⚙️",
      content: "These cookies allow the Platform to remember choices you make and provide enhanced, personalized features such as language preferences, theme selection (light/dark mode), and user interface customization."
    },
    {
      title: "Advertising Cookies",
      icon: "📢",
      content: "These cookies are used to deliver advertisements relevant to you and your interests. They also help measure the effectiveness of advertising campaigns and track conversion metrics."
    }
  ];

  const breadcrumbs = [{ label: "Legal", href: "/legal/terms" }, { label: "Cookies", icon: Cookie }];

  return (
    <div className="w-full">
      <PageHero
        title="Cookie Policy"
        description="We use cookies to improve your experience and understand how you use our platform."
        badge={{ icon: Cookie, text: "Cookie Policy" }}
        breadcrumbs={breadcrumbs}
        imageSrc="https://images.unsplash.com/photo-1633265486064-086b219458ec?w=800&q=80"
        imageAlt="Privacy and cookies"
      />

      <section className="py-12 sm:py-16 lg:py-20 bg-background relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Cookie Types */}
          <SectionTransition variant="fade" delay={200}>
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-8">How We Use Cookies</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {sections.map((section, index) => (
                  <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                    <Card className="border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
                      <CardContent className="p-6 space-y-4 h-full flex flex-col">
                        <div className="flex items-start gap-3">
                          <span className="text-3xl">{section.icon}</span>
                          <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                          {section.content}
                        </p>
                      </CardContent>
                    </Card>
                  </SectionTransition>
                ))}
              </div>
            </div>
          </SectionTransition>

          {/* Managing Cookies */}
          <SectionTransition variant="fade" delay={400}>
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-8">Managing Cookies</h2>
              <div className="space-y-6">
                <Card className="border border-border/50 hover:border-primary/50 transition-all duration-300">
                  <CardContent className="p-6 space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">Browser Settings</h3>
                    <p className="text-muted-foreground">
                      Most browsers allow you to refuse or accept cookies. You can usually find cookie settings in the "Options" or "Preferences" menu of your browser.
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-border/50 hover:border-primary/50 transition-all duration-300">
                  <CardContent className="p-6 space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">Cookie Consent Tool</h3>
                    <p className="text-muted-foreground">
                      When you first visit our Platform, you'll see a cookie consent banner. You can manage your cookie preferences through this tool at any time.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </SectionTransition>

          {/* Third-Party Cookies */}
          <SectionTransition variant="fade" delay={500}>
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-6">Third-Party Cookies</h2>
              <Card className="border-2 border-primary/30 bg-primary/5">
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-4">
                    We may allow third-party service providers to place cookies on your device for analytics, payments, and advertising. These include:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1">•</span>
                      <span>Google Analytics for tracking user behavior</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1">•</span>
                      <span>Payment processors for secure transactions</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1">•</span>
                      <span>Social media platforms for integration</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary mt-1">•</span>
                      <span>Advertising networks for personalized content</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </SectionTransition>

          {/* Impact of Blocking */}
          <SectionTransition variant="fade" delay={600}>
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-6">Impact of Blocking Cookies</h2>
              <Card className="border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
                <CardContent className="p-6">
                  <p className="text-sm text-amber-900 dark:text-amber-400">
                    If you choose to block or delete cookies, some features of the Platform may not function properly or may be unavailable. Essential cookies cannot be blocked if you wish to use the Platform.
                  </p>
                </CardContent>
              </Card>
            </div>
          </SectionTransition>

          {/* Contact */}
          <div className="pt-8 border-t border-border/30 text-center">
            <p className="text-sm text-muted-foreground">
              For questions about our cookie policy, contact us at <span className="text-primary font-medium">privacy@49gig.com</span>
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
