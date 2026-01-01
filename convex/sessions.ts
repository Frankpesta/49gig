import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Sessions table for tracking user sessions and token rotation
 * This extends Convex Auth's built-in session management
 */
export const sessions = defineTable({
  // User
  userId: v.id("users"),
  
  // Session token
  sessionToken: v.string(),
  refreshToken: v.string(),
  
  // Expiry
  expiresAt: v.number(),
  refreshExpiresAt: v.number(),
  
  // Rotation
  lastRotatedAt: v.number(),
  rotationCount: v.number(),
  
  // Metadata
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  
  // Status
  isActive: v.boolean(),
  revokedAt: v.optional(v.number()),
  revokedReason: v.optional(v.string()),
  
  // Audit
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_token", ["sessionToken"])
  .index("by_refresh_token", ["refreshToken"])
  .index("by_expires", ["expiresAt"])
  .index("by_active", ["isActive"]);

