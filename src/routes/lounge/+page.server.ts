import { fail, redirect } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import { fetchThreads, fetchTopThreads, fetchAnimeOptions } from '$lib/threads';
import type { Actions, PageServerLoad } from './$types';

const COOKIE = 'mokultur_token';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export const load: PageServerLoad = async ({ url, fetch }) => {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const animeId = url.searchParams.get('animeId') ? Number(url.searchParams.get('animeId')) : undefined;

  const [list, topThreads, animeOptions] = await Promise.all([
    fetchThreads(fetch, { page, perPage: 20, animeId }),
    fetchTopThreads(fetch, 5),
    fetchAnimeOptions(fetch),
  ]);

  return { threads: list.data, meta: list.meta, animeId, topThreads, animeOptions };
};

export const actions: Actions = {
  create: async ({ request, cookies, fetch, locals }) => {
    if (!locals.user) throw redirect(303, '/auth/login?redirect=/lounge');

    const fd = await request.formData();
    const body = String(fd.get('body') ?? '').trim();
    const animeRaw = String(fd.get('animeCacheId') ?? '').trim();
    const articleRaw = String(fd.get('articlePostId') ?? '').trim();
    const image = fd.get('image');
    const hasImage = image instanceof File && image.size > 0;

    if (!body && !hasImage) return fail(400, { error: 'Konten atau gambar wajib diisi.', body });
    if (body.length > 5000) return fail(400, { error: 'Konten maksimal 5000 karakter.', body });
    if (hasImage && (image as File).size > MAX_IMAGE_BYTES) {
      return fail(400, { error: 'Ukuran gambar maksimal 8MB.', body });
    }

    const forward = new FormData();
    if (body) forward.set('body', body);
    if (animeRaw) forward.set('animeCacheId', animeRaw);
    if (articleRaw) forward.set('articlePostId', articleRaw);
    if (hasImage) forward.set('image', image as File);

    const token = cookies.get(COOKIE) ?? '';
    const res = await fetch(`${PUBLIC_API_URL}/api/threads`, {
      method: 'POST',
      headers: { cookie: `${COOKIE}=${token}` },
      body: forward,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return fail(res.status, { error: err.error ?? 'Gagal membuat thread.', body });
    }

    await res.json();
    throw redirect(303, '/lounge');
  },

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
