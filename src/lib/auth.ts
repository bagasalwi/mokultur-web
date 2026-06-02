import { SignJWT } from 'jose';
import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

const SECRET_BYTES = new TextEncoder().encode(env.JWT_SECRET ?? '');
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
  username?: string | null;
  description?: string | null;
  instagram?: string | null;
  facebook?: string | null;
};

export async function signSessionJwt(user: AuthApiUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
    img: user.img ?? null,
    username: user.username ?? null,
    description: user.description ?? null,
    instagram: user.instagram ?? null,
    facebook: user.facebook ?? null,
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
    domain: dev ? undefined : COOKIE_DOMAIN,
    httpOnly: true,
    secure: !dev,
    sameSite: 'lax',
    maxAge: COOKIE_TTL_SECONDS,
  });
}

export function clearSessionCookie(cookies: Cookies): void {
  cookies.delete(COOKIE_NAME, {
    path: '/',
    domain: dev ? undefined : COOKIE_DOMAIN,
  });
}
