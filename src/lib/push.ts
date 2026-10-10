import { browser } from '$app/environment';
import { PUBLIC_API_URL } from '$env/static/public';

/**
 * Browser push for readers. The permission prompt only ever follows a click
 * on our own "Aktifkan notifikasi" button, never a page load.
 */
const API = PUBLIC_API_URL.replace(/\/$/, '');
const DISMISS_KEY = 'mokultur:push-dismissed';

export type PushState = 'unsupported' | 'denied' | 'subscribed' | 'available';

export function pushSupported(): boolean {
  if (!browser) return false;
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return false;
  // iOS only allows push for sites added to the home screen.
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent);
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone;
  return !ios || !!standalone;
}

/**
 * The active registration. `ready` waits until the worker has activated:
 * subscribing against one that is still installing fails with
 * "no active Service Worker" (typical on the first visit).
 */
async function registration(timeoutMs = 10_000): Promise<ServiceWorkerRegistration | null> {
  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
  } catch {
    return null;
  }
}

export async function pushState(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  // No waiting here: a page only needs to know whether a subscription exists.
  const reg = await navigator.serviceWorker.getRegistration().catch(() => undefined);
  const sub = await reg?.pushManager.getSubscription().catch(() => null);
  return sub ? 'subscribed' : 'available';
}

/** VAPID public key (base64url) as the raw bytes PushManager expects. */
function applicationServerKey(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}

/** Ask permission, subscribe, and register the subscription with the API. */
export async function enablePush(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported';
  const keyRes = await fetch(`${API}/api/push/key`);
  const { enabled, publicKey } = (await keyRes.json()) as { enabled: boolean; publicKey: string | null };
  if (!enabled || !publicKey) throw new Error('Notifikasi belum aktif di server.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'available';
  const reg = await registration();
  if (!reg) throw new Error('Service worker belum siap. Muat ulang halaman lalu coba lagi.');
  const sub = (await reg.pushManager.getSubscription())
    ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey(publicKey) }));
  const json = sub.toJSON();
  const res = await fetch(`${API}/api/push/subscribe`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });
  if (!res.ok) throw new Error('Gagal menyimpan langganan notifikasi.');
  return 'subscribed';
}

export async function disablePush(): Promise<PushState> {
  const reg = await registration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await fetch(`${API}/api/push/unsubscribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    }).catch(() => {});
    await sub.unsubscribe().catch(() => {});
  }
  return pushState();
}

export function dismissedRecently(days = 14): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    return Date.now() - at < days * 86_400_000;
  } catch {
    return false;
  }
}

export function rememberDismiss(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // Storage blocked: the card simply shows again next time.
  }
}
