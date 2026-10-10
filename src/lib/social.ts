/**
 * Platform icon and brand gradient for a social account. Shared by every
 * social widget so a new platform only needs adding here.
 */
const ICONS: Record<string, string> = {
  instagram: 'instagram',
  facebook: 'facebook',
  tiktok: 'tiktok',
  twitter: 'twitter-x',
  x: 'twitter-x',
  youtube: 'youtube',
  threads: 'threads',
  whatsapp: 'whatsapp',
  globe: 'globe',
  website: 'globe',
  linkedin: 'linkedin',
  telegram: 'telegram',
};

const GRADIENTS: Record<string, string> = {
  instagram: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
  facebook: 'linear-gradient(135deg, #1877f2 0%, #0c5fbd 100%)',
  tiktok: 'linear-gradient(135deg, #010101 0%, #1a1a2e 60%, #00f2ea 100%)',
  twitter: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
  x: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
  youtube: 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)',
  threads: 'linear-gradient(135deg, #111827 0%, #374151 100%)',
  whatsapp: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)',
  linkedin: 'linear-gradient(135deg, #0077b5 0%, #005885 100%)',
  telegram: 'linear-gradient(135deg, #2aabee 0%, #229ed9 100%)',
};
const FALLBACK_GRADIENT = 'linear-gradient(135deg, #111827 0%, #374151 100%)';

/** Bootstrap Icons name (without the `bi-` prefix). */
export function socialIcon(platform: string, icon: string | null): string {
  if (icon) return icon;
  return ICONS[platform.toLowerCase()] ?? 'link-45deg';
}

/** CSS background value in the platform's brand colours. */
export function socialGradient(platform: string, icon: string | null): string {
  const key = (icon ?? platform).toLowerCase();
  return GRADIENTS[key] ?? GRADIENTS[platform.toLowerCase()] ?? FALLBACK_GRADIENT;
}
