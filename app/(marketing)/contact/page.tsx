"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/marketing/page-header";
import {
  Mail,
  MessageSquare,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  Clock,
  HelpCircle,
  Briefcase,
  Users,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset form after 5 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: "",
        email: "",
        subject: "",
        category: "",
        message: "",
      });
    }, 5000);
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Us",
      description: "Send us an email and we'll respond within 24 hours",
      contact: "support@49gig.com",
      href: "mailto:support@49gig.com",
    },
    {
      icon: Phone,
      title: "Call Us",
      description: "Speak with our team during business hours",
      contact: "+234 (0) 123 456 7890",
      href: "tel:+2340123456789",
    },
    {
      icon: MapPin,
      title: "Visit Us",
      description: "Come meet us at our office",
      contact: "Lagos, Nigeria",
      href: "#",
    },
  ];

  const faqs = [
    {
      icon: Briefcase,
      question: "How do I hire talent?",
      answer: "Click 'Hire Talent' and complete the project form. We'll match you with vetted professionals.",
    },
    {
      icon: Users,
      question: "How do I join as a freelancer?",
      answer: "Click 'Join as Freelancer' to apply. You'll go through our automated vetting process.",
    },
    {
      icon: Clock,
      question: "What are your response times?",
      answer: "We typically respond to inquiries within 24 hours during business days.",
    },
    {
      icon: HelpCircle,
      question: "Do you offer support?",
      answer: "Yes! We provide full support for both clients and freelancers throughout the project lifecycle.",
    },
  ];

  return (
    <div className="w-full">
      {/* PAGE HEADER */}
      <PageHeader
        badge={{
          icon: MessageSquare,
          text: "Contact Us"
        }}
        title="Get in Touch With 49GIG"
        description="Have questions about hiring talent, joining as a freelancer, or anything else? We're here to help. Reach out to our team and we'll get back to you as soon as possible."
      />

      {/* CONTACT FORM & INFO */}
      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* CONTACT FORM */}
            <div>
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                  Send Us a Message
                </h2>
                <p className="text-base text-muted-foreground">
                  Fill out the form below and our team will get back to you within 24 hours.
                </p>
              </div>

              {isSubmitted ? (
                <Card className="border-2 border-green-500/50 bg-green-500/5">
                  <CardContent className="p-8 text-center space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mx-auto">
                      <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">
                      Message Sent Successfully!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Thank you for contacting us. We'll get back to you within 24 hours.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border border-border/50">
                  <CardContent className="p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Name */}
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="h-11"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="h-11"
                        />
                      </div>

                      {/* Category */}
                      <div className="space-y-2">
                        <Label htmlFor="category">Inquiry Category *</Label>
                        <select
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          required
                          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

                      {/* Subject */}
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          placeholder="Brief description of your inquiry"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          className="h-11"
                        />
                      </div>

                      {/* Message */}
                      <div className="space-y-2">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                          id="message"
                          name="message"
                          placeholder="Tell us more about your inquiry..."
                          value={formData.message}
                          onChange={handleChange}
                          required
                          rows={6}
                          className="resize-none"
                        />
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full h-12"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* CONTACT INFO & METHODS */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                  Other Ways to Reach Us
                </h2>
                <p className="text-base text-muted-foreground">
                  Choose the contact method that works best for you
                </p>
              </div>

              <div className="space-y-4">
                {contactMethods.map((method, index) => (
                  <Card key={index} className="border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                    <CardContent className="p-6">
                      <a
                        href={method.href}
                        className="flex items-start gap-4 group"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-transform duration-300 group-hover:scale-110">
                          <method.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold text-foreground">
                            {method.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {method.description}
                          </p>
                          <p className="text-sm font-medium text-primary">
                            {method.contact}
                          </p>
                        </div>
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Business Hours */}
              <Card className="border-2 border-primary/30 bg-primary/5">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="h-6 w-6 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">
                      Business Hours
                    </h3>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Monday - Friday: 9:00 AM - 6:00 PM (WAT)</p>
                    <p>Saturday: 10:00 AM - 2:00 PM (WAT)</p>
                    <p>Sunday: Closed</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ANSWERS / FAQs */}
      <section className="py-16 sm:py-20 lg:py-24 bg-muted/30 border-t border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Quick Answers
            </h2>
            <p className="text-base text-muted-foreground">
              Find answers to the most common questions
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {faqs.map((faq, index) => (
              <Card key={index} className="border border-border/50">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <faq.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold text-foreground">
                        {faq.question}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

