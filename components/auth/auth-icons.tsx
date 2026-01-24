"use client";

import {
  CheckCircle2,
  Shield,
  Zap,
  Users,
  DollarSign,
  Briefcase,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import type { AuthFeature } from "./auth-two-column-layout";

const iconClass = "h-5 w-5";

export const loginFeatures: AuthFeature[] = [
  {
    icon: <CheckCircle2 className={iconClass} />,
    title: "Vetted Talent Pool",
    description: "All freelancers undergo comprehensive verification.",
  },
  {
    icon: <Shield className={iconClass} />,
    title: "Secure Payments",
    description: "Escrowed payments with milestone-based releases.",
  },
  {
    icon: <Zap className={iconClass} />,
    title: "Smart Matching",
    description: "Algorithmic matching for perfect project-fit.",
  },
];

export const signupFeatures: AuthFeature[] = [
  {
    icon: <Shield className={iconClass} />,
    title: "Comprehensive Verification",
    description: "Freelancers undergo identity, skills, and English checks.",
  },
  {
    icon: <Users className={iconClass} />,
    title: "Curated Marketplace",
    description: "No bidding wars. Smart algorithmic matching.",
  },
  {
    icon: <DollarSign className={iconClass} />,
    title: "Protected Payments",
    description: "Pre-funded projects with escrowed milestone payments.",
  },
];

export const clientSignupFeatures: AuthFeature[] = [
  {
    icon: <Users className={iconClass} />,
    title: "Verified Freelancers",
    description: "Connect with talent that’s been vetted for quality.",
  },
  {
    icon: <Briefcase className={iconClass} />,
    title: "Build Your Team",
    description: "Scale projects with trusted professionals on 49GIG.",
  },
];

export const freelancerSignupFeatures: AuthFeature[] = [
  {
    icon: <DollarSign className={iconClass} />,
    title: "Competitive Earnings",
    description: "Secure payments and fair rates for your work.",
  },
  {
    icon: <Briefcase className={iconClass} />,
    title: "Quality Projects",
    description: "Access vetted clients and well-scoped projects.",
  },
];

export const resumeUploadFeatures: AuthFeature[] = [
  {
    icon: <CheckCircle2 className={iconClass} />,
    title: "PDF only, max 10MB",
    description: "Upload a single PDF resume for parsing.",
  },
  {
    icon: <Sparkles className={iconClass} />,
    title: "Bio generated automatically",
    description: "We extract key info and build your profile.",
  },
  {
    icon: <ShieldCheck className={iconClass} />,
    title: "Secure and private",
    description: "Stored securely and used only for your profile.",
  },
];
