import type { PageServerLoad } from './$types';
import { getBioLinks, listArticles } from '$lib/api';

export const load: PageServerLoad = async () => {
  const [bioLinksRes, articlesRes] = await Promise.allSettled([
    getBioLinks(),
    listArticles({ page: 1, perPage: 3 }),
  ]);

  return {
    bioLinks: bioLinksRes.status === 'fulfilled' ? bioLinksRes.value.data : [],
    recentArticles: articlesRes.status === 'fulfilled' ? articlesRes.value.data : [],
  };
};
