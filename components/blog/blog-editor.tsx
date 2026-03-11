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
      const url = await onImageUpload(file);
      editor.chain().focus().setImage({ src: url }).run();
    },
    [editor, onImageUpload]
  );

  if (!editor) return null;
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 px-2 py-1.5 rounded-t-lg">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
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
          if (url) editor.chain().focus().setLink({ href: url }).run();
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
        disabled={!editor.can().chain().focus().undo().run()}
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
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
    content: content ? (typeof content === "string" ? (JSON.parse(content) as object) : content) : undefined,
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral dark:prose-invert max-w-none min-h-[280px] px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const parsed = (() => {
      try {
        return content ? JSON.parse(content) : null;
      } catch {
        return null;
      }
    })();
    if (parsed && JSON.stringify(parsed) !== JSON.stringify(editor.getJSON())) {
      editor.commands.setContent(parsed);
    }
  }, [content, editor]);

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden bg-background", className)}>
      <MenuBar editor={editor} onImageUpload={onImageUpload} />
      <EditorContent editor={editor} />
    </div>
  );
}
