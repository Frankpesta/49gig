"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/marketing/page-header";
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
  DollarSign,
  Clock,
  MapPin,
  Award,
  ArrowRight,
  Sparkles,
  Lightbulb,
  TrendingUp,
  BarChart3,
  MessageCircle,
  ThumbsUp,
  Crown,
  Layers,
  Shield,
  Brain,
  Workflow,
  Code,
  Palette,
  Database,
  Cloud,
  Cpu,
  UserCheck,
  FileText,
  Settings,
  Globe,
  Heart
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
      avgRating: 4.8,
      startingPrice: 45
    },
    {
      id: "design",
      name: "UI/UX & Product Design",
      icon: Palette,
      description: "Creative designers crafting intuitive user experiences and stunning visuals",
      color: "from-purple-500 to-purple-600",
      bgColor: "from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900",
      skills: ["UI Design", "UX Research", "Prototyping", "Figma", "Adobe XD", "Brand Design"],
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
      freelancerCount: 890,
      avgRating: 4.7,
      startingPrice: 35
    },
    {
      id: "data",
      name: "Data & Analytics",
      icon: Database,
      description: "Data scientists and analysts turning data into actionable business insights",
      color: "from-green-500 to-green-600",
      bgColor: "from-green-50 to-green-100 dark:from-green-950 dark:to-green-900",
      skills: ["Python", "SQL", "Tableau", "Power BI", "Machine Learning", "Statistics"],
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
      freelancerCount: 650,
      avgRating: 4.9,
      startingPrice: 50
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
      avgRating: 4.8,
      startingPrice: 55
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
      avgRating: 4.9,
      startingPrice: 60
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
      avgRating: 4.8,
      startingPrice: 65
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
      avgRating: 4.7,
      startingPrice: 40
    }
  ];

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const featuredFreelancers = [
    {
      name: "Sarah Johnson",
      role: "Senior React Developer",
      category: "development",
      rating: 4.9,
      completedProjects: 127,
      hourlyRate: 65,
      location: "Nigeria",
      skills: ["React", "TypeScript", "Node.js"],
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&q=80",
      verified: true,
      available: true
    },
    {
      name: "David Kiprop",
      role: "UX/UI Designer",
      category: "design",
      rating: 4.8,
      completedProjects: 89,
      hourlyRate: 45,
      location: "Kenya",
      skills: ["Figma", "User Research", "Prototyping"],
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
      verified: true,
      available: true
    },
    {
      name: "Amara Okafor",
      role: "Data Scientist",
      category: "data",
      rating: 5.0,
      completedProjects: 156,
      hourlyRate: 70,
      location: "South Africa",
      skills: ["Python", "ML", "SQL"],
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
      verified: true,
      available: false
    }
  ];

  return (
    <div className="w-full">
      <PageHeader
        title="Explore Talent Categories"
        description="Find skilled African professionals across every specialty. From developers and designers to data scientists and marketers—discover the perfect talent for your project."
        badge={{
          icon: Layers,
          text: "All Categories"
        }}
        breadcrumbs={breadcrumbs}
      >
        <div className="space-y-8">
          {/* Search and Filter Bar */}
          <div className="bg-background/80 backdrop-blur-xl rounded-3xl p-6 border border-border/30 shadow-xl">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search skills, categories, or roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-background/50 border border-border/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
                />
              </div>
              <Button variant="outline" className="px-6 py-3 border-primary/30 hover:bg-primary/5">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === null
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedCategory === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-black text-primary">5,000+</div>
              <div className="text-sm text-muted-foreground">Verified Freelancers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-black text-secondary">50+</div>
              <div className="text-sm text-muted-foreground">Specialties</div>
            </div>
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-black text-green-600">4.8★</div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-black text-purple-600">120+</div>
              <div className="text-sm text-muted-foreground">Countries</div>
            </div>
          </div>
        </div>
      </PageHeader>

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
                        <div className="text-right">
                          <div className="text-2xl font-black text-foreground">${category.startingPrice}+</div>
                          <div className="text-sm text-muted-foreground">starting rate</div>
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

      {/* FEATURED FREELANCERS */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-muted/20 via-background to-muted/20 border-y border-border/30 relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-secondary/10 to-primary/10 px-6 py-3 text-sm font-bold text-secondary mb-6 border border-secondary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-secondary/20 to-primary/20">
                  <Crown className="h-3.5 w-3.5 text-secondary" />
                </div>
                Featured Talent
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                Top-Rated <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">African Professionals</span>
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                Meet some of our highest-rated freelancers across different categories, ready to take your project to the next level.
              </p>
            </div>
          </SectionTransition>

          {/* Featured Freelancers */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuredFreelancers.map((freelancer, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <div className="group relative">
                  <div className="relative bg-background/80 backdrop-blur-xl border border-border/30 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:shadow-primary/15 transition-all duration-500 hover:scale-105 overflow-hidden">
                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative">
                      {/* Profile Header */}
                      <div className="flex items-start gap-4 mb-6">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden">
                            <Image
                              src={freelancer.image}
                              alt={freelancer.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          {freelancer.verified && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-foreground truncate">{freelancer.name}</h3>
                          <p className="text-primary font-medium text-sm">{freelancer.role}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{freelancer.rating}</span>
                            <span className="text-sm text-muted-foreground">({freelancer.completedProjects} projects)</span>
                          </div>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="mb-6">
                        <div className="flex flex-wrap gap-2">
                          {freelancer.skills.map((skill, idx) => (
                            <span key={idx} className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-border/30">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{freelancer.location}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-lg font-bold text-foreground">${freelancer.hourlyRate}/hr</div>
                          </div>
                          {freelancer.available ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              <span className="text-xs font-medium">Available</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs">Busy</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="mt-6">
                        <CTAButton href="/hire-talent" variant="primary" size="sm" className="w-full justify-center gap-2">
                          View Profile
                          <ArrowRight className="h-3 w-3" />
                        </CTAButton>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionTransition>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE 49GIG TALENT */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-background via-muted/10 to-background relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-20 lg:mb-24">
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-3 text-sm font-bold text-primary mb-6 border border-primary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-primary/20 to-secondary/20">
                  <Lightbulb className="h-3.5 w-3.5 text-primary" />
                </div>
                Why 49GIG Talent
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-foreground mb-8 leading-tight">
                Quality That <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Delivers Results</span>
              </h2>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                Every freelancer on our platform goes through rigorous vetting to ensure they meet the highest standards of quality and professionalism.
              </p>
            </div>
          </SectionTransition>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Award,
                title: "Rigorous Vetting",
                description: "Every freelancer undergoes comprehensive testing and background verification before joining our platform."
              },
              {
                icon: Star,
                title: "Proven Track Record",
                description: "Our freelancers have successfully completed thousands of projects with consistently high ratings."
              },
              {
                icon: Globe,
                title: "Global Standards",
                description: "African talent trained to meet international standards and best practices across all industries."
              },
              {
                icon: Heart,
                title: "Client-Focused",
                description: "Our freelancers are committed to delivering exceptional results that exceed client expectations."
              }
            ].map((reason, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 100}>
                <div className="group relative h-full">
                  <div className="relative h-full bg-background/80 backdrop-blur-xl border border-border/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-primary/15 transition-all duration-500 hover:scale-105 group-hover:border-primary/30 overflow-hidden">
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative space-y-6">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-500 shadow-lg group-hover:shadow-primary/20 group-hover:scale-110">
                        <reason.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-xl lg:text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
                          {reason.title}
                        </h3>
                        <p className="text-base text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors duration-300">
                          {reason.description}
                        </p>
                      </div>

                      {/* Progress Bar Animation */}
                      <div className="space-y-2">
                        <div className="h-1 w-full bg-border/30 rounded-full overflow-hidden">
                          <div className="h-full w-0 bg-gradient-to-r from-primary to-secondary rounded-full group-hover:w-full transition-all duration-700 ease-out" />
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