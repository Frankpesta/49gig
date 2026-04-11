import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

const ACTIVE_FREELANCER_PROJECT_STATUSES = new Set<string>([
  "pending_funding",
  "funded",
  "matching",
  "awaiting_freelancer",
  "matched",
  "in_progress",
  "disputed",
]);

const ALL_PROJECT_STATUSES = [
  "draft",
  "pending_funding",
  "funded",
  "matching",
  "awaiting_freelancer",
  "matched",
  "in_progress",
  "completed",
  "cancelled",
  "disputed",
] as const;

function projectReferencesFreelancer(
  p: Doc<"projects">,
  userId: Id<"users">
): boolean {
  if (p.matchedFreelancerId === userId) return true;
  if (p.selectedFreelancerId === userId) return true;
  if (p.matchedFreelancerIds?.includes(userId)) return true;
  if (p.selectedFreelancerIds?.includes(userId)) return true;
  return false;
}

async function deleteStorageIfPresent(
  ctx: MutationCtx,
  fileId: Id<"_storage"> | undefined
) {
  if (!fileId) return;
  try {
    await ctx.storage.delete(fileId);
  } catch {
    // File may already be removed
  }
}

async function patchProjectStripFreelancer(
  ctx: MutationCtx,
  p: Doc<"projects">,
  userId: Id<"users">
) {
  if (!projectReferencesFreelancer(p, userId)) return;

  const patch: Record<string, unknown> = { updatedAt: Date.now() };
  if (p.matchedFreelancerId === userId) patch.matchedFreelancerId = undefined;
  if (p.selectedFreelancerId === userId) patch.selectedFreelancerId = undefined;
  if (p.matchedFreelancerIds?.length) {
    const next = p.matchedFreelancerIds.filter((id) => id !== userId);
    patch.matchedFreelancerIds = next.length ? next : undefined;
  }
  if (p.selectedFreelancerIds?.length) {
    const next = p.selectedFreelancerIds.filter((id) => id !== userId);
    patch.selectedFreelancerIds = next.length ? next : undefined;
  }
  if (p.permanentlyExcludedFreelancerIds?.length) {
    const next = p.permanentlyExcludedFreelancerIds.filter((id) => id !== userId);
    patch.permanentlyExcludedFreelancerIds = next.length ? next : undefined;
  }
  if (p.freelancerContractSignatures?.length) {
    const next = p.freelancerContractSignatures.filter(
      (s) => s.freelancerId !== userId
    );
    patch.freelancerContractSignatures = next.length ? next : undefined;
  }

  await ctx.db.patch(p._id, patch as Partial<Doc<"projects">>);
}

export type HardDeleteUserAccountOptions = {
  targetUserId: Id<"users">;
  /** Stored on the final audit row before the user document is removed */
  auditActorId: Id<"users">;
  auditActorRole: Doc<"users">["role"] | "system";
  auditActionType: "admin" | "system" | "auth";
  reason?: string;
};

/**
 * Permanently removes the user document and purges user-owned rows.
 * Blocks when the user still owns projects, has wallet balance, open disputes, or active hire involvement.
 */
export async function hardDeleteUserAccount(
  ctx: MutationCtx,
  opts: HardDeleteUserAccountOptions
): Promise<void> {
  const { targetUserId, auditActorId, auditActorRole, auditActionType, reason } =
    opts;

  const user = await ctx.db.get(targetUserId);
  if (!user) return;

  const asClient = await ctx.db
    .query("projects")
    .withIndex("by_client", (q) => q.eq("clientId", targetUserId))
    .collect();
  if (asClient.length > 0) {
    throw new Error(
      "Cannot delete this account: the user is a client on one or more projects. Remove or reassign those projects first."
    );
  }

  for (const status of ACTIVE_FREELANCER_PROJECT_STATUSES) {
    const projs = await ctx.db
      .query("projects")
      .withIndex("by_status", (q) =>
        q.eq("status", status as Doc<"projects">["status"])
      )
      .collect();
    for (const p of projs) {
      if (projectReferencesFreelancer(p, targetUserId)) {
        throw new Error(
          "Cannot delete this account: the user is tied to an active hire, escrow, or dispute-related project."
        );
      }
    }
  }

  const wallet = await ctx.db
    .query("wallets")
    .withIndex("by_user", (q) => q.eq("userId", targetUserId))
    .first();
  if (wallet && wallet.balanceCents > 0) {
    throw new Error(
      "Cannot delete this account: wallet balance must be zero (withdraw or adjust first)."
    );
  }

  const payoutReqs = await ctx.db
    .query("clientReferralPayoutRequests")
    .withIndex("by_user", (q) => q.eq("userId", targetUserId))
    .collect();
  for (const r of payoutReqs) {
    if (r.status === "pending" || r.status === "processing") {
      throw new Error(
        "Cannot delete this account: pending referral payout requests must be completed or rejected first."
      );
    }
  }

  for (const disputeStatus of ["open", "under_review"] as const) {
    const openBatch = await ctx.db
      .query("disputes")
      .withIndex("by_status", (q) => q.eq("status", disputeStatus))
      .collect();
    for (const d of openBatch) {
      const proj = await ctx.db.get(d.projectId);
      if (!proj) continue;
      if (
        proj.clientId === targetUserId ||
        projectReferencesFreelancer(proj, targetUserId)
      ) {
        throw new Error(
          "Cannot delete this account: user is involved in an open or in-review dispute."
        );
      }
    }
  }

  const initiatedDisputes = await ctx.db
    .query("disputes")
    .withIndex("by_initiator", (q) => q.eq("initiatorId", targetUserId))
    .collect();

  if (user.role === "admin") {
    const admins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();
    const otherActiveAdmins = admins.filter(
      (a) => a._id !== targetUserId && a.status === "active"
    );
    if (otherActiveAdmins.length === 0) {
      throw new Error("Cannot delete the last admin account.");
    }
  }

  const now = Date.now();

  await deleteStorageIfPresent(ctx, user.resumeFileId);

  const kyc = await ctx.db
    .query("kycSubmissions")
    .withIndex("by_freelancer", (q) => q.eq("freelancerId", targetUserId))
    .first();
  if (kyc) {
    await deleteStorageIfPresent(ctx, kyc.idFrontFileId);
    await deleteStorageIfPresent(ctx, kyc.idBackFileId);
    await deleteStorageIfPresent(ctx, kyc.addressDocFileId);
    await ctx.db.delete(kyc._id);
  }

  const blogPosts = await ctx.db
    .query("blogPosts")
    .withIndex("by_author", (q) => q.eq("authorId", targetUserId))
    .collect();
  for (const post of blogPosts) {
    await deleteStorageIfPresent(ctx, post.bannerImageId);
    const likes = await ctx.db
      .query("blogPostLikes")
      .withIndex("by_post", (q) => q.eq("postId", post._id))
      .collect();
    for (const like of likes) await ctx.db.delete(like._id);
    const comments = await ctx.db
      .query("blogComments")
      .withIndex("by_post", (q) => q.eq("postId", post._id))
      .collect();
    for (const c of comments) await ctx.db.delete(c._id);
    await ctx.db.delete(post._id);
  }

  const allComments = await ctx.db.query("blogComments").collect();
  for (const c of allComments) {
    if (c.authorId === targetUserId) await ctx.db.delete(c._id);
  }

  const allLikes = await ctx.db.query("blogPostLikes").collect();
  for (const like of allLikes) {
    if (like.userId === targetUserId) await ctx.db.delete(like._id);
  }

  const messagesFromUser = await ctx.db
    .query("messages")
    .withIndex("by_sender", (q) => q.eq("senderId", targetUserId))
    .collect();
  for (const m of messagesFromUser) await ctx.db.delete(m._id);

  const allChats = await ctx.db.query("chats").collect();
  const userChats = allChats.filter((c) => c.participants.includes(targetUserId));
  for (const chat of userChats) {
    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
      .collect();
    for (const m of msgs) {
      const readBy = m.readBy.filter((r) => r.userId !== targetUserId);
      if (readBy.length !== m.readBy.length) {
        await ctx.db.patch(m._id, { readBy });
      }
    }
    const nextParticipants = chat.participants.filter((id) => id !== targetUserId);
    if (nextParticipants.length === 0) {
      const remaining = await ctx.db
        .query("messages")
        .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
        .collect();
      for (const m of remaining) await ctx.db.delete(m._id);
      await ctx.db.delete(chat._id);
    } else {
      await ctx.db.patch(chat._id, {
        participants: nextParticipants,
        updatedAt: now,
        ...(chat.supportAssignedModeratorId === targetUserId
          ? { supportAssignedModeratorId: undefined }
          : {}),
      });
    }
  }

  const notifications = await ctx.db
    .query("notifications")
    .withIndex("by_user", (q) => q.eq("userId", targetUserId))
    .collect();
  for (const n of notifications) await ctx.db.delete(n._id);

  const sessions = await ctx.db
    .query("sessions")
    .withIndex("by_user", (q) => q.eq("userId", targetUserId))
    .collect();
  for (const s of sessions) await ctx.db.delete(s._id);

  const emailTok = await ctx.db
    .query("emailVerificationTokens")
    .withIndex("by_user", (q) => q.eq("userId", targetUserId))
    .collect();
  for (const t of emailTok) await ctx.db.delete(t._id);

  const passTok = await ctx.db
    .query("passwordResetTokens")
    .withIndex("by_user", (q) => q.eq("userId", targetUserId))
    .collect();
  for (const t of passTok) await ctx.db.delete(t._id);

  const twoFac = await ctx.db
    .query("twoFactorTokens")
    .withIndex("by_user", (q) => q.eq("userId", targetUserId))
    .collect();
  for (const t of twoFac) await ctx.db.delete(t._id);

  if (wallet) {
    const wtx = await ctx.db
      .query("walletTransactions")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .collect();
    for (const tx of wtx) await ctx.db.delete(tx._id);
    await ctx.db.delete(wallet._id);
  }

  const matches = await ctx.db
    .query("matches")
    .withIndex("by_freelancer", (q) => q.eq("freelancerId", targetUserId))
    .collect();
  for (const m of matches) await ctx.db.delete(m._id);

  const skillSessions = await ctx.db
    .query("vettingSkillTestSessions")
    .withIndex("by_freelancer", (q) => q.eq("freelancerId", targetUserId))
    .collect();
  for (const s of skillSessions) await ctx.db.delete(s._id);

  const vetting = await ctx.db
    .query("vettingResults")
    .withIndex("by_freelancer", (q) => q.eq("freelancerId", targetUserId))
    .collect();
  for (const vDoc of vetting) await ctx.db.delete(vDoc._id);

  const reviewsAsClient = await ctx.db
    .query("reviews")
    .withIndex("by_client", (q) => q.eq("clientId", targetUserId))
    .collect();
  for (const r of reviewsAsClient) await ctx.db.delete(r._id);

  const reviewsAsFreelancer = await ctx.db
    .query("reviews")
    .withIndex("by_freelancer", (q) => q.eq("freelancerId", targetUserId))
    .collect();
  for (const r of reviewsAsFreelancer) await ctx.db.delete(r._id);

  const accrualsAsReferrer = await ctx.db
    .query("referralAccruals")
    .withIndex("by_referrer", (q) => q.eq("referrerId", targetUserId))
    .collect();
  for (const a of accrualsAsReferrer) await ctx.db.delete(a._id);

  const accrualsAsReferred = await ctx.db
    .query("referralAccruals")
    .withIndex("by_referred_client", (q) => q.eq("referredClientId", targetUserId))
    .collect();
  for (const a of accrualsAsReferred) await ctx.db.delete(a._id);

  const calls = await ctx.db.query("scheduledCalls").collect();
  for (const call of calls) {
    if (!call.freelancerIds.includes(targetUserId)) continue;
    const nextIds = call.freelancerIds.filter((id) => id !== targetUserId);
    if (nextIds.length === 0) await ctx.db.delete(call._id);
    else await ctx.db.patch(call._id, { freelancerIds: nextIds, updatedAt: now });
  }

  for (const d of initiatedDisputes) {
    const dmsgs = await ctx.db
      .query("disputeMessages")
      .withIndex("by_dispute", (q) => q.eq("disputeId", d._id))
      .collect();
    for (const dm of dmsgs) await ctx.db.delete(dm._id);
    await ctx.db.delete(d._id);
  }

  const disputesAsMod = await ctx.db
    .query("disputes")
    .withIndex("by_moderator", (q) => q.eq("assignedModeratorId", targetUserId))
    .collect();
  for (const d of disputesAsMod) {
    await ctx.db.patch(d._id, {
      assignedModeratorId: undefined,
      updatedAt: now,
    });
  }

  const disputeMsgs = await ctx.db.query("disputeMessages").collect();
  for (const dm of disputeMsgs) {
    if (dm.authorId === targetUserId) await ctx.db.delete(dm._id);
  }

  for (const r of payoutReqs) await ctx.db.delete(r._id);

  for (const status of ALL_PROJECT_STATUSES) {
    const projs = await ctx.db
      .query("projects")
      .withIndex("by_status", (q) =>
        q.eq("status", status as Doc<"projects">["status"])
      )
      .collect();
    for (const p of projs) {
      await patchProjectStripFreelancer(ctx, p, targetUserId);
    }
  }

  const referredUsers = await ctx.db
    .query("users")
    .withIndex("by_referred_by", (q) => q.eq("referredByUserId", targetUserId))
    .collect();
  for (const u of referredUsers) {
    await ctx.db.patch(u._id, {
      referredByUserId: undefined,
      referralAttributedAt: undefined,
      updatedAt: now,
    });
  }

  const allUsers = await ctx.db.query("users").collect();
  for (const u of allUsers) {
    if (u._id === targetUserId) continue;
    if (u.roleChangedBy !== targetUserId && u.suspendedBy !== targetUserId) continue;
    await ctx.db.patch(u._id, {
      ...(u.roleChangedBy === targetUserId ? { roleChangedBy: undefined } : {}),
      ...(u.suspendedBy === targetUserId ? { suspendedBy: undefined } : {}),
      updatedAt: now,
    });
  }

  const enquiries = await ctx.db.query("contactEnquiries").collect();
  for (const e of enquiries) {
    if (
      e.assignedModeratorId !== targetUserId &&
      e.repliedBy !== targetUserId
    ) {
      continue;
    }
    await ctx.db.patch(e._id, {
      ...(e.assignedModeratorId === targetUserId
        ? { assignedModeratorId: undefined, assignedAt: undefined }
        : {}),
      ...(e.repliedBy === targetUserId ? { repliedBy: undefined } : {}),
      updatedAt: now,
    });
  }

  const pricing = await ctx.db
    .query("pricingConfig")
    .withIndex("by_key", (q) => q.eq("key", "baseRates"))
    .first();
  if (pricing?.updatedBy === targetUserId) {
    await ctx.db.patch(pricing._id, { updatedBy: undefined, updatedAt: now });
  }

  const settings = await ctx.db.query("platformSettings").collect();
  for (const row of settings) {
    if (row.updatedBy === targetUserId) {
      await ctx.db.patch(row._id, { updatedBy: undefined, updatedAt: now });
    }
  }

  const auditsByActor = await ctx.db
    .query("auditLogs")
    .withIndex("by_actor", (q) => q.eq("actorId", targetUserId))
    .collect();
  for (const a of auditsByActor) await ctx.db.delete(a._id);

  const auditsByTarget = await ctx.db
    .query("auditLogs")
    .withIndex("by_target", (q) =>
      q.eq("targetType", "user").eq("targetId", targetUserId as string)
    )
    .collect();
  for (const a of auditsByTarget) await ctx.db.delete(a._id);

  await ctx.db.insert("auditLogs", {
    action: "account_hard_deleted",
    actionType: auditActionType,
    actorId: auditActorId,
    actorRole: auditActorRole,
    targetType: "user",
    targetId: targetUserId as string,
    details: {
      reason,
      deletedEmail: user.email,
      deletedName: user.name,
      deletedRole: user.role,
    },
    createdAt: now,
  });

  await ctx.db.delete(targetUserId);
}
