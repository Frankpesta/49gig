import { v } from "convex/values";

/**
 * Rate limiting helper
 * Tracks attempts in a simple in-memory store
 * In production, use Redis or similar for distributed rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if request should be rate limited
 * @param key - Unique identifier for rate limiting (e.g., email, IP)
 * @param maxAttempts - Maximum attempts allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if rate limited, false otherwise
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // Reset or create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return false;
  }

  if (entry.count >= maxAttempts) {
    return true; // Rate limited
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  return false;
}

/**
 * Clear rate limit for a key (useful after successful auth)
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

