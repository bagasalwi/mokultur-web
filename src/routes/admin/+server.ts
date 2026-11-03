import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DASHBOARD_URL } from '$lib/server/site';

export const GET: RequestHandler = () => {
	redirect(301, DASHBOARD_URL);
};
