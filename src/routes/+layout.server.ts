import type { LayoutServerLoad } from './$types';
import type { SiteSettings, NavbarItem, SocialMediaItem, Category } from '$lib/api';
import { getSettings, listCategories, getSocialMedia, getNavbar } from '$lib/api';

const CACHE_TTL = 5 * 60 * 1000;
let _cache: {
  settings: SiteSettings | null;
  categories: Category[];
  navHeader: NavbarItem[];
  navFooter: NavbarItem[];
  socials: SocialMediaItem[];
} | null = null;
let _cacheAt = 0;

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!_cache || Date.now() - _cacheAt >= CACHE_TTL) {
    const [settingsRes, categoriesRes, navHeaderRes, navFooterRes, socialsRes] = await Promise.allSettled([
      getSettings(),
      listCategories(),
      getNavbar('header', 10),
      getNavbar('footer', 10),
      getSocialMedia(),
    ]);

    _cache = {
      settings: settingsRes.status === 'fulfilled' ? settingsRes.value.data : null,
      categories: categoriesRes.status === 'fulfilled' ? categoriesRes.value.data : [],
      navHeader: navHeaderRes.status === 'fulfilled' ? navHeaderRes.value.data : [],
      navFooter: navFooterRes.status === 'fulfilled' ? navFooterRes.value.data : [],
      socials: socialsRes.status === 'fulfilled' ? socialsRes.value.data : [],
    };
    _cacheAt = Date.now();
  }

  return { ..._cache, user: locals.user };
};
