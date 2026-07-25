import { PUBLIC_API_URL } from '$env/static/public';
import { getSettings, listCategories, listArticles, listWriters, type ArticleListItem } from '$lib/api';

/**
 * Builds the grounding context injected into the chat system prompt.
 *
 * Without this the model invents answers wholesale — asked "Apa itu Mokultur?"
 * with no context it replies that Mokultur is an AI assistant. Everything the
 * bot states about Mokultur has to come from here.
 */

const CACHE_TTL = 10 * 60 * 1000;

let _facts: string | null = null;
let _factsAt = 0;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${PUBLIC_API_URL}${path}`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

interface AboutSection {
  data?: {
    headline?: { id?: string };
    body1?: { id?: string };
    body2?: { id?: string };
  };
}

interface MediaPartners {
  featured?: { name: string }[];
  sections?: { label?: string; partners?: { name: string }[] }[];
}

interface ReelsPayload {
  profile?: {
    username: string;
    followers: number;
    totalPosts: number;
    isVerified: boolean;
  } | null;
}

/** Static site facts, refreshed at most every 10 minutes. */
export async function getSiteFacts(): Promise<string> {
  if (_facts && Date.now() - _factsAt < CACHE_TTL) return _facts;

  const [settingsRes, categoriesRes, aboutRes, partnersRes, reelsRes, writersRes] = await Promise.allSettled([
    getSettings(),
    listCategories(),
    fetchJson<AboutSection>('/api/about/about-section'),
    fetchJson<MediaPartners>('/api/media-partners'),
    fetchJson<ReelsPayload>('/api/reels'),
    listWriters(1, 50),
  ]);

  const parts: string[] = [];

  if (settingsRes.status === 'fulfilled') {
    const s = settingsRes.value.data;
    parts.push(
      [
        '## Identitas',
        `Nama: ${s.site_name ?? 'Mokultur'}`,
        s.site_description ? `Tagline: ${s.site_description}` : null,
        'Website: https://mokultur.com',
        'Halaman profil lengkap: https://about.mokultur.com',
        '',
        '## Kontak',
        s.contact_email ? `Email: ${s.contact_email}` : null,
        s.contact_whatsapp ? `WhatsApp: +${s.contact_whatsapp}` : null,
        'Halaman kontak: https://mokultur.com/contact',
      ]
        .filter(Boolean)
        .join('\n')
    );
  }

  if (aboutRes.status === 'fulfilled') {
    const a = aboutRes.value.data;
    const about = [a?.headline?.id, a?.body1?.id, a?.body2?.id].filter(Boolean).join(' ');
    if (about) parts.push(`## Tentang Mokultur\n${about}`);
  }

  if (categoriesRes.status === 'fulfilled') {
    const cats = categoriesRes.value.data;
    if (cats.length) {
      parts.push(
        '## Kategori artikel\n' +
          cats
            .map((c) => {
              const desc = c.description ? ` — ${c.description}` : '';
              return `- ${c.name} (https://mokultur.com/category/${c.slug})${desc}`;
            })
            .join('\n')
      );
    }
  }

  if (writersRes.status === 'fulfilled') {
    const writers = writersRes.value.data ?? [];
    if (writers.length) {
      parts.push(
        '## Penulis / author\n' +
          `Halaman daftar penulis: https://mokultur.com/author\n` +
          writers
            .map((w) => {
              const handle = w.username ?? String(w.id);
              const bio = w.description ? ` — ${w.description}` : '';
              return `- ${w.name} (https://mokultur.com/@${handle}), ${w.totalArticles} artikel${bio}`;
            })
            .join('\n')
      );
    }
  }

  if (partnersRes.status === 'fulfilled') {
    const p = partnersRes.value;
    const names = [
      ...(p.featured ?? []).map((x) => x.name),
      ...(p.sections ?? []).flatMap((sec) => (sec.partners ?? []).map((x) => x.name)),
    ].filter(Boolean);
    const unique = [...new Set(names)];
    if (unique.length) {
      parts.push(
        `## Media partner\nHalaman: https://mokultur.com/media-partner\nDaftar partner: ${unique.join(', ')}`
      );
    }
  }

  if (reelsRes.status === 'fulfilled' && reelsRes.value.profile) {
    const ig = reelsRes.value.profile;
    parts.push(
      [
        '## Instagram',
        `Akun: @${ig.username} (https://www.instagram.com/${ig.username}/)${ig.isVerified ? ' — terverifikasi' : ''}`,
        `Pengikut: ${ig.followers.toLocaleString('id-ID')}`,
        `Total konten: ${ig.totalPosts.toLocaleString('id-ID')}`,
      ].join('\n')
    );
  }

  _facts = parts.join('\n\n');
  _factsAt = Date.now();

  return _facts;
}

/**
 * Question words and filler that must be stripped before searching.
 *
 * The articles endpoint matches the search term literally, so sending the raw
 * question ("Ada artikel soal cosplay?") returns zero rows while "cosplay"
 * returns three. Without this the bot silently loses its article knowledge.
 */
const STOPWORDS = new Set([
  'ada', 'adakah', 'apa', 'apakah', 'aku', 'artikel', 'atau', 'bagaimana', 'berita',
  'bisa', 'buat', 'cari', 'carikan', 'dan', 'dari', 'dengan', 'di', 'dong', 'gimana',
  'info', 'informasi', 'ingin', 'ini', 'itu', 'kah', 'kamu', 'kapan', 'kasih', 'ke',
  'kok', 'lihat', 'mana', 'mau', 'mengenai', 'nggak', 'nya', 'punya', 'rekomendasi',
  'saya', 'seputar', 'sih', 'siapa', 'soal', 'tentang', 'terakhir', 'terbaru',
  'tolong', 'untuk', 'ya', 'yang', 'yg',
]);

function extractKeywords(question: string): string[] {
  return question
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .slice(0, 4);
}

/** Articles matching the visitor's question, so the bot links real URLs instead of inventing titles. */
export async function searchArticles(query: string): Promise<string> {
  const keywords = extractKeywords(query);
  if (!keywords.length) return '';

  const search = async (term: string): Promise<ArticleListItem[]> => {
    try {
      const res = await listArticles({ page: 1, perPage: 5, search: term });
      return res.data ?? [];
    } catch {
      return [];
    }
  };

  // Try the whole keyword phrase first; fall back to single keywords when it is too narrow.
  let items = await search(keywords.join(' '));

  if (!items.length && keywords.length > 1) {
    const byLength = [...keywords].sort((a, b) => b.length - a.length).slice(0, 2);
    const found = new Map<number, ArticleListItem>();
    for (const term of byLength) {
      for (const a of await search(term)) {
        if (!found.has(a.id)) found.set(a.id, a);
      }
      if (found.size >= 5) break;
    }
    items = [...found.values()].slice(0, 5);
  }

  if (!items.length) return '';

  return (
    '## Artikel relevan dengan pertanyaan ini\n' +
    items
      .map((a) => {
        const desc = a.description ? ` — ${a.description}` : '';
        return `- "${a.title}" (https://mokultur.com/article/${a.id}/${a.slug})${desc}`;
      })
      .join('\n')
  );
}
