import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

/**
 * Internal: Create contact enquiry (called from action).
 */
export const createContactEnquiryInternal = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    category: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("contactEnquiries", {
      name: args.name,
      email: args.email,
      subject: args.subject,
      category: args.category,
      message: args.message,
      status: "new",
      createdAt: now,
      updatedAt: now,
    });
  },
});
