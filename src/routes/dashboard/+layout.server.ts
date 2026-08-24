import { redirect } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import { COOKIE_NAME } from '$lib/auth';
import type { LayoutServerLoad } from './$types';

/**
 * The single gate for the whole dashboard.
 *
 * Capabilities are read from the API rather than from `locals.user`. That
 * matters: this site mints its own session cookie with a 30-day lifetime, so
 * the `role` claim inside it is a snapshot from whenever the user last logged
 * in. Granting someone writing rights today would otherwise stay invisible here
 * for a month. `/api/auth/me` re-reads the row and its joined role on every
 * request, so a role change shows up on the next page load.
 */
export const load: LayoutServerLoad = async ({ locals, cookies, fetch, url }) => {
  if (!locals.user) {
    throw redirect(303, `/auth/login?redirect=${encodeURIComponent(url.pathname)}`);
  }

  const token = cookies.get(COOKIE_NAME) ?? '';

  let profile = {
    ...locals.user,
    roleName: null as string | null,
    isVerified: false,
    canWrite: false,
    canPublishDirectly: false,
  };

  try {
    const res = await fetch(`${PUBLIC_API_URL}/api/auth/me`, {
      headers: { cookie: `${COOKIE_NAME}=${token}` },
    });

    if (res.ok) {
      const json = await res.json();
      if (json?.user) profile = { ...profile, ...json.user };
    }
  } catch {
    /*
     * Fail soft. A dashboard that renders the profile card and the account link
     * is more useful than an error page, and defaulting canWrite to false means
     * an API outage can never hand out rights the user does not have.
     */
  }

  return { profile };
};
