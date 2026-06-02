import { error, fail, redirect } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import { fetchThread, threadUrl } from '$lib/threads';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) throw error(404, 'Thread tidak ditemukan');

  const thread = await fetchThread(fetch, id);
  if (!thread) throw error(404, 'Thread tidak ditemukan');

  const canonicalHandle = thread.authorUsername || (thread.authorId ? `u${thread.authorId}` : 'user');
  if (params.username !== canonicalHandle) {
    throw redirect(301, threadUrl(thread));
  }

  return { thread };
};

export const actions: Actions = {
  reply: async ({ request, cookies, fetch, params, locals }) => {
    if (!locals.user) {
      throw redirect(303, `/auth/login?redirect=/lounge/@${params.username}/${params.id}`);
    }

    const fd = await request.formData();
    const body = String(fd.get('body') ?? '').trim();
    const parentReplyId = String(fd.get('parent_reply_id') ?? '').trim();
    const image = fd.get('image');
    const hasImage = image instanceof File && image.size > 0;

    if (!body && !hasImage) return fail(400, { error: 'Balasan atau gambar wajib diisi.' });
    if (body.length > 5000) return fail(400, { error: 'Balasan maksimal 5000 karakter.' });
    if (hasImage && (image as File).size > 8 * 1024 * 1024) {
      return fail(400, { error: 'Ukuran gambar maksimal 8MB.' });
    }

    const forward = new FormData();
    if (body) forward.set('body', body);
    if (parentReplyId) forward.set('parentReplyId', parentReplyId);
    if (hasImage) forward.set('image', image as File);

    const token = cookies.get('mokultur_token') ?? '';
    const res = await fetch(`${PUBLIC_API_URL}/api/threads/${params.id}/replies`, {
      method: 'POST',
      headers: { cookie: `mokultur_token=${token}` },
      body: forward,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return fail(res.status, { error: err.error ?? 'Gagal mengirim balasan.' });
    }
    return { success: true };
  },

  like: async ({ cookies, fetch, params, locals }) => {
    if (!locals.user) return fail(401, { error: 'Masuk dulu untuk menyukai.' });
    const token = cookies.get('mokultur_token') ?? '';
    const res = await fetch(`${PUBLIC_API_URL}/api/threads/${params.id}/like`, {
      method: 'POST',
      headers: { cookie: `mokultur_token=${token}` },
    });
    if (!res.ok) return fail(res.status, { error: 'Gagal menyukai.' });
    return await res.json();
  },

  replyLike: async ({ request, cookies, fetch, locals }) => {
    if (!locals.user) return fail(401, { error: 'Masuk dulu untuk menyukai.' });
    const fd = await request.formData();
    const replyId = String(fd.get('reply_id') ?? '');
    const token = cookies.get('mokultur_token') ?? '';
    const res = await fetch(`${PUBLIC_API_URL}/api/threads/replies/${replyId}/like`, {
      method: 'POST',
      headers: { cookie: `mokultur_token=${token}` },
    });
    if (!res.ok) return fail(res.status, { error: 'Gagal menyukai.' });
    return await res.json();
  },
};
