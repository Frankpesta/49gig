"use client";

import Link from "next/link";

export function DashboardFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/50 bg-background/50 px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-center text-xs text-muted-foreground sm:text-left">
          © {currentYear} 49GIG. All rights reserved.
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <Link href="/legal/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link href="/legal/privacy-policy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}
