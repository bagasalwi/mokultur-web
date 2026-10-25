import type { MokuExpression } from '$lib/chat/expressions';

/**
 * What Moku-san says without asking the AI: taps on the /moku stage, the
 * gesture buttons and the expression chips. Free and instant, and never added
 * to the conversation, so they do not use up the chat's limit or its history.
 */
export type Line = { text: string; expression: MokuExpression };

export const HEAD_PAT: Line[] = [
  { text: 'H-hei! Jangan pegang-pegang kepalaku! …ya sudah, sekali aja.', expression: 'malu' },
  { text: 'Aku bukan kucing, tahu! B-bukan berarti aku nggak suka, sih.', expression: 'tsundere' },
  { text: 'Rambutku jadi berantakan! Aku harus rapat sebentar lagi…', expression: 'malu' },
  { text: 'Hmph. Kalau mau dipuji, bilang aja. Jangan colek-colek.', expression: 'tsundere' },
];

export const POKE: Line[] = [
  { text: 'Kaget tahu! Aku lagi ngerjain tiket pertanyaan, nih.', expression: 'kaget' },
  { text: 'Apa? Mau nanya sesuatu? Ketik aja, aku dengerin. Bukan karena aku nunggu, ya.', expression: 'tsundere' },
  { text: 'Kopiku hampir tumpah! Untung belum kena laptop kantor.', expression: 'kaget' },
  { text: 'Iya, iya, aku di sini. Nggak usah dicolek terus.', expression: 'kesal' },
];

/** After this many taps in a row, Moku-san has had enough. */
export const TOO_MANY = 6;
export const ENOUGH: Line = { text: 'Oke, cukup! Sekali lagi aku laporin ke HRD, ya!', expression: 'kesal' };

export const GESTURES = {
  Wave: { label: 'Sapa', icon: 'bi-emoji-smile', line: { text: 'Hmph, halo juga. Bukan karena aku nungguin kamu, ya!', expression: 'senang' } },
  Nod: { label: 'Angguk', icon: 'bi-check2-circle', line: { text: 'Iya, iya. Aku dengerin, kok. Lanjut.', expression: 'netral' } },
  FingerHeart: { label: 'Finger heart', icon: 'bi-heart-fill', line: { text: 'I-ini cuma pose buat foto kantor! Jangan salah paham!', expression: 'malu' } },
} as const satisfies Record<string, { label: string; icon: string; line: Line }>;

export const EXPRESSION_LINES: Record<MokuExpression, { label: string; text: string }> = {
  netral: { label: 'Netral', text: 'Mode kerja. Profesional, tenang, dan sama sekali nggak tsundere.' },
  senang: { label: 'Senang', text: 'Jangan GR. Aku senang karena kerjaanku beres, bukan karena kamu.' },
  berbinar: { label: 'Berbinar', text: 'Episode baru Frieren?! Eh, maksudku… lanjut kerja.' },
  wink: { label: 'Wink', text: 'Itu tadi kelilipan. Bukan kedip ke kamu.' },
  bangga: { label: 'Bangga', text: 'Kalau soal Mokultur, tanya aku. Aku kan profesional.' },
  tsundere: { label: 'Tsundere', text: 'B-bukan karena aku peduli sama kamu, ya!' },
  malu: { label: 'Malu', text: 'J-jangan lihatin aku terus begitu…' },
  kaget: { label: 'Kaget', text: 'Hah? Deadline-nya hari ini?!' },
  berpikir: { label: 'Berpikir', text: 'Hmm, sebentar. Aku cek dulu di catatanku.' },
  kesal: { label: 'Kesal', text: 'Rapat lagi? Padahal tadi bisa lewat chat.' },
  sedih: { label: 'Sedih', text: 'Kopi di pantry habis. Hari yang berat.' },
  lega: { label: 'Lega', text: 'Akhirnya semua pertanyaan hari ini kejawab. Fiuh.' },
};

export const pick = <T>(list: readonly T[], avoid?: T): T => {
  const options = list.length > 1 && avoid ? list.filter((item) => item !== avoid) : list;
  return options[Math.floor(Math.random() * options.length)];
};

/** Moku-san's day at the office, by the hour in WIB. */
export function officeStatus(at = new Date()): string {
  const hour = (at.getUTCHours() + 7) % 24;
  const day = new Date(at.getTime() + 7 * 3_600_000).getUTCDay();
  if (day === 0 || day === 6) return hour < 9 || hour >= 22 ? 'Libur, tapi tetap standby' : 'Lembur di akhir pekan';
  if (hour < 7) return 'Belum ngopi, jangan diajak bercanda';
  if (hour < 9) return 'Baru absen, ngopi dulu';
  if (hour < 12) return 'Lagi jawabin pertanyaan';
  if (hour < 13) return 'Istirahat makan siang';
  if (hour < 17) return 'Ngejar deadline';
  if (hour < 21) return 'Lembur (lagi)';
  return 'Shift malam, nonton Frieren diam-diam';
}
