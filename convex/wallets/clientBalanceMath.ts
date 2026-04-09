import type { Doc } from "../_generated/dataModel";

/** Completed credits (+ refunds) minus debits in one currency (client wallet). */
export function sumClientSpendableCentsForCurrency(
  txs: Doc<"walletTransactions">[],
  currencyLower: string
): number {
  let sum = 0;
  for (const t of txs) {
    if (t.status !== "completed") continue;
    if (t.currency.toLowerCase() !== currencyLower) continue;
    if (t.type === "credit" || t.type === "refund") {
      sum += t.amountCents;
    } else if (t.type === "debit") {
      sum -= t.amountCents;
    }
  }
  return Math.max(0, sum);
}

/** Legacy hiring-only referral credits net of hire debits (not bank-withdrawable). */
export function sumClientReferralHiringCents(
  txs: Doc<"walletTransactions">[],
  currencyLower: string
): number {
  let sum = 0;
  for (const t of txs) {
    if (t.status !== "completed") continue;
    if (t.currency.toLowerCase() !== currencyLower) continue;
    if (t.type === "credit" && t.category === "client_referral_credit") {
      sum += t.amountCents;
    } else if (t.type === "debit" && t.category === "hiring_credit") {
      sum -= t.amountCents;
    }
  }
  return Math.max(0, sum);
}

/** Amount a client may withdraw to bank / off-platform (excludes hiring-only bucket). */
export function clientBankWithdrawableCents(
  txs: Doc<"walletTransactions">[],
  currencyLower: string
): number {
  return Math.max(
    0,
    sumClientSpendableCentsForCurrency(txs, currencyLower) -
      sumClientReferralHiringCents(txs, currencyLower)
  );
}
