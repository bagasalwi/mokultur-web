import { COOKIE_NAME } from '$lib/auth';
import { ReaderError } from '$lib/reader';
import { INTERNAL_API_URL } from '$lib/server/site';

export async function loadReader<T>(fetcher: typeof fetch, token: string, path: string): Promise<T> {
  const response = await fetcher(`${INTERNAL_API_URL}/api/me/reader/${path}`, {
    headers: token ? { cookie: `${COOKIE_NAME}=${token}` } : {}, signal: AbortSignal.timeout(8000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new ReaderError(result.error ?? 'Bacaan belum dapat dimuat.', response.status);
  return result;
}
