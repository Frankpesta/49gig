"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/marketing/page-hero";
import { CTAButton } from "@/components/marketing/cta-buttons";
import { SectionTransition } from "@/components/ui/section-transition";
import {
  CheckCircle2,
  CheckCircle,
  Users,
  Briefcase,
  Search,
  Filter,
  Star,
  ArrowRight,
  Sparkles,
  Layers,
  Shield,
  Brain,
  Workflow,
  Code,
  Palette,
  Database,
  Cloud
} from "lucide-react";

export default function TalentCategoriesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const breadcrumbs = [
    { label: "Talent", href: "/talent-categories" },
    { label: "Categories", icon: Layers },
  ];

  const categories = [
    {
      id: "development",
      name: "Software Development",
      icon: Code,
      description: "Full-stack, mobile, and specialized developers building scalable solutions",
      color: "from-blue-500 to-blue-600",
      bgColor: "from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900",
      skills: ["React", "Node.js", "Python", "Java", "PHP", "Go", "Rust", "Mobile Dev"],
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
      freelancerCount: 1250,
      avgRating: 4.8
    },
    {
      id: "design",
      name: "UI/UX and Product Design",
      icon: Palette,
      description: "Creative designers crafting intuitive user experiences and stunning visuals",
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900",
      skills: ["UI Design", "UX Research", "Prototyping", "Figma", "Adobe XD", "Brand Design"],
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
      freelancerCount: 890,
      avgRating: 4.7
    },
    {
      id: "data",
      name: "Data Analytics",
      icon: Database,
      description: "Data scientists and analysts turning data into actionable business insights",
      color: "from-green-500 to-green-600",
      bgColor: "from-green-50 to-green-100 dark:from-green-950 dark:to-green-900",
      skills: ["Python", "SQL", "Tableau", "Power BI", "Machine Learning", "Statistics"],
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
      freelancerCount: 650,
      avgRating: 4.9
    },
    {
      id: "devops",
      name: "DevOps & Cloud Engineering",
      icon: Cloud,
      description: "Infrastructure experts automating deployments and managing cloud infrastructure",
      color: "from-orange-500 to-orange-600",
      bgColor: "from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900",
      skills: ["Docker", "Kubernetes", "AWS", "Azure", "Terraform", "CI/CD", "Linux"],
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
      freelancerCount: 420,
      avgRating: 4.8
    },
    {
      id: "cybersecurity",
      name: "Cybersecurity & IT Infrastructure",
      icon: Shield,
      description: "Security specialists protecting systems and infrastructure from threats",
      color: "from-red-500 to-red-600",
      bgColor: "from-red-50 to-red-100 dark:from-red-950 dark:to-red-900",
      skills: ["Network Security", "Penetration Testing", "SIEM", "Compliance", "Risk Assessment"],
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80",
      freelancerCount: 380,
      avgRating: 4.9
    },
    {
      id: "ai-ml",
      name: "AI, Machine Learning & Blockchain",
      icon: Brain,
      description: "AI/ML engineers and blockchain developers building next-generation solutions",
      color: "from-indigo-500 to-indigo-600",
      bgColor: "from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900",
      skills: ["Machine Learning", "Deep Learning", "TensorFlow", "Blockchain", "Smart Contracts", "Web3"],
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
      freelancerCount: 520,
      avgRating: 4.8
    },
    {
      id: "qa",
      name: "Quality Assurance & Testing",
      icon: CheckCircle,
      description: "QA engineers ensuring software quality through comprehensive testing",
      color: "from-teal-500 to-teal-600",
      bgColor: "from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900",
      skills: ["Test Automation", "Selenium", "Cypress", "QA", "Performance Testing", "API Testing"],
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
      freelancerCount: 310,
      avgRating: 4.7
    }
  ];

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full">
      <PageHero
        title="Explore Talent Categories"
        description="Find skilled African professionals across every specialty. From developers and designers to data scientists and marketers—discover the perfect talent for your project."
        badge={{ icon: Layers, text: "All Categories" }}
        breadcrumbs={breadcrumbs}
        imageSrc="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80"
        imageAlt="Professional collaboration"
        actions={
          <>
            <CTAButton href="/signup" variant="primary" className="gap-2">
              Start Hiring
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
            <CTAButton href="/hire-talent" variant="secondary" className="gap-2">
              Learn More
              <ArrowRight className="h-4 w-4" />
            </CTAButton>
          </>
        }
      />

      {/* Search and Filter Bar */}
      <section className="py-6 sm:py-8 border-b border-border/30 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search skills, categories, or roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-background border border-border/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              />
            </div>
            <Button variant="outline" className="px-6 py-3 border-primary/30 hover:bg-primary/5">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === null ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* TALENT CATEGORIES GRID */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-background via-primary/5 to-background relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {(selectedCategory ? filteredCategories.filter(cat => cat.id === selectedCategory) : filteredCategories).map((category, index) => (
              <SectionTransition key={category.id} variant="slide" direction="up" delay={300 + index * 100}>
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl scale-110" />

                  <div className="relative bg-background/80 backdrop-blur-xl border border-border/30 rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-primary/15 transition-all duration-500 hover:scale-105 overflow-hidden">
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.bgColor} opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />

                    <div className="relative p-8">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${category.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <category.icon className="h-8 w-8 text-white" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl lg:text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
                            {category.name}
                          </h3>
                          <p className="text-muted-foreground leading-relaxed mt-2">
                            {category.description}
                          </p>
                        </div>

                        {/* Skills */}
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {category.skills.slice(0, 4).map((skill, idx) => (
                              <span key={idx} className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                {skill}
                              </span>
                            ))}
                            {category.skills.length > 4 && (
                              <span className="px-3 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full">
                                +{category.skills.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between pt-4 border-t border-border/30">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{category.freelancerCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{category.avgRating}</span>
                            </div>
                          </div>
                          <CTAButton
                            href={`/hire-talent?category=${category.id}`}
                            variant="primary"
                            size="sm"
                            className="gap-2"
                          >
                            Explore
                            <ArrowRight className="h-3 w-3" />
                          </CTAButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionTransition>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-y border-border/30 relative overflow-hidden">
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "2s" }} />
          <div className="absolute bottom-1/3 right-1/3 w-20 h-20 bg-secondary/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "3s" }} />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center space-y-12">
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 px-8 py-4 text-sm font-bold text-primary border border-primary/20 shadow-2xl">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary">
                  <Search className="h-4 w-4 text-white" />
                </div>
                Find Your Perfect Match
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>

              <div className="space-y-6">
                <h2 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-black text-foreground leading-[0.9] tracking-tight">
                  Ready to <span className="bg-gradient-to-r from-primary via-primary/90 to-secondary bg-clip-text text-transparent">Hire Top Talent</span>?
                </h2>
                <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                  Browse through our extensive talent pool or let us match you with the perfect professional for your project needs.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-8 justify-center pt-12">
                <SectionTransition variant="slide" direction="left" delay={600}>
                  <CTAButton href="/hire-talent" variant="primary" className="gap-3">
                    <Briefcase className="h-6 w-6" />
                    Browse All Talent
                    <ArrowRight className="h-6 w-6" />
                  </CTAButton>
                </SectionTransition>
                <SectionTransition variant="slide" direction="right" delay={700}>
                  <CTAButton href="/hire-team" variant="secondary" className="gap-3">
                    <Users className="h-6 w-6" />
                    Hire a Full Team
                    <ArrowRight className="h-6 w-6" />
                  </CTAButton>
                </SectionTransition>
              </div>

              <SectionTransition variant="fade" delay={800}>
                <div className="bg-background/80 backdrop-blur-xl rounded-3xl p-8 border border-border/30 shadow-xl max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-primary">5,000+</div>
                      <div className="text-sm text-muted-foreground">Verified freelancers</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-secondary">50+</div>
                      <div className="text-sm text-muted-foreground">Skill categories</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-green-600">4.8★</div>
                      <div className="text-sm text-muted-foreground">Average rating</div>
                    </div>
                  </div>
                </div>
              </SectionTransition>
            </div>
          </SectionTransition>
        </div>
      </section>
    </div>
  );
}