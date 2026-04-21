/**
 * Shared platform-fee constants safe to import from both client and server.
 *
 * Prefer reading the effective fee per-project via Convex helpers
 * (`getDefaultPlatformFeePercent`, `effectivePlatformFeePercentForProject`).
 * This constant only exists so UI-only code paths that can't await a query
 * reference a single source of truth instead of hardcoding 25.
 */
export const DEFAULT_PLATFORM_FEE_PERCENT = 25;
