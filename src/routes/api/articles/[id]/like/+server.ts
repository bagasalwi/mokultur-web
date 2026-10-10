import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { COOKIE_NAME } from '$lib/auth';

/**
 * The reader's login cookie lives on mokultur.com only, so likes go through
 * this same-origin proxy (like /api/reader) instead of straight to the API.
 */
const headers = { 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex, nofollow' };

export const POST: RequestHandler = async ({ params, request, url, cookies, locals, fetch }) => {
  if (!/^[1-9]\d{0,9}$/.test(params.id)) return json({ error: 'Tidak ditemukan.' }, { status: 404, headers });
  if (request.headers.get('origin') !== url.origin) return json({ error: 'Permintaan tidak diizinkan.' }, { status: 403, headers });
  if (!locals.user) return json({ error: 'Masuk untuk menyukai artikel.' }, { status: 401, headers });
  const token = cookies.get(COOKIE_NAME);
  try {
    const response = await fetch(`http://127.0.0.1:3001/api/articles/${params.id}/like`, {
      method: 'POST',
      headers: { origin: url.origin, ...(token ? { cookie: `${COOKIE_NAME}=${token}` } : {}) },
      signal: AbortSignal.timeout(8000),
    });
    return new Response(await response.text(), { status: response.status, headers: { ...headers, 'content-type': 'application/json' } });
  } catch {
    return json({ error: 'Koneksi bermasalah. Coba lagi.' }, { status: 503, headers });
  }
};
