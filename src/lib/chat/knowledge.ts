import { PUBLIC_API_URL } from '$env/static/public';
import {
  getSettings,
  listCategories,
  listArticles,
  listWriters,
  listTalents,
  listEvents,
  getPopularArticles,
  type ArticleListItem,
  type EventItem,
  type PopularRange,
} from '$lib/api';
import { getAboutFacts } from '$lib/chat/about';

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

const TIER_LABEL: Record<string, string> = {
  verified: 'Verified',
  partner: 'Partner',
  general: 'General',
};

/**
 * Most-read articles per time window.
 *
 * Views are a single lifetime counter per article — there is no per-day
 * history — so each window ranks the articles *published* in it. The labels
 * say exactly that, otherwise the bot would claim a daily trending chart the
 * data cannot back up.
 */
const POPULAR_WINDOWS: { range: PopularRange; label: string }[] = [
  { range: 'today', label: 'Terbit hari ini, paling banyak dibaca' },
  { range: 'month', label: 'Terbit bulan ini, paling banyak dibaca' },
  { range: 'all', label: 'Paling banyak dibaca sepanjang masa' },
];

const EVENT_STATUS_LABEL: Record<string, string> = {
  upcoming: 'belum mulai',
  ongoing: 'sedang berlangsung',
  done: 'sudah selesai',
  postponed: 'ditunda',
  cancelled: 'dibatalkan',
};

function describeEvent(e: EventItem): string {
  const dates = e.endDate && e.endDate !== e.startDate ? `${e.startDate} s/d ${e.endDate}` : e.startDate;
  const bits = [
    `- "${e.name}" (https://mokultur.com/event/${e.slug})`,
    dates,
    e.startTime ? `mulai ${e.startTime} WIB` : null,
    [e.location, e.city].filter(Boolean).join(', ') || null,
    `status: ${EVENT_STATUS_LABEL[e.status] ?? e.status}`,
    e.ticketUrl ? `tiket: ${e.ticketUrl}` : null,
  ].filter(Boolean);

  return bits.join(' — ');
}

/**
 * The event schedule, so the bot can answer "ada event apa bulan ini?".
 *
 * Dates are handed over as plain ISO strings with today's date stated next to
 * them: the model is far better at "is 2026-10-03 after today" than at being
 * told "3 hari lagi" and having to reason backwards from it.
 */
async function buildEventFacts(): Promise<string> {
  const [upcomingRes, pastRes] = await Promise.allSettled([
    listEvents('upcoming', 12),
    listEvents('past', 5),
  ]);

  const upcoming = upcomingRes.status === 'fulfilled' ? upcomingRes.value.data : [];
  const past = pastRes.status === 'fulfilled' ? pastRes.value.data : [];
  const today = upcomingRes.status === 'fulfilled' ? upcomingRes.value.today : null;

  if (!upcoming.length && !past.length) return '';

  const parts = [
    '## Jadwal event',
    'Halaman jadwal: https://mokultur.com/event',
    today ? `Hari ini: ${today} (WIB). Semua tanggal di bawah format YYYY-MM-DD.` : null,
  ].filter(Boolean) as string[];

  if (upcoming.length) {
    parts.push('', '### Event mendatang dan yang sedang berlangsung', ...upcoming.map(describeEvent));
  }

  if (past.length) {
    parts.push('', '### Event yang sudah lewat', ...past.map(describeEvent));
  }

  return parts.join('\n');
}

async function buildPopularFacts(): Promise<string> {
  const blocks = await Promise.all(
    POPULAR_WINDOWS.map(async ({ range, label }) => {
      try {
        const res = await getPopularArticles(5, range);
        const items = res.data ?? [];
        if (!items.length) return null;
        return (
          `### ${label}\n` +
          items
            .map((a, i) => {
              const views =
                typeof a.viewCount === 'number'
                  ? ` — ${a.viewCount.toLocaleString('id-ID')} kali dibaca`
                  : '';
              return `${i + 1}. "${a.title}" (https://mokultur.com/article/${a.id}/${a.slug})${views}`;
            })
            .join('\n')
        );
      } catch {
        return null;
      }
    })
  );

  const filled = blocks.filter(Boolean);
  if (!filled.length) return '';

  return (
    '## Artikel paling populer\n' +
    'Peringkat dihitung dari jumlah pembaca artikel yang terbit pada rentang waktu tersebut.\n\n' +
    filled.join('\n\n')
  );
}

/** Static site facts, refreshed at most every 10 minutes. */
export async function getSiteFacts(): Promise<string> {
  if (_facts && Date.now() - _factsAt < CACHE_TTL) return _facts;

  const [
    settingsRes,
    categoriesRes,
    aboutRes,
    partnersRes,
    reelsRes,
    writersRes,
    talentsRes,
    popularRes,
    eventsRes,
  ] = await Promise.allSettled([
    getSettings(),
    listCategories(),
    getAboutFacts(),
    fetchJson<MediaPartners>('/api/media-partners'),
    fetchJson<ReelsPayload>('/api/reels'),
    listWriters(1, 50),
    listTalents(),
    buildPopularFacts(),
    buildEventFacts(),
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

  if (aboutRes.status === 'fulfilled' && aboutRes.value) {
    parts.push(aboutRes.value);
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

  if (talentsRes.status === 'fulfilled') {
    const { data, featured, stats } = talentsRes.value;
    // `featured` repeats entries from `data`, so dedupe before listing them.
    const all = [...featured, ...data].filter(
      (t, i, arr) => arr.findIndex((x) => x.slug === t.slug) === i
    );
    if (all.length) {
      parts.push(
        [
          '## Talent',
          'Halaman daftar talent: https://mokultur.com/talent',
          `Jumlah talent: ${stats.talentCount}, total pengikut gabungan: ${stats.totalFollowers.toLocaleString('id-ID')}`,
          ...all.map((t) => {
            const bits = [
              `- ${t.alias} (https://mokultur.com/talent/${t.slug})`,
              `tier ${TIER_LABEL[t.talentTier] ?? t.talentTier}`,
              t.instagramUsername ? `IG @${t.instagramUsername}` : null,
              t.igFollowers ? `${t.igFollowers.toLocaleString('id-ID')} pengikut` : null,
              t.collabCount ? `${t.collabCount} kolaborasi` : null,
              t.isFeatured ? 'talent unggulan' : null,
            ].filter(Boolean);
            const blurb = t.tagline ?? t.bioShort;
            return `${bits.join(', ')}${blurb ? ` — ${blurb}` : ''}`;
          }),
        ].join('\n')
      );
    }
  }

  if (eventsRes.status === 'fulfilled' && eventsRes.value) {
    parts.push(eventsRes.value);
  }

  if (popularRes.status === 'fulfilled' && popularRes.value) {
    parts.push(popularRes.value);
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
