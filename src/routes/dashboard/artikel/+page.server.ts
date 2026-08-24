import { error } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import { COOKIE_NAME } from '$lib/auth';
import type { PageServerLoad } from './$types';

export type MyPost = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  image: string;
  status: string;
  publishDate: string | null;
  views: number;
  categoryName: string | null;
  categorySlug: string | null;
  isPublished: boolean;
};

const PER_PAGE = 20;

export const load: PageServerLoad = async ({ parent, cookies, fetch, url }) => {
  const { profile } = await parent();

  // The sidebar hides this page from readers, but a typed-in URL must not be a
  // way around that.
  if (!profile.canWrite) {
    throw error(403, 'Halaman ini khusus untuk penulis Mokultur.');
  }

  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
  const status = url.searchParams.get('status');
  const filter = status === 'published' || status === 'draft' ? status : 'all';

  const query = new URLSearchParams({
    page: String(page),
    perPage: String(PER_PAGE),
    status: filter,
  });

  const token = cookies.get(COOKIE_NAME) ?? '';

  try {
    const res = await fetch(`${PUBLIC_API_URL}/api/me/posts?${query}`, {
      headers: { cookie: `${COOKIE_NAME}=${token}` },
    });

    if (!res.ok) throw new Error(`API ${res.status}`);

    const json = (await res.json()) as { data: MyPost[]; meta: { total: number } };

    return {
      posts: json.data,
      total: json.meta.total,
      page,
      perPage: PER_PAGE,
      filter,
      failed: false,
    };
  } catch {
    return { posts: [] as MyPost[], total: 0, page, perPage: PER_PAGE, filter, failed: true };
  }
};
