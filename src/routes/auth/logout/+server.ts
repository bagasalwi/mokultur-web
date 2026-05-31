import { redirect } from '@sveltejs/kit';
import { clearSessionCookie } from '$lib/auth';
import type { RequestHandler } from './$types';

const handler: RequestHandler = ({ cookies }) => {
  clearSessionCookie(cookies);
  throw redirect(303, '/');
};

export const POST = handler;
// Allow GET too for simple <a href> logout links if needed
export const GET = handler;
