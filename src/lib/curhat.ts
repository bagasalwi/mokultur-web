/**
 * One slug rule for a curhatan URL, shared by the cards that link to a post and
 * the post page that checks it. The page redirects any other slug here, so a
 * post has exactly one URL. Text with no latin letters slugs to nothing; it
 * gets a fixed word so the route still has a segment to match.
 */
export function curhatSlug(text: string): string {
  const slug = text.substring(0, 60).toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+$/, '');
  return slug || 'curhatan';
}

export function curhatPath(item: { id: number; curhatan: string }): string {
  return `/curhat-${item.id}/${curhatSlug(item.curhatan)}`;
}

/** A short single-line excerpt for titles and descriptions. */
export function curhatExcerpt(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const atWord = cut.lastIndexOf(' ');
  return `${(atWord > max * 0.6 ? cut.slice(0, atWord) : cut).replace(/[\s.,;:!?-]+$/, '')}…`;
}
