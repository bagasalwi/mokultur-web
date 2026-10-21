#!/usr/bin/env node
/**
 * Sitemap audit: every URL in the sitemap index, checked the way Search
 * Console judges it. Writes one CSV row per URL.
 *
 *   node scripts/audit-sitemap/index.mjs [options]
 *
 *   --sitemap <url>   sitemap index to start from (default https://mokultur.com/sitemap.xml)
 *   --fetch-origin <origin>
 *                     fetch pages from this origin instead of the public one,
 *                     e.g. http://127.0.0.1:3002 to skip Cloudflare and the nginx
 *                     micro-cache. URLs are still judged against the public URL.
 *   --out <file>      CSV path (default sitemap-audit-<date>.csv in the cwd)
 *   --concurrency <n> parallel requests (default 4)
 *   --limit <n>       stop after n URLs (for a quick look)
 *   --thin <words>    word count below which an article is flagged (default 300)
 *
 * Per URL: status without following redirects, X-Robots-Tag, meta robots,
 * canonical (must be the URL itself), <title>, <h1>, meta description (and
 * whether another URL shares it), word count of the main content, JSON-LD
 * types, and for articles: NewsArticle/Article fields, links to other
 * articles, and whether the sitemap <lastmod> matches dateModified.
 *
 * `action` says what the sitemap should do with the URL: "keep", or "drop"
 * with the reason. Nothing is changed or deleted by this script.
 */
import { writeFileSync } from 'node:fs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith('--')) pairs.push([arg.slice(2), all[i + 1]?.startsWith('--') || all[i + 1] === undefined ? 'true' : all[i + 1]]);
    return pairs;
  }, []),
);
const SITEMAP = args.sitemap ?? 'https://mokultur.com/sitemap.xml';
const PUBLIC_ORIGIN = new URL(SITEMAP).origin;
const FETCH_ORIGIN = args['fetch-origin']?.replace(/\/$/, '') ?? null;
const CONCURRENCY = Math.max(1, Number(args.concurrency ?? 4));
const LIMIT = args.limit ? Number(args.limit) : Infinity;
const THIN = Number(args.thin ?? 300);
const OUT = args.out ?? `sitemap-audit-${new Date().toISOString().slice(0, 10)}.csv`;
const UA = 'Mozilla/5.0 (compatible; MokulturSitemapAudit/1.0; +https://mokultur.com)';

const viaOrigin = (url) => (FETCH_ORIGIN ? url.replace(PUBLIC_ORIGIN, FETCH_ORIGIN) : url);

async function get(url, { tries = 2 } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(viaOrigin(url), { redirect: 'manual', headers: { 'user-agent': UA, accept: 'text/html,application/xml' }, signal: AbortSignal.timeout(20_000) });
      const body = res.status >= 300 && res.status < 400 ? '' : await res.text();
      if (res.status >= 500 && attempt < tries) continue;
      return { status: res.status, headers: res.headers, body };
    } catch (error) {
      if (attempt >= tries) return { status: 0, headers: new Headers(), body: '', error: String(error?.message ?? error) };
    }
  }
}

const decode = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, '&');
const text = (html) => decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'))?.slice(2).find((v) => v !== undefined) ?? null;

function sitemapEntries(xml) {
  const entries = [];
  for (const block of xml.match(/<(url|sitemap)\b[\s\S]*?<\/\1>/g) ?? []) {
    const loc = block.match(/<loc>([\s\S]*?)<\/loc>/)?.[1]?.trim();
    if (loc) entries.push({ loc: decode(loc), lastmod: block.match(/<lastmod>([\s\S]*?)<\/lastmod>/)?.[1]?.trim() ?? '' });
  }
  return { isIndex: /<sitemapindex\b/.test(xml), entries };
}

/** The inner HTML of the first element whose opening tag matches `open`, balancing nested <div>s. */
function elementInner(html, open) {
  const start = html.search(open);
  if (start < 0) return null;
  const from = html.indexOf('>', start) + 1;
  const re = /<(\/?)div\b[^>]*>/gi;
  re.lastIndex = from;
  let depth = 1;
  for (let m; (m = re.exec(html)); ) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return html.slice(from, m.index);
  }
  return html.slice(from);
}

function mainText(html, kind) {
  if (kind === 'article') {
    const body = elementInner(html, /<div[^>]*class="[^"]*\bbodyArticle\b/i);
    if (body !== null) return text(body);
  }
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html;
  return text(main.replace(/<(nav|header|footer|aside)\b[\s\S]*?<\/\1>/gi, ' '));
}

function kindOf(url) {
  const path = new URL(url).pathname;
  if (path.startsWith('/article/')) return 'article';
  if (path.startsWith('/tag/')) return 'tag';
  if (path.startsWith('/category/')) return 'category';
  if (path.startsWith('/@')) return 'author';
  if (path.startsWith('/curhat-')) return 'curhat';
  if (path.startsWith('/event/')) return 'event';
  if (path.startsWith('/talent/')) return 'talent';
  if (path.startsWith('/page/')) return 'page';
  return 'other';
}

function jsonLd(html) {
  const items = [];
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const value = JSON.parse(m[1]);
      for (const node of [value].flat().flatMap((v) => (v && v['@graph'] ? v['@graph'] : [v]))) items.push(node);
    } catch {
      items.push({ '@type': 'INVALID_JSON' });
    }
  }
  return items;
}

async function audit(entry) {
  const url = entry.loc;
  const kind = kindOf(url);
  const res = await get(url);
  const row = {
    url, type: kind, status: res.status || `error: ${res.error}`, location: res.headers.get('location') ?? '',
    x_robots_tag: res.headers.get('x-robots-tag') ?? '', meta_robots: '', indexable: '', canonical: '', canonical_ok: '',
    title: '', title_length: 0, h1: '', h1_count: 0, meta_description_length: 0, description_duplicate_of: '',
    words: 0, thin: '', jsonld_types: '', article_schema_missing: '', related_article_links: '',
    sitemap_lastmod: entry.lastmod, date_modified: '', lastmod_ok: '', issues: '', action: '',
  };
  const issues = [];
  if (res.status !== 200) {
    issues.push(res.status >= 300 && res.status < 400 ? `redirect ${res.status}` : `status ${row.status}`);
  } else {
    const html = res.body;
    const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? html;
    const metaRobots = [...head.matchAll(/<meta\b[^>]*name=["']robots["'][^>]*>/gi)].map((m) => attr(m[0], 'content') ?? '').join(' | ');
    row.meta_robots = metaRobots;
    const noindex = /noindex/i.test(metaRobots) || /noindex/i.test(row.x_robots_tag);
    row.indexable = noindex ? 'no' : 'yes';
    if (/noindex/i.test(metaRobots)) issues.push('meta noindex');
    if (/noindex/i.test(row.x_robots_tag)) issues.push('X-Robots-Tag noindex');

    const canonicals = [...head.matchAll(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi)].map((m) => decode(attr(m[0], 'href') ?? ''));
    row.canonical = canonicals.join(' | ');
    row.canonical_ok = canonicals.length === 1 && canonicals[0] === url ? 'yes' : 'no';
    if (!canonicals.length) issues.push('no canonical');
    else if (canonicals.length > 1) issues.push('several canonicals');
    else if (canonicals[0] !== url) issues.push('canonical elsewhere');

    row.title = text(head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
    row.title_length = row.title.length;
    if (!row.title) issues.push('empty title');
    const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => text(m[1]));
    row.h1 = h1s[0] ?? '';
    row.h1_count = h1s.length;
    if (!h1s.some(Boolean)) issues.push('no h1 text');

    const description = head.match(/<meta\b[^>]*name=["']description["'][^>]*>/i);
    row.description = description ? decode(attr(description[0], 'content') ?? '').trim() : '';
    row.meta_description_length = row.description.length;
    if (!row.description) issues.push('no meta description');

    row.words = mainText(html, kind).split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

    const ld = jsonLd(html);
    row.jsonld_types = [...new Set(ld.map((n) => [n?.['@type']].flat().join('+')))].join(' ');
    if (ld.some((n) => n['@type'] === 'INVALID_JSON')) issues.push('invalid JSON-LD');

    if (kind === 'article') {
      row.thin = row.words < THIN ? 'yes' : 'no';
      if (row.words < THIN) issues.push(`thin (<${THIN} words)`);
      const article = ld.find((n) => ['NewsArticle', 'Article', 'BlogPosting'].includes([n?.['@type']].flat()[0]));
      const missing = article
        ? ['headline', 'datePublished', 'dateModified', 'author', 'image'].filter((k) => !article[k] || (Array.isArray(article[k]) && !article[k].length))
        : ['NewsArticle'];
      row.article_schema_missing = missing.join(' ');
      if (missing.length) issues.push(`schema missing: ${missing.join(' ')}`);
      row.date_modified = article?.dateModified ?? '';
      if (entry.lastmod && row.date_modified) {
        row.lastmod_ok = Math.abs(Date.parse(entry.lastmod) - Date.parse(row.date_modified)) <= 60_000 ? 'yes' : 'no';
        if (row.lastmod_ok === 'no') issues.push('lastmod differs from dateModified');
      } else if (!entry.lastmod) {
        row.lastmod_ok = 'no';
        issues.push('no lastmod');
      }
      const self = new URL(url).pathname;
      const related = new Set([...html.matchAll(/<a\b[^>]*href="((?:https:\/\/mokultur\.com)?\/article\/\d+\/[^"#?]+)/gi)].map((m) => m[1].replace(PUBLIC_ORIGIN, '')).filter((p) => p !== self));
      row.related_article_links = related.size;
      if (!related.size) issues.push('no links to other articles');
    }
  }
  row.issues = issues.join('; ');
  const dropReason = issues.find((i) => /^(redirect|status|meta noindex|X-Robots-Tag noindex|canonical elsewhere)/.test(i));
  row.action = dropReason ? `drop: ${dropReason}` : 'keep';
  return row;
}

async function pool(items, worker, size) {
  const results = new Array(items.length);
  let next = 0, done = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i]);
      if (++done % 50 === 0 || done === items.length) process.stderr.write(`  ${done}/${items.length}\n`);
    }
  }));
  return results;
}

const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// ---- collect URLs from the sitemap index -----------------------------------
const index = await get(SITEMAP);
if (index.status !== 200) throw new Error(`${SITEMAP} answered ${index.status}`);
const root = sitemapEntries(index.body);
const children = root.isIndex ? root.entries : [{ loc: SITEMAP, lastmod: '' }];
const urls = new Map();
const sitemapRows = [];
for (const child of children) {
  const res = child.loc === SITEMAP ? index : await get(child.loc);
  const parsed = res.status === 200 ? sitemapEntries(res.body) : { entries: [] };
  const withLastmod = parsed.entries.filter((e) => e.lastmod).length;
  sitemapRows.push(`${child.loc}: ${res.status}, ${parsed.entries.length} URLs, ${withLastmod} with <lastmod>${child.lastmod ? `, index lastmod ${child.lastmod}` : ', no lastmod in index'}`);
  for (const e of parsed.entries) {
    const known = urls.get(e.loc);
    // news-sitemap.xml repeats recent articles without <lastmod>; keep the one that has it.
    if (!known || (!known.lastmod && e.lastmod)) urls.set(e.loc, { ...e, sitemap: new URL(child.loc).pathname });
  }
}
process.stderr.write(`${sitemapRows.join('\n')}\n${urls.size} unique URLs\n`);

const list = [...urls.values()].slice(0, LIMIT);
const rows = await pool(list, async (e) => ({ sitemap: e.sitemap, ...(await audit(e)) }), CONCURRENCY);

// Descriptions shared by several URLs.
const byDescription = new Map();
for (const r of rows) if (r.description) byDescription.set(r.description, [...(byDescription.get(r.description) ?? []), r.url]);
for (const r of rows) {
  const same = (byDescription.get(r.description) ?? []).filter((u) => u !== r.url);
  if (same.length) {
    r.description_duplicate_of = same.slice(0, 3).join(' ');
    r.issues = [r.issues, 'duplicate meta description'].filter(Boolean).join('; ');
  }
}

const columns = ['sitemap', 'url', 'type', 'status', 'location', 'x_robots_tag', 'meta_robots', 'indexable', 'canonical', 'canonical_ok',
  'title', 'title_length', 'h1', 'h1_count', 'meta_description_length', 'description_duplicate_of', 'words', 'thin',
  'jsonld_types', 'article_schema_missing', 'related_article_links', 'sitemap_lastmod', 'date_modified', 'lastmod_ok', 'issues', 'action'];
writeFileSync(OUT, [columns.join(','), ...rows.map((r) => columns.map((c) => csvCell(r[c])).join(','))].join('\n') + '\n');

const tally = (pick) => Object.entries(rows.reduce((acc, r) => { for (const k of pick(r)) acc[k] = (acc[k] ?? 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]);
process.stderr.write(`\nWrote ${rows.length} rows to ${OUT}\n\nAction:\n${tally((r) => [r.action]).map(([k, n]) => `  ${n}\t${k}`).join('\n')}\n`);
process.stderr.write(`\nIssues:\n${tally((r) => r.issues.split('; ').filter(Boolean).map((i) => i.replace(/\(.*\)/, '').trim())).map(([k, n]) => `  ${n}\t${k}`).join('\n')}\n`);
