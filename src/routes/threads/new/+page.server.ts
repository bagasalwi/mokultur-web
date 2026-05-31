import { fail, redirect } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import { fetchAnimeOptions } from '$lib/threads';
import type { Actions, PageServerLoad } from './$types';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export const load: PageServerLoad = async ({ locals, fetch }) => {
  if (!locals.user) throw redirect(303, '/auth/login?redirect=/threads/new');
  if (locals.user.role !== 'admin') throw redirect(303, '/threads');

  const animeOptions = await fetchAnimeOptions(fetch);
  return { animeOptions };
};

export const actions: Actions = {
  default: async ({ request, cookies, fetch, locals }) => {
    if (!locals.user || locals.user.role !== 'admin') {
      throw redirect(303, '/threads');
    }

    const fd = await request.formData();
    const body = String(fd.get('body') ?? '').trim();
    const animeRaw = String(fd.get('animeCacheId') ?? '').trim();
    const image = fd.get('image');
    const hasImage = image instanceof File && image.size > 0;

    if (!body && !hasImage) {
      return fail(400, { error: 'Konten atau gambar wajib diisi.', body, animeRaw });
    }
    if (body.length > 5000) {
      return fail(400, { error: 'Konten maksimal 5000 karakter.', body, animeRaw });
    }
    if (hasImage && (image as File).size > MAX_IMAGE_BYTES) {
      return fail(400, { error: 'Ukuran gambar maksimal 8MB.', body, animeRaw });
    }

    const forward = new FormData();
    if (body) forward.set('body', body);
    if (animeRaw) forward.set('animeCacheId', animeRaw);
    if (hasImage) forward.set('image', image as File);

    const token = cookies.get('mokultur_token') ?? '';
    const res = await fetch(`${PUBLIC_API_URL}/api/threads`, {
      method: 'POST',
      headers: { cookie: `mokultur_token=${token}` },
      body: forward,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return fail(res.status, { error: err.error ?? 'Gagal membuat thread.', body, animeRaw });
    }

    const { data } = await res.json();
    throw redirect(303, `/threads/${data.slug}`);
  },
};
