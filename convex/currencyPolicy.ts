/**
 * Product policy: client money flows are USD-only until multi-currency is supported.
 */
export function assertUsdCurrency(currency: string, context: string): void {
  const c = (currency ?? "").toLowerCase().trim();
  if (c !== "usd") {
    throw new Error(
      `${context}: only USD is supported (got "${currency}").`
    );
  }
}
