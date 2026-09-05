import { env } from '$env/dynamic/private';
import { PUBLIC_API_URL } from '$env/static/public';

/**
 * AI configuration that must not reach a browser.
 *
 * The public /api/settings payload is serialised into the HTML of every page,
 * so the system prompt and model live behind a shared-secret endpoint instead
 * and are read here, server-side only.
 *
 * Every field is nullable on purpose: a blank dashboard field means "not
 * configured", and each caller falls back to its own env default. That way an
 * empty AI tab leaves the chat working exactly as it did before.
 */
export type AiSettings = {
  model: string | null;
  fastModel: string | null;
  systemPrompt: string | null;
  temperature: number | null;
  maxTokens: number | null;
  rateLimit: number | null;
};

const EMPTY: AiSettings = {
  model: null,
  fastModel: null,
  systemPrompt: null,
  temperature: null,
  maxTokens: null,
  rateLimit: null,
};

const TTL_MS = 60_000;
let cache: AiSettings | null = null;
let cachedAt = 0;

export async function getAiSettings(fetchFn: typeof fetch = fetch): Promise<AiSettings> {
  if (cache && Date.now() - cachedAt < TTL_MS) return cache;

  const secret = env.INTERNAL_API_SECRET;
  if (!secret) return EMPTY;

  try {
    const res = await fetchFn(`${PUBLIC_API_URL.replace(/\/$/, '')}/api/settings/internal/ai`, {
      headers: { 'x-sync-secret': secret },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return cache ?? EMPTY;

    const body = (await res.json()) as { data?: Partial<AiSettings> };
    cache = { ...EMPTY, ...(body.data ?? {}) };
    cachedAt = Date.now();
    return cache;
  } catch {
    // A blip upstream must not take the chat down; the last good value stands.
    return cache ?? EMPTY;
  }
}
