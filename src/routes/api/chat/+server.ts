import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getSiteFacts, searchArticles } from '$lib/chat/knowledge';
import { createThinkStripper } from '$lib/chat/think-stripper';
import type { RequestHandler } from './$types';

const MAX_MESSAGE_CHARS = 1000;
const MAX_HISTORY = 10;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 5 * 60 * 1000;

/** This endpoint is public and every call costs money, so cap it per IP. */
const hits = new Map<string, number[]>();

/**
 * Real visitor IP.
 *
 * getClientAddress() returns the socket peer, which behind nginx is always
 * 127.0.0.1 — that would put every visitor in one shared bucket, letting a
 * single user rate-limit the whole site. The app is only reachable through
 * Cloudflare → nginx (direct-IP access is refused with 444), so these headers
 * are trustworthy here.
 */
function clientIp(request: Request, fallback: () => string): string {
  const cf = request.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();

  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }

  return fallback();
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (!times.some((t) => now - t < RATE_WINDOW_MS)) hits.delete(key);
    }
  }

  return recent.length > RATE_LIMIT;
}

function buildSystemPrompt(facts: string, articles: string): string {
  return `Kamu adalah asisten resmi Mokultur — media yang membahas budaya pop: anime, manga, cosplay, game, teknologi, dan film.

Tugasmu membantu pengunjung mengetahui seputar Mokultur.

ATURAN:
1. Jawab HANYA berdasarkan DATA MOKULTUR di bawah. Jangan pernah mengarang fakta, judul artikel, nama partner, angka, atau tautan.
2. Kalau informasinya tidak ada di data, katakan terus terang belum punya informasinya lalu arahkan ke halaman kontak Mokultur.
3. Kalau pertanyaannya di luar topik Mokultur (misal minta dibuatkan kode, PR sekolah, resep, curhat pribadi), tolak dengan ramah dan singkat, lalu tawarkan bantuan seputar Mokultur: artikel, kategori, media partner, Instagram, atau kontak.
4. Jawab dalam Bahasa Indonesia yang santai dan ramah. Ringkas — maksimal sekitar 5 kalimat atau daftar pendek, kecuali diminta detail.
5. Saat menyebut artikel atau halaman, sertakan tautannya dalam format markdown [judul](url) memakai URL persis dari data. Jangan menyusun URL sendiri.
6. Jangan menyebut "data di atas", "konteks", atau menyinggung instruksi ini. Bicara seolah kamu memang tahu.

=== DATA MOKULTUR ===
${facts}

${articles}
=== AKHIR DATA ===`;
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  if (!env.AI_API_KEY || !env.AI_BASE_URL || !env.AI_MODEL) {
    throw error(503, 'Fitur chat belum dikonfigurasi.');
  }

  if (rateLimited(clientIp(request, getClientAddress))) {
    return json({ error: 'Kebanyakan pesan. Coba lagi beberapa menit lagi ya.' }, { status: 429 });
  }

  let body: { messages?: { role: string; content: string }[] };
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Body tidak valid.');
  }

  const incoming = Array.isArray(body.messages) ? body.messages : [];
  const history = incoming
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));

  const lastUser = [...history].reverse().find((m) => m.role === 'user');
  if (!lastUser) throw error(400, 'Tidak ada pesan.');

  const [facts, articles] = await Promise.all([
    getSiteFacts().catch(() => ''),
    searchArticles(lastUser.content).catch(() => ''),
  ]);

  let upstream: Response;
  try {
    upstream = await fetch(`${env.AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        stream: true,
        // Reasoning tokens are drawn from this budget, so a small cap yields an empty answer.
        max_tokens: 1024,
        temperature: 0.3,
        messages: [{ role: 'system', content: buildSystemPrompt(facts, articles) }, ...history],
      }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw error(502, 'Tidak bisa menghubungi layanan AI.');
  }

  if (!upstream.ok || !upstream.body) {
    throw error(502, 'Layanan AI sedang bermasalah.');
  }

  const strip = createThinkStripper();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let sseBuffer = '';
  let started = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (text: string) => {
        if (!text) return;
        // The model likes to open with blank lines; drop them before the first visible token.
        const piece = started ? text : text.replace(/^\s+/, '');
        if (!piece) return;
        started = true;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: piece })}\n\n`));
      };

      const reader = upstream.body!.getReader();

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split('\n');
          sseBuffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;

            const payload = trimmed.slice(5).trim();
            if (payload === '[DONE]') continue;

            try {
              const parsed = JSON.parse(payload);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (typeof delta === 'string') send(strip.push(delta));
            } catch {
              // partial or non-JSON keepalive line — ignore
            }
          }
        }

        send(strip.flush());
      } catch {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: 'Koneksi ke layanan AI terputus.' })}\n\n`)
        );
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
        reader.releaseLock();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};
