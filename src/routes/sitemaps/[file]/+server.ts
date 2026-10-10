import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sitemapResponse } from '$lib/server/sitemap';

export const GET: RequestHandler = ({ fetch, params }) => {
  if (!/^(?:pages|articles-[1-9]\d{0,6})\.xml$/.test(params.file)) throw error(404, 'Sitemap tidak ditemukan');
  return sitemapResponse(fetch, `sitemaps/${params.file}`);
};
