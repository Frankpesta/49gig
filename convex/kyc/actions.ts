"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import React from "react";
import { sendEmail } from "../email/send";

/**
 * Send KYC rejected email (reason + ask to resubmit)
 */
export const sendKycRejectedEmail = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
    step: v.union(v.literal("id"), v.literal("address")),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const stepLabel = args.step === "id" ? "ID verification" : "address verification";
    await sendEmail({
      to: args.email,
      subject: "49GIG KYC – Action required",
      react: React.createElement(
        "div",
        { style: { fontFamily: "sans-serif", padding: "24px", maxWidth: "600px" } },
        React.createElement("h2", { style: { marginBottom: "16px" } }, "KYC update"),
        React.createElement("p", null, `Hi ${args.name},`),
        React.createElement("p", { style: { marginTop: "16px" } },
          `Your ${stepLabel} could not be approved. Please review the reason below and resubmit.`
        ),
        React.createElement("p", { style: { marginTop: "16px", padding: "12px", background: "#f3f4f6", borderRadius: "8px" } },
          "Reason: ",
          args.reason
        ),
        React.createElement("p", { style: { marginTop: "16px" } },
          "Log in to your dashboard and go to Verification to upload new documents. Use clear images or PDFs (max 5MB)."
        ),
        React.createElement("p", { style: { marginTop: "24px", color: "#6b7280", fontSize: "14px" } },
          "If you have questions, contact support."
        )
      ),
    });
    return { sent: true };
  },
});

/**
 * Send KYC approved email (congratulatory)
 */
export const sendKycApprovedEmail = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await sendEmail({
      to: args.email,
      subject: "49GIG KYC approved – You’re all set",
      react: React.createElement(
        "div",
        { style: { fontFamily: "sans-serif", padding: "24px", maxWidth: "600px" } },
        React.createElement("h2", { style: { marginBottom: "16px" } }, "KYC approved"),
        React.createElement("p", null, `Hi ${args.name},`),
        React.createElement("p", { style: { marginTop: "16px" } },
          "Congratulations! Your identity and address verification have been approved. You can now enjoy full access to the platform and be matched with client projects."
        ),
        React.createElement("p", { style: { marginTop: "16px" } },
          "Log in to your dashboard to view opportunities and start getting matched."
        ),
        React.createElement("p", { style: { marginTop: "24px", color: "#6b7280", fontSize: "14px" } },
          "Welcome to 49GIG."
        )
      ),
    });
    return { sent: true };
  },
});

/**
 * Send account removed email (after 2 rejections)
 */
export const sendKycAccountRemovedEmail = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await sendEmail({
      to: args.email,
      subject: "49GIG account update",
      react: React.createElement(
        "div",
        { style: { fontFamily: "sans-serif", padding: "24px", maxWidth: "600px" } },
        React.createElement("h2", { style: { marginBottom: "16px" } }, "Account update"),
        React.createElement("p", null, `Hi ${args.name},`),
        React.createElement("p", { style: { marginTop: "16px" } },
          "After repeated unsuccessful KYC attempts, your account has been removed from the platform."
        ),
        React.createElement("p", { style: { marginTop: "16px", padding: "12px", background: "#fef2f2", borderRadius: "8px" } },
          "Reason: ",
          args.reason
        ),
        React.createElement("p", { style: { marginTop: "24px", color: "#6b7280", fontSize: "14px" } },
          "If you believe this is an error, please contact support."
        )
      ),
    });
    return { sent: true };
  },
});
