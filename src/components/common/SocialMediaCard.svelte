<script lang="ts">
  import type { SocialMediaItem } from '$lib/api';

  export let socials: SocialMediaItem[] = [];

  const iconMap: Record<string, string> = {
    instagram: 'instagram',
    facebook: 'facebook',
    tiktok: 'tiktok',
    twitter: 'twitter-x',
    x: 'twitter-x',
    youtube: 'youtube',
    threads: 'threads',
    whatsapp: 'whatsapp',
    globe: 'globe',
    website: 'globe',
    linkedin: 'linkedin',
    telegram: 'telegram',
  };

  const gradients: Record<string, string> = {
    instagram: 'background: linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%);',
    facebook: 'background: linear-gradient(135deg, #1877f2 0%, #0c5fbd 100%);',
    tiktok: 'background: linear-gradient(135deg, #010101 0%, #1a1a2e 60%, #00f2ea 100%);',
    twitter: 'background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);',
    x: 'background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);',
    youtube: 'background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%);',
    threads: 'background: linear-gradient(135deg, #111827 0%, #374151 100%);',
    whatsapp: 'background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);',
    linkedin: 'background: linear-gradient(135deg, #0077b5 0%, #005885 100%);',
    telegram: 'background: linear-gradient(135deg, #2aabee 0%, #229ed9 100%);',
  };

  function getIcon(platform: string, icon: string | null): string {
    if (icon) return icon;
    return iconMap[platform.toLowerCase()] ?? 'link-45deg';
  }

  function getGradient(platform: string, icon: string | null): string {
    const key = (icon ?? platform).toLowerCase();
    return gradients[key] ?? gradients[platform.toLowerCase()] ?? 'background: linear-gradient(135deg, #111827 0%, #374151 100%);';
  }
</script>

{#if socials.length > 0}
  <div class="social-media-feed-widget card border-0 mb-4">
    <div class="card-body p-3">
      <div class="social-media-feed-widget__list">
        {#each socials as s}
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            class="social-media-feed-widget__item text-decoration-none"
          >
            <div class="flex-shrink-0">
              <div
                class="rounded-circle d-flex align-items-center justify-content-center"
                style="width: 34px; height: 34px; {getGradient(s.platform, s.icon)}"
              >
                <i class="bi bi-{getIcon(s.platform, s.icon)} text-white fs-6"></i>
              </div>
            </div>
            <div class="flex-grow-1 min-w-0">
              <strong class="d-block text-dark">{s.username}</strong>
              <span class="small text-muted">{s.platform}</span>
            </div>
            <i class="bi bi-chevron-right text-muted flex-shrink-0"></i>
          </a>
        {/each}
      </div>
    </div>
  </div>
{/if}
