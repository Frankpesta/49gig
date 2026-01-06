"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/marketing/page-header";
import {
  CheckCircle2,
  Users,
  ChevronRight,
  Code,
  Palette,
  Database,
  TrendingUp,
  PenTool,
  Target,
  Shield,
  DollarSign,
  Zap,
  Award,
} from "lucide-react";

export default function TalentCategoriesPage() {
  const categories = [
    {
      icon: Code,
      title: "Software Development",
      description: "Deliver scalable, high-quality software solutions for any project.",
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
      roles: [
        "Web Developers (Frontend, Backend, Fullstack)",
        "Mobile App Developers (iOS, Android, React Native)",
        "Software Engineers",
        "DevOps Specialists",
        "Blockchain & AI Developers",
      ],
    },
    {
      icon: Palette,
      title: "UI/UX & Product Design",
      description: "Create intuitive, visually stunning products that users love.",
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
      roles: [
        "UI/UX Designers",
        "Product Designers",
        "Graphic Designers",
        "Motion & Animation Designers",
        "Branding & Visual Identity Experts",
      ],
    },
    {
      icon: Database,
      title: "Data & Analytics",
      description: "Turn data into actionable insights and drive smarter business decisions.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
      roles: [
        "Data Analysts",
        "Data Scientists",
        "Business Intelligence Specialists",
        "Machine Learning Engineers",
        "Database Administrators",
      ],
    },
    {
      icon: TrendingUp,
      title: "Digital Marketing",
      description: "Grow your audience, traffic, and revenue with results-driven marketing strategies.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
      roles: [
        "SEO & SEM Experts",
        "Social Media Managers",
        "Content Marketing Strategists",
        "Email Marketing Specialists",
        "Paid Media Campaign Managers",
      ],
    },
    {
      icon: PenTool,
      title: "Writing & Content",
      description: "Produce compelling, engaging, and high-quality content for any purpose.",
      image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80",
      roles: [
        "Copywriters",
        "Technical Writers",
        "Blog & Article Writers",
        "Content Strategists",
        "Creative Writers",
      ],
    },
    {
      icon: Users,
      title: "Product & Project Management",
      description: "Lead projects and products to successful outcomes with experienced managers.",
      image: "https://images.unsplash.com/photo-1552664730-d307ca8849d1?w=800&q=80",
      roles: [
        "Product Managers",
        "Project Managers",
        "Scrum Masters",
        "Program Managers",
        "Agile Coaches",
      ],
    },
  ];

  const whyHireFeatures = [
    { icon: Shield, text: "Every professional is vetted and verified" },
    { icon: Target, text: "Projects are matched automatically to top talent" },
    { icon: Users, text: "Flexible hiring: individuals or full teams" },
    { icon: DollarSign, text: "Transparent pricing and milestone-based payments" },
    { icon: Award, text: "Secure contracts and built-in protection" },
  ];

  return (
    <div className="w-full">
      {/* PAGE HEADER */}
      <PageHeader
        badge={{
          icon: Target,
          text: "Talent Categories",
        }}
        title="Hire Africa's Top Freelancers Across High-Demand Skills"
        description="At 49GIG, we connect global companies with highly vetted African professionals in key high-demand fields. Whether you need a single expert or a full project team, our talent categories make it easy to find the right match for your project."
      />

      {/* TALENT CATEGORIES */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Our Launch Talent Categories
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Expertly vetted professionals across the most in-demand skills
            </p>
          </div>

          <div className="space-y-16 lg:space-y-24">
            {categories.map((category, index) => (
              <div key={index} className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
                {/* Image */}
                <div className={`relative ${index % 2 === 1 ? 'lg:order-last' : ''}`}>
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl border border-border/50">
                    <Image
                      src={category.image}
                      alt={category.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                      <category.icon className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-primary mb-1">
                        {index + 1}. Category
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                        {category.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {category.description}
                  </p>
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground uppercase tracking-wide">
                      Available Roles:
                    </p>
                    <ul className="space-y-2">
                      {category.roles.map((role, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                          <span className="text-sm text-foreground">{role}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY HIRE THROUGH 49GIG */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30 border-y border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Why Hire Through 49GIG?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get access to top talent with comprehensive protection and support
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {whyHireFeatures.map((feature, index) => (
              <Card key={index} className="border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                      <feature.icon className="h-7 w-7 text-primary" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {feature.text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON GRID */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="relative">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                  alt="Diverse team"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Hire for Any Project Size
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Whether you need a single specialist or a complete team, 49GIG makes it easy to scale your workforce based on project needs.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border border-border/50">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground">
                      Single Expert
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Perfect for specific tasks or specialized needs
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-border/50">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground">
                      Full Team
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Ideal for complete projects or ongoing work
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 sm:py-20 lg:py-24 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Ready to Find Talent?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Tell us what you need and get matched with Africa's top vetted professionals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="text-base h-12 px-8 shadow-lg">
              <Link href="/hire-talent">
                Hire Talent
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild className="text-base h-12 px-8 shadow-lg bg-secondary hover:bg-secondary/90">
              <Link href="/hire-team">
                Hire a Team
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="text-base h-12 px-8 bg-primary-foreground/10 border-2 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <Link href="/contact">
                Start Your Project
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

