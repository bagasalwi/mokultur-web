import { writable } from 'svelte/store';

/** The site-wide search palette (navbar icon, "/" or Ctrl/⌘+K). */
export const searchPalette = writable<{ open: boolean; query: string }>({ open: false, query: '' });

export function openSearchPalette(query = '') {
  searchPalette.set({ open: true, query });
}

export function closeSearchPalette() {
  searchPalette.update((state) => ({ ...state, open: false }));
}
