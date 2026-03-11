"use client";

import { useMemo } from "react";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { cn } from "@/lib/utils";

const extensions = [
  StarterKit,
  Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full h-auto my-4" } }),
  Link.configure({
    HTMLAttributes: { class: "text-primary underline hover:no-underline" },
    openOnClick: false,
  }),
];

export function BlogContentRenderer({
  contentJson,
  className,
}: {
  contentJson: string;
  className?: string;
}) {
  const html = useMemo(() => {
    try {
      const doc = typeof contentJson === "string" ? JSON.parse(contentJson) : contentJson;
      return generateHTML(doc, extensions);
    } catch {
      return "<p>Invalid content.</p>";
    }
  }, [contentJson]);

  return (
    <div
      className={cn(
        "prose prose-neutral dark:prose-invert max-w-none prose-headings:font-semibold prose-img:rounded-xl",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
