import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DASHBOARD_URL } from '$lib/server/site';

export const GET: RequestHandler = ({ params }) => {
	redirect(301, `${DASHBOARD_URL}/admin/${params.path}`);
};
