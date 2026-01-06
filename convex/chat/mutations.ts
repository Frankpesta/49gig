import { mutation, MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc } from "../_generated/dataModel";

/**
 * Helper to get current user in mutations
 */
async function getCurrentUserInMutation(
  ctx: MutationCtx,
  userId?: string
): Promise<Doc<"users"> | null> {
  if (userId) {
    const user = await ctx.db.get(userId as Doc<"users">["_id"]);
    if (!user || user.status !== "active") {
      return null;
    }
    return user;
  }

  const user = await getCurrentUser(ctx);
  if (!user || user.status !== "active") {
    return null;
  }
  return user as Doc<"users">;
}

/**
 * Create or get project chat
 * Automatically creates chat when project is matched
 */
export const createProjectChat = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get project
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check authorization
    const isClient = project.clientId === user._id;
    const isFreelancer = project.matchedFreelancerId === user._id;
    const isAdminOrModerator =
      user.role === "admin" || user.role === "moderator";

    if (!isClient && !isFreelancer && !isAdminOrModerator) {
      throw new Error("Unauthorized");
    }

    // Check if chat already exists
    const existingChat = await ctx.db
      .query("chats")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();

    if (existingChat) {
      return existingChat._id;
    }

    // Create participants array
    const participants: Doc<"users">["_id"][] = [project.clientId];
    if (project.matchedFreelancerId) {
      participants.push(project.matchedFreelancerId);
    }

    // Create chat
    const chatId = await ctx.db.insert("chats", {
      type: "project",
      participants,
      projectId: args.projectId,
      title: `Project: ${project.intakeForm?.title || "Untitled"}`,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "chat_created",
      actionType: "system",
      actorId: user._id,
      actorRole: user.role,
      targetType: "chat",
      targetId: chatId,
      details: {
        type: "project",
        projectId: args.projectId,
      },
      createdAt: Date.now(),
    });

    return chatId;
  },
});

/**
 * Send a message in a chat
 */
export const sendMessage = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    contentType: v.union(
      v.literal("text"),
      v.literal("file"),
      v.literal("system")
    ),
    attachments: v.optional(
      v.array(
        v.object({
          fileId: v.id("_storage"),
          fileName: v.string(),
          fileSize: v.number(),
          mimeType: v.string(),
          url: v.string(),
        })
      )
    ),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Validate content
    if (!args.content.trim() && !args.attachments?.length) {
      throw new Error("Message content or attachment required");
    }

    // Get chat
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    // Check authorization
    const isParticipant = chat.participants.includes(user._id);
    const isAdminOrModerator =
      user.role === "admin" || user.role === "moderator";

    if (!isParticipant && !isAdminOrModerator) {
      throw new Error("Unauthorized");
    }

    // Determine sender role
    const senderRole =
      user.role === "admin"
        ? "admin"
        : user.role === "moderator"
        ? "moderator"
        : user.role === "client"
        ? "client"
        : user.role === "freelancer"
        ? "freelancer"
        : "system";

    // Create message
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      senderId: user._id,
      senderRole,
      content: args.content,
      contentType: args.contentType,
      attachments: args.attachments,
      isPinned: false,
      isDeleted: false,
      readBy: [], // Will be updated when recipients read
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update chat metadata
    await ctx.db.patch(args.chatId, {
      lastMessageAt: Date.now(),
      lastMessagePreview: args.content.substring(0, 100),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "message_sent",
      actionType: "system",
      actorId: user._id,
      actorRole: user.role,
      targetType: "message",
      targetId: messageId,
      details: {
        chatId: args.chatId,
        contentType: args.contentType,
      },
      createdAt: Date.now(),
    });

    return messageId;
  },
});

/**
 * Mark messages as read
 */
export const markAsRead = mutation({
  args: {
    chatId: v.id("chats"),
    messageIds: v.optional(v.array(v.id("messages"))),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get chat
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    // Check authorization
    const isParticipant = chat.participants.includes(user._id);
    if (!isParticipant) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();

    if (args.messageIds && args.messageIds.length > 0) {
      // Mark specific messages as read
      for (const messageId of args.messageIds) {
        const message = await ctx.db.get(messageId);
        if (!message || message.chatId !== args.chatId) {
          continue;
        }

        // Check if already read
        const alreadyRead = message.readBy.some(
          (read) => read.userId === user._id
        );

        if (!alreadyRead) {
          await ctx.db.patch(messageId, {
            readBy: [
              ...message.readBy,
              {
                userId: user._id,
                readAt: now,
              },
            ],
            updatedAt: now,
          });
        }
      }
    } else {
      // Mark all unread messages in chat as read
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
        .filter((q) =>
          q.and(
            q.neq(q.field("senderId"), user._id), // Not own messages
            q.eq(q.field("isDeleted"), false) // Not deleted
          )
        )
        .collect();

      for (const message of messages) {
        const alreadyRead = message.readBy.some(
          (read) => read.userId === user._id
        );

        if (!alreadyRead) {
          await ctx.db.patch(message._id, {
            readBy: [
              ...message.readBy,
              {
                userId: user._id,
                readAt: now,
              },
            ],
            updatedAt: now,
          });
        }
      }
    }

    return { success: true };
  },
});

/**
 * Pin/unpin a message
 */
export const togglePinMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Get chat
    const chat = await ctx.db.get(message.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    // Check authorization - must be participant or admin/moderator
    const isParticipant = chat.participants.includes(user._id);
    const isAdminOrModerator =
      user.role === "admin" || user.role === "moderator";

    if (!isParticipant && !isAdminOrModerator) {
      throw new Error("Unauthorized");
    }

    // Toggle pin status
    await ctx.db.patch(args.messageId, {
      isPinned: !message.isPinned,
      updatedAt: Date.now(),
    });

    return { success: true, isPinned: !message.isPinned };
  },
});

/**
 * Soft delete a message
 */
export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Check authorization - can delete own messages or admin/moderator can delete any
    const isOwner = message.senderId === user._id;
    const isAdminOrModerator =
      user.role === "admin" || user.role === "moderator";

    if (!isOwner && !isAdminOrModerator) {
      throw new Error("Unauthorized");
    }

    // Soft delete
    await ctx.db.patch(args.messageId, {
      isDeleted: true,
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "message_deleted",
      actionType: "system",
      actorId: user._id,
      actorRole: user.role,
      targetType: "message",
      targetId: args.messageId,
      details: {
        chatId: message.chatId,
        wasOwner: isOwner,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Create support chat
 */
export const createSupportChat = mutation({
  args: {
    subject: v.string(),
    initialMessage: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Create support chat
    const chatId = await ctx.db.insert("chats", {
      type: "support",
      participants: [user._id], // Admin/moderator will be added when they respond
      supportRequestId: `support_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      title: args.subject,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create initial message
    const senderRole =
      user.role === "admin"
        ? "admin"
        : user.role === "moderator"
        ? "moderator"
        : user.role === "client"
        ? "client"
        : user.role === "freelancer"
        ? "freelancer"
        : "system";

    await ctx.db.insert("messages", {
      chatId,
      senderId: user._id,
      senderRole,
      content: args.initialMessage,
      contentType: "text",
      isPinned: false,
      isDeleted: false,
      readBy: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update chat metadata
    await ctx.db.patch(chatId, {
      lastMessageAt: Date.now(),
      lastMessagePreview: args.initialMessage.substring(0, 100),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "support_chat_created",
      actionType: "system",
      actorId: user._id,
      actorRole: user.role,
      targetType: "chat",
      targetId: chatId,
      createdAt: Date.now(),
    });

    return chatId;
  },
});

/**
 * Archive a chat
 */
export const archiveChat = mutation({
  args: {
    chatId: v.id("chats"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserInMutation(ctx, args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    // Check authorization
    const isParticipant = chat.participants.includes(user._id);
    const isAdminOrModerator =
      user.role === "admin" || user.role === "moderator";

    if (!isParticipant && !isAdminOrModerator) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.chatId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

