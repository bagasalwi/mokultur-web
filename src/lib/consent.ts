import { browser } from '$app/environment';
import { writable, type Writable } from 'svelte/store';

/**
 * Cookie consent state, as required by UU 27/2022 (PDP): non-essential cookies
 * may only run after the visitor actively agrees to them.
 *
 * Essential cookies (the login session) are not represented here — they carry no
 * choice, so offering one would be dishonest.
 */
export interface ConsentState {
  analytics: boolean;
  ads: boolean;
  /** Schema version — bump to re-ask everyone when the categories change. */
  v: number;
}

export const CONSENT_COOKIE = 'mokultur_consent';
export const CONSENT_VERSION = 1;
const ONE_YEAR = 60 * 60 * 24 * 365;

export const DENY_ALL: ConsentState = { analytics: false, ads: false, v: CONSENT_VERSION };
export const ALLOW_ALL: ConsentState = { analytics: true, ads: true, v: CONSENT_VERSION };

function parse(raw: string | null | undefined): ConsentState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (typeof parsed !== 'object' || parsed === null) return null;
    if (parsed.v !== CONSENT_VERSION) return null;
    return {
      analytics: parsed.analytics === true,
      ads: parsed.ads === true,
      v: CONSENT_VERSION,
    };
  } catch {
    return null;
  }
}

function readCookie(): ConsentState | null {
  if (!browser) return null;
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  return parse(match?.slice(CONSENT_COOKIE.length + 1));
}

/**
 * `null` means "not decided yet" — the banner keys off this, so an undecided
 * visitor is never confused with one who chose to refuse everything.
 */
export const consent: Writable<ConsentState | null> = writable(readCookie());

export function saveConsent(state: ConsentState): void {
  if (!browser) return;
  const value = encodeURIComponent(JSON.stringify({ ...state, v: CONSENT_VERSION }));
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax${secure}`;
  consent.set({ ...state, v: CONSENT_VERSION });
}

export function clearConsent(): void {
  if (!browser) return;
  document.cookie = `${CONSENT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  consent.set(null);
}
