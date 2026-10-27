import { env } from '$env/dynamic/private';
import type { AiSettings } from '$lib/server/ai-settings';

/**
 * Where the site's AI calls go and how they are sent.
 *
 * The provider is the one picked at dashboard Settings → AI (bagas-server's
 * gateway, Anthropic, …), handed over with its key by getAiSettings(). With
 * none picked, or mokultur-elysia unreachable on a cold start, this process's
 * own AI_BASE_URL / AI_API_KEY / AI_MODEL stand, as before providers existed.
 */
export type AiEndpoint = { baseUrl: string; apiKey: string; model: string; fastModel: string };

export function aiEndpoint(ai: AiSettings): AiEndpoint | null {
  if (ai.provider?.baseUrl && ai.model) {
    return { baseUrl: ai.provider.baseUrl, apiKey: ai.provider.apiKey, model: ai.model, fastModel: ai.fastModel || ai.model };
  }
  if (!env.AI_BASE_URL || !env.AI_API_KEY || !env.AI_MODEL) return null;
  const model = ai.model ?? env.AI_MODEL;
  return { baseUrl: env.AI_BASE_URL, apiKey: env.AI_API_KEY, model, fastModel: ai.fastModel || env.AI_FAST_MODEL || model };
}

/**
 * Models that refuse a `temperature` (Anthropic's whole Claude 5 family), by
 * address and model, so only a model's first request pays for the retry.
 */
const refusesTemperature = new Set<string>();

/**
 * POSTs a chat completion. `body.temperature` is dropped, and the request sent
 * again, when the model answers 400 about it. Network failures throw; any
 * other answer, streamed or not, is returned for the caller to read.
 */
export async function postChatCompletion(
  endpoint: AiEndpoint,
  body: Record<string, unknown> & { model: string },
  timeoutMs: number,
): Promise<Response> {
  const key = `${endpoint.baseUrl}|${body.model}`;
  const send = (payload: Record<string, unknown>) =>
    fetch(`${endpoint.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        ...(endpoint.apiKey ? { Authorization: `Bearer ${endpoint.apiKey}` } : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });

  const { temperature, ...rest } = body;
  if (temperature === undefined || refusesTemperature.has(key)) return send(rest);

  const res = await send(body);
  if (res.status !== 400) return res;
  const reason = await res.text().catch(() => '');
  if (!/temperature/i.test(reason)) {
    return new Response(reason, { status: res.status, headers: res.headers });
  }
  refusesTemperature.add(key);
  return send(rest);
}
