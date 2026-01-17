import { internalAction } from "../_generated/server";

const internalAny: any = require("../_generated/api").internal;
const cleanupSessions = internalAny.auth.sessions.cleanupSessions;

/**
 * Cleanup expired sessions
 * Runs every hour to remove expired and revoked sessions
 */
export const cleanupExpiredSessions = internalAction({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    timestamp: number;
    expiredDeleted: number;
    revokedDeleted: number;
    totalDeleted: number;
  }> => {
    const now = Date.now();
    const revokeBefore = now - 30 * 24 * 60 * 60 * 1000; // 30 days

    const result = (await ctx.runMutation(cleanupSessions, {
      now,
      revokeBefore,
    })) as {
      expiredDeleted: number;
      revokedDeleted: number;
      totalDeleted: number;
    };

    console.log(`[Cron] Cleanup expired sessions at ${new Date(now).toISOString()}`, result);

    return { success: true, timestamp: now, ...result };
  },
});
