import type { MokuExpression } from '$lib/chat/expressions';

/**
 * What Moku-san says without asking the AI: her greeting on /moku and her
 * answers to taps on the stage. Free and instant, and never added to the
 * conversation, so they do not use up the chat's limit or its history.
 */
export type Line = { text: string; expression: MokuExpression };

export const HEAD_PAT: Line[] = [
  { text: 'H-hei! Kepalaku bukan tombol, tahu! …ya sudah, sekali aja.', expression: 'malu' },
  { text: 'Secara logika, nggak ada alasan buat nepuk kepalaku. T-tapi nggak apa-apa, sih.', expression: 'tsundere' },
  { text: 'Rambutku jadi berantakan! Padahal aku lagi nyusun daftar tontonan.', expression: 'malu' },
  { text: 'Hmph. Kalau mau muji, bilang aja langsung. Nggak usah tepuk-tepuk.', expression: 'tsundere' },
];

export const POKE: Line[] = [
  { text: 'Kaget tahu! Aku lagi nyusun rekomendasi buat minggu ini, nih.', expression: 'kaget' },
  { text: 'Apa? Mau nanya sesuatu? Ketik aja, aku dengerin. Bukan karena aku nunggu, ya.', expression: 'tsundere' },
  { text: 'Jangan colek pas aku lagi nonton! Hampir kelewat adegan pentingnya.', expression: 'kaget' },
  { text: 'Iya, iya, aku di sini. Nggak usah dicolek terus.', expression: 'kesal' },
];

/** After this many taps in a row, Moku-san has had enough. */
export const TOO_MANY = 6;
export const ENOUGH: Line = { text: 'Oke, cukup! Sekali lagi, kamu aku jadikan subjek eksperimen.', expression: 'kesal' };

export const pick = <T>(list: readonly T[], avoid?: T): T => {
  const options = list.length > 1 && avoid ? list.filter((item) => item !== avoid) : list;
  return options[Math.floor(Math.random() * options.length)];
};

/** What Moku-san is up to, by the hour in WIB. She is always there to answer. */
export function mokuStatus(at = new Date()): string {
  const hour = (at.getUTCHours() + 7) % 24;
  const day = new Date(at.getTime() + 7 * 3_600_000).getUTCDay();
  if (hour < 5 || hour >= 22) return 'Begadang nonton film, tapi tetap siaga';
  if (day === 0 || day === 6) return 'Maraton anime akhir pekan';
  if (hour < 9) return 'Baru mulai, nyiapin catatan';
  if (hour < 12) return 'Siap bantu kamu';
  if (hour < 13) return 'Makan siang sambil nonton satu episode';
  if (hour < 18) return 'Lagi kurasi artikel dan tontonan';
  return 'Masih siaga, tanya aja';
}
