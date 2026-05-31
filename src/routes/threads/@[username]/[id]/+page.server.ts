import { error, fail, redirect } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import { fetchThread, threadUrl } from '$lib/threads';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) throw error(404, 'Thread tidak ditemukan');

  const thread = await fetchThread(fetch, id);
  if (!thread) throw error(404, 'Thread tidak ditemukan');

  // Canonical handle: if URL @username doesn't match actual author, 301 redirect
  const canonicalHandle = thread.authorUsername || (thread.authorId ? `u${thread.authorId}` : 'user');
  if (params.username !== canonicalHandle) {
    throw redirect(301, threadUrl(thread));
  }

  return { thread };
};

export const actions: Actions = {
  reply: async ({ request, cookies, fetch, params, locals }) => {
    if (!locals.user) {
      throw redirect(303, `/auth/login?redirect=/threads/@${params.username}/${params.id}`);
    }

    const fd = await request.formData();
    const body = String(fd.get('body') ?? '').trim();
    const threadId = String(fd.get('thread_id') ?? params.id);

    if (!body) return fail(400, { error: 'Balasan tidak boleh kosong.' });
    if (body.length > 5000) return fail(400, { error: 'Balasan maksimal 5000 karakter.' });

    const token = cookies.get('mokultur_token') ?? '';
    const res = await fetch(`${PUBLIC_API_URL}/api/threads/${threadId}/replies`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `mokultur_token=${token}`,
      },
      body: JSON.stringify({ body }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return fail(res.status, { error: err.error ?? 'Gagal mengirim balasan.' });
    }
    return { success: true };
  },
};
