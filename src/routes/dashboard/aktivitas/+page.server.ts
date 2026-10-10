import { COOKIE_NAME } from '$lib/auth';
import { meGet, type MeActivity } from '$lib/server/me';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
  const result = await meGet<{ data: MeActivity[] }>(fetch, cookies.get(COOKIE_NAME) ?? '', 'activity');
  return { activity: result?.data ?? [], activityError: result ? null : 'Aktivitas belum dapat dimuat. Coba lagi.' };
};
