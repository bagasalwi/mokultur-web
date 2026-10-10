import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** Moved into the reader's personal space; old links and bookmarks keep working. */
export const GET: RequestHandler = ({ url }) => {
  throw redirect(301, `/dashboard/tersimpan${url.search}`);
};
