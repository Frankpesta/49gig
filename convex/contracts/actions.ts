"use node";

import React from "react";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { FunctionReference } from "convex/server";
import { sendEmail } from "../email/send";
import { ContractReadyEmail } from "../../emails/templates";
import type { Doc, Id } from "../_generated/dataModel";
const api = require("../_generated/api") as {
  api: {
    contracts: {
      queries: { getContractContext: unknown };
      mutations: { storeContract: unknown };
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

function wrapText(text: string, maxWidth: number, font: any, size: number) {
  const words = text.split(" ");
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
  page.drawText(`${client.name || "Client"} (auto-signed)`, {
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
  page.drawText(`${freelancer.name || "Freelancer"} (auto-signed)`, {
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
    appendixB.drawText(line, {
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

    const sendToClient = sendEmail({
      to: client.email,
      subject: `Contract ready for ${project.intakeForm.title}`,
      react: React.createElement(ContractReadyEmail, {
        name: client.name || "there",
        projectName: project.intakeForm.title,
        contractUrl: contractUrl || `${appUrl}/dashboard/projects/${project._id}`,
        appUrl,
        logoUrl,
        date,
      }),
      attachments: [attachment],
    });

    const sendToFreelancer = sendEmail({
      to: freelancer.email,
      subject: `Contract ready for ${project.intakeForm.title}`,
      react: React.createElement(ContractReadyEmail, {
        name: freelancer.name || "there",
        projectName: project.intakeForm.title,
        contractUrl: contractUrl || `${appUrl}/dashboard/projects/${project._id}`,
        appUrl,
        logoUrl,
        date,
      }),
      attachments: [attachment],
    });

    await Promise.all([sendToClient, sendToFreelancer]);

    return { status: "sent", contractFileId: storageId };
  },
});
