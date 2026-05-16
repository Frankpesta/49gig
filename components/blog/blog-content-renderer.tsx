"use client";

import { useMemo } from "react";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { cn } from "@/lib/utils";
import { parseTipTapDocJson } from "@/components/blog/blog-editor";

const extensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3, 4, 5, 6] },
  }),
  TextStyle,
  Color,
  Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full h-auto my-4" } }),
  Link.configure({
    HTMLAttributes: {
      class: "text-primary underline underline-offset-2 hover:opacity-80",
      target: "_blank",
      rel: "noopener noreferrer",
    },
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
      const doc = parseTipTapDocJson(
        typeof contentJson === "string" ? contentJson : JSON.stringify(contentJson),
      );
      return generateHTML(doc, extensions);
    } catch {
      return "<p>Invalid content.</p>";
    }
  }, [contentJson]);

  return (
    <div
      className={cn(
        "max-w-none [&_p]:mt-0 [&_p]:mb-4 [&_p]:leading-relaxed",
        "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4",
        "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3",
        "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2",
        "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6",
        "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6",
        "[&_li]:my-1.5",
        "[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-muted-foreground/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
        "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4",
        "[&_strong]:font-semibold",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
