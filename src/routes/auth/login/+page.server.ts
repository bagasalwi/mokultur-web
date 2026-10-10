import { redirect } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import { setSessionCookie } from '$lib/auth';
import { authFail, modalUrl, safeNext } from '$lib/server/auth-flow';
import type { Actions, PageServerLoad } from './$types';

/**
 * There is no login page any more: logging in happens in the site-wide modal.
 * A visit here (old links, server redirects from private pages) is forwarded
 * to the page the reader wanted, with the modal open over it.
 */
export const load: PageServerLoad = ({ locals, url }) => {
  const next = safeNext(url.searchParams.get('redirect'));
  if (locals.user) throw redirect(303, next);
  throw redirect(303, modalUrl(url.origin, 'login', next));
};

export const actions: Actions = {
  default: async ({ request, cookies, fetch, url }) => {
    const fd = await request.formData();
    const email = String(fd.get('email') ?? '').trim();
    const password = String(fd.get('password') ?? '');
    const next = safeNext(String(fd.get('redirect') ?? ''));
    const fail = (status: number, code: Parameters<typeof authFail>[5]) =>
      authFail(request, url.origin, 'login', next, status, code, { email });

    if (!email || !password) return fail(400, 'required');

    let user: unknown;
    try {
      const res = await fetch(`${PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      // Any rejection reads the same to the reader; the API's English text never reaches them.
      if (!res.ok) return fail(res.status === 401 ? 401 : 400, 'invalid');
      ({ user } = await res.json());
    } catch {
      return fail(503, 'busy');
    }
    if (!user) return fail(500, 'busy');

    await setSessionCookie(cookies, user as Parameters<typeof setSessionCookie>[1]);
    throw redirect(303, next);
  },
};
