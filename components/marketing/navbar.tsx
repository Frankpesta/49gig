"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Menu, ChevronDown, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavLink {
  label: string;
  href: string;
  children?: NavLink[];
}

const navLinks: NavLink[] = [
  { label: "Why 49GIG?", href: "/why-49gig" },
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(
    null
  );
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { resolvedTheme } = useTheme();

  const logoSrc = resolvedTheme === "dark" ? "/logo-dark.png" : "/logo-light.png";

  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      const t = setTimeout(() => {
        setIsMobileMenuOpen(false);
        setOpenDropdown(null);
        setOpenMobileDropdown(null);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [pathname]);

  const linkBase =
    "relative inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap";
  const linkDefault = "text-muted-foreground hover:text-foreground hover:bg-muted/80";
  const linkActive =
    "text-primary font-semibold hover:text-primary after:absolute after:inset-x-1.5 after:bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:content-['']";

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        "bg-background/95 dark:bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm"
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
              className="h-auto w-auto md:h-auto object-contain object-left transition-opacity hover:opacity-90"
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
                  className="rounded-md text-sm font-medium"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="rounded-md text-sm font-medium"
                >
                  <Link href="/signup/client">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          <div className="lg:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className="p-2 -mr-2 rounded-md transition-colors touch-manipulation text-foreground hover:bg-muted"
                  aria-label="Open menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[90vw] max-w-[360px] p-0 border-r border-border/60"
              >
                <SheetHeader className="border-b border-border/50 px-4 py-2.5">
                  <Link
                    href="/"
                    aria-label="49GIG Home"
                    className="inline-flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Image
                      key={logoSrc}
                      src={logoSrc}
                      alt="49GIG"
                      width={108}
                      height={35}
                      className="h-[31px] w-auto object-contain"
                    />
                  </Link>
                </SheetHeader>
                <div className="flex h-full flex-col">
                  <div className="px-3 py-3 space-y-1 overflow-y-auto">
                    {filteredNavLinks.map((link) => {
                      const isActive =
                        pathname === link.href ||
                        link.children?.some((c) => c.href === pathname);
                      const isOpen = openMobileDropdown === link.label;
                      return (
                        <div key={link.href}>
                          <Link
                            href={link.href}
                            onClick={() => {
                              if (!link.children) setIsMobileMenuOpen(false);
                            }}
                            className={cn(
                              "flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                              isActive
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
                                  setOpenMobileDropdown(
                                    isOpen ? null : link.label
                                  );
                                }}
                                className="p-1 -mr-1 rounded-md"
                                aria-label={isOpen ? "Collapse" : "Expand"}
                              >
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 transition-transform",
                                    isOpen && "rotate-180"
                                  )}
                                />
                              </button>
                            )}
                          </Link>
                          {link.children && isOpen && (
                            <div className="ml-3 mt-1 space-y-1 border-l border-border/50 pl-3">
                              {link.children.map((child) => (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className={cn(
                                    "block px-3 py-2 text-sm rounded-lg transition-colors",
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
                      );
                    })}
                  </div>
                  <div className="mt-auto border-t border-border/60 p-4 space-y-3 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Theme</span>
                      <ThemeToggle />
                    </div>
                    {isAuthenticated ? (
                      <Button className="w-full rounded-md" size="sm" asChild>
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
                        <Button
                          variant="outline"
                          className="w-full rounded-md"
                          size="sm"
                          asChild
                        >
                          <Link
                            href="/login"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Sign In
                          </Link>
                        </Button>
                        <Button className="w-full rounded-md" size="sm" asChild>
                          <Link
                            href="/signup/client"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Get Started
                          </Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
