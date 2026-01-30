import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";

/**
 * Get all chats for the current user
 * Returns project chats, support chats, and system chats
 */
export const getChats = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = args.userId
      ? await ctx.db.get(args.userId)
      : await getCurrentUser(ctx);

    if (!user || user.status !== "active") {
      return [];
    }

    // Get all chats where user is a participant
    // Note: participants is an array, so we need to filter instead of using index
    const allChats = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    const chats = allChats.filter((chat) => chat.participants.includes(user._id));

    // For admins/moderators, also include all chats
    if (user.role === "admin" || user.role === "moderator") {
      const allChats = await ctx.db
        .query("chats")
        .withIndex("by_type")
        .filter((q) => q.eq(q.field("status"), "active"))
        .order("desc")
        .collect();

      // Merge and deduplicate
      const chatMap = new Map();
      [...chats, ...allChats].forEach((chat) => {
        chatMap.set(chat._id, chat);
      });
      return Array.from(chatMap.values()).sort(
        (a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0)
      );
    }

    return chats.sort(
      (a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0)
    );
  },
});

/**
 * Get a specific chat by ID
 * Includes authorization check
 */
export const getChat = query({
  args: {
    chatId: v.id("chats"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = args.userId
      ? await ctx.db.get(args.userId)
      : await getCurrentUser(ctx);

    if (!user || user.status !== "active") {
      return null;
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      return null;
    }

    // Check authorization
    const isParticipant = chat.participants.includes(user._id);
    const isAdminOrModerator =
      user.role === "admin" || user.role === "moderator";

    if (!isParticipant && !isAdminOrModerator) {
      return null;
    }

    return chat;
  },
});

/**
 * Get messages for a chat
 * Real-time subscription for live updates
 */
export const getMessages = query({
  args: {
    chatId: v.id("chats"),
    limit: v.optional(v.number()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = args.userId
      ? await ctx.db.get(args.userId)
      : await getCurrentUser(ctx);

    if (!user || user.status !== "active") {
      return [];
    }

    // Check chat access
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      return [];
    }

    const isParticipant = chat.participants.includes(user._id);
    const isAdminOrModerator =
      user.role === "admin" || user.role === "moderator";

    if (!isParticipant && !isAdminOrModerator) {
      return [];
    }

    // Get messages (excluding soft-deleted ones for non-admins)
    const limit = args.limit || 50;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("desc")
      .take(limit);

    // Filter deleted messages (admins/moderators can see them)
    const filteredMessages =
      isAdminOrModerator
        ? messages
        : messages.filter((msg) => !msg.isDeleted);

    return filteredMessages.reverse(); // Return in chronological order
  },
});

/**
 * Get project chat for a specific project.
 * Accepts projectId as string (e.g. from URL) and normalizes to support external IDs.
 */
export const getProjectChat = query({
  args: {
    projectId: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const projectId = ctx.db.normalizeId("projects", args.projectId);
    if (!projectId) {
      return null;
    }

    const user = args.userId
      ? await ctx.db.get(args.userId)
      : await getCurrentUser(ctx);

    if (!user || user.status !== "active") {
      return null;
    }

    // Get project
    const project = await ctx.db.get(projectId);
    if (!project) {
      return null;
    }

    // Check authorization - user must be client or matched freelancer
    const isClient = project.clientId === user._id;
    const isFreelancer =
      project.matchedFreelancerId === user._id;
    const isAdminOrModerator =
      user.role === "admin" || user.role === "moderator";

    if (!isClient && !isFreelancer && !isAdminOrModerator) {
      return null;
    }

    // Find existing project chat
    const existingChat = await ctx.db
      .query("chats")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    if (existingChat) {
      return existingChat;
    }

    // Chat doesn't exist yet - will be created by mutation
    return null;
  },
});

/**
 * Get all project chats (client–freelancer) for admin/moderator.
 * Allows admin to view and separate project communication from support chats.
 */
export const getProjectChatsForAdmin = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = args.userId
      ? await ctx.db.get(args.userId)
      : await getCurrentUser(ctx);

    if (!user || user.status !== "active") {
      return [];
    }

    if (user.role !== "admin" && user.role !== "moderator") {
      return [];
    }

    const chats = await ctx.db
      .query("chats")
      .withIndex("by_type", (q) => q.eq("type", "project"))
      .filter((q) => q.eq(q.field("status"), "active"))
      .order("desc")
      .collect();

    return chats.sort(
      (a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0)
    );
  },
});

/**
 * Get all support chats for admin/moderator.
 * Allows admin to view and separate support requests from project chats.
 */
export const getSupportChatsForAdmin = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = args.userId
      ? await ctx.db.get(args.userId)
      : await getCurrentUser(ctx);

    if (!user || user.status !== "active") {
      return [];
    }

    if (user.role !== "admin" && user.role !== "moderator") {
      return [];
    }

    const chats = await ctx.db
      .query("chats")
      .withIndex("by_type", (q) => q.eq("type", "support"))
      .filter((q) => q.eq(q.field("status"), "active"))
      .order("desc")
      .collect();

    return chats.sort(
      (a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0)
    );
  },
});

/**
 * Get unread message count for a user
 */
export const getUnreadCount = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = args.userId
      ? await ctx.db.get(args.userId)
      : await getCurrentUser(ctx);

    if (!user || user.status !== "active") {
      return 0;
    }

    // Get all user's chats
    // Note: participants is an array, so we need to filter instead of using index
    const allChats = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    const chats = allChats.filter((chat) => chat.participants.includes(user._id));

    let unreadCount = 0;

    for (const chat of chats) {
      // Get latest messages
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
        .order("desc")
        .take(10);

      // Count unread messages (not read by user)
      for (const message of messages) {
        if (message.senderId === user._id) {
          continue; // Skip own messages
        }
        if (message.isDeleted) {
          continue; // Skip deleted messages
        }

        const isRead = message.readBy.some(
          (read) => read.userId === user._id
        );
        if (!isRead) {
          unreadCount++;
        }
      }
    }

    return unreadCount;
  },
});

