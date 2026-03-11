import { internalMutation } from "../_generated/server";

const TWELVE_MONTHS_MS = 12 * 30 * 24 * 60 * 60 * 1000;

/**
 * Delete KYC document files from storage 12 months after approval to avoid over-accumulation.
 * Run daily via crons.
 */
export const deleteKycDocumentsOlderThan12Months = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - TWELVE_MONTHS_MS;
    const approved = await ctx.db
      .query("kycSubmissions")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .collect();

    let deleted = 0;
    for (const sub of approved) {
      if (sub.documentsDeletedAt != null) continue; // Already cleaned
      const reviewedAt = sub.reviewedAt ?? 0;
      if (reviewedAt >= cutoff) continue;

      try {
        await ctx.storage.delete(sub.idFrontFileId);
        await ctx.storage.delete(sub.idBackFileId);
        await ctx.storage.delete(sub.addressDocFileId);
      } catch {
        // Ignore if file already missing
      }

      await ctx.db.patch(sub._id, {
        documentsDeletedAt: Date.now(),
        updatedAt: Date.now(),
      });
      deleted++;
    }

    return { deleted };
  },
});
