import type { ArticleSeo } from './api';

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
