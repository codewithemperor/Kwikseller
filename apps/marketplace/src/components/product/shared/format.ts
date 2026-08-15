/**
 * Shared formatting helpers for product components.
 * Single source of truth — no per-component duplication.
 */

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function discountPercent(price: number, comparePrice?: number): number {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

/**
 * Render an ISO date as a friendly relative string (e.g. "3 days ago",
 * "Just now", "2 weeks ago"). Falls back to a localized date for older
 * reviews (>= 6 months).
 */
export function formatRelativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  if (!then) return "";
  const diffMs = Date.now() - then;
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (sec < 60) return "Just now";
  if (min < 60) return `${min} min ago`;
  if (hr < 24) return `${hr} hr ago`;
  if (day === 1) return "Yesterday";
  if (day < 7) return `${day} days ago`;
  if (day < 14) return "1 week ago";
  if (day < 30) return `${Math.round(day / 7)} weeks ago`;
  if (day < 60) return "1 month ago";
  if (day < 180) return `${Math.round(day / 30)} months ago`;
  return new Date(then).toLocaleDateString("en-NG", { dateStyle: "medium" });
}

export function hasHtmlMarkup(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}
