"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { sendEmail } from "../email/send";
import React from "react";

const internalAny = require("../_generated/api").internal as any;

/**
 * Email moderator when an admin assigns them to a support chat.
 */
export const sendSupportChatAssignedEmailInternal = internalAction({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const chat = (await ctx.runQuery(internalAny.chat.queries.getChatByIdInternal, {
      chatId: args.chatId,
    })) as Doc<"chats"> | null;
    if (!chat || chat.type !== "support" || !chat.supportAssignedModeratorId) {
      return;
    }

    const moderator = (await ctx.runQuery(internalAny.users.queries.getUserByIdInternal, {
      userId: chat.supportAssignedModeratorId as Id<"users">,
    })) as Doc<"users"> | null;
    if (!moderator?.email) return;

    const appUrl =
      process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://49gig.com";
    const threadUrl = `${appUrl}/dashboard/chat/support/${args.chatId}`;

    await sendEmail({
      to: moderator.email,
      subject: `[49GIG] Support assigned: ${chat.title ?? "New thread"}`,
      react: React.createElement(
        "div",
        { style: { fontFamily: "sans-serif", padding: "24px", maxWidth: "600px" } },
        React.createElement("p", null, `Hi ${moderator.name ?? "there"},`),
        React.createElement(
          "p",
          { style: { marginTop: "16px" } },
          "An admin assigned a support conversation to you."
        ),
        React.createElement("p", { style: { marginTop: "12px" } }, React.createElement("strong", null, "Subject: "), chat.title ?? "(no subject)"),
        React.createElement("a", {
          href: threadUrl,
          style: {
            display: "inline-block",
            marginTop: "24px",
            padding: "12px 24px",
            backgroundColor: "#2563eb",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
          },
        }, "Open support thread")
      ),
    });
  },
});
