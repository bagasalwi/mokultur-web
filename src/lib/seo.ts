import { PUBLIC_SITE_URL } from '$env/static/public';
import type { ArticleSeo } from './api';

const SITE = PUBLIC_SITE_URL.replace(/\/$/, '');

/**
 * Absolute site URL for canonical / og:url tags.
 *
 * Search engines pick which URL represents a page from the canonical tag, and
 * social scrapers need og:url absolute to resolve previews at all — a bare "/"
 * gives them nothing to work with.
 */
export function absoluteUrl(path = '/'): string {
  return `${SITE}${path.startsWith('/') ? path : `/${path}`}`;
}

/** BreadcrumbList JSON-LD, stating a page's place in the site hierarchy. */
export function buildBreadcrumb(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '/' }, ...trail].map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildPageTitle(title: string, siteName = 'Mokultur') {
  return title ? `${title} - ${siteName}` : siteName;
}

export function seoToMeta(seo: ArticleSeo) {
  return seo;
}

export function buildListSeo(params: {
  title: string;
  description: string;
  canonical: string;
  image?: string | null;
}): ArticleSeo {
  return {
    title: params.title,
    description: params.description,
    canonical: params.canonical,
    robots: 'index, follow',
    og: {
      title: params.title,
      description: params.description,
      image: params.image ?? null,
      type: 'website',
      url: params.canonical,
    },
    twitter: {
      card: 'summary_large_image',
      title: params.title,
      description: params.description,
      image: params.image ?? null,
    },
  };
}
