/**
 * Moku's faces. The model opens every reply with one of these in square
 * brackets ("[senang] Halo!"); /api/chat lifts the tag off and sends it as its
 * own event, and the chat panel shows it on the avatar.
 */
export const MOKU_EXPRESSIONS = ['netral', 'senang', 'berbinar', 'wink', 'bangga', 'tsundere', 'malu', 'kaget', 'berpikir', 'kesal', 'sedih', 'lega'] as const;
export type MokuExpression = (typeof MOKU_EXPRESSIONS)[number];

export const isMokuExpression = (name: unknown): name is MokuExpression =>
  typeof name === 'string' && (MOKU_EXPRESSIONS as readonly string[]).includes(name);

const STRAY_TAG = new RegExp(`\\[(?:${MOKU_EXPRESSIONS.join('|')})\\]\\s?`, 'gi');

/** Removes any expression tag left inside a reply (a model sometimes tags a second paragraph too). */
export const stripExpressionTags = (text: string): string => text.replace(STRAY_TAG, '');
