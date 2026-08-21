import type { PageServerLoad } from './$types';
import { listTalents } from '$lib/api';

export const load: PageServerLoad = async ({ setHeaders }) => {
  setHeaders({ 'cache-control': 'public, max-age=300, stale-while-revalidate=900' });

  const res = await listTalents().catch(() => null);

  return {
    talents: res?.data ?? [],
    featured: res?.featured ?? [],
    // Zeroed rather than absent so the hero can render its stat row without a
    // null check on every field.
    stats: res?.stats ?? { talentCount: 0, totalFollowers: 0, totalReels: 0 },
  };
};
