"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ChevronDown, Linkedin, Twitter, Youtube } from "lucide-react";

const footerSections = [
  {
    key: "why",
    title: "Why 49GIG?",
    links: [
      { label: "Why 49GIG?", href: "/why-49gig" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "For Clients", href: "/for-clients" },
      { label: "For Freelancers", href: "/for-freelancers" },
      { label: "Talent Categories", href: "/talent-categories" },
    ],
  },
  {
    key: "solutions",
    title: "Solutions",
    links: [
      { label: "Hire Talent", href: "/signup/client" },
      { label: "Hire a Team", href: "/hire-team" },
      { label: "Use Cases", href: "/use-cases" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    key: "resources",
    title: "Resources",
    links: [
      { label: "Help Center", href: "/contact" },
      { label: "Contact Us", href: "/contact" },
      { label: "About 49GIG", href: "/about" },
    ],
  },
  {
    key: "legal",
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/legal/privacy-policy" },
      { label: "Terms & Conditions", href: "/legal/terms" },
      { label: "Cookie Policy", href: "/legal/cookie-policy" },
      { label: "Code of Conduct", href: "/legal/code-of-conduct" },
      { label: "Refund Policy", href: "/legal/refund-policy" },
    ],
  },
];

const socialLinks = [
  { label: "LinkedIn", href: "https://linkedin.com/company/49gig", icon: Linkedin },
  { label: "Twitter", href: "https://twitter.com/49gig", icon: Twitter },
  { label: "YouTube", href: "https://youtube.com/@49gig", icon: Youtube },
];

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [openSection, setOpenSection] = useState<string | null>("why");

  return (
    <footer className="bg-[#07122B] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Top CTA block */}
        <div className="rounded-2xl border border-white/15 bg-white/5 px-5 py-8 sm:px-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
              Get Started
            </p>
            <h2 className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-3xl lg:text-4xl">
              Build your team with vetted global talent
            </h2>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <Link
              href="/signup/client"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#07122B] transition hover:bg-white/90"
            >
              Hire Talent
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Talk to Sales
            </Link>
          </div>
        </div>

        {/* Desktop link columns */}
        <div className="mt-12 hidden lg:grid lg:grid-cols-5 lg:gap-8">
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block" aria-label="49GIG Home">
              <Image
                src="/logo-dark.png"
                alt="49GIG"
                width={120}
                height={48}
                className="h-auto w-auto object-contain object-left"
              />
            </Link>
          </div>
          {footerSections.map((section) => (
            <div key={section.key}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-white/80">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={`${section.key}-${link.label}-${link.href}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mobile accordion */}
        <div className="mt-10 lg:hidden">
          <Link href="/" className="inline-block" aria-label="49GIG Home">
            <Image
              src="/logo-dark.png"
              alt="49GIG"
              width={120}
              height={48}
              className="h-auto w-auto object-contain object-left"
            />
          </Link>

          <div className="mt-6 divide-y divide-white/10 rounded-xl border border-white/10 bg-white/5">
            {footerSections.map((section) => {
              const isOpen = openSection === section.key;
              return (
                <div key={section.key}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-4 text-left"
                    onClick={() => setOpenSection(isOpen ? null : section.key)}
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-semibold uppercase tracking-[0.08em] text-white/80">
                      {section.title}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-white/70 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <ul className="space-y-3 px-4 pb-4">
                      {section.links.map((link) => (
                        <li key={`${section.key}-${link.label}-${link.href}`}>
                          <Link
                            href={link.href}
                            className="text-sm text-white/75 transition hover:text-white"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/60">
            © {currentYear} 49GIG. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/65 transition hover:text-white"
                  aria-label={social.label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/60">
            <Link href="/legal/privacy-policy" className="transition hover:text-white">
              Privacy
            </Link>
            <Link href="/legal/terms" className="transition hover:text-white">
              Terms
            </Link>
            <Link href="/legal/cookie-policy" className="transition hover:text-white">
              Cookies
            </Link>
            <Link href="/contact" className="transition hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

