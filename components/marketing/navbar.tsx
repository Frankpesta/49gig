"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { gsap } from "gsap";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/ui/logo";

interface NavLink {
  label: string;
  href: string;
  children?: NavLink[];
}

const navLinks: NavLink[] = [
  { label: "Home", href: "/" },
  {
    label: "Hire Talent",
    href: "/hire-talent",
    children: [
      { label: "Hire a Team", href: "/hire-team" },
      { label: "Talent Categories", href: "/talent-categories" },
    ],
  },
  {
    label: "How It Works",
    href: "/how-it-works",
  },
  {
    label: "For Clients",
    href: "/for-clients",
  },
  {
    label: "For Freelancers",
    href: "/for-freelancers",
  },
  {
    label: "Resources",
    href: "/resources",
    children: [
      { label: "Blog", href: "/blog" },
      { label: "Use Cases", href: "/use-cases" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Animate navbar on mount
    if (typeof window !== "undefined") {
      gsap.from(".navbar-content", {
        y: -20,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
      });
    }
  }, []);

  // Close mobile menu when route changes
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    // Only close menu if pathname actually changed
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      // Use setTimeout to defer state updates and avoid cascading renders
      const timeoutId = setTimeout(() => {
        setIsMobileMenuOpen(false);
        setOpenDropdown(null);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav
      className={cn(
        "navbar fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/80 dark:bg-background/80 backdrop-blur-xl shadow-md border-b border-border/50"
          : "bg-background/60 dark:bg-background/20 backdrop-blur-sm"
      )}
    >
      <div className="navbar-content mx-auto max-w-7xl px-4 sm:px-5 md:px-6 lg:px-8">
        <div className="flex h-16 md:h-20 items-center justify-between gap-4">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center shrink-0 group"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Logo 
              width={400} 
              height={84} 
              className="h-24 md:h-32 w-auto transition-opacity group-hover:opacity-80" 
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex lg:items-center lg:gap-3 xl:gap-4 flex-1 justify-center">
            {navLinks.map((link) => (
              <div
                key={link.href}
                className="relative group"
                onMouseEnter={() => link.children && setOpenDropdown(link.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  href={link.href}
                  className={cn(
                    "relative px-3 xl:px-4 py-2 text-sm font-medium transition-all rounded-md whitespace-nowrap",
                    pathname === link.href
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {link.label}
                    {link.children && (
                      <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180" />
                    )}
                  </span>
                  {pathname === link.href && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </Link>

                {/* Dropdown Menu */}
                {link.children && openDropdown === link.label && (
                  <div className="absolute left-0 top-full mt-2 w-56 rounded-lg border border-border bg-background/95 dark:bg-background/95 backdrop-blur-xl shadow-lg py-1.5 animate-in fade-in-0 zoom-in-95 duration-200">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors rounded-md mx-1"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex lg:items-center lg:gap-3 shrink-0">
            <ThemeToggle />
            {isAuthenticated ? (
              <Button size="sm" asChild className="text-sm">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="text-sm">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild className="text-sm">
                  <Link href="/get-started">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 -mr-2 text-foreground hover:bg-accent rounded-md transition-colors touch-manipulation"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background/95 dark:bg-background/95 backdrop-blur-xl animate-in slide-in-from-top duration-200">
            <div className="px-4 py-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {navLinks.map((link) => (
                <div key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => !link.children && setIsMobileMenuOpen(false)}
                    className={cn(
                      "block px-4 py-3 text-base font-medium rounded-lg transition-all touch-manipulation",
                      pathname === link.href
                        ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/10 active:bg-primary/20"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>{link.label}</span>
                      {link.children && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenDropdown(
                              openDropdown === link.label ? null : link.label
                            );
                          }}
                          className="p-1 -mr-2 touch-manipulation"
                          aria-label={openDropdown === link.label ? "Collapse" : "Expand"}
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              openDropdown === link.label && "rotate-180"
                            )}
                          />
                        </button>
                      )}
                    </div>
                  </Link>
                  {link.children && openDropdown === link.label && (
                    <div className="ml-4 mt-1 mb-1 space-y-1 animate-in slide-in-from-top duration-200">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground rounded-lg transition-colors touch-manipulation active:bg-accent/80"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Mobile CTA Buttons */}
              <div className="pt-4 mt-4 space-y-3 border-t border-border">
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm font-medium text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                {isAuthenticated ? (
                  <Button className="w-full" size="lg" asChild>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" size="lg" asChild>
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        Sign In
                      </Link>
                    </Button>
                    <Button className="w-full" size="lg" asChild>
                      <Link
                        href="/get-started"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Get Started
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
