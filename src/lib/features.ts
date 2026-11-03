/** Culture Lounge (forum/threads) — set true untuk mengaktifkan kembali. */
export const LOUNGE_ENABLED = false;

/**
 * Optional parts of the public site, switched per deployment by WEB_FEATURES
 * (src/lib/server/site.ts). mokultur.com runs all of them; a second site lists
 * the ones it uses, so anything added here later stays off there.
 *
 * Anime, events, curhatan promos and the chat are also gated by their
 * site_settings flags, which editors can flip from the dashboard; a key here
 * says whether the site has the feature at all.
 */
export const WEB_FEATURES = ['talent', 'ratecard', 'moku', 'comifuro23', 'reels', 'newsletter', 'push', 'swg'] as const;

export type WebFeature = (typeof WEB_FEATURES)[number];

export function parseWebFeatures(raw: string): WebFeature[] {
  const value = raw.trim();
  if (value === '*') return [...WEB_FEATURES];
  const listed = new Set(value.split(',').map((item) => item.trim()));
  return WEB_FEATURES.filter((feature) => listed.has(feature));
}

/**
 * For components: `features` is the root layout's `site.features`. Without
 * that data (it is always there below the root layout) everything counts as on,
 * which is how mokultur.com runs.
 */
export function hasWebFeature(features: readonly string[] | undefined, feature: WebFeature): boolean {
  return features ? features.includes(feature) : true;
}
