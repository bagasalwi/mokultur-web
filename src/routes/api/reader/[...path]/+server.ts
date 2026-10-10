import type { RequestHandler } from './$types';
import { COOKIE_NAME } from '$lib/auth';
import { json } from '@sveltejs/kit';

const headers = { 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex, nofollow' };
const allowed = /^(feed|interests|saved|history|articles\/[1-9]\d*(?:\/bookmark)?)$/;

const proxy: RequestHandler = async ({ params, request, url, cookies, locals, fetch }) => {
  const path = params.path;
  if (!allowed.test(path)) return json({ error: 'Tidak ditemukan.' }, { status: 404, headers });
  const write = !['GET', 'HEAD'].includes(request.method);
  if (write && request.headers.get('origin') !== url.origin) return json({ error: 'Permintaan tidak diizinkan.' }, { status: 403, headers });
  if (!locals.user && (path !== 'feed' || write)) return json({ error: 'Masuk untuk menyimpan bacaan.' }, { status: 401, headers });
  if (write && Number(request.headers.get('content-length') ?? 0) > 4096) return json({ error: 'Permintaan terlalu besar.' }, { status: 413, headers });
  let body: string | undefined;
  if (['PATCH', 'PUT'].includes(request.method) && !path.endsWith('/bookmark')) {
    body = await request.text();
    if (body.length > 4096) return json({ error: 'Permintaan terlalu besar.' }, { status: 413, headers });
  }
  try {
    const token = cookies.get(COOKIE_NAME);
    const response = await fetch(`http://127.0.0.1:3001/api/me/reader/${path}${url.search}`, {
      method: request.method,
      headers: { 'content-type': 'application/json', origin: url.origin, ...(token ? { cookie: `${COOKIE_NAME}=${token}` } : {}) },
      body, signal: AbortSignal.timeout(8000),
    });
    return new Response(await response.text(), { status: response.status, headers: { ...headers, 'content-type': 'application/json' } });
  } catch {
    return json({ error: 'Koneksi bermasalah. Coba lagi.' }, { status: 503, headers });
  }
};
export const GET = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const PATCH = proxy;
