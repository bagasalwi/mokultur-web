/**
 * Reader-facing auth errors, keyed by a short code so the server action, the
 * no-JS redirect (`?auth_error=code`) and the login modal all show the same
 * Indonesian sentence — never the API's raw English message.
 */
export const AUTH_MESSAGES = {
  required: 'Email & password wajib diisi.',
  invalid: 'Email atau password salah.',
  exists: 'Email ini sudah terdaftar. Coba masuk.',
  name: 'Nama minimal 2 karakter.',
  email: 'Email tidak valid.',
  password: 'Password minimal 8 karakter.',
  confirm: 'Konfirmasi password tidak sama.',
  failed: 'Pendaftaran gagal. Coba lagi.',
  busy: 'Server lagi sibuk, coba lagi sebentar.',
  google: 'Masuk dengan Google dibatalkan atau gagal. Coba lagi.',
} as const;

export type AuthErrorCode = keyof typeof AUTH_MESSAGES;

export function authMessage(code: string | null | undefined): string | null {
  return code && code in AUTH_MESSAGES ? AUTH_MESSAGES[code as AuthErrorCode] : null;
}
