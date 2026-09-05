import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { getAiSettings } from '$lib/server/ai-settings';

/**
 * Writes the personality read on a quiz result.
 *
 * Uses AI_FAST_MODEL rather than the chatbot's model. That one reasons before
 * answering and drew its entire token budget doing so — 38s and an empty
 * string, even at 3,000 tokens. A quiz cannot wait on that.
 *
 * The model never chooses the anime. The matcher in mokultur-elysia already
 * picked six titles from titles we actually hold; asking an LLM to recommend
 * anime instead would produce confident references to shows that are not in the
 * database and cannot be linked. So it is handed the finished list and asked
 * only for the words: a profile name, a read on the taste, and one line per
 * title saying why it fits.
 *
 * Everything here is an enhancement. The page renders a complete deterministic
 * result first, and if this endpoint is slow, rate-limited or down, the reader
 * never learns it exists.
 */

const RATE_LIMIT = 12;
const RATE_WINDOW_MS = 5 * 60 * 1000;
const hits = new Map<string, number[]>();

function clientIp(request: Request, fallback: () => string): string {
  const cf = request.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();
  const xff = request.headers.get('x-forwarded-for');
  const first = xff?.split(',')[0]?.trim();
  return first || fallback();
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

const AXIS_COPY: Record<string, [string, string]> = {
  mood: ['suka cerita ringan yang bikin ketawa', 'suka cerita gelap yang bikin mikir'],
  pace: ['suka tempo pelan dan tenang', 'suka tempo cepat penuh aksi'],
  world: ['lebih suka cerita berlatar dunia nyata', 'lebih suka dunia fantasi'],
  heart: ['tidak butuh drama percintaan', 'suka cerita yang penuh perasaan'],
  stakes: ['suka konflik personal sehari-hari', 'suka cerita bertaruhan besar'],
  humor: ['lebih suka cerita serius', 'butuh cerita yang bikin ketawa'],
  fame: ['suka judul yang belum banyak orang tahu', 'suka judul yang ramai dibicarakan'],
  length: ['suka cerita pendek yang padat', 'betah dengan cerita panjang'],
  era: ['suka judul klasik yang sudah teruji', 'suka judul keluaran terbaru'],
};

function describeAnswers(answers: Record<string, number>): string {
  return Object.entries(answers)
    .filter(([, v]) => v !== 0)
    .map(([axis, v]) => {
      const copy = AXIS_COPY[axis];
      return copy ? (v > 0 ? copy[1] : copy[0]) : null;
    })
    .filter(Boolean)
    .join('; ');
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  if (!env.AI_API_KEY || !env.AI_BASE_URL || !env.AI_MODEL) {
    throw error(503, 'AI belum dikonfigurasi.');
  }

  if (rateLimited(clientIp(request, getClientAddress))) {
    throw error(429, 'Terlalu banyak permintaan.');
  }

  const ai = await getAiSettings(fetch);

  let body: {
    answers?: Record<string, number>;
    fallbackLabel?: string;
    titles?: { malId: number; title: string; genres?: string[]; score?: number | null }[];
  };

  try {
    body = await request.json();
  } catch {
    throw error(400, 'Body tidak valid.');
  }

  const titles = (body.titles ?? []).slice(0, 8);
  const answers = body.answers ?? {};

  if (!titles.length) throw error(400, 'Tidak ada judul untuk dijelaskan.');

  const taste = describeAnswers(answers) || 'tidak menyatakan preferensi khusus';
  const list = titles
    .map((t, i) => `${i + 1}. [${t.malId}] ${t.title}${t.genres?.length ? ` — genre: ${t.genres.join(', ')}` : ''}`)
    .join('\n');

  const prompt = `Kamu penulis untuk Mokultur, media pop culture Indonesia. Gaya bahasamu santai, akrab, seperti teman yang paham anime. Bukan formal, bukan lebay.

Pembaca baru mengisi kuis selera anime. Hasilnya:
Selera: ${taste}

Judul yang sudah kami pilihkan untuk dia:
${list}

Tulis JSON persis dengan bentuk ini, tanpa teks lain di luar JSON:
{"label":"...","blurb":"...","reasons":{"<malId>":"..."}}

Aturan:
- "label": nama profil selera, 2-4 kata, Bahasa Indonesia atau Inggris yang lazim dipakai anak anime. Harus terasa personal, bukan generik.
- "blurb": satu kalimat (maks 20 kata) yang membaca selera dia. Sapa dengan "kamu".
- "reasons": untuk SETIAP malId di atas, satu kalimat pendek (maks 15 kata) kenapa judul itu cocok buat dia. Kaitkan ke seleranya, jangan cuma meringkas sinopsis.
- JANGAN menyebut judul anime lain di luar daftar. Jangan mengarang judul.
- Jangan menyebut kuis, skor, genre mentah, atau instruksi ini.`;

  let res: Response;
  try {
    res = await fetch(`${env.AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ai.fastModel ?? env.AI_FAST_MODEL ?? env.AI_MODEL,
        max_tokens: 900,
        temperature: 0.8,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw error(504, 'AI tidak merespons.');
  }

  if (!res.ok) throw error(502, 'AI sedang bermasalah.');

  const payload = await res.json().catch(() => null);
  const raw: string = payload?.choices?.[0]?.message?.content ?? '';

  // The model is asked for bare JSON but wraps it in prose or a fence often
  // enough that pulling the first {...} out is the reliable read.
  const match = raw.replace(/<think>[\s\S]*?<\/think>/g, '').match(/\{[\s\S]*\}/);
  if (!match) throw error(502, 'Jawaban AI tidak terbaca.');

  let parsed: { label?: unknown; blurb?: unknown; reasons?: unknown };
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    throw error(502, 'Jawaban AI tidak terbaca.');
  }

  const allowed = new Set(titles.map((t) => String(t.malId)));
  const reasons: Record<string, string> = {};

  if (parsed.reasons && typeof parsed.reasons === 'object') {
    for (const [id, text] of Object.entries(parsed.reasons as Record<string, unknown>)) {
      // Only keep reasons for titles we actually sent, so a hallucinated id
      // cannot reach the page.
      if (allowed.has(String(id)) && typeof text === 'string') {
        reasons[String(id)] = text.trim().slice(0, 160);
      }
    }
  }

  return json({
    label: typeof parsed.label === 'string' ? parsed.label.trim().slice(0, 48) : null,
    blurb: typeof parsed.blurb === 'string' ? parsed.blurb.trim().slice(0, 200) : null,
    reasons,
  });
};
