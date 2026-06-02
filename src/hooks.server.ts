import type { Handle } from '@sveltejs/kit';
import { jwtVerify } from 'jose';
import { env } from '$env/dynamic/private';

const COOKIE_NAME = 'mokultur_token';
const SECRET_BYTES = new TextEncoder().encode(env.JWT_SECRET ?? '');

export const handle: Handle = async ({ event, resolve }) => {
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

  if (event.locals.user) {
    response.headers.set('Cache-Control', 'private, no-store');
  }

  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
};
