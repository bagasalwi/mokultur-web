import { PUBLIC_API_URL } from '$env/static/public';

/**
 * Responsive variants of the gallery images.
 *
 * Nothing on the site used to declare a srcset, so a phone downloaded the same
 * full-size artwork a desktop did — around 5 MB on the homepage either way. The
 * API resizes on demand and caches the result, so a card can ask for the width
 * it actually renders at.
 */

/** Must stay in step with WIDTHS in mokultur-elysia/src/modules/images/routes.ts. */
const WIDTHS = [160, 320, 480, 768, 1080, 1600] as const;

const API = PUBLIC_API_URL.replace(/\/$/, '');

/** Remote hosts the API is willing to fetch and resize. Mirrors REMOTE_HOSTS there. */
const REMOTE_HOSTS = ['cdn.myanimelist.net'];

/**
 * The key the variant endpoint understands, or null when the image is not ours
 * to resize — a partner logo on an unknown host is handed back untouched rather
 * than turned into a URL that would 400.
 */
function variantKey(url: string | null | undefined): string | null {
  if (!url) return null;

  const marker = '/storage/';
  const at = url.indexOf(marker);
  if (at !== -1) return url.slice(at + marker.length);

  const host = REMOTE_HOSTS.find((h) => url.includes(`//${h}/`));
  if (host) return url.slice(url.indexOf(host));

  return null;
}

/** One resized URL. Falls back to the original when it is not ours to resize. */
export function imgUrl(src: string | null | undefined, width: number): string | null {
  const rel = variantKey(src);
  if (!rel) return src ?? null;

  return `${API}/img/${width}/${rel}`;
}

/**
 * A srcset covering the widths a slot can plausibly occupy.
 *
 * `displayWidth` is the CSS width of the slot at its largest; entries stop two
 * steps above it, because past that the browser is choosing between files that
 * only differ in bytes.
 */
export function imgSrcset(src: string | null | undefined, displayWidth: number): string | null {
  const rel = variantKey(src);
  if (!rel) return null;

  const ceiling = displayWidth * 2;
  const picked = WIDTHS.filter((w) => w <= ceiling);

  // Always keep at least one, and one step past the ceiling so a very wide
  // viewport still has something sharp to pick.
  const next = WIDTHS.find((w) => w > ceiling);
  if (next) picked.push(next);
  if (!picked.length) picked.push(WIDTHS[0]);

  return picked.map((w) => `${API}/img/${w}/${rel} ${w}w`).join(', ');
}
