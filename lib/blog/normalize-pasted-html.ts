/**
 * Cleans clipboard HTML from Word, Google Docs, Notion, etc. while keeping
 * structure and inline formatting TipTap can parse (headings, lists, bold, links…).
 */
export function normalizePastedHtml(html: string): string {
  if (!html?.trim()) return "";

  if (typeof window === "undefined") {
    return stripOfficeNoise(html);
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const root = doc.body;

  root
    .querySelectorAll("script, style, meta, link, title, head, xml, o\\:p")
    .forEach((el) => el.remove());

  root.querySelectorAll("*").forEach((el) => {
    if (el instanceof HTMLElement) {
      for (const attr of [...el.attributes]) {
        if (
          attr.name.startsWith("xmlns") ||
          attr.name.startsWith("on") ||
          (attr.name === "class" && /^Mso/i.test(attr.value))
        ) {
          el.removeAttribute(attr.name);
        }
      }
    }
  });

  promoteStyledSpans(root, doc);
  unwrapRedundantSpans(root);
  convertDivsToParagraphs(root);

  const cleaned = root.innerHTML.trim();
  return cleaned || stripOfficeNoise(html);
}

function stripOfficeNoise(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<o:p>\s*<\/o:p>/gi, "")
    .replace(/<\/?o:[^>]*>/gi, "")
    .replace(/<\/?w:[^>]*>/gi, "")
    .replace(/class="Mso[^"]*"/gi, "")
    .replace(/style="[^"]*mso-[^"]*"/gi, "");
}

function promoteStyledSpans(root: HTMLElement, doc: Document): void {
  const spans = [...root.querySelectorAll("span")];
  for (const span of spans) {
    if (!(span instanceof HTMLElement) || !span.parentNode) continue;

    const weight = span.style.fontWeight;
    const isBold =
      weight === "bold" ||
      weight === "bolder" ||
      (weight !== "" && !Number.isNaN(Number(weight)) && Number(weight) >= 600);
    const isItalic = span.style.fontStyle === "italic";
    const isUnderline = span.style.textDecoration.includes("underline");
    const color = span.style.color?.trim();

    if (isBold || isItalic || isUnderline) {
      const inner = doc.createElement("span");
      inner.innerHTML = span.innerHTML;
      let wrapped: HTMLElement = inner;
      if (isBold) {
        const strong = doc.createElement("strong");
        strong.appendChild(wrapped);
        wrapped = strong;
      }
      if (isItalic) {
        const em = doc.createElement("em");
        em.appendChild(wrapped);
        wrapped = em;
      }
      if (isUnderline) {
        const u = doc.createElement("u");
        u.appendChild(wrapped);
        wrapped = u;
      }
      if (color && color !== "inherit") {
        const colored = doc.createElement("span");
        colored.style.color = color;
        colored.appendChild(wrapped);
        span.replaceWith(colored);
      } else {
        span.replaceWith(wrapped);
      }
      continue;
    }

    if (color && color !== "inherit") {
      span.style.color = color;
    } else {
      span.removeAttribute("style");
    }
  }
}

function unwrapRedundantSpans(root: HTMLElement): void {
  let changed = true;
  while (changed) {
    changed = false;
    for (const span of [...root.querySelectorAll("span")]) {
      if (!(span instanceof HTMLElement)) continue;
      const hasAttrs = span.attributes.length > 0;
      const onlyStyle = span.attributes.length === 1 && span.hasAttribute("style");
      const styleEmpty = !span.getAttribute("style")?.trim();
      if (!hasAttrs || (onlyStyle && styleEmpty)) {
        const parent = span.parentNode;
        if (!parent) continue;
        while (span.firstChild) parent.insertBefore(span.firstChild, span);
        span.remove();
        changed = true;
      }
    }
  }
}

/** Normalize leaf divs to paragraphs when they are not inside list items. */
function convertDivsToParagraphs(root: HTMLElement): void {
  for (const div of [...root.querySelectorAll("div")]) {
    if (!(div instanceof HTMLElement)) continue;
    if (div.closest("li")) continue;
    if (divHasBlockChildren(div)) continue;

    const p = root.ownerDocument.createElement("p");
    while (div.firstChild) {
      p.appendChild(div.firstChild);
    }
    div.replaceWith(p);
  }
}

function divHasBlockChildren(el: HTMLElement): boolean {
  const block = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "LI", "BLOCKQUOTE"]);
  return [...el.children].some((c) => block.has(c.tagName));
}
