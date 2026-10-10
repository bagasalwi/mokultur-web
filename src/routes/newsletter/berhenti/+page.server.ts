import type { PageServerLoad } from './$types';

/** Shared by /newsletter/konfirmasi and /newsletter/berhenti: one call to the API, then a branded answer. */
export const load: PageServerLoad = async ({ url, fetch, setHeaders }) => {
  setHeaders({ 'cache-control': 'private, no-store' });
  const token = url.searchParams.get('token') ?? '';
  const action = url.pathname.endsWith('/berhenti') ? 'unsubscribe' : 'confirm';
  if (!/^[a-f0-9]{48}$/.test(token)) return { action, ok: false, email: null };
  try {
    const res = await fetch(`http://127.0.0.1:3001/api/newsletter/${action}?token=${token}`);
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; email?: string };
    return { action, ok: !!(res.ok && data.ok), email: data.email ?? null };
  } catch {
    return { action, ok: false, email: null };
  }
};
