"use client";

import Link from "next/link";
import { Facebook, Twitter, Linkedin, Instagram, Youtube, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

const footerLinks = {
  platform: {
    title: "Platform",
    links: [
      { label: "How It Works", href: "/how-it-works" },
      { label: "For Clients", href: "/for-clients" },
      { label: "For Freelancers", href: "/for-freelancers" },
      { label: "Pricing", href: "/pricing" },
      { label: "Success Stories", href: "/success-stories" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "About 49GIG", href: "/about" },
      { label: "Why 49GIG", href: "/why-49gig" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Talent Categories", href: "/talent-categories" },
      { label: "Developer Resources", href: "/resources" },
      { label: "API Documentation", href: "/api-docs" },
      { label: "Community", href: "/community" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "GDPR", href: "/gdpr" },
    ],
  },
};

const socialLinks = [
  {
    label: "Facebook",
    href: "https://facebook.com/49gig",
    icon: Facebook,
  },
  {
    label: "Twitter",
    href: "https://twitter.com/49gig",
    icon: Twitter,
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/49gig",
    icon: Linkedin,
  },
  {
    label: "Instagram",
    href: "https://instagram.com/49gig",
    icon: Instagram,
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@49gig",
    icon: Youtube,
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <Logo width={300} height={82} className="h-24 w-auto" priority />
            </Link>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Connecting businesses with vetted, top-tier freelance talent. 
              Your trusted marketplace for quality work.
            </p>
            
            {/* Newsletter Signup */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                Stay updated
              </p>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key} className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <p className="text-sm text-muted-foreground">
              © {currentYear} 49GIG. All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

