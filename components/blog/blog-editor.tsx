"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useEffect, useRef } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

/** TipTap + ProseMirror content area: explicit list/heading/blockquote/image styles (no @tailwindcss/typography). */
const editorContentClass = cn(
  "max-w-none min-h-[280px] px-4 py-3 focus:outline-none text-foreground",
  "[&_p]:my-2 [&_p]:leading-relaxed",
  "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2",
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6",
  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6",
  "[&_li]:my-1 [&_li]:pl-1",
  "[&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-muted-foreground/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
  "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:my-3",
);

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

  if (!editor) return null;
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 px-2 py-1.5 rounded-t-lg">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().toggleBold()}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().toggleItalic()}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => {
          const url = window.prompt("URL");
          if (url?.trim()) editor.chain().focus().setLink({ href: url.trim() }).run();
        }}
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
      {onImageUpload && (
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={handleImage}>
          <ImagePlus className="h-4 w-4" />
        </Button>
      )}
      <span className="w-px h-6 bg-border mx-1" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
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
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
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
      onChange(JSON.stringify(ed.getJSON()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const parsed = parseTipTapDocJson(content);
    const next = JSON.stringify(parsed);
    const current = JSON.stringify(editor.getJSON());
    if (next !== current) {
      editor.commands.setContent(parsed, { emitUpdate: false });
    }
  }, [content, editor]);

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden bg-background", className)}>
      <MenuBar editor={editor} onImageUpload={onImageUpload} />
      <EditorContent editor={editor} />
    </div>
  );
}
