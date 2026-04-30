/**
 * Check if a price verification date is stale (older than threshold).
 * @param verifiedAt - The date the price was last verified
 * @param thresholdMonths - Number of months before a price is considered stale (default 6)
 * @param now - Current date for comparison (default: new Date())
 */
export function isPriceStale(
  verifiedAt: Date,
  thresholdMonths: number = 6,
  now: Date = new Date(),
): boolean {
  const threshold = new Date(now);
  threshold.setMonth(threshold.getMonth() - thresholdMonths);
  return verifiedAt < threshold;
}
