import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { getEvent, getSettings } from '$lib/api';
import { icsFile } from '$lib/event';
import { absoluteUrl } from '$lib/seo';

/** "Tambah ke kalender" for Apple Calendar, Outlook and anything else that reads .ics. */
export const GET: RequestHandler = async ({ params, url }) => {
  const { data: settings } = await getSettings();
  if (settings.event_enabled === false) throw error(404, 'Event tidak tersedia.');

  const res = await getEvent(params.slug).catch(() => null);
  if (!res) throw error(404, 'Event tidak ditemukan');

  const pageUrl = absoluteUrl(`/event/${res.data.slug}`);
  const body = icsFile(res.data, pageUrl, url.host);
  if (!body) throw error(404, 'Tanggal event tidak valid');

  return new Response(body, {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'cache-control': 'no-store',
      'content-disposition': `attachment; filename="${res.data.slug}.ics"`,
    },
  });
};
