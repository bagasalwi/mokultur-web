import type { EventDetail, EventItem, EventStatus } from '$lib/api';

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

/** "10:00–21:00 WIB", "Mulai 10:00 WIB", or null when no time is set. */
export function timeRange(start: string | null, end: string | null): string | null {
  if (!start) return null;
  return end && end !== start ? `${start}–${end} WIB` : `Mulai ${start} WIB`;
}

/** Day block for agenda rows: { day: '24', weekday: 'Sab', month: 'Okt' }. */
export function dayParts(iso: string): { day: string; weekday: string; month: string } | null {
  const p = parts(iso);
  if (!p) return null;
  const weekday = DAYS[new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay()].slice(0, 3);
  return { day: String(p.d), weekday, month: MONTHS_SHORT[p.m - 1] };
}

/** "2026-10" — groups an agenda by month. */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** "Oktober 2026" from a monthKey. */
export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return y && m ? `${MONTHS_LONG[m - 1]} ${y}` : key;
}

/** The editor's Maps link, or a Maps search for the venue. */
export function directionsUrl(event: Pick<EventDetail, 'mapsUrl' | 'location' | 'city'> & { address?: string | null }): string | null {
  if (event.mapsUrl) return event.mapsUrl;
  const query = [event.location, event.address, event.city].filter(Boolean).join(', ');
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}

export function instagramUrl(handle: string | null | undefined): string | null {
  return handle ? `https://www.instagram.com/${encodeURIComponent(handle)}/` : null;
}

/*
 * Calendar maths. Event dates and times are WIB (UTC+7) with no zone attached,
 * so they are built with Date.UTC and shifted, never parsed by the runtime.
 */
const pad = (n: number) => String(n).padStart(2, '0');

function wibToUtc(date: string, time: string): Date | null {
  const p = parts(date);
  const [h, m] = time.split(':').map(Number);
  if (!p || Number.isNaN(h) || Number.isNaN(m)) return null;
  return new Date(Date.UTC(p.y, p.m - 1, p.d, h - 7, m));
}

const stampUtc = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

function nextDay(date: string): string {
  const p = parts(date)!;
  const d = new Date(Date.UTC(p.y, p.m - 1, p.d + 1));
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

type CalendarEvent = Pick<EventItem, 'name' | 'startDate' | 'endDate' | 'startTime' | 'endTime' | 'location' | 'city'> & {
  endDateEffective?: string;
  address?: string | null;
};

/**
 * Start/end for calendars. Timed when a start time exists (end falls back to
 * the start time on the last day, or +2 hours for a one-day event); otherwise
 * an all-day entry spanning every day of the event.
 */
export function calendarRange(event: CalendarEvent): { allDay: true; start: string; end: string } | { allDay: false; start: Date; end: Date } | null {
  const last = event.endDateEffective ?? event.endDate ?? event.startDate;
  if (event.startTime) {
    const start = wibToUtc(event.startDate, event.startTime);
    if (!start) return null;
    let end = wibToUtc(last, event.endTime ?? event.startTime);
    if (!end || end <= start) end = new Date(start.getTime() + 2 * 3600 * 1000);
    return { allDay: false, start, end };
  }
  const p = parts(event.startDate);
  if (!p) return null;
  return { allDay: true, start: `${p.y}${pad(p.m)}${pad(p.d)}`, end: nextDay(last) };
}

export function calendarLocation(event: CalendarEvent): string {
  return [event.location, event.address, event.city].filter(Boolean).join(', ');
}

export function googleCalendarUrl(event: CalendarEvent, pageUrl: string): string | null {
  const range = calendarRange(event);
  if (!range) return null;
  const dates = range.allDay ? `${range.start}/${range.end}` : `${stampUtc(range.start)}/${stampUtc(range.end)}`;
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates,
    details: `Info & tiket: ${pageUrl}`,
    location: calendarLocation(event),
    ctz: 'Asia/Jakarta',
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

/** RFC 5545 text escaping. */
const icsText = (value: string) => value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Folds lines at 75 octets as the spec requires. */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (new TextEncoder().encode(rest).length > 75) {
    let cut = 75;
    while (new TextEncoder().encode(rest.slice(0, cut)).length > 75) cut--;
    out.push(rest.slice(0, cut));
    rest = ` ${rest.slice(cut)}`;
  }
  out.push(rest);
  return out.join('\r\n');
}

export function icsFile(event: CalendarEvent & { slug: string; description?: string | null }, pageUrl: string, host: string): string | null {
  const range = calendarRange(event);
  if (!range) return null;
  const now = stampUtc(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mokultur//Jadwal Event//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:event-${event.slug}@${host}`,
    `DTSTAMP:${now}`,
    range.allDay ? `DTSTART;VALUE=DATE:${range.start}` : `DTSTART:${stampUtc(range.start)}`,
    range.allDay ? `DTEND;VALUE=DATE:${range.end}` : `DTEND:${stampUtc(range.end)}`,
    `SUMMARY:${icsText(event.name)}`,
    `LOCATION:${icsText(calendarLocation(event))}`,
    `URL:${pageUrl}`,
    `DESCRIPTION:${icsText(`${(event.description ?? '').trim().slice(0, 600)}\n\nInfo & tiket: ${pageUrl}`.trim())}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}
