import type { LayoutServerLoad } from './$types';
import type { SiteSettings, NavbarItem, SocialMediaItem, Category } from '$lib/api';
import { getSettings, listCategories, getSocialMedia, getNavbar } from '$lib/api';

// 60s, not 5 minutes. The API already caches these responses for 300s and
// busts that cache the moment settings are saved, so a long window here just
// stacked on top of it: a color change took up to ten minutes to appear.
const CACHE_TTL = 60 * 1000;
let _cache: {
  settings: SiteSettings | null;
  categories: Category[];
  navHeader: NavbarItem[];
  navFooter: NavbarItem[];
  socials: SocialMediaItem[];
} | null = null;
let _cacheAt = 0;

/**
 * Layout settings the dashboard may override per-request, so an admin can see a
 * variant before committing it. Values are checked against these lists rather
 * than trusted: they land in markup and component branches.
 */
const PREVIEWABLE = {
  hero_type: ['cinematic', 'split', 'ticker', 'masthead', 'top-stories', 'editorial-grid', 'spotlight-stack'],
  card_style: ['vertical', 'horizontal', 'magazine', 'minimal', 'compact-news', 'feature-tile', 'borderless-feed'],
  article_detail_style: ['classic', 'immersive', 'editorial', 'clean'],
  event_section_style: ['standard', 'immersive', 'magazine', 'newsroom'],
  tech_section_style: ['standard', 'immersive', 'magazine', 'newsroom'],
  latest_section_style: ['card-grid', 'news-list'],
  home_layout: ['news-first', 'classic'],
  anime_section_style: ['trio', 'poster-rail'],
  navbar_style: ['times', 'compact', 'masthead', 'split', 'minimal'],
} as const satisfies Record<string, readonly string[]>;

/**
 * Returns a copy when a preview is requested, never a mutated original —
 * `_cache` is module state shared by every visitor, so writing an admin's
 * preview into it would leak that variant to the whole site.
 */
function applyPreview(settings: SiteSettings | null, url: URL): SiteSettings | null {
  if (!settings) return settings;
  let preview: SiteSettings | null = null;
  for (const key of Object.keys(PREVIEWABLE) as (keyof typeof PREVIEWABLE)[]) {
    const value = url.searchParams.get(`preview_${key}`);
    if (!value || !(PREVIEWABLE[key] as readonly string[]).includes(value)) continue;
    preview ??= { ...settings };
    preview[key] = value;
  }
  return preview ?? settings;
}

/**
 * Menu entries whose destination a feature flag can switch off.
 *
 * The header carries "Anime" -> /anime and "Jadwal Event" -> /event as rows in
 * mm_navbar, so turning a feature off without filtering here would leave the
 * menu pointing at a 404. Matching on the target rather than the label keeps it
 * working when an editor renames the entry.
 */
function navAllowed(settings: SiteSettings | null) {
  const disabled: string[] = [];
  if (settings && settings.anime_enabled === false) disabled.push('/anime');
  if (settings && settings.event_enabled === false) disabled.push('/event');
  if (!disabled.length) return null;

  return (item: NavbarItem) => {
    const target = `/${(item.navTarget ?? '').replace(/^\//, '')}`;
    return !disabled.some((path) => target === path || target.startsWith(`${path}/`));
  };
}

export const load: LayoutServerLoad = async ({ locals, url }) => {
  if (!_cache || Date.now() - _cacheAt >= CACHE_TTL) {
    const [settingsRes, categoriesRes, navHeaderRes, navFooterRes, socialsRes] = await Promise.allSettled([
      getSettings(),
      listCategories(),
      // 20 is the API's own ceiling. At 10 an eleventh menu item simply
      // vanished from the site with no error anywhere — the header already
      // holds nine.
      getNavbar('header', 20),
      getNavbar('footer', 20),
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

  const settings = applyPreview(_cache.settings, url);
  const keep = navAllowed(settings);

  return {
    ..._cache,
    settings,
    navHeader: keep ? _cache.navHeader.filter(keep) : _cache.navHeader,
    navFooter: keep ? _cache.navFooter.filter(keep) : _cache.navFooter,
    user: locals.user,
  };
};
