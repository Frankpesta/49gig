"use client";

import { ReactNode } from "react";
import { PageHero } from "@/components/marketing/page-hero";
import { LucideIcon, FileText } from "lucide-react";

interface LegalLayoutProps {
  title: string;
  description: string;
  badge?: { icon: LucideIcon; text: string };
  children: ReactNode;
}

export function LegalLayout({ title, description, badge, children }: LegalLayoutProps) {
  const breadcrumbs = [{ label: "Legal", href: "/legal/terms" }, { label: title.split(" ")[0], icon: FileText }];

  return (
    <div className="w-full">
      <PageHero
        title={title}
        description={description}
        badge={badge ?? { icon: FileText, text: "Legal" }}
        breadcrumbs={breadcrumbs}
        imageSrc="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80"
        imageAlt="Legal documents"
      />
      <article className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-slate dark:prose-invert prose-lg max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
            {children}
          </div>
        </div>
      </article>
    </div>
  );
}
