import { fail, redirect } from '@sveltejs/kit';
import { AUTH_MESSAGES, type AuthErrorCode } from '$lib/auth-messages';

export type AuthMode = 'login' | 'register';

/**
 * Only same-site paths may be redirected to.
 *
 * `startsWith('/')` alone is not enough: `//evil.com` is a protocol-relative
 * URL, and some browsers normalise `/\evil.com` the same way.
 */
export function safeNext(value: string | null | undefined, fallback = '/dashboard'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  return value;
}

/** Pages a signed-out visitor cannot see, so the modal opens over the homepage instead. */
const PRIVATE = /^\/(dashboard|artikel-tersimpan|untuk-kamu)(?:[/?#]|$)/;

/**
 * Where the login modal lives for a given destination: on that page itself when
 * it is public (the reader stays where they were), otherwise on the homepage.
 */
export function modalUrl(origin: string, mode: AuthMode, next: string, error?: AuthErrorCode): string {
  const target = new URL(PRIVATE.test(next) ? '/' : next, origin);
  target.searchParams.set('auth', mode);
  target.searchParams.set('redirect', next);
  if (error) target.searchParams.set('auth_error', error);
  return `${target.pathname}${target.search}${target.hash}`;
}

/**
 * A failed login/register. The modal submits with `use:enhance`, which marks
 * the request, so it gets the error back in place; a plain form post (no JS)
 * is sent back to the page with the modal open and the reason in the URL.
 */
export function authFail(
  request: Request,
  origin: string,
  mode: AuthMode,
  next: string,
  status: number,
  code: AuthErrorCode,
  fields: Record<string, string> = {},
) {
  if (request.headers.get('x-sveltekit-action') === 'true') {
    return fail(status, { error: AUTH_MESSAGES[code], code, ...fields });
  }
  throw redirect(303, modalUrl(origin, mode, next, code));
}
