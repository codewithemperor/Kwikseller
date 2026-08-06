/**
 * CSV export utilities — shared across the marketplace.
 *
 * - `toCSV` converts a list of records into a CSV string with proper escaping.
 * - `downloadCSV` triggers a client-side download of the CSV file.
 *
 * Used by the orders page (order history export) and could be reused for
 * vendor analytics exports later.
 */

/**
 * Escape a single CSV cell. Wraps in double quotes if the value contains a
 * comma, quote, or newline; doubles any embedded quotes per RFC 4180.
 */
export function escapeCSVCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "string" ? value : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of records into a CSV string.
 *
 * @param rows Array of objects with the same shape.
 * @param columns Optional ordered list of `{ key, label }` pairs. If omitted,
 *                the keys of the first row are used as headers.
 */
export function toCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns?: Array<{ key: keyof T; label: string }>,
): string {
  if (!rows.length && !columns) return "";
  const cols =
    columns ??
    (Object.keys(rows[0] ?? {}).map((k) => ({
      key: k as keyof T,
      label: k,
    })) as Array<{ key: keyof T; label: string }>);

  const header = cols.map((c) => escapeCSVCell(c.label)).join(",");
  const body = rows
    .map((row) => cols.map((c) => escapeCSVCell(row[c.key])).join(","))
    .join("\n");

  // Prefix with BOM so Excel reads UTF-8 correctly (handles ₦, emojis, etc.)
  return `\uFEFF${header}\n${body}`;
}

/**
 * Trigger a client-side download of a CSV file. No-op on the server.
 */
export function downloadCSV(filename: string, csv: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Release the object URL after a beat so the download has time to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
