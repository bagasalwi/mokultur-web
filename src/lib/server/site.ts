import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { parseWebFeatures, type WebFeature } from '$lib/features';

/**
 * What differs between the sites this codebase serves. mokultur.com sets none
 * of these and gets its defaults; a second deployment (new.seputarotaku.com)
 * sets them in its own .env. Read at runtime, so changing one needs a restart,
 * not a build.
 */

/** The API on this box, reached over loopback rather than out through Cloudflare. */
export const INTERNAL_API_URL = (env.INTERNAL_API_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');

export const DASHBOARD_URL = (env.DASHBOARD_URL || 'https://dashboard.mokultur.com').replace(/\/$/, '');

/**
 * Keeps the whole site out of search engines: every response says noindex,
 * robots.txt disallows everything, and there is no sitemap or feed to find.
 * A site Google must not see does not report to Google either, so Analytics,
 * AdSense and Subscribe with Google stay off with it.
 */
export const SITE_NOINDEX = env.SITE_NOINDEX === '1' || env.SITE_NOINDEX === 'true';

/** Optional parts of the site (WEB_FEATURES, '*' = all, as on mokultur.com). */
export const WEB_FEATURE_LIST: WebFeature[] = parseWebFeatures(env.WEB_FEATURES ?? '*');

export function webFeatureOn(feature: WebFeature): boolean {
  return WEB_FEATURE_LIST.includes(feature);
}

/** For the load of a page that belongs to an optional feature: a site without it has no such page. */
export function requireWebFeature(feature: WebFeature): void {
  if (!webFeatureOn(feature)) error(404, 'Halaman tidak ditemukan');
}

/** Brand details that are not in site_settings. Blank means leave the tag out. */
export const BRAND = {
  /** Organization logo for structured data: a path on this site, or blank for the site_logo setting. */
  orgLogo: env.ORG_LOGO ?? '/assets/mokultur/MOKULTUR-LOGO.png',
  alternateName: env.SITE_ALTERNATE_NAME ?? 'Mokultur ID',
  twitter: env.TWITTER_HANDLE ?? '@mokultur',
  /** The web app manifest's description; blank falls back to the tagline setting. */
  description: env.SITE_DESCRIPTION ?? 'Berita dan ulasan anime, game, dan budaya pop Indonesia.',
};
