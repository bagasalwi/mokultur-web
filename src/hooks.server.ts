import type { Handle } from '@sveltejs/kit';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'mokultur_token';
const SECRET_BYTES = new TextEncoder().encode(process.env.JWT_SECRET ?? '');

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.user = null;

  const token = event.cookies.get(COOKIE_NAME);
  if (token && process.env.JWT_SECRET) {
    try {
      const { payload } = await jwtVerify(token, SECRET_BYTES);
      if (payload.sub) {
        event.locals.user = {
          id: Number(payload.sub),
          name: String(payload.name ?? ''),
          email: String(payload.email ?? ''),
          role: String(payload.role ?? 'user'),
        };
      }
    } catch {
      // invalid / expired token — treat as logged out
    }
  }

  const response = await resolve(event);
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
};
