import { redirect } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import { setSessionCookie } from '$lib/auth';
import { authFail, modalUrl, safeNext } from '$lib/server/auth-flow';
import type { Actions, PageServerLoad } from './$types';

/** Same as login: registration lives in the site-wide modal. */
export const load: PageServerLoad = ({ locals, url }) => {
  const next = safeNext(url.searchParams.get('redirect'));
  if (locals.user) throw redirect(303, next);
  throw redirect(303, modalUrl(url.origin, 'register', next));
};

export const actions: Actions = {
  default: async ({ request, cookies, fetch, url }) => {
    const fd = await request.formData();
    const name = String(fd.get('name') ?? '').trim();
    const email = String(fd.get('email') ?? '').trim().toLowerCase();
    const password = String(fd.get('password') ?? '');
    const passwordConfirm = String(fd.get('password_confirm') ?? '');
    const next = safeNext(String(fd.get('redirect') ?? ''));
    const fail = (status: number, code: Parameters<typeof authFail>[5]) =>
      authFail(request, url.origin, 'register', next, status, code, { name, email });

    if (name.length < 2) return fail(400, 'name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, 'email');
    if (password.length < 8) return fail(400, 'password');
    if (password !== passwordConfirm) return fail(400, 'confirm');

    let user: unknown;
    try {
      const res = await fetch(`${PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) return res.status === 409 ? fail(409, 'exists') : fail(400, 'failed');
      ({ user } = await res.json());
    } catch {
      return fail(503, 'busy');
    }
    if (!user) return fail(500, 'failed');

    await setSessionCookie(cookies, user as Parameters<typeof setSessionCookie>[1]);
    throw redirect(303, next);
  },
};
