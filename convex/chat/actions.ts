"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { sendEmail } from "../email/send";
import React from "react";
import { SystemNoticeEmail } from "../../emails/templates";

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
    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    await sendEmail({
      to: moderator.email,
      subject: `[49GIG] Support assigned: ${chat.title ?? "New thread"}`,
      react: React.createElement(SystemNoticeEmail, {
        name: moderator.name ?? "there",
        appUrl,
        logoUrl: `${appUrl}/logo-light.png`,
        date,
        heroLabel: "Support",
        headline: "A support conversation was assigned to you",
        details: [{ label: "Subject", value: chat.title ?? "(no subject)" }],
        bodyText: "An admin assigned this support conversation to you.",
        ctaHref: threadUrl,
        ctaLabel: "Open support thread",
      }),
    });
  },
});
