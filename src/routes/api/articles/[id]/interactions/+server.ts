import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { COOKIE_NAME } from '$lib/auth';
import { INTERNAL_API_URL } from '$lib/server/site';

/** Like count, comment count and whether this reader liked it. Same-origin so the login cookie counts. */
const headers = { 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex, nofollow' };

export const GET: RequestHandler = async ({ params, cookies, fetch }) => {
  if (!/^[1-9]\d{0,9}$/.test(params.id)) return json({ error: 'Tidak ditemukan.' }, { status: 404, headers });
  const token = cookies.get(COOKIE_NAME);
  try {
    const response = await fetch(`${INTERNAL_API_URL}/api/articles/${params.id}/interactions`, {
      headers: token ? { cookie: `${COOKIE_NAME}=${token}` } : {},
      signal: AbortSignal.timeout(8000),
    });
    return new Response(await response.text(), { status: response.status, headers: { ...headers, 'content-type': 'application/json' } });
  } catch {
    return json({ likes: 0, comments: 0, liked: false }, { headers });
  }
};
