<script lang="ts">
  import type { EventItem } from '$lib/api';
  import { imgSrcset, imgUrl } from '$lib/img';
  import { imgFallback } from '$lib/format';
  import { countdownLabel, formatDateRange, timeRange } from '$lib/event';
  import AddToCalendar from './AddToCalendar.svelte';

  /** The next event, given the house dark panel so it reads as "what's on next". */
  export let event: EventItem;

  $: href = `/event/${event.slug}`;
  $: countdown = countdownLabel(event.daysUntil, event.status);
  $: time = timeRange(event.startTime, event.endTime);
  $: place = [event.location, event.city].filter(Boolean).join(', ');
</script>

<section class="spot" aria-label="Event terdekat">
  <a class="spot__poster" {href} tabindex="-1" aria-hidden="true">
    {#if event.poster}
      <img src={imgUrl(event.poster, 768) ?? event.poster} srcset={imgSrcset(event.poster, 320)} sizes="(max-width: 767px) 40vw, 320px" alt="" decoding="async" on:error={imgFallback} />
    {/if}
  </a>
  <div class="spot__body">
    <h2 class="spot__title"><a {href}>{event.name}</a></h2>
    {#if countdown}<p class="spot__countdown">{countdown}</p>{/if}
    <ul class="spot__facts">
      <li><i class="bi bi-calendar3" aria-hidden="true"></i>{formatDateRange(event.startDate, event.endDate)}</li>
      {#if time}<li><i class="bi bi-clock" aria-hidden="true"></i>{time}</li>{/if}
      {#if place}<li><i class="bi bi-geo-alt" aria-hidden="true"></i>{place}</li>{/if}
      {#if event.priceLabel}<li><i class="bi bi-ticket-perforated" aria-hidden="true"></i>{event.priceLabel}</li>{/if}
    </ul>
    <div class="spot__actions">
      {#if event.ticketUrl}
        <a class="theme-btn theme-btn--primary" href={event.ticketUrl} target="_blank" rel="noopener nofollow"><i class="bi bi-ticket-perforated" aria-hidden="true"></i> Beli Tiket</a>
      {/if}
      <AddToCalendar {event} tone="on-dark" />
      <a class="theme-btn theme-btn--see-all theme-btn--on-dark theme-btn--sm" {href}>Detail event <i class="bi bi-arrow-right" aria-hidden="true"></i></a>
    </div>
  </div>
</section>

<style>
  .spot {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 2rem;
    align-items: center;
    padding: 1.5rem;
    border-radius: 24px;
    color: #fff;
    background:
      radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--site-accent-glow, #a51d2d) 70%, transparent), transparent 40%),
      linear-gradient(135deg, var(--site-dark, #0a0a0a) 0%, #101827 55%, #1f2937 100%);
    box-shadow: 0 16px 40px rgba(10, 10, 10, 0.16);
  }
  .spot__poster { display: block; aspect-ratio: 3 / 4; overflow: hidden; border-radius: 16px; background: rgba(255, 255, 255, 0.06); }
  .spot__poster img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }

  .spot__body { min-width: 0; }
  .spot__countdown {
    display: inline-block;
    margin: 0.75rem 0 0;
    padding: 0.2rem 0.65rem;
    border-radius: 8px;
    background: var(--site-primary, #f1ff32);
    color: var(--site-primary-contrast, #111);
    font-size: 0.9375rem;
    font-weight: 900;
    letter-spacing: -0.01em;
  }
  .spot__title { margin: 0; font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 900; letter-spacing: -0.03em; line-height: 1.08; text-wrap: balance; }
  .spot__title a { color: #fff; text-decoration: none; }
  .spot__title a:hover { text-decoration: underline; text-decoration-color: var(--site-primary, #f1ff32); text-decoration-thickness: 3px; text-underline-offset: 5px; }
  .spot__title a:focus-visible { outline: 3px solid #fff; outline-offset: 3px; border-radius: 4px; }

  .spot__facts { display: grid; gap: 0.45rem; margin: 1.1rem 0 1.4rem; padding: 0; list-style: none; font-size: 0.9375rem; color: rgba(255, 255, 255, 0.86); }
  .spot__facts li { display: flex; align-items: center; gap: 0.6rem; }
  .spot__facts i { color: var(--site-primary, #f1ff32); }

  .spot__actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
  .spot__actions :global(.theme-btn--primary) { box-shadow: none; }

  @media (max-width: 767px) {
    .spot { grid-template-columns: 112px minmax(0, 1fr); gap: 1rem; padding: 1rem; border-radius: 18px; align-items: start; }
    .spot__facts { font-size: 0.8125rem; margin: 0.75rem 0 1rem; }
    .spot__actions { grid-column: 1 / -1; }
  }
</style>
