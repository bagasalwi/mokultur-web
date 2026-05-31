import { SignJWT } from 'jose';
import type { Cookies } from '@sveltejs/kit';

const SECRET_BYTES = new TextEncoder().encode(process.env.JWT_SECRET ?? '');
export const COOKIE_NAME = 'mokultur_token';
export const COOKIE_DOMAIN = '.mokultur.com';
export const COOKIE_TTL_DAYS = 30;
export const COOKIE_TTL_SECONDS = 60 * 60 * 24 * COOKIE_TTL_DAYS;

export type AuthApiUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  img?: string | null;
};

export async function signSessionJwt(user: AuthApiUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_TTL_DAYS}d`)
    .sign(SECRET_BYTES);
}

export async function setSessionCookie(cookies: Cookies, user: AuthApiUser): Promise<void> {
  const token = await signSessionJwt(user);
  cookies.set(COOKIE_NAME, token, {
    path: '/',
    domain: COOKIE_DOMAIN,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: COOKIE_TTL_SECONDS,
  });
}

export function clearSessionCookie(cookies: Cookies): void {
  cookies.delete(COOKIE_NAME, {
    path: '/',
    domain: COOKIE_DOMAIN,
  });
}
