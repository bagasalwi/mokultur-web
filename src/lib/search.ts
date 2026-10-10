import { browser } from '$app/environment';
import { PUBLIC_API_URL } from '$env/static/public';

/**
 * Client-side search helpers: highlighting, the reader's own recent searches
 * (this browser only) and the anonymous "a search happened" report.
 */

export type Part = { text: string; hit: boolean };

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Splits `text` so every word starting with one of the query words can be
 * wrapped in <mark>. Plain parts, never HTML, so titles cannot inject markup.
 */
export function highlight(text: string | null | undefined, words: string[]): Part[] {
  if (!text) return [];
  const list = [...new Set(words.map((w) => w.trim().toLowerCase()).filter((w) => w.length >= 2))]
    .sort((a, b) => b.length - a.length);
  if (!list.length) return [{ text, hit: false }];
  let pattern: RegExp;
  try {
    pattern = new RegExp(`(^|[^\\p{L}\\p{N}])((?:${list.map(escapeRegex).join('|')})[\\p{L}\\p{N}]*)`, 'giu');
  } catch {
    return [{ text, hit: false }];
  }
  const parts: Part[] = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const start = (match.index ?? 0) + match[1].length;
    if (start > last) parts.push({ text: text.slice(last, start), hit: false });
    parts.push({ text: match[2], hit: true });
    last = start + match[2].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), hit: false });
  return parts;
}

/** Same word split the API uses, for highlighting what the reader typed. */
export function queryWords(q: string): string[] {
  return q.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

const RECENT_KEY = 'mokultur:recent-searches';
const RECENT_MAX = 6;

export function loadRecent(): string[] {
  if (!browser) return [];
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string').slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function storeRecent(list: string[]): string[] {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // Private mode or storage blocked: recent searches simply stay empty.
  }
  return list;
}

export function rememberSearch(q: string): string[] {
  const value = q.trim().replace(/\s+/g, ' ').slice(0, 100);
  if (value.length < 2) return loadRecent();
  const list = [value, ...loadRecent().filter((v) => v.toLowerCase() !== value.toLowerCase())].slice(0, RECENT_MAX);
  return storeRecent(list);
}

export function forgetSearch(q: string): string[] {
  return storeRecent(loadRecent().filter((v) => v !== q));
}

export function clearRecent(): string[] {
  return storeRecent([]);
}

/** Anonymous: only the words go to the API, which counts the results itself. */
export function reportSearch(q: string, source: 'page' | 'suggest'): void {
  if (!browser || q.trim().length < 2) return;
  fetch(`${PUBLIC_API_URL}/api/search/log`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ q: q.trim().slice(0, 100), source }),
    keepalive: true,
  }).catch(() => {});
}

export function searchHref(q: string): string {
  return `/search?q=${encodeURIComponent(q.trim())}`;
}
