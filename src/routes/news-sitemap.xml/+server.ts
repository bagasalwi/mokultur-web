import type { RequestHandler } from './$types';
import { sitemapResponse } from '$lib/server/sitemap';

export const GET: RequestHandler = ({ fetch }) => sitemapResponse(fetch, 'news-sitemap.xml');
