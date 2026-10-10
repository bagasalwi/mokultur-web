import { writable } from 'svelte/store';

export type AuthMode = 'login' | 'register';

export type AuthModalState = {
  open: boolean;
  mode: AuthMode;
  /** Same-site path to land on after signing in. */
  redirect: string;
  error: string | null;
};

export const authModal = writable<AuthModalState>({ open: false, mode: 'login', redirect: '/', error: null });

function here(): string {
  if (typeof location === 'undefined') return '/';
  return `${location.pathname}${location.search}${location.hash}`;
}

/** Open the site-wide login/register modal. Defaults to returning to the current page. */
export function openAuth(mode: AuthMode = 'login', redirect?: string | null, error: string | null = null) {
  authModal.set({ open: true, mode, redirect: redirect || here(), error });
}

export function closeAuth() {
  authModal.update((state) => ({ ...state, open: false, error: null }));
}
