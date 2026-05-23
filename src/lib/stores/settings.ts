import { writable } from 'svelte/store';
import type { SiteSettings } from '$lib/api';

export const siteSettings = writable<SiteSettings | null>(null);
