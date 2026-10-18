/**
 * Shortens text to at most `maxBytes` UTF-8 bytes and appends "...", like the live site's
 * PHP substr() previews (home: 80 bytes, courses: 100). Unlike substr(), it never cuts a
 * multi-byte (Hindi) character in half. "..." is always appended, as on live.
 */
export function previewByBytes(text: string, maxBytes: number): string {
  const encoder = new TextEncoder();
  let bytes = 0;
  let out = '';
  for (const char of text) {
    const size = encoder.encode(char).length;
    if (bytes + size > maxBytes) break;
    bytes += size;
    out += char;
  }
  return `${out}...`;
}

/**
 * Original ("struck-through") price in paise, floored to whole rupees like live:
 * floor(₹499 / 0.6) = ₹831.
 */
export function originalPrice(price: number, discountPercent: number): number {
  if (discountPercent <= 0 || discountPercent >= 100) return price;
  return Math.floor(price / 100 / (1 - discountPercent / 100)) * 100;
}

/** Formats paise as rupees the way the live pages do: "₹499.00" or, with `decimals: false`, "₹831". */
export function formatRupees(paise: number, decimals = true): string {
  const rupees = paise / 100;
  return `₹${decimals ? rupees.toFixed(2) : Math.floor(rupees).toString()}`;
}
