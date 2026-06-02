import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, url }) => {
  const rest = params.rest ?? '';
  const target = '/lounge' + (rest ? `/${rest}` : '') + url.search;
  throw redirect(301, target);
};
