import { action } from "../_generated/server";
import { v } from "convex/values";

/**
 * Resolve storage ID to public URL (for blog image uploads in editor)
 */
export const getStorageUrl = action({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
