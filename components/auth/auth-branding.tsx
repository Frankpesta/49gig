"use client";

import { Logo } from "@/components/ui/logo";

export function AuthBranding() {
  return (
    <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-between bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12">
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Logo width={140} height={45} priority />
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        © 2025 49GIG. All rights reserved.
      </div>
    </div>
  );
}

export function AuthMobileLogo() {
  return (
    <div className="lg:hidden flex items-center justify-center pb-8">
      <Logo width={120} height={38} priority />
    </div>
  );
}

