import type { PageServerLoad } from './$types';
import { getToolCount } from '$lib/api';

/** The "Cosplan Card sudah dibuat Nx" count; when the API is slow or down the page simply leaves it out. */
export const load: PageServerLoad = async () => {
  const toolCount = await getToolCount('cf23').then((res) => res.count).catch(() => null);
  return { toolCount };
};
