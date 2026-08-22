import type { EventStatus } from '$lib/api';

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

const MONTHS_LONG = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const STATUS_LABELS: Record<EventStatus, string> = {
  upcoming: 'Mendatang',
  ongoing: 'Berlangsung',
  done: 'Selesai',
  postponed: 'Ditunda',
  cancelled: 'Dibatalkan',
};

/**
 * Splits a plain ISO date without letting a timezone near it.
 *
 * `new Date('2026-10-12')` is parsed as UTC midnight and then rendered in the
 * viewer's zone, so anyone west of Greenwich sees the 11th. These values carry
 * no time at all, so they are formatted as the digits they are.
 */
function parts(iso: string): { y: number; m: number; d: number } | null {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { y, m, d };
}

/** "Sab, 12 Okt 2026" */
export function formatDate(iso: string | null): string {
  const p = iso ? parts(iso) : null;
  if (!p) return '';
  // Date.UTC keeps the weekday lookup off the local calendar too.
  const weekday = DAYS[new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay()];
  return `${weekday}, ${p.d} ${MONTHS_SHORT[p.m - 1]} ${p.y}`;
}

/** "12 – 14 Oktober 2026", collapsing whatever the two dates share. */
export function formatDateRange(startDate: string, endDate: string | null): string {
  const s = parts(startDate);
  if (!s) return '';

  const long = `${s.d} ${MONTHS_LONG[s.m - 1]} ${s.y}`;
  if (!endDate || endDate === startDate) return long;

  const e = parts(endDate);
  if (!e) return long;

  if (s.y === e.y && s.m === e.m) return `${s.d} – ${e.d} ${MONTHS_LONG[e.m - 1]} ${e.y}`;
  if (s.y === e.y) return `${s.d} ${MONTHS_LONG[s.m - 1]} – ${e.d} ${MONTHS_LONG[e.m - 1]} ${e.y}`;

  return `${long} – ${e.d} ${MONTHS_LONG[e.m - 1]} ${e.y}`;
}

/**
 * Countdown copy. Returns null when a countdown would mislead — a cancelled
 * event or one already finished.
 */
export function countdownLabel(days: number | null, status: EventStatus): string | null {
  if (status === 'cancelled' || status === 'postponed' || status === 'done') return null;
  if (status === 'ongoing') return 'Sedang berlangsung';
  if (days === null || days < 0) return null;
  if (days === 0) return 'Hari ini';
  if (days === 1) return 'Besok';
  if (days <= 30) return `${days} hari lagi`;
  const months = Math.round(days / 30);
  return `${months} bulan lagi`;
}
