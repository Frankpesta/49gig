"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy URL — verification lives under /onboarding/verification */
export default function LegacyVerificationRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/onboarding/verification");
  }, [router]);
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
