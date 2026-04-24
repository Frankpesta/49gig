import { query, internalQuery, type QueryCtx } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../auth";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Internal: load chat by id (for scheduled emails / actions).
 */
export const getChatByIdInternal = internalQuery({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.chatId);
  },
});

async function attachUnreadCounts<T extends Doc<"chats">>(
  ctx: QueryCtx,
  userId: Id<"users">,
  isStaff: boolean,
  chats: T[]
): Promise<Array<T & { unreadCount: number }>> {
  return Promise.all(
    chats.map(async (chat) => {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
        .order("desc")
        .take(40);
      let unreadCount = 0;
      for (const message of messages) {
        if (message.senderId === userId) continue;
        if (message.isDeleted && !isStaff) continue;
        const isRead = message.readBy.some((r) => r.userId === userId);
        if (!isRead) unreadCount++;
      }
      return { ...chat, unreadCount };
    })
  );
}

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

    const isStaff = user.role === "admin" || user.role === "moderator";

    // Get all chats where user is a participant
    // Note: participants is an array, so we need to filter instead of using index
    const allChats = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const chats = allChats.filter((chat) => chat.participants.includes(user._id));

    // For admins/moderators, also include all chats
    if (isStaff) {
      const staffChats = await ctx.db
        .query("chats")
        .withIndex("by_type")
        .filter((q) => q.eq(q.field("status"), "active"))
        .order("desc")
        .collect();

      // Merge and deduplicate
      const chatMap = new Map<string, Doc<"chats">>();
      [...chats, ...staffChats].forEach((chat) => {
        chatMap.set(chat._id, chat);
      });
      const sorted = Array.from(chatMap.values()).sort(
        (a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0)
      );
      return attachUnreadCounts(ctx, user._id, true, sorted);
    }

    const sorted = chats.sort(
      (a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0)
    );
    return attachUnreadCounts(ctx, user._id, false, sorted);
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

    // Check authorization - user must be client or matched freelancer (single or team)
    const isClient = project.clientId === user._id;
    const isFreelancer =
      project.matchedFreelancerId === user._id ||
      (project.matchedFreelancerIds && project.matchedFreelancerIds.includes(user._id));
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
 * Project chat messages for dispute evidence: display names and optional
 * "partial team" filter (client + only disputed freelancers, plus system messages).
 */
export const getProjectChatMessagesForDisputeEvidence = query({
  args: {
    projectId: v.string(),
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
    evidenceFilter: v.union(
      v.object({ kind: v.literal("all") }),
      v.object({
        kind: v.literal("partial"),
        disputedFreelancerIds: v.array(v.id("users")),
      })
    ),
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

    const project = await ctx.db.get(projectId);
    if (!project) {
      return null;
    }

    const isClient = project.clientId === user._id;
    const isFreelancer =
      project.matchedFreelancerId === user._id ||
      (project.matchedFreelancerIds && project.matchedFreelancerIds.includes(user._id));
    const isAdminOrModerator =
      user.role === "admin" || user.role === "moderator";

    if (!isClient && !isFreelancer && !isAdminOrModerator) {
      return null;
    }

    const existingChat = await ctx.db
      .query("chats")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .first();

    if (!existingChat) {
      return null;
    }

    if (args.evidenceFilter.kind === "partial" && args.evidenceFilter.disputedFreelancerIds.length === 0) {
      return { chatId: existingChat._id, messages: [] };
    }

    const limit = args.limit ?? 100;
    const raw = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", existingChat._id))
      .order("desc")
      .take(limit);

    const visible =
      isAdminOrModerator ? raw : raw.filter((msg) => !msg.isDeleted);
    const chronological = visible.slice().reverse();

    let toProcess = chronological;
    if (args.evidenceFilter.kind === "partial") {
      const allow = new Set<Id<"users">>([
        project.clientId,
        ...args.evidenceFilter.disputedFreelancerIds,
      ]);
      toProcess = chronological.filter((m) => {
        if (m.senderRole === "system") {
          return true;
        }
        return allow.has(m.senderId);
      });
    }

    const uniqueIds = [...new Set(toProcess.map((m) => m.senderId))];
    const userDocs = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)));
    const nameById = new Map<Id<"users">, string>();
    for (let i = 0; i < uniqueIds.length; i++) {
      const u = userDocs[i];
      nameById.set(uniqueIds[i] as Id<"users">, u?.name ?? "Unknown");
    }

    const messages = toProcess.map((m) => {
      const senderDisplayName = nameById.get(m.senderId) ?? "Unknown";
      return { ...m, senderDisplayName };
    });

    return { chatId: existingChat._id, messages };
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

    const enriched = await Promise.all(
      chats.map(async (chat) => {
        const participantDetails = await Promise.all(
          chat.participants.map(async (uid) => {
            const u = await ctx.db.get(uid);
            return u ? { _id: u._id, name: u.name, role: u.role } : null;
          })
        );
        const filtered = participantDetails.filter(Boolean);
        const client = filtered.find((p) => p?.role === "client");
        const freelancer = filtered.find((p) => p?.role === "freelancer");
        return { ...chat, clientName: client?.name ?? null, freelancerName: freelancer?.name ?? null };
      })
    );

    const sorted = enriched.sort(
      (a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0)
    );
    return attachUnreadCounts(ctx, user._id, true, sorted);
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

    const allStatuses = await ctx.db
      .query("chats")
      .withIndex("by_type", (q) => q.eq("type", "support"))
      .order("desc")
      .collect();

    const enriched = await Promise.all(
      allStatuses.map(async (chat) => {
        const openerDetails = chat.participants[0]
          ? await ctx.db.get(chat.participants[0])
          : null;
        const assignedMod = chat.supportAssignedModeratorId
          ? await ctx.db.get(chat.supportAssignedModeratorId)
          : null;
        return {
          ...chat,
          openerName: openerDetails?.name ?? null,
          openerRole: openerDetails?.role ?? null,
          openerEmail: openerDetails?.email ?? null,
          assignedModeratorName: assignedMod?.name ?? null,
        };
      })
    );

    return enriched.sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0));
  },
});

/**
 * Get chat with participant details (name, profile image) for display.
 * Only returns data if the user is a participant.
 */
export const getChatWithParticipantDetails = query({
  args: {
    chatId: v.id("chats"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = args.userId
      ? await ctx.db.get(args.userId)
      : await getCurrentUser(ctx);
    if (!user || user.status !== "active") return null;

    const chat = await ctx.db.get(args.chatId);
    if (!chat) return null;
    const isParticipant = chat.participants.includes(user._id);
    const isAdminOrModerator =
      user.role === "admin" || user.role === "moderator";
    if (!isParticipant && !isAdminOrModerator) return null;

    const participants = await Promise.all(
      chat.participants.map(async (userId) => {
        const u = await ctx.db.get(userId);
        return u
          ? {
              _id: u._id,
              name: u.name || "Unknown",
              imageUrl: u.profile?.imageUrl,
            }
          : { _id: userId, name: "Unknown", imageUrl: undefined };
      })
    );

    return { ...chat, participants };
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

