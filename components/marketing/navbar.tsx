"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { useAuth } from "@/hooks/use-auth";

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
  { label: "How It Works", href: "/how-it-works" },
  { label: "For Clients", href: "/for-clients" },
  { label: "For Freelancers", href: "/for-freelancers" },
  {
    label: "Resources",
    href: "/use-cases",
    children: [
      { label: "Use Cases", href: "/use-cases" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  { label: "About", href: "/about" },
];

const filteredNavLinks = navLinks;

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { resolvedTheme } = useTheme();

  const isHome = pathname === "/";
  const isOverHero = isHome && !isScrolled;
  const logoSrc = resolvedTheme === "dark" ? "/logo-dark.png" : "/logo-light.png";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      const t = setTimeout(() => {
        setIsMobileMenuOpen(false);
        setOpenDropdown(null);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => setIsMobileMenuOpen((o) => !o);

  const linkBase =
    "relative inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap";
  const linkDefault = isOverHero
    ? "text-white/90 hover:text-white hover:bg-white/10"
    : "text-muted-foreground hover:text-foreground hover:bg-muted/80";
  const linkActive = isOverHero
    ? "text-white font-semibold hover:text-white after:absolute after:inset-x-1.5 after:bottom-0.5 after:h-0.5 after:rounded-full after:bg-white after:content-['']"
    : "text-primary font-semibold hover:text-primary after:absolute after:inset-x-1.5 after:bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:content-['']";

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isOverHero
          ? "bg-transparent"
          : "bg-background/95 dark:bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-6 lg:px-8">
        <div className="flex h-14 md:h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="flex shrink-0 items-center"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Image
              key={logoSrc}
              src={logoSrc}
              alt="49GIG"
              width={100}
              height={100}
              className={cn(
                "h-auto w-auto md:h-auto object-contain object-left transition-opacity hover:opacity-90",
                isOverHero && "brightness-0 invert"
              )}
              priority
            />
          </Link>

          <nav className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center lg:gap-0.5 xl:gap-1">
            {filteredNavLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                link.children?.some((c) => c.href === pathname);
              return (
                <div
                  key={link.href}
                  className="group relative"
                  onMouseEnter={() =>
                    link.children && setOpenDropdown(link.label)
                  }
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      linkBase,
                      isActive ? linkActive : linkDefault
                    )}
                  >
                    {link.label}
                    {link.children && (
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                          openDropdown === link.label && "rotate-180"
                        )}
                      />
                    )}
                  </Link>
                  {link.children && openDropdown === link.label && (
                    <div className="absolute left-0 top-full pt-1">
                      <div className="min-w-[200px] rounded-lg border border-border bg-background py-1 shadow-lg">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "block px-4 py-2.5 text-sm transition-colors",
                              pathname === child.href
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="hidden lg:flex lg:items-center lg:gap-2 shrink-0">
            <ThemeToggle />
            {isAuthenticated ? (
              <Button size="sm" asChild className="rounded-md text-sm font-medium">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className={cn(
                    "rounded-md text-sm font-medium",
                    isOverHero && "text-white/90 hover:bg-white/10 hover:text-white border-0"
                  )}
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className={cn(
                    "rounded-md text-sm font-medium",
                    isOverHero && "border-white/80 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  )}
                >
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          <button
            onClick={toggleMobileMenu}
            className={cn(
              "lg:hidden p-2 -mr-2 rounded-md transition-colors touch-manipulation",
              isOverHero ? "text-white hover:bg-white/10" : "text-foreground hover:bg-muted"
            )}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border/50 bg-background">
            <div className="max-h-[calc(100vh-4rem)] overflow-y-auto py-4 space-y-0.5">
              {filteredNavLinks.map((link) => (
                <div key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => !link.children && setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg mx-2 transition-colors",
                      pathname === link.href
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <span>{link.label}</span>
                    {link.children && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === link.label ? null : link.label);
                        }}
                        className="p-1 -mr-2 rounded touch-manipulation"
                        aria-label={openDropdown === link.label ? "Collapse" : "Expand"}
                      >
                        <ChevronDown
                          className={cn("h-4 w-4 transition-transform", openDropdown === link.label && "rotate-180")}
                        />
                      </button>
                    )}
                  </Link>
                  {link.children && openDropdown === link.label && (
                    <div className="ml-4 mt-0.5 mb-1 space-y-0.5">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "block px-4 py-2.5 text-sm rounded-lg mx-2 transition-colors",
                            pathname === child.href
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-border px-4 space-y-2">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
                {isAuthenticated ? (
                  <Button className="w-full rounded-md" size="sm" asChild>
                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" className="w-full rounded-md" size="sm" asChild>
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        Sign In
                      </Link>
                    </Button>
                    <Button className="w-full rounded-md" size="sm" asChild>
                      <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
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
