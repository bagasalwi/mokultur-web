import { fail, redirect } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import { setSessionCookie } from '$lib/auth';
import type { Actions, PageServerLoad } from './$types';

const DEFAULT_DESTINATION = '/dashboard';

/**
 * Only same-site paths may be redirected to.
 *
 * `startsWith('/')` alone is not enough: `//evil.com` is a protocol-relative
 * URL, so a browser reads it as another origin and leaves the site. Anything
 * that is not a plain absolute path falls back to the dashboard.
 */
function safeNext(value: string | null | undefined): string {
  if (!value) return DEFAULT_DESTINATION;
  if (!value.startsWith('/')) return DEFAULT_DESTINATION;
  if (value.startsWith('//')) return DEFAULT_DESTINATION;
  // Backslashes are normalised to slashes by some browsers, so /\evil.com
  // would escape the same way //evil.com does.
  if (value.startsWith('/\\')) return DEFAULT_DESTINATION;
  return value;
}

export const load: PageServerLoad = ({ locals, url }) => {
  if (locals.user) {
    throw redirect(303, safeNext(url.searchParams.get('redirect')));
  }
  return {};
};

export const actions: Actions = {
  default: async ({ request, cookies, fetch }) => {
    const fd = await request.formData();
    const email = String(fd.get('email') ?? '').trim();
    const password = String(fd.get('password') ?? '');
    const redirectTo = safeNext(String(fd.get('redirect') ?? ''));

    if (!email || !password) {
      return fail(400, { error: 'Email & password wajib diisi.', email });
    }

    try {
      const res = await fetch(`${PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return fail(res.status === 401 ? 401 : 400, {
          error: err.error ?? 'Email atau password salah.',
          email,
        });
      }

      const { user } = await res.json();
      if (!user) {
        return fail(500, { error: 'Respons login tidak valid.', email });
      }

      await setSessionCookie(cookies, user);
    } catch (e) {
      return fail(503, { error: 'Server lagi sibuk, coba lagi sebentar.', email });
    }

    throw redirect(303, redirectTo);
  },
};
