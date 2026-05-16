"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Link as LinkIcon,
  ImagePlus,
  Undo,
  Redo,
  Palette,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { BlogRichPaste } from "@/components/blog/blog-paste-extension";

/** Valid empty document for TipTap JSON storage (never use raw `{}`). */
export const EMPTY_TIPTAP_DOC_JSON = JSON.stringify({ type: "doc", content: [] });

export function parseTipTapDocJson(raw: string | undefined | null): Record<string, unknown> {
  const s = raw?.trim() ?? "";
  if (s === "" || s === "{}") {
    return { type: "doc", content: [] };
  }
  try {
    const v = JSON.parse(s) as { type?: string };
    if (!v || typeof v !== "object" || v.type !== "doc") {
      return { type: "doc", content: [] };
    }
    return v as Record<string, unknown>;
  } catch {
    return { type: "doc", content: [] };
  }
}

/** TipTap + ProseMirror content area styles. */
const editorContentClass = cn(
  "max-w-none min-h-[280px] px-4 py-3 focus:outline-none text-foreground",
  // Paragraphs: single direction margin so Enter = one line gap, not double
  "[&_p]:mt-0 [&_p]:mb-3 [&_p]:leading-relaxed",
  "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2",
  "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1",
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6",
  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6",
  "[&_li]:my-1 [&_li]:pl-1",
  "[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-muted-foreground/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:cursor-pointer",
  "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:my-3",
  "[&_strong]:font-semibold",
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm [&_code]:font-mono",
);

const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Red", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Yellow", value: "#eab308" },
  { label: "Green", value: "#22c55e" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Purple", value: "#a855f7" },
  { label: "Pink", value: "#ec4899" },
  { label: "Gray", value: "#6b7280" },
];

const ColorPicker = ({ editor }: { editor: Editor }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setOpen((v) => !v)}
        title="Text color"
      >
        <Palette className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 rounded-lg border border-border bg-background shadow-lg p-2 grid grid-cols-3 gap-1 min-w-[120px]">
          {TEXT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-xs hover:bg-muted transition-colors text-left"
              onClick={() => {
                if (!c.value) {
                  editor.chain().focus().unsetColor().run();
                } else {
                  editor.chain().focus().setColor(c.value).run();
                }
                setOpen(false);
              }}
            >
              {c.value ? (
                <span className="h-3 w-3 rounded-full shrink-0 border border-border/50" style={{ background: c.value }} />
              ) : (
                <span className="h-3 w-3 rounded-full shrink-0 border border-border/50 bg-foreground" />
              )}
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const MenuBar = ({
  editor,
  onImageUpload,
}: {
  editor: Editor | null;
  onImageUpload?: (file: File) => Promise<string>;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleImage = useCallback(() => {
    if (!onImageUpload) return;
    inputRef.current?.click();
  }, [onImageUpload]);

  const onFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !editor || !onImageUpload) return;
      try {
        const url = await onImageUpload(file);
        if (!url?.trim()) throw new Error("No image URL returned");
        editor.chain().focus().setImage({ src: url.trim() }).run();
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : "Image upload failed");
      }
    },
    [editor, onImageUpload],
  );

  const handleLink = useCallback(() => {
    if (!editor) return;
    const existing = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter link URL:", existing ?? "https://");
    if (url === null) return; // cancelled
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url.trim(), target: "_blank" }).run();
    }
  }, [editor]);

  if (!editor) return null;
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5 rounded-t-lg">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

      {/* Formatting */}
      <Button
        type="button"
        variant={editor.isActive("bold") ? "secondary" : "ghost"}
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().toggleBold()}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={editor.isActive("italic") ? "secondary" : "ghost"}
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().toggleItalic()}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>

      <span className="w-px h-5 bg-border mx-0.5" />

      {/* Headings */}
      <Button
        type="button"
        variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading"
      >
        <Heading2 className="h-4 w-4" />
      </Button>

      <span className="w-px h-5 bg-border mx-0.5" />

      {/* Lists */}
      <Button
        type="button"
        variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet list"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered list"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Blockquote"
      >
        <Quote className="h-4 w-4" />
      </Button>

      <span className="w-px h-5 bg-border mx-0.5" />

      {/* Color */}
      <ColorPicker editor={editor} />

      {/* Link */}
      <Button
        type="button"
        variant={editor.isActive("link") ? "secondary" : "ghost"}
        size="icon"
        className="h-8 w-8"
        onClick={handleLink}
        title="Insert / edit link"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>

      {/* Open current link in new tab */}
      {editor.isActive("link") && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            const href = editor.getAttributes("link").href as string | undefined;
            if (href) window.open(href, "_blank", "noopener,noreferrer");
          }}
          title="Open link"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      )}

      {/* Image */}
      {onImageUpload && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleImage}
          title="Insert image"
        >
          <ImagePlus className="h-4 w-4" />
        </Button>
      )}

      <span className="w-px h-5 bg-border mx-0.5" />

      {/* History */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
};

export function BlogEditor({
  content,
  onChange,
  placeholder = "Write your post content…",
  onImageUpload,
  className,
}: {
  content: string;
  onChange: (json: string) => void;
  placeholder?: string;
  onImageUpload?: (file: File) => Promise<string>;
  className?: string;
}) {
  const lastEmittedContentRef = useRef<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      BlogRichPaste,
      TextStyle,
      Color,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2 cursor-pointer",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    immediatelyRender: false,
    content: parseTipTapDocJson(content),
    editorProps: {
      attributes: {
        class: editorContentClass,
      },
    },
    onUpdate: ({ editor: ed }) => {
      const json = JSON.stringify(ed.getJSON());
      lastEmittedContentRef.current = json;
      onChange(json);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (content === lastEmittedContentRef.current) {
      lastEmittedContentRef.current = null;
      return;
    }
    const parsed = parseTipTapDocJson(content);
    editor.commands.setContent(parsed, { emitUpdate: false });
  }, [content, editor]);

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden bg-background", className)}>
      <MenuBar editor={editor} onImageUpload={onImageUpload} />
      <EditorContent editor={editor} />
    </div>
  );
}
