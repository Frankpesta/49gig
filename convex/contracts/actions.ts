"use node";

import React from "react";
import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { FunctionReference } from "convex/server";
import { sendEmail } from "../email/send";
import {
  ContractReadyEmail,
  AdminContractRecordEmail,
} from "../../emails/templates";
import type { Doc, Id } from "../_generated/dataModel";
import {
  CLIENT_AGREEMENT_SECTIONS,
  FREELANCER_AGREEMENT_SECTIONS,
  applyClientAgreementPlaceholders,
  applyFreelancerAgreementPlaceholders,
} from "./content";

const api = require("../_generated/api") as {
  api: {
    contracts: {
      queries: { getContractContext: unknown; getProjectContractParties: unknown };
      mutations: { storeContract: unknown; updateContractFile: unknown };
    };
  };
};

const CONTRACT_TITLE = "Independent Contractor Agreement";

function getAppUrl() {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://49gig.com"
  );
}

function getLogoUrl(appUrl: string) {
  return `${appUrl}/logo-light.png`;
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCurrency(amount: number, currency: string) {
  return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
}

function isValidEmail(e: string | undefined | null): e is string {
  return typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

async function sendResendEmail(
  label: string,
  fn: () => ReturnType<typeof sendEmail>,
): Promise<void> {
  try {
    const result = await fn();
    if (
      result &&
      typeof result === "object" &&
      "status" in result &&
      (result as { status: string }).status === "skipped"
    ) {
      console.warn(
        `[contracts] ${label}: email skipped — set RESEND_API_KEY and RESEND_FROM_EMAIL in Convex`,
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[contracts] ${label} failed:`, msg);
  }
}

/** WinAnsi encoding cannot handle newlines or certain Unicode (e.g. ⸻ U+2E3B); sanitize before drawing. */
function sanitizeForPdf(text: string): string {
  let s = String(text ?? "").replace(/[\r\n]+/g, " ").trim() || " ";
  // pdf-lib StandardFonts use WinAnsi; replace chars it cannot encode
  return s.replace(/[\s\S]/g, (c) => {
    const code = c.charCodeAt(0);
    if (code >= 0x20 && code <= 0x7e) return c; // ASCII printable
    if (code >= 0xa0 && code <= 0xff) return c; // Latin-1 supplement
    // Map common Unicode punctuation to ASCII
    if (code === 0x2022) return "- "; // bullet (list)
    if (code === 0x2248) return "~"; // approx. equal
    const map: Record<number, string> = {
      0x2014: "-", 0x2013: "-", 0x2e3a: "-", 0x2e3b: "-",
      0x201c: '"', 0x201d: '"', 0x2018: "'", 0x2019: "'",
    };
    return map[code] ?? "-";
  });
}

function wrapText(text: string, maxWidth: number, font: any, size: number) {
  const safe = sanitizeForPdf(text);
  const words = safe.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    const next = currentLine ? `${currentLine} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      currentLine = next;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

async function generateContractPdf({
  client,
  freelancer,
  project,
}: {
  client: Doc<"users">;
  freelancer: Doc<"users">;
  project: Doc<"projects">;
}) {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 56;
  const lineHeight = 16;
  const titleSize = 18;
  const headingSize = 13;
  const bodySize = 11;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const drawHeading = (text: string) => {
    page.drawText(text, {
      x: margin,
      y,
      size: headingSize,
      font: bold,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= lineHeight + 4;
  };

  const drawParagraph = (text: string) => {
    const lines = wrapText(text, pageWidth - margin * 2, regular, bodySize);
    for (const line of lines) {
      if (y < margin) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      page.drawText(line, {
        x: margin,
        y,
        size: bodySize,
        font: regular,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= lineHeight;
    }
    y -= 6;
  };

  page.drawText(CONTRACT_TITLE, {
    x: margin,
    y,
    size: titleSize,
    font: bold,
    color: rgb(0.05, 0.05, 0.05),
  });
  y -= lineHeight * 2;

  drawHeading("Parties");
  drawParagraph(
    `This Independent Contractor Agreement ("Agreement") is entered into between ${client.name || "Client"} ("Client") and ${freelancer.name || "Freelancer"} ("Contractor").`
  );

  drawHeading("Project");
  drawParagraph(
    `Project Title: ${project.intakeForm.title}. The Contractor agrees to perform professional services for the Client as described in the project scope and milestones.`
  );

  drawHeading("Effective Date");
  drawParagraph(`This Agreement is effective as of ${formatDate()}.`);

  drawHeading("Scope of Work");
  drawParagraph(
    "The Contractor will provide services according to the agreed project requirements, deliverables, timeline, and milestones. Any changes to scope must be documented and mutually agreed in writing."
  );

  drawHeading("Compensation");
  drawParagraph(
    `Total project compensation is ${formatCurrency(project.totalAmount, project.currency)}. Payments are released on milestone approval through the 49GIG escrow system.`
  );

  drawHeading("Confidentiality");
  drawParagraph(
    "Both parties agree to keep confidential all non-public information disclosed during the engagement. Confidential information shall not be shared with third parties without written consent."
  );

  drawHeading("Intellectual Property");
  drawParagraph(
    "Upon full payment, all deliverables, source code, and project materials created under this Agreement will be assigned to the Client, unless otherwise agreed in writing."
  );

  drawHeading("Independent Contractor Status");
  drawParagraph(
    "The Contractor is an independent contractor and is not an employee of the Client. The Contractor is responsible for all taxes, insurance, and legal obligations."
  );

  drawHeading("Termination");
  drawParagraph(
    "Either party may terminate this Agreement with written notice. Upon termination, the Client will pay for approved work completed up to the termination date."
  );

  drawHeading("Dispute Resolution");
  drawParagraph(
    "Any disputes will be handled in good faith through the 49GIG dispute resolution process. If unresolved, the parties agree to arbitration in a mutually agreed location."
  );

  drawHeading("Governing Law");
  drawParagraph(
    "This Agreement is governed by applicable international commercial laws and the platform policies of 49GIG."
  );

  drawHeading("Signatures");
  drawParagraph(
    `This Agreement is electronically signed and accepted by both parties on ${formatDate()}.`
  );

  if (y < margin + 120) {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  }

  page.drawText("Client Signature", {
    x: margin,
    y,
    size: bodySize,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= lineHeight;
  page.drawText(sanitizeForPdf(`${client.name || "Client"} (auto-signed)`), {
    x: margin,
    y,
    size: bodySize,
    font: regular,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= lineHeight * 2;

  page.drawText("Contractor Signature", {
    x: margin,
    y,
    size: bodySize,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= lineHeight;
  page.drawText(sanitizeForPdf(`${freelancer.name || "Freelancer"} (auto-signed)`), {
    x: margin,
    y,
    size: bodySize,
    font: regular,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Add extra pages for professional length
  const appendix = pdfDoc.addPage([pageWidth, pageHeight]);
  appendix.drawText("Appendix A: Platform Terms Summary", {
    x: margin,
    y: pageHeight - margin,
    size: headingSize,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  const appendixText =
    "This appendix summarizes key platform policies including communication standards, payment milestones, and quality expectations. The full terms are available in the 49GIG dashboard. Both parties agree to adhere to platform policies for dispute resolution, milestone approvals, and professional conduct.";
  let ay = pageHeight - margin - lineHeight * 2;
  const appendixLines = wrapText(appendixText, pageWidth - margin * 2, regular, bodySize);
  for (const line of appendixLines) {
    appendix.drawText(line, {
      x: margin,
      y: ay,
      size: bodySize,
      font: regular,
      color: rgb(0.2, 0.2, 0.2),
    });
    ay -= lineHeight;
  }

  const appendixB = pdfDoc.addPage([pageWidth, pageHeight]);
  appendixB.drawText("Appendix B: Engagement Summary", {
    x: margin,
    y: pageHeight - margin,
    size: headingSize,
    font: bold,
    color: rgb(0.1, 0.1, 0.1),
  });
  const summaryText = `Project: ${project.intakeForm.title}\nClient: ${client.name || "Client"}\nContractor: ${freelancer.name || "Freelancer"}\nTotal: ${formatCurrency(project.totalAmount, project.currency)}\nCreated on: ${formatDate()}`;
  let sy = pageHeight - margin - lineHeight * 2;
  for (const line of summaryText.split("\n")) {
    appendixB.drawText(sanitizeForPdf(line), {
      x: margin,
      y: sy,
      size: bodySize,
      font: regular,
      color: rgb(0.2, 0.2, 0.2),
    });
    sy -= lineHeight;
  }

  return pdfDoc.save();
}

/** Generate full 49GIG contract PDF (client + freelancer agreements) with signature lines. */
async function generateFullContractPdf({
  project,
  client,
  freelancers,
  clientSignedAt,
  freelancerSignatures,
  copyFor,
}: {
  project: Doc<"projects">;
  client: Doc<"users">;
  freelancers: Doc<"users">[];
  clientSignedAt?: number;
  freelancerSignatures?: { freelancerId: Id<"users">; signedAt: number }[];
  copyFor?: { name: string; role: string };
}) {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const bold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const signatureFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const sansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 54;
  const lineHeight = 13;
  const bodySize = 10;
  const minContentY = 78;
  const effectiveDate = formatDate();
  const clientName = client.name || "Client";
  const freelancerNames = freelancers.map((f) => f.name || "Freelancer").join(", ");

  const C = {
    navy: rgb(0.051, 0.106, 0.165),
    gold: rgb(0.961, 0.722, 0),
    text: rgb(0.067, 0.067, 0.067),
    muted: rgb(0.38, 0.38, 0.38),
    rule: rgb(0.82, 0.82, 0.82),
    banner: rgb(0.94, 0.945, 0.95),
    white: rgb(1, 1, 1),
  };

  let page = pdfDoc.addPage([pageWidth, pageHeight]);

  // ── Cover page
  const bandH = 100;
  page.drawRectangle({
    x: 0,
    y: pageHeight - bandH,
    width: pageWidth,
    height: bandH,
    color: C.navy,
  });
  page.drawRectangle({
    x: 0,
    y: pageHeight - bandH - 3,
    width: pageWidth,
    height: 3,
    color: C.gold,
  });
  page.drawText("49GIG", {
    x: margin,
    y: pageHeight - 42,
    size: 26,
    font: sansBold,
    color: C.white,
  });
  page.drawText("CONFIDENTIAL", {
    x: margin,
    y: pageHeight - 64,
    size: 8,
    font: sansBold,
    color: C.gold,
  });

  let cy = pageHeight - bandH - 40;
  page.drawText("Combined Client & Freelancer Agreement", {
    x: margin,
    y: cy,
    size: 17,
    font: bold,
    color: C.text,
  });
  cy -= 26;
  page.drawText(`Effective date: ${sanitizeForPdf(effectiveDate)}`, {
    x: margin,
    y: cy,
    size: 11,
    font: regular,
    color: C.muted,
  });
  cy -= 36;

  if (copyFor) {
    page.drawText(
      `Distribution copy: ${sanitizeForPdf(copyFor.name)} (${sanitizeForPdf(copyFor.role)})`,
      { x: margin, y: cy, size: 9, font: bold, color: rgb(0.45, 0.22, 0.18) },
    );
    cy -= 28;
  }

  const partyRows: [string, string][] = [
    ["Project", project.intakeForm.title || "Engagement"],
    ["Client", clientName],
    ["Talent", freelancerNames || "As assigned"],
  ];
  for (const [label, value] of partyRows) {
    page.drawText(sanitizeForPdf(label.toUpperCase()), {
      x: margin,
      y: cy,
      size: 7,
      font: sansBold,
      color: C.muted,
    });
    cy -= 12;
    page.drawText(sanitizeForPdf(value), {
      x: margin,
      y: cy,
      size: 11,
      font: regular,
      color: C.text,
    });
    cy -= 26;
  }

  const coverNote =
    "This document incorporates the 49GIG Client Agreement and Freelancer Agreement for the engagement described above.";
  let noteY = cy;
  for (const line of wrapText(
    coverNote,
    pageWidth - margin * 2,
    regular,
    9,
  )) {
    page.drawText(sanitizeForPdf(line), {
      x: margin,
      y: noteY,
      size: 9,
      font: regular,
      color: C.muted,
    });
    noteY -= 12;
  }

  // ── Agreement body (structured; matches in-app sections)
  page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const ensureSpace = (need: number) => {
    if (y < minContentY + need) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      page.drawLine({
        start: { x: margin, y: y + 4 },
        end: { x: pageWidth - margin, y: y + 4 },
        thickness: 0.4,
        color: C.rule,
      });
      y -= 18;
    }
  };

  const drawFilledBody = (filled: string) => {
    const blocks = filled.split(/\n\n+/);
    for (const block of blocks) {
      for (const rawLine of block.split("\n")) {
        const t = rawLine.trim();
        if (!t) continue;
        const isBullet =
          /^\d+\.\d+\s/.test(t) || (t.startsWith("-") && t.charAt(1) === " ");
        const indent = isBullet ? 14 : 0;
        const wrapped = wrapText(
          t,
          pageWidth - 2 * margin - indent,
          regular,
          bodySize,
        );
        for (const wl of wrapped) {
          ensureSpace(lineHeight);
          page.drawText(sanitizeForPdf(wl), {
            x: margin + indent,
            y,
            size: bodySize,
            font: regular,
            color: C.text,
          });
          y -= lineHeight;
        }
      }
      y -= 5;
    }
  };

  const drawBanner = (text: string) => {
    const h = 22;
    ensureSpace(h + 14);
    page.drawRectangle({
      x: margin,
      y: y - h,
      width: pageWidth - 2 * margin,
      height: h,
      color: C.banner,
    });
    page.drawText(sanitizeForPdf(text), {
      x: margin + 8,
      y: y - 14,
      size: 8.5,
      font: sansBold,
      color: C.navy,
    });
    y -= h + 12;
  };

  drawBanner("PART I   |   CLIENT AGREEMENT");

  for (const s of CLIENT_AGREEMENT_SECTIONS) {
    if ("level" in s && s.level === "title") {
      ensureSpace(30);
      page.drawText(sanitizeForPdf(s.title), {
        x: margin,
        y,
        size: 14,
        font: bold,
        color: C.navy,
      });
      y -= 18;
      page.drawLine({
        start: { x: margin, y: y + 6 },
        end: { x: pageWidth - margin, y: y + 6 },
        thickness: 1.2,
        color: C.gold,
      });
      y -= 18;
    } else if ("level" in s && s.level === "heading") {
      ensureSpace(22);
      page.drawText(sanitizeForPdf(s.title), {
        x: margin,
        y,
        size: 11,
        font: bold,
        color: C.text,
      });
      y -= 16;
    } else if ("level" in s && s.level === "divider") {
      ensureSpace(16);
      page.drawLine({
        start: { x: margin, y: y - 2 },
        end: { x: pageWidth - margin, y: y - 2 },
        thickness: 0.55,
        color: C.rule,
      });
      y -= 18;
    } else if ("body" in s) {
      const filled = applyClientAgreementPlaceholders(
        s.body,
        clientName,
        freelancerNames,
        effectiveDate,
      );
      drawFilledBody(filled);
    }
  }

  drawBanner("PART II   |   FREELANCER AGREEMENT");

  for (let fi = 0; fi < freelancers.length; fi++) {
    const f = freelancers[fi];
    const fname = f.name || "Freelancer";
    if (freelancers.length > 1) {
      const letter = String.fromCharCode(65 + fi);
      drawBanner(`EXHIBIT ${letter}   |   ${fname.toUpperCase()}`);
    }
    for (const s of FREELANCER_AGREEMENT_SECTIONS) {
      if ("level" in s && s.level === "title") {
        ensureSpace(30);
        page.drawText(sanitizeForPdf(s.title), {
          x: margin,
          y,
          size: 14,
          font: bold,
          color: C.navy,
        });
        y -= 18;
        page.drawLine({
          start: { x: margin, y: y + 6 },
          end: { x: pageWidth - margin, y: y + 6 },
          thickness: 1.2,
          color: C.gold,
        });
        y -= 18;
      } else if ("level" in s && s.level === "heading") {
        ensureSpace(22);
        page.drawText(sanitizeForPdf(s.title), {
          x: margin,
          y,
          size: 11,
          font: bold,
          color: C.text,
        });
        y -= 16;
      } else if ("body" in s) {
        const filled = applyFreelancerAgreementPlaceholders(
          s.body,
          fname,
          effectiveDate,
        );
        drawFilledBody(filled);
      }
    }
  }

  // ── Signatures
  ensureSpace(88);
  page.drawText("ELECTRONIC SIGNATURES", {
    x: margin,
    y,
    size: 12,
    font: bold,
    color: C.navy,
  });
  y -= 8;
  page.drawLine({
    start: { x: margin, y: y + 2 },
    end: { x: pageWidth - margin, y: y + 2 },
    thickness: 0.9,
    color: C.gold,
  });
  y -= 22;

  const sigIntro =
    "By signing electronically through the 49GIG platform, the parties agree that electronic signatures have the same legal effect as handwritten signatures under applicable law.";
  for (const line of wrapText(
    sigIntro,
    pageWidth - 2 * margin,
    regular,
    9,
  )) {
    ensureSpace(lineHeight);
    page.drawText(sanitizeForPdf(line), {
      x: margin,
      y,
      size: 9,
      font: regular,
      color: C.muted,
    });
    y -= lineHeight;
  }
  y -= 16;

  const drawSignatureBlock = (
    roleLabel: string,
    displayName: string,
    signedAtMs: number | undefined,
  ) => {
    ensureSpace(62);
    page.drawText(sanitizeForPdf(roleLabel.toUpperCase()), {
      x: margin,
      y,
      size: 7,
      font: sansBold,
      color: C.muted,
    });
    y -= 14;
    if (signedAtMs) {
      page.drawText(sanitizeForPdf(displayName), {
        x: margin,
        y,
        size: 13,
        font: signatureFont,
        color: C.navy,
      });
      y -= 18;
      page.drawText(
        sanitizeForPdf(
          new Date(signedAtMs).toLocaleDateString("en-US", {
            dateStyle: "long",
          }),
        ),
        { x: margin, y, size: 9, font: regular, color: C.muted },
      );
      y -= 14;
    } else {
      page.drawText("(Pending electronic signature)", {
        x: margin,
        y,
        size: 10,
        font: regular,
        color: rgb(0.55, 0.55, 0.55),
      });
      y -= 16;
    }
    page.drawLine({
      start: { x: margin, y: y - 2 },
      end: { x: Math.min(margin + 280, pageWidth - margin), y: y - 2 },
      thickness: 0.55,
      color: C.text,
    });
    y -= 28;
  };

  drawSignatureBlock("Client", clientName, clientSignedAt);

  for (const f of freelancers) {
    const sig = freelancerSignatures?.find((s) => s.freelancerId === f._id);
    drawSignatureBlock(
      `Freelancer — ${f.name || "Freelancer"}`,
      f.name || "Freelancer",
      sig?.signedAt,
    );
  }

  // ── Footers on every page
  const pages = pdfDoc.getPages();
  const total = pages.length;
  for (let i = 0; i < total; i++) {
    const p = pages[i];
    const pw = p.getWidth();
    p.drawLine({
      start: { x: margin, y: 50 },
      end: { x: pw - margin, y: 50 },
      thickness: 0.45,
      color: C.rule,
    });
    p.drawText(
      sanitizeForPdf(
        `49GIG   |   Engagement Agreement   |   Page ${i + 1} of ${total}`,
      ),
      { x: margin, y: 34, size: 8, font: regular, color: C.muted },
    );
  }

  return pdfDoc.save();
}

export const generateAndSendContract = action({
  args: {
    matchId: v.id("matches"),
  },
  handler: async (ctx, args) => {
    const getContractContext = api.api.contracts.queries
      .getContractContext as unknown as FunctionReference<
      "query",
      "internal"
    >;

    const context = await ctx.runQuery(getContractContext, {
      matchId: args.matchId,
    });

    if (!context) {
      throw new Error("Contract context not found");
    }

    const { match, project, client, freelancer } = context;
    if (!match || match.status !== "accepted") {
      throw new Error("Match not accepted");
    }

    if (project.contractFileId) {
      return { status: "already_generated" };
    }

    const pdfBytes = await generateContractPdf({
      client: client as Doc<"users">,
      freelancer: freelancer as Doc<"users">,
      project: project as Doc<"projects">,
    });

    const pdfArrayBuffer = pdfBytes.buffer.slice(
      pdfBytes.byteOffset,
      pdfBytes.byteOffset + pdfBytes.byteLength
    ) as ArrayBuffer;

    const storageId = await ctx.storage.store(
      new Blob([pdfArrayBuffer], { type: "application/pdf" })
    );

    const storeContract = api.api.contracts.mutations
      .storeContract as unknown as FunctionReference<
      "mutation",
      "internal"
    >;

    await ctx.runMutation(storeContract, {
      projectId: project._id,
      contractFileId: storageId,
      actorId: client._id,
      actorRole: client.role,
      matchId: match._id,
      freelancerId: freelancer._id,
    });

    const contractUrl = await ctx.storage.getUrl(storageId);
    const appUrl = getAppUrl();
    const logoUrl = getLogoUrl(appUrl);
    const date = formatDate();
    const attachment = {
      filename: `49GIG-Contract-${project.intakeForm.title.replace(/\s+/g, "-")}.pdf`,
      content: Buffer.from(pdfBytes).toString("base64"),
      contentType: "application/pdf",
    };

    const emailTasks: Promise<void>[] = [];
    const contractLink =
      contractUrl || `${appUrl}/dashboard/projects/${project._id}`;

    if (isValidEmail(client.email)) {
      emailTasks.push(
        sendResendEmail("contract email (match flow, client)", () =>
          sendEmail({
            to: client.email.trim(),
            subject: `Contract ready for ${project.intakeForm.title}`,
            react: React.createElement(ContractReadyEmail, {
              name: client.name || "there",
              projectName: project.intakeForm.title,
              contractUrl: contractLink,
              appUrl,
              logoUrl,
              date,
            }),
            attachments: [attachment],
          }),
        ),
      );
    } else {
      console.warn(
        "[contracts] skip match-flow client email: invalid or missing email",
      );
    }

    if (isValidEmail(freelancer.email)) {
      emailTasks.push(
        sendResendEmail("contract email (match flow, freelancer)", () =>
          sendEmail({
            to: freelancer.email.trim(),
            subject: `Contract ready for ${project.intakeForm.title}`,
            react: React.createElement(ContractReadyEmail, {
              name: freelancer.name || "there",
              projectName: project.intakeForm.title,
              contractUrl: contractLink,
              appUrl,
              logoUrl,
              date,
            }),
            attachments: [attachment],
          }),
        ),
      );
    } else {
      console.warn(
        "[contracts] skip match-flow freelancer email: invalid or missing email",
      );
    }

    await Promise.all(emailTasks);

    return { status: "sent", contractFileId: storageId };
  },
});

/**
 * Internal: Regenerate contract PDF with current signatures and send to all parties.
 * Called after client or freelancer signs.
 * Sends personalized copies (client name on client copy, freelancer names on freelancer copies)
 * and an admin copy for record-keeping with all parties listed.
 */
export const regenerateContractPdfAndSend = internalAction({
  args: {
    projectId: v.id("projects"),
    /**
     * When false, updates the stored PDF only (no client/freelancer/admin emails).
     * Used after each signature until the contract is fully signed — avoids duplicate
     * “contract ready” emails on every party signing. Post-funding kickoff omits this
     * (defaults to true) so parties get the initial PDF link once.
     */
    sendEmails: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const apiModule = require("../_generated/api");
    const parties = await ctx.runQuery(
      apiModule.internal.contracts.queries.getProjectContractParties,
      { projectId: args.projectId }
    );
    if (!parties) return { status: "parties_not_found" };

    const { project, client, freelancers } = parties;
    const basePdfParams = {
      project,
      client,
      freelancers,
      clientSignedAt: project.clientContractSignedAt,
      freelancerSignatures: project.freelancerContractSignatures,
    };

    const clientPdfBytes = await generateFullContractPdf({
      ...basePdfParams,
      copyFor: { name: client.name || "Client", role: "Client" },
    });
    const clientArrayBuffer = clientPdfBytes.buffer.slice(
      clientPdfBytes.byteOffset,
      clientPdfBytes.byteOffset + clientPdfBytes.byteLength
    ) as ArrayBuffer;
    const clientStorageId = await ctx.storage.store(
      new Blob([clientArrayBuffer], { type: "application/pdf" })
    );

    await ctx.runMutation(
      apiModule.internal.contracts.mutations.updateContractFile,
      { projectId: args.projectId, contractFileId: clientStorageId }
    );

    const sendEmails = args.sendEmails !== false;

    const appUrl = getAppUrl();
    const logoUrl = getLogoUrl(appUrl);
    const date = formatDate();
    const baseFilename = `49GIG-Contract-${project.intakeForm.title.replace(/\s+/g, "-")}`;

    if (sendEmails) {
      const contractUrl =
        (await ctx.storage.getUrl(clientStorageId)) ||
        `${appUrl}/dashboard/projects/${args.projectId}`;

      const clientAttachment = {
        filename: `${baseFilename}-Client-${(client.name || "Client").replace(/\s+/g, "-")}.pdf`,
        content: Buffer.from(clientPdfBytes).toString("base64"),
        contentType: "application/pdf",
      };

      if (isValidEmail(client.email)) {
        await sendResendEmail("contract email (client)", () =>
          sendEmail({
            to: client.email.trim(),
            subject: `Contract ready / signed – ${project.intakeForm.title}`,
            react: React.createElement(ContractReadyEmail, {
              name: client.name || "there",
              projectName: project.intakeForm.title,
              contractUrl,
              appUrl,
              logoUrl,
              date,
            }),
            attachments: [clientAttachment],
          }),
        );
      } else {
        console.warn(
          "[contracts] skip client contract email: invalid or missing client email",
        );
      }

      for (const f of freelancers as Doc<"users">[]) {
        if (!isValidEmail(f.email)) {
          console.warn(
            `[contracts] skip freelancer contract email: invalid email for ${f._id}`,
          );
          continue;
        }
        const freelancerPdfBytes = await generateFullContractPdf({
          ...basePdfParams,
          copyFor: { name: f.name || "Freelancer", role: "Freelancer" },
        });
        const freelancerAttachment = {
          filename: `${baseFilename}-Freelancer-${(f.name || "Freelancer").replace(/\s+/g, "-")}.pdf`,
          content: Buffer.from(freelancerPdfBytes).toString("base64"),
          contentType: "application/pdf",
        };
        await sendResendEmail(`contract email (freelancer ${f._id})`, () =>
          sendEmail({
            to: f.email!.trim(),
            subject: `Contract ready / signed – ${project.intakeForm.title}`,
            react: React.createElement(ContractReadyEmail, {
              name: f.name || "there",
              projectName: project.intakeForm.title,
              contractUrl,
              appUrl,
              logoUrl,
              date,
            }),
            attachments: [freelancerAttachment],
          }),
        );
      }

      const admins = await ctx.runQuery(
        apiModule.internal.users.queries.getModeratorsAndAdminsInternal,
        {},
      );
      const adminEmails =
        admins?.filter((a: { email?: string }) => isValidEmail(a.email)).map(
          (a: { email: string }) => a.email.trim(),
        ) ?? [];
      if (adminEmails.length > 0) {
        const adminPdfBytes = await generateFullContractPdf({
          ...basePdfParams,
          copyFor: {
            name: "49GIG Admin",
            role: "Record (all parties listed in email)",
          },
        });
        const adminAttachment = {
          filename: `${baseFilename}-Admin-Record.pdf`,
          content: Buffer.from(adminPdfBytes).toString("base64"),
          contentType: "application/pdf",
        };
        const partyRows: { label: string; value: string }[] = [
          {
            label: "Client",
            value: `${client.name || "Client"} (${client.email || "no email"})`,
          },
          ...(freelancers as Doc<"users">[]).map((f) => ({
            label: "Freelancer",
            value: `${f.name || "Freelancer"} (${f.email || "no email"})`,
          })),
        ];
        const dashboardUrl = `${appUrl}/dashboard/projects/${args.projectId}`;
        await sendResendEmail("contract email (admins)", () =>
          sendEmail({
            to: adminEmails,
            subject: `[49GIG] Contract signed – ${project.intakeForm.title}`,
            react: React.createElement(AdminContractRecordEmail, {
              projectName: project.intakeForm.title,
              partyRows,
              dashboardUrl,
              appUrl,
              logoUrl,
              date,
            }),
            attachments: [adminAttachment],
          }),
        );
      }
    }

    return {
      status: sendEmails ? "sent" : "stored",
      contractFileId: clientStorageId,
    };
  },
});
