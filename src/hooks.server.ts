import { redirect, type Handle } from '@sveltejs/kit';
import { jwtVerify } from 'jose';
import { env } from '$env/dynamic/private';
import { LOUNGE_ENABLED } from '$lib/features';
import { isAnimePath } from '$lib/route-policy';

const COOKIE_NAME = 'mokultur_token';
const SECRET_BYTES = new TextEncoder().encode(env.JWT_SECRET ?? '');

export const handle: Handle = async ({ event, resolve }) => {
  if (!LOUNGE_ENABLED) {
    const path = event.url.pathname;
    if (path === '/lounge' || path.startsWith('/lounge/') || path === '/forum' || path.startsWith('/forum/')) {
      throw redirect(302, '/');
    }
  }

  event.locals.user = null;

  const token = event.cookies.get(COOKIE_NAME);
  if (token && env.JWT_SECRET) {
    try {
      const { payload } = await jwtVerify(token, SECRET_BYTES);
      if (payload.sub) {
        event.locals.user = {
          id: Number(payload.sub),
          name: String(payload.name ?? ''),
          email: String(payload.email ?? ''),
          role: String(payload.role ?? 'user'),
          img: payload.img ? String(payload.img) : null,
          username: payload.username ? String(payload.username) : null,
          description: payload.description ? String(payload.description) : null,
          instagram: payload.instagram ? String(payload.instagram) : null,
          facebook: payload.facebook ? String(payload.facebook) : null,
        };
      }
    } catch {
      // invalid / expired token — treat as logged out
    }
  }

  const response = await resolve(event);

  if (isAnimePath(event.url.pathname)) {
    response.headers.set('X-Robots-Tag', 'noindex, follow');
  }

  if (event.locals.user) {
    response.headers.set('Cache-Control', 'private, no-store');
  }

  // Let Google show large image previews (Discover, image results) site-wide;
  // pages that are noindex already carry their own X-Robots-Tag.
  if (!response.headers.has('X-Robots-Tag') && (response.headers.get('content-type') ?? '').includes('text/html')) {
    response.headers.set('X-Robots-Tag', 'max-image-preview:large');
  }

  /*
   * Guest pages (and their __data.json) are publicly cacheable for a minute or
   * more. Without this the browser keeps serving that guest copy after the
   * reader logs in on the same URL, so the navbar still says "Masuk" until a
   * manual refresh. Varying on Cookie makes the new session a cache miss.
   */
  if (/\bpublic\b/.test(response.headers.get('cache-control') ?? '')) {
    response.headers.append('Vary', 'Cookie');
  }

  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  /*
   * Set here rather than in nginx.
   *
   * The vhost declares HSTS at server level, but `location /` has its own
   * add_header (X-Cache-Status), and nginx drops every inherited add_header the
   * moment a block declares one of its own — so the server-level set never
   * reached a visitor. Keeping all of these in one place stops them from
   * silently disappearing again.
   */
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  return response;
};
