<script lang="ts">
  import type { SiteSettings } from '$lib/api';
  import SideCard from './SideCard.svelte';

  export let settings: SiteSettings | null = null;

  const LINKS = [
    { type: 'press', icon: 'bi-megaphone', label: 'Kirim press release' },
    { type: 'event', icon: 'bi-calendar-event', label: 'Undang kami meliput event' },
    { type: 'paid', icon: 'bi-stars', label: 'Kerja sama brand' },
  ];

  $: siteName = settings?.site_name ?? 'Mokultur';
  $: email = settings?.contact_email && settings.contact_email !== '-' ? settings.contact_email : null;
  $: whatsapp = (settings?.contact_whatsapp ?? '').replace(/\D/g, '') || null;
</script>

<SideCard tone="dark" title="Punya kabar untuk kami?" headingId="side-contact" lead="Tim {siteName} terbuka untuk rilis, undangan liputan, dan kolaborasi.">
  <ul class="contact-card">
    {#each LINKS as link (link.type)}
      <li>
        <a href="/contact?type={link.type}">
          <i class="bi {link.icon}" aria-hidden="true"></i><span>{link.label}</span><i class="bi bi-arrow-right contact-card__go" aria-hidden="true"></i>
        </a>
      </li>
    {/each}
  </ul>
  {#if whatsapp || email}
    <div class="contact-card__direct">
      {#if whatsapp}<a href="https://wa.me/{whatsapp}" target="_blank" rel="noopener"><i class="bi bi-whatsapp" aria-hidden="true"></i> WhatsApp</a>{/if}
      {#if email}<a href="mailto:{email}"><i class="bi bi-envelope" aria-hidden="true"></i> Email</a>{/if}
    </div>
  {/if}
</SideCard>

<style>
  .contact-card { display: grid; gap: 0.35rem; margin: 0; padding: 0; list-style: none; }
  .contact-card li a {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-height: 44px;
    padding: 0 0.85rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    font-size: 0.875rem;
    font-weight: 700;
    text-decoration: none;
    transition: background-color 160ms ease, color 160ms ease;
  }
  .contact-card li a > i:first-child { color: var(--site-primary, #f1ff32); }
  .contact-card li a span { flex: 1; }
  .contact-card__go { color: rgba(255, 255, 255, 0.6); transition: transform 160ms ease; }
  .contact-card li a:hover { background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); }
  .contact-card li a:hover > i { color: inherit; }
  .contact-card li a:hover .contact-card__go { transform: translateX(2px); }
  .contact-card__direct { display: flex; gap: 0.75rem; margin-top: 0.9rem; padding-top: 0.85rem; border-top: 1px solid rgba(255, 255, 255, 0.12); }
  .contact-card__direct a { display: inline-flex; align-items: center; gap: 0.35rem; min-height: 32px; color: rgba(255, 255, 255, 0.85); font-size: 0.8125rem; font-weight: 700; text-decoration: none; }
  .contact-card__direct a:hover { color: var(--site-primary, #f1ff32); }
  .contact-card a:focus-visible, .contact-card__direct a:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { .contact-card__go { transition: none; } }
</style>
