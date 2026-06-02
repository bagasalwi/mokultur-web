import { error, fail } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import { fetchThreads } from '$lib/threads';
import type { Actions, PageServerLoad } from './$types';

const COOKIE = 'mokultur_token';

export const load: PageServerLoad = async ({ params, fetch, url }) => {
  const username = params.username;
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));

  const [userRes, threadsResult] = await Promise.all([
    fetch(`${PUBLIC_API_URL}/api/users/${username}/profile`),
    fetchThreads(fetch, { page, perPage: 20, authorUsername: username }),
  ]);

  if (!userRes.ok) throw error(404, 'User tidak ditemukan');
  const { user } = await userRes.json();

  return {
    profile: user,
    threads: threadsResult.data,
    meta: threadsResult.meta,
    username,
  };
};

export const actions: Actions = {
  like: async ({ request, cookies, fetch, locals }) => {
    if (!locals.user) return fail(401, { error: 'Masuk dulu untuk menyukai.' });

    const fd = await request.formData();
    const id = String(fd.get('thread_id') ?? '');
    const token = cookies.get(COOKIE) ?? '';
    const res = await fetch(`${PUBLIC_API_URL}/api/threads/${id}/like`, {
      method: 'POST',
      headers: { cookie: `${COOKIE}=${token}` },
    });
    if (!res.ok) return fail(res.status, { error: 'Gagal menyukai.' });
    return await res.json();
  },
};
