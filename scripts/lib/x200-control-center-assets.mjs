/**
 * Pure helpers to assert Control Center HTML references Next.js assets.
 * Used by Playwright regression and unit tests — no invented success.
 */

export function extractNextAssetUrls(html) {
  if (typeof html !== "string" || !html) {
    return [];
  }
  const found = new Set();
  const pattern =
    /(?:href|src)=["']([^"']*\/_next\/[^"'?#]+)(?:\?[^"']*)?["']/gi;
  for (const match of html.matchAll(pattern)) {
    const url = match[1]?.trim();
    if (url) {
      found.add(url);
    }
  }
  return [...found];
}

/**
 * Fails closed when HTML looks like a bare document without Next assets.
 * Accepts `/_next/` stylesheet or script URLs (dev and production shapes).
 */
export function assertControlCenterHtmlHasAssets(html) {
  const assets = extractNextAssetUrls(html);
  if (assets.length === 0) {
    throw new Error(
      "Control Center HTML returned without resolvable /_next/ asset URLs",
    );
  }
  const hasNextRuntime = assets.some((url) => /\/_next\//i.test(url));
  if (!hasNextRuntime) {
    throw new Error(
      "Control Center HTML is missing required /_next/ CSS or JS asset references",
    );
  }
  return { ok: true, assets };
}
