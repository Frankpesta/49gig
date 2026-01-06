"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle2, 
  Users, 
  Shield, 
  Code, 
  Palette, 
  Database, 
  TrendingUp, 
  PenTool,
  ArrowRight,
  Globe,
  Award,
  Target,
  Briefcase,
  Zap,
  Clock,
  FileCheck,
  Handshake,
  Star,
  ChevronRight,
  DollarSign,
  Search,
  UserCheck,
  Rocket
} from "lucide-react";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Ensure video plays on mount
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log("Video autoplay failed:", error);
      });
    }
  }, []);

  const stats = [
    { value: "10,000+", label: "Vetted Professionals" },
    { value: "95%", label: "Client Satisfaction" },
    { value: "120+", label: "Countries Served" },
    { value: "$50M+", label: "Paid to Freelancers" },
  ];

  const categories = [
    {
      icon: Code,
      title: "Software Development",
      description: "Full-stack, mobile, and specialized developers",
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
    },
    {
      icon: Palette,
      title: "Design & Creative",
      description: "UI/UX, graphic design, and creative direction",
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
    },
    {
      icon: TrendingUp,
      title: "Marketing & Growth",
      description: "Digital marketing, SEO, and growth strategy",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    },
    {
      icon: Database,
      title: "Data & Analytics",
      description: "Data science, analysis, and business intelligence",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    },
    {
      icon: PenTool,
      title: "Content & Writing",
      description: "Technical writing, copywriting, and content strategy",
      image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80",
    },
    {
      icon: Users,
      title: "Product & Project Management",
      description: "Product managers, scrum masters, and project leads",
      image: "https://images.unsplash.com/photo-1552664730-d307ca8849d1?w=800&q=80",
    },
  ];

  const whyChoose = [
    {
      icon: Shield,
      title: "100% Vetted Talent",
      description: "Every freelancer undergoes rigorous technical and soft skills assessment. Only the top 3% make it through.",
    },
    {
      icon: Zap,
      title: "Fast Matching",
      description: "Get matched with qualified professionals in 48 hours. Start your project immediately with pre-vetted talent.",
    },
    {
      icon: FileCheck,
      title: "Quality Guaranteed",
      description: "Milestone-based delivery ensures you only pay for work that meets your standards. Full refund protection.",
    },
    {
      icon: Globe,
      title: "Global Talent Pool",
      description: "Access top African talent working across 120+ countries. Work with professionals in your timezone.",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      icon: Briefcase,
      title: "Post Your Project",
      description: "Tell us about your project requirements, timeline, and budget. Our smart form takes less than 5 minutes to complete.",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
    },
    {
      step: "2",
      icon: Search,
      title: "Get Matched",
      description: "Our AI-powered system analyzes your needs and matches you with the best-fit professionals from our vetted talent pool.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    },
    {
      step: "3",
      icon: UserCheck,
      title: "Interview & Hire",
      description: "Review curated profiles, conduct interviews if needed, and hire your perfect match. Your project workspace is ready instantly.",
      image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80",
    },
    {
      step: "4",
      icon: Rocket,
      title: "Deliver Results",
      description: "Work through milestones with full transparency, real-time updates, and secure payments. Pay only when you're satisfied.",
      image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80",
    },
  ];

  // Trusted companies (for marquee)
  const trustedCompanies = [
    "Microsoft", "Google", "Amazon", "Meta", "Apple",
    "Netflix", "Spotify", "Airbnb", "Uber", "Stripe",
    "Shopify", "Adobe", "Tesla", "PayPal", "Salesforce"
  ];

  return (
    <div className="w-full">
      {/* HERO SECTION - Full Width Video Background */}
      <section className="relative bg-background border-b border-border/50 overflow-hidden min-h-[600px] sm:min-h-[650px] lg:min-h-[700px] flex items-center">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          {/* Video Element */}
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source
              src="https://assets.mixkit.co/videos/preview/mixkit-businesspeople-working-in-an-office-4609-large.mp4"
              type="video/mp4"
            />
            <source
              src="https://player.vimeo.com/external/434045526.sd.mp4?s=c27eecc69a27dbc4ff2b87d38afc35f1a9e7c02d&profile_id=164&oauth2_token_id=57447761"
              type="video/mp4"
            />
          </video>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-background/96 via-background/93 to-background/96 dark:from-background/98 dark:via-background/96 dark:to-background/98" />
          
          {/* Additional subtle gradient for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
        </div>

        <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="max-w-3xl space-y-6 lg:space-y-8">
            {/* Badge */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-primary shadow-sm">
                <Star className="h-4 w-4 fill-primary" />
                <span>Africa&apos;s #1 Freelance Platform</span>
              </div>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-foreground">
                Hire <span className="text-primary">World-Class</span> African Talent
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl">
                Connect with the top 3% of vetted African professionals. Build exceptional teams. Scale faster with 49GIG.
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-4 lg:gap-6">
              <div className="flex items-center gap-2 rounded-full bg-background/80 backdrop-blur-sm px-4 py-2 border border-border/50 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-foreground">100% Vetted</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-background/80 backdrop-blur-sm px-4 py-2 border border-border/50 shadow-sm">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Secure Payments</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-background/80 backdrop-blur-sm px-4 py-2 border border-border/50 shadow-sm">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium text-foreground">4.9/5 Rating</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="text-base h-12 px-8 shadow-lg">
                <Link href="/hire-talent">
                  Hire Talent
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild 
                className="text-base h-12 px-8 bg-background/90 backdrop-blur-sm border-2 hover:bg-background"
              >
                <Link href="/get-started">
                  Apply as Freelancer
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Social Proof */}
            <p className="text-sm text-muted-foreground">
              Trusted by <span className="text-foreground font-medium">500+ companies</span> including startups and Fortune 500s
            </p>
          </div>
        </div>

        {/* Bottom fade effect */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
      </section>

      {/* TRUSTED BY MARQUEE */}
      <section className="bg-muted/30 py-8 border-b border-border/50 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-4">
          <p className="text-center text-sm text-muted-foreground font-medium">
            Trusted by leading companies worldwide
          </p>
        </div>
        <div className="relative">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...trustedCompanies, ...trustedCompanies].map((company, index) => (
              <div
                key={index}
                className="mx-8 flex items-center justify-center"
              >
                <span className="text-xl font-semibold text-muted-foreground/60">
                  {company}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-background py-12 border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE 49GIG */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Why Choose 49GIG
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We make hiring exceptional talent simple, secure, and successful
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {whyChoose.map((item, index) => (
              <Card key={index} className="border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6 space-y-4">
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

      {/* TALENT CATEGORIES - With Marquee Animation */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30 border-y border-border/50 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-12 lg:mb-16">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Talent Categories
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find expert professionals across every skill you need
            </p>
          </div>
        </div>

        {/* Marquee Container */}
        <div className="relative">
          <div className="flex animate-marquee-slow">
            {[...categories, ...categories].map((category, index) => (
              <div key={index} className="flex-shrink-0 w-[350px] mx-4">
                <Card className="group overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl h-full">
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={category.image}
                      alt={category.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="350px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                  </div>
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <category.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {category.title}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                    <Button variant="link" className="p-0 h-auto text-primary font-medium group/link">
                      Explore talent
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button size="lg" variant="outline" asChild className="text-base h-12 px-8">
            <Link href="/talent-categories">
              View All Categories
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* HOW IT WORKS - Redesigned with Images */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes and hire your perfect team
            </p>
          </div>

          <div className="space-y-16 lg:space-y-24">
            {howItWorks.map((item, index) => (
              <div key={index} className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
                {/* Image - Alternating sides */}
                <div className={`relative ${index % 2 === 1 ? 'lg:order-last' : ''}`}>
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-xl border border-border/50">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                  {/* Step Number Badge */}
                  <div className="absolute -top-4 -left-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold shadow-lg border-4 border-background">
                    {item.step}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                      <item.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                  {index === 0 && (
                    <div className="flex flex-wrap gap-3 pt-2">
                      {["Project details", "Budget range", "Timeline", "Skills needed"].map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {index === 1 && (
                    <div className="flex flex-wrap gap-3 pt-2">
                      {["AI matching", "Skill assessment", "Availability check", "Experience level"].map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {index === 2 && (
                    <div className="flex flex-wrap gap-3 pt-2">
                      {["Review profiles", "Check portfolios", "Conduct interviews", "Make offers"].map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {index === 3 && (
                    <div className="flex flex-wrap gap-3 pt-2">
                      {["Milestone tracking", "Secure payments", "Quality assurance", "24/7 support"].map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Button size="lg" asChild className="text-base h-12 px-8 shadow-lg">
              <Link href="/how-it-works">
                Learn More About Our Process
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* WHY FREELANCERS CHOOSE US */}
      <section className="py-16 sm:py-20 lg:py-24 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                Why Freelancers Choose 49GIG
              </h2>
              <p className="text-lg text-primary-foreground/90 leading-relaxed">
                Join thousands of African professionals building successful global careers on our platform
              </p>

              <div className="space-y-4">
                {[
                  { icon: DollarSign, text: "Competitive rates and secure payments" },
                  { icon: Globe, text: "Work with global clients from anywhere" },
                  { icon: Award, text: "Build your reputation with verified reviews" },
                  { icon: Handshake, text: "Fair contracts and milestone protection" },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/10">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="text-base font-medium">{item.text}</span>
                  </div>
                ))}
              </div>

              <Button size="lg" variant="secondary" asChild className="text-base h-12 px-8 mt-6">
                <Link href="/get-started">
                  Join as Freelancer
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="relative">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&q=80"
                  alt="Freelancer working"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Target className="h-4 w-4" />
                Our Mission
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Empowering African Talent Globally
          </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Our mission is to connect exceptional African professionals with global opportunities, creating economic prosperity across the continent while delivering world-class results to clients worldwide.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                We believe in the power of African talent to drive innovation, solve complex problems, and build the future of work—one project at a time.
              </p>
            </div>

            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-sm font-medium text-secondary">
                <Zap className="h-4 w-4" />
                Our Vision
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Building Africa's Largest Talent Network
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                We envision a future where African talent is the first choice for companies worldwide—recognized not just for affordability, but for exceptional quality, innovation, and reliability.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                By 2030, we aim to facilitate $1 billion in freelance earnings for African professionals, creating sustainable careers and driving continental growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 sm:py-20 bg-muted/30 border-y border-border/50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of companies and freelancers building success on 49GIG
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base h-12 px-8 shadow-lg">
              <Link href="/hire-talent">
                Hire Talent
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base h-12 px-8">
              <Link href="/get-started">
                Join as Freelancer
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
