"use client";

import { useRef } from "react";
import type { EditorProps } from "@monaco-editor/react";
import dynamic from "next/dynamic";

// Load Monaco only on client; avoids SSR and reduces initial bundle
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] items-center justify-center rounded-lg border border-border bg-muted/30 font-mono text-sm text-muted-foreground">
        Loading editor…
      </div>
    ),
  }
);

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string | number;
  readOnly?: boolean;
  className?: string;
}

/** Monaco-based code editor with IDE look: line numbers, syntax highlighting, dark theme. */
export function CodeEditor({
  value,
  onChange,
  language = "javascript",
  height = 320,
  readOnly = false,
  className = "",
}: CodeEditorProps) {
  const editorRef = useRef<Parameters<NonNullable<EditorProps["onMount"]>>[0] | null>(null);

  const handleEditorMount: EditorProps["onMount"] = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  return (
    <div className={`overflow-hidden rounded-lg border border-border bg-[#1e1e1e] ${className}`}>
      <MonacoEditor
        height={typeof height === "number" ? `${height}px` : height}
        language={language}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        onMount={handleEditorMount}
        theme="vs-dark"
        loading={null}
        options={{
          minimap: { enabled: true },
          lineNumbers: "on",
          glyphMargin: false,
          folding: true,
          lineNumbersMinChars: 3,
          wordWrap: "off",
          fontSize: 14,
          fontFamily: "var(--font-mono), 'Fira Code', 'Monaco', 'Menlo', monospace",
          fontLigatures: true,
          scrollBeyondLastLine: false,
          padding: { top: 12, bottom: 12 },
          readOnly,
          tabSize: 2,
          insertSpaces: true,
          automaticLayout: true,
          bracketPairColorization: { enabled: true },
          renderLineHighlight: "all",
          cursorBlinking: "smooth",
          smoothScrolling: true,
          suggest: { showKeywords: true },
        }}
      />
    </div>
  );
}
