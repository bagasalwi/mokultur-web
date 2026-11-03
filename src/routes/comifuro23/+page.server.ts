import type { PageServerLoad } from './$types';
import { requireWebFeature } from '$lib/server/site';

/** Only on a site that offers it (WEB_FEATURES). */
export const load: PageServerLoad = () => {
  requireWebFeature('comifuro23');
};
