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
