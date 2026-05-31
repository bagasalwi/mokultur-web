import { fail, redirect } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import { fetchAnimeOptions } from '$lib/forum';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch }) => {
  if (!locals.user) throw redirect(303, '/auth/login?redirect=/forum/new');
  if (locals.user.role !== 'admin') throw redirect(303, '/forum');

  const animeOptions = await fetchAnimeOptions(fetch);
  return { animeOptions };
};

export const actions: Actions = {
  default: async ({ request, cookies, fetch, locals }) => {
    if (!locals.user || locals.user.role !== 'admin') {
      throw redirect(303, '/forum');
    }

    const fd = await request.formData();
    const title = String(fd.get('title') ?? '').trim();
    const body = String(fd.get('body') ?? '').trim();
    const animeRaw = String(fd.get('anime_cache_id') ?? '').trim();

    if (title.length < 3) return fail(400, { error: 'Judul minimal 3 karakter.', title, body, animeRaw });
    if (title.length > 200) return fail(400, { error: 'Judul maksimal 200 karakter.', title, body, animeRaw });

    const payload: Record<string, unknown> = { title };
    if (body) payload.body = body;
    if (animeRaw) payload.animeCacheId = Number(animeRaw);

    const token = cookies.get('mokultur_token') ?? '';
    const res = await fetch(`${PUBLIC_API_URL}/api/forum/threads`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `mokultur_token=${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return fail(res.status, { error: err.error ?? 'Gagal membuat thread.', title, body, animeRaw });
    }

    const { data } = await res.json();
    throw redirect(303, `/forum/${data.slug}`);
  },
};
