"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHero } from "@/components/marketing/page-hero";
import { SectionTransition } from "@/components/ui/section-transition";
import {
  Mail,
  MessageSquare,
  Phone,
  Send,
  CheckCircle2,
  Clock,
  HelpCircle,
  Briefcase,
  Users,
  ArrowRight,
  Sparkles,
  Shield,
  DollarSign,
  FileCheck,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const submitEnquiry = useAction(api.contactEnquiries.actions.submitContactEnquiry);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitEnquiry({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        category: formData.category,
        message: formData.message.trim(),
      });
      setIsSubmitted(true);
      setFormData({ name: "", email: "", subject: "", category: "", message: "" });
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (error) {
      console.error("Failed to submit:", error);
      setIsSubmitted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Us",
      description: "Send us an email and we'll respond within 24 hours",
      contact: "support@49gig.com",
      href: "mailto:support@49gig.com",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Phone,
      title: "Call Us",
      description: "Speak with our team during business hours",
      contact: "+234 (0) 123 456 7890",
      href: "tel:+2340123456789",
      color: "from-green-500 to-green-600"
    },
  ];

  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const faqs = [
    {
      icon: Briefcase,
      question: "How do I hire talent on 49GIG?",
      answer: "Sign up as a client, create a project with our intake form (skills, budget, timeline), and we'll match you with vetted African professionals. No job postings or bidding—we handle the matching. Most clients are matched within 48 hours.",
    },
    {
      icon: Users,
      question: "How do I join as a freelancer?",
      answer: "Sign up and complete your profile with skills, experience, and portfolio. You'll go through our automated vetting process: English proficiency test, skills assessment (MCQ or coding), and portfolio review. Only top-scoring applicants are approved. Once approved, projects are matched to you—no bidding required.",
    },
    {
      icon: Shield,
      question: "How does the vetting process work?",
      answer: "Freelancers complete an English test, skills assessment (multiple-choice or coding challenges based on role), and portfolio evaluation. Scores are weighted and only applicants meeting our quality bar are approved. This ensures clients work with verified, capable professionals.",
    },
    {
      icon: DollarSign,
      question: "How do payments work?",
      answer: "Clients fund projects upfront into escrow. Payments are released to freelancers only after you approve milestone deliverables. Funds are held securely until work is confirmed. Freelancers receive payouts via bank transfer or other supported methods. A platform service fee applies to facilitate vetting, contracts, and support.",
    },
    {
      icon: FileCheck,
      question: "What happens after I'm matched with a freelancer?",
      answer: "A digital contract is generated for both parties to sign. Once signed, work begins. You track progress through milestones, approve deliverables, and payments release automatically upon approval. Our platform includes chat for communication and dispute resolution support if needed.",
    },
    {
      icon: Zap,
      question: "Can I hire a team instead of one person?",
      answer: "Yes. Choose 'Hire a Team' when creating your project. We assemble pre-vetted teams (e.g. full-stack dev, product design, data analytics) based on your requirements. You get a single point of contact and a cohesive team ready to start within days.",
    },
    {
      icon: Clock,
      question: "What are your response times?",
      answer: "We typically respond to contact enquiries within 24 hours during business days (Mon–Fri, 9am–6pm WAT). For logged-in users, use the Help & Support section in your dashboard to create a support chat for faster assistance.",
    },
    {
      icon: HelpCircle,
      question: "Do you offer support during projects?",
      answer: "Yes. We provide full support for both clients and freelancers: milestone guidance, dispute mediation, payment questions, and technical help. Logged-in users can open a support chat from the dashboard. We're committed to ensuring smooth project delivery.",
    },
  ];

  const breadcrumbs = [{ label: "Contact", icon: MessageSquare }];

  return (
    <div className="w-full">
      <PageHero
        title="Let's Connect"
        description="Have questions about hiring talent, joining as a freelancer, or anything else? We're here to help. Reach out to our team and we'll get back to you promptly."
        badge={{ icon: MessageSquare, text: "Contact Us" }}
        breadcrumbs={breadcrumbs}
        imageSrc="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=800&q=80"
        imageAlt="Team communication"
        actions={
          <>
            <Button asChild variant="default" size="lg" className="gap-2">
              <a href="mailto:support@49gig.com">
                <Mail className="h-5 w-5" />
                Email Us
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <a href="#contact-form">
                Send Message
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </>
        }
      />

      {/* CONTACT SECTION */}
      <section className="py-20 sm:py-24 lg:py-32 bg-background relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* CONTACT FORM */}
            <SectionTransition variant="slide" direction="left" delay={200}>
              <div id="contact-form">
                <div className="mb-8">
                  <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                    Send us a message
                  </h2>
                  <p className="text-base text-muted-foreground">
                    Fill out the form and our team will respond within 24 hours.
                  </p>
                </div>

                {isSubmitted ? (
                  <Card className="border-2 border-green-500/50 bg-green-500/5">
                    <CardContent className="p-8 text-center space-y-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mx-auto">
                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">
                        Message sent successfully!
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Thank you for contacting us. We'll get back to you within 24 hours.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border border-border/50 shadow-lg">
                    <CardContent className="p-8">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-semibold">Full Name *</Label>
                            <Input
                              id="name"
                              name="name"
                              type="text"
                              placeholder="John Doe"
                              value={formData.name}
                              onChange={handleChange}
                              required
                              className="h-11 rounded-lg"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-semibold">Email Address *</Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              placeholder="john@example.com"
                              value={formData.email}
                              onChange={handleChange}
                              required
                              className="h-11 rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="category" className="text-sm font-semibold">Inquiry Category *</Label>
                          <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select a category</option>
                            <option value="hiring">Hiring Talent</option>
                            <option value="freelancer">Becoming a Freelancer</option>
                            <option value="support">Technical Support</option>
                            <option value="billing">Billing & Payments</option>
                            <option value="partnership">Partnership Opportunities</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="subject" className="text-sm font-semibold">Subject *</Label>
                          <Input
                            id="subject"
                            name="subject"
                            type="text"
                            placeholder="Brief description of your inquiry"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                            className="h-11 rounded-lg"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message" className="text-sm font-semibold">Message *</Label>
                          <Textarea
                            id="message"
                            name="message"
                            placeholder="Tell us more about your inquiry..."
                            value={formData.message}
                            onChange={handleChange}
                            required
                            rows={5}
                            className="resize-none rounded-lg"
                          />
                        </div>

                        <Button
                          type="submit"
                          size="lg"
                          className="w-full h-12 rounded-lg gap-2"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <span className="animate-spin">⏳</span>
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </div>
            </SectionTransition>

            {/* CONTACT INFO & METHODS */}
            <SectionTransition variant="slide" direction="right" delay={300}>
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                    Other ways to reach us
                  </h2>
                  <p className="text-base text-muted-foreground">
                    Choose the contact method that works best for you
                  </p>
                </div>

                <div className="space-y-4">
                  {contactMethods.map((method, index) => (
                    <SectionTransition key={index} variant="slide" direction="up" delay={400 + index * 100}>
                      <a
                        href={method.href}
                        className="group"
                      >
                        <Card className="border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${method.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                <method.icon className="h-6 w-6 text-white" />
                              </div>
                              <div className="space-y-1 flex-1">
                                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                                  {method.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {method.description}
                                </p>
                                <p className="text-sm font-medium text-primary">
                                  {method.contact}
                                </p>
                              </div>
                              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 mt-1" />
                            </div>
                          </CardContent>
                        </Card>
                      </a>
                    </SectionTransition>
                  ))}
                </div>

                {/* Business Hours */}
                <SectionTransition variant="slide" direction="up" delay={700}>
                  <Card className="border-2 border-primary/30 bg-primary/5">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <Clock className="h-6 w-6 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">
                          Business Hours
                        </h3>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p><span className="font-medium text-foreground">Monday - Friday:</span> 9:00 AM - 6:00 PM (WAT)</p>
                        <p><span className="font-medium text-foreground">Saturday:</span> 10:00 AM - 2:00 PM (WAT)</p>
                        <p><span className="font-medium text-foreground">Sunday:</span> Closed</p>
                      </div>
                    </CardContent>
                  </Card>
                </SectionTransition>
              </div>
            </SectionTransition>
          </div>
        </div>
      </section>

      {/* QUICK ANSWERS / FAQs */}
      <section className="py-20 sm:py-24 lg:py-32 bg-muted/30 border-t border-border/30 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTransition variant="fade" delay={200}>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-3 text-sm font-bold text-primary mb-6 border border-primary/20 shadow-lg">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-primary/20 to-secondary/20">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                Quick Answers
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Find answers to the most common questions
              </p>
            </div>
          </SectionTransition>

          <div className="max-w-3xl mx-auto space-y-2">
            {faqs.map((faq, index) => (
              <SectionTransition key={index} variant="slide" direction="up" delay={300 + index * 50}>
                <div
                  className="rounded-xl border border-border/50 bg-card overflow-hidden transition-all hover:border-primary/50"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-center gap-4 p-4 sm:p-5 text-left"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <faq.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="flex-1 text-base font-semibold text-foreground">
                      {faq.question}
                    </h3>
                    {expandedFaq === index ? (
                      <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
                      <p className="text-sm text-muted-foreground leading-relaxed pl-14">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              </SectionTransition>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
