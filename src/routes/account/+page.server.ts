import { fail, redirect } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import { setSessionCookie } from '$lib/auth';
import type { Actions, PageServerLoad } from './$types';

const COOKIE = 'mokultur_token';

export const load: PageServerLoad = async ({ locals, cookies, fetch }) => {
  if (!locals.user) throw redirect(303, '/auth/login?redirect=/account');

  const token = cookies.get(COOKIE) ?? '';
  let user: AuthUser & { id: number } = {
    id: locals.user.id,
    name: locals.user.name,
    email: locals.user.email,
    role: locals.user.role,
    img: locals.user.img,
    username: locals.user.username,
    description: locals.user.description,
    instagram: locals.user.instagram,
    facebook: locals.user.facebook,
  };

  try {
    const res = await fetch(`${PUBLIC_API_URL}/api/auth/me`, {
      headers: { cookie: `${COOKIE}=${token}` },
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.user) user = { ...user, ...json.user };
    }
  } catch {
    // fallback to locals.user
  }

  return { profile: user };
};

export const actions: Actions = {
  profile: async ({ request, cookies, fetch, locals }) => {
    if (!locals.user) throw redirect(303, '/auth/login?redirect=/account');

    const fd = await request.formData();
    const payload = {
      name: String(fd.get('name') ?? '').trim(),
      username: String(fd.get('username') ?? '').trim(),
      description: String(fd.get('description') ?? '').trim(),
      instagram: String(fd.get('instagram') ?? '').trim(),
      facebook: String(fd.get('facebook') ?? '').trim(),
    };

    const token = cookies.get(COOKIE) ?? '';
    const res = await fetch(`${PUBLIC_API_URL}/api/auth/profile`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        cookie: `${COOKIE}=${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return fail(res.status, { section: 'profile', error: err.error ?? 'Gagal update profil.' });
    }

    const { user } = await res.json();
    await setSessionCookie(cookies, user);
    return { section: 'profile', success: 'Profil tersimpan.' };
  },

  avatar: async ({ request, cookies, fetch, locals }) => {
    if (!locals.user) throw redirect(303, '/auth/login?redirect=/account');

    const fd = await request.formData();
    const avatar = fd.get('avatar');
    if (!(avatar instanceof File) || avatar.size === 0) {
      return fail(400, { section: 'avatar', error: 'Pilih gambar dulu.' });
    }
    if (avatar.size > 4 * 1024 * 1024) {
      return fail(400, { section: 'avatar', error: 'Ukuran maks 4MB.' });
    }

    const forward = new FormData();
    forward.set('avatar', avatar);

    const token = cookies.get(COOKIE) ?? '';
    const res = await fetch(`${PUBLIC_API_URL}/api/auth/avatar`, {
      method: 'POST',
      headers: { cookie: `${COOKIE}=${token}` },
      body: forward,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return fail(res.status, { section: 'avatar', error: err.error ?? 'Gagal upload avatar.' });
    }

    const { img } = await res.json();

    // re-fetch full user to refresh cookie payload
    const meRes = await fetch(`${PUBLIC_API_URL}/api/auth/me`, {
      headers: { cookie: `${COOKIE}=${token}` },
    });
    if (meRes.ok) {
      const { user } = await meRes.json();
      if (user) await setSessionCookie(cookies, user);
    }

    return { section: 'avatar', success: 'Avatar tersimpan.', img };
  },

  password: async ({ request, cookies, fetch, locals }) => {
    if (!locals.user) throw redirect(303, '/auth/login?redirect=/account');

    const fd = await request.formData();
    const currentPassword = String(fd.get('currentPassword') ?? '');
    const newPassword = String(fd.get('newPassword') ?? '');
    const confirmPassword = String(fd.get('confirmPassword') ?? '');

    if (!currentPassword || !newPassword) {
      return fail(400, { section: 'password', error: 'Semua kolom password wajib diisi.' });
    }
    if (newPassword.length < 8) {
      return fail(400, { section: 'password', error: 'Password baru minimal 8 karakter.' });
    }
    if (newPassword !== confirmPassword) {
      return fail(400, { section: 'password', error: 'Konfirmasi password tidak cocok.' });
    }

    const token = cookies.get(COOKIE) ?? '';
    const res = await fetch(`${PUBLIC_API_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `${COOKIE}=${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return fail(res.status, { section: 'password', error: err.error ?? 'Gagal ganti password.' });
    }
    return { section: 'password', success: 'Password berhasil diubah.' };
  },
};
