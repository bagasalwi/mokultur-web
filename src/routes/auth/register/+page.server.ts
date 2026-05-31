import { fail, redirect } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import { setSessionCookie } from '$lib/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
  if (locals.user) throw redirect(303, '/');
  return {};
};

export const actions: Actions = {
  default: async ({ request, cookies, fetch }) => {
    const fd = await request.formData();
    const name = String(fd.get('name') ?? '').trim();
    const email = String(fd.get('email') ?? '').trim().toLowerCase();
    const password = String(fd.get('password') ?? '');
    const passwordConfirm = String(fd.get('password_confirm') ?? '');

    if (name.length < 2) return fail(400, { error: 'Nama minimal 2 karakter.', name, email });
    if (!email.includes('@')) return fail(400, { error: 'Email tidak valid.', name, email });
    if (password.length < 8) return fail(400, { error: 'Password minimal 8 karakter.', name, email });
    if (password !== passwordConfirm) return fail(400, { error: 'Konfirmasi password tidak sama.', name, email });

    try {
      const res = await fetch(`${PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const status = res.status === 409 ? 409 : 400;
        return fail(status, {
          error: err.error ?? 'Pendaftaran gagal. Coba lagi.',
          name, email,
        });
      }

      const { user } = await res.json();
      if (!user) {
        return fail(500, { error: 'Respons pendaftaran tidak valid.', name, email });
      }
      await setSessionCookie(cookies, user);
    } catch {
      return fail(503, { error: 'Server lagi sibuk, coba lagi sebentar.', name, email });
    }

    throw redirect(303, '/');
  },
};
