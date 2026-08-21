import type { TalentTier } from '$lib/api';

/** Compact follower/view counts — "1.2M" reads better than "1,238,904" on a card. */
export function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace('.0', '')}K`;
  return String(value);
}

export const TIER_LABELS: Record<TalentTier, string> = {
  verified: 'Verified',
  partner: 'Partner',
  general: 'General',
};

/**
 * Turn a contact link into a WhatsApp message that already names the talent.
 *
 * Only WhatsApp links get the treatment — anything else is returned untouched,
 * so an admin can point the CTA at an email or a form without it being mangled.
 */
export function collabLink(url: string | null, alias: string): string | null {
  if (!url) return null;

  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  if (!/(^|\.)wa\.me$|(^|\.)whatsapp\.com$/.test(parsed.hostname)) return url;

  parsed.searchParams.set('text', `Halo Mokultur, saya tertarik untuk kolaborasi dengan ${alias}.`);

  return parsed.toString();
}
