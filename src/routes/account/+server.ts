import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Account settings moved under the dashboard.
 *
 * A permanent redirect rather than a deletion: /account was the signed-in
 * landing spot for a long time, it is what `?redirect=` pointed at in older
 * login links, and it is the kind of URL people bookmark.
 */
export const GET: RequestHandler = () => {
  throw redirect(301, '/dashboard/account');
};
