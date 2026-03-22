"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthTwoColumnLayout } from "@/components/auth/auth-two-column-layout";

export default function SignupPage() {
  const router = useRouter();

  const handleRoleSelect = (role: "client" | "freelancer") => {
    router.push(`/signup/${role}`);
  };

  return (
    <AuthTwoColumnLayout
      leftTitle="Get Started With Us"
      leftDescription="Complete these easy steps to register your account."
      steps={[
        { label: "Choose your role", active: true },
        { label: "Create your account", active: false },
        { label: "Set up your profile", active: false },
      ]}
      badge="Get started"
      heading="Create your account"
      subline="Complete these steps to register your account."
    >
      <div className="w-full space-y-5">
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleRoleSelect("client")}
            className="w-full group rounded-xl border border-border/60 bg-muted/20 p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <span className="font-medium text-foreground">Client</span>
                <p className="text-xs text-muted-foreground mt-0.5">Post projects and hire vetted freelancers</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect("freelancer")}
            className="w-full group rounded-xl border border-border/60 bg-muted/20 p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m0 10v-4l8 4" />
                </svg>
              </div>
              <div>
                <span className="font-medium text-foreground">Freelancer</span>
                <p className="text-xs text-muted-foreground mt-0.5">Find opportunities and earn from global clients</p>
              </div>
            </div>
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </AuthTwoColumnLayout>
  );
}
