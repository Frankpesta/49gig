import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { normalizePastedHtml } from "@/lib/blog/normalize-pasted-html";

const pastePluginKey = new PluginKey("blogRichPaste");

/**
 * Prefer clipboard HTML (Word, Google Docs, web) and normalize it before insert.
 * Falls back to the default handler when only plain text is available.
 */
export const BlogRichPaste = Extension.create({
  name: "blogRichPaste",

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: pastePluginKey,
        props: {
          transformPastedHTML(html) {
            return normalizePastedHtml(html);
          },
          handlePaste(_view, event) {
            const clipboard = event.clipboardData;
            if (!clipboard) return false;

            const html = clipboard.getData("text/html");
            if (!html?.trim()) return false;

            const cleaned = normalizePastedHtml(html);
            if (!cleaned.trim()) return false;

            event.preventDefault();
            editor.commands.insertContent(cleaned, {
              parseOptions: { preserveWhitespace: false },
            });
            return true;
          },
        },
      }),
    ];
  },
});
