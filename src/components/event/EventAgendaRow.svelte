<script lang="ts">
  import type { EventItem } from '$lib/api';
  import { imgSrcset, imgUrl } from '$lib/img';
  import { imgFallback } from '$lib/format';
  import { countdownLabel, dayParts, formatDateRange, STATUS_LABELS, timeRange } from '$lib/event';
  import AddToCalendar from './AddToCalendar.svelte';

  /** One line of the agenda: the date leads, everything else follows it. */
  export let event: EventItem;
  /** Quieter row for finished events (archive). */
  export let past = false;

  $: day = dayParts(event.startDate);
  $: href = `/event/${event.slug}`;
  $: countdown = countdownLabel(event.daysUntil, event.status);
  $: time = timeRange(event.startTime, event.endTime);
  $: multiDay = !!event.endDate && event.endDate !== event.startDate;
  $: place = [event.location, event.city].filter(Boolean).join(' · ');
  $: live = event.status === 'upcoming' || event.status === 'ongoing';
  $: flagged = event.status === 'cancelled' || event.status === 'postponed';
</script>

<article class="row-ev" class:row-ev--past={past}>
  {#if day}
    <div class="row-ev__date" aria-hidden="true">
      <span class="row-ev__weekday">{day.weekday}</span>
      <span class="row-ev__day">{day.day}</span>
      <span class="row-ev__month">{day.month}</span>
    </div>
  {/if}

  <a class="row-ev__poster" {href} tabindex="-1" aria-hidden="true">
    {#if event.poster}
      <img src={imgUrl(event.poster, 320) ?? event.poster} srcset={imgSrcset(event.poster, 96)} sizes="96px" alt="" loading="lazy" decoding="async" on:error={imgFallback} />
    {/if}
  </a>

  <div class="row-ev__body">
    <div class="row-ev__tags">
      {#if flagged}
        <span class="row-ev__flag">{STATUS_LABELS[event.status]}</span>
      {:else if countdown && !past}
        <span class="row-ev__countdown" class:is-now={event.status === 'ongoing'}>{countdown}</span>
      {/if}
      {#if event.priceLabel}<span class="row-ev__price">{event.priceLabel}</span>{/if}
    </div>
    <h3 class="row-ev__name"><a {href}>{event.name}</a></h3>
    <ul class="row-ev__meta">
      <li><i class="bi bi-calendar3" aria-hidden="true"></i>{formatDateRange(event.startDate, event.endDate)}{#if multiDay}<span class="visually-hidden"> (beberapa hari)</span>{/if}</li>
      {#if time}<li><i class="bi bi-clock" aria-hidden="true"></i>{time}</li>{/if}
      {#if place}<li><i class="bi bi-geo-alt" aria-hidden="true"></i>{place}</li>{/if}
    </ul>
  </div>

  {#if live && !past}
    <div class="row-ev__actions">
      {#if event.ticketUrl}
        <a class="theme-btn theme-btn--primary theme-btn--sm" href={event.ticketUrl} target="_blank" rel="noopener nofollow">Tiket <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i></a>
      {/if}
      <AddToCalendar {event} compact />
    </div>
  {/if}
</article>

<style>
  .row-ev {
    display: grid;
    grid-template-columns: 64px 72px minmax(0, 1fr) auto;
    align-items: center;
    gap: 1.25rem;
    padding: 1.1rem 0;
    border-bottom: 1px solid #ececec;
  }

  .row-ev__date {
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 0.1rem;
    width: 64px;
    padding: 0.5rem 0;
    border-radius: 14px;
    background: var(--site-dark, #111);
    color: #fff;
    line-height: 1;
  }
  .row-ev__weekday,
  .row-ev__month { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255, 255, 255, 0.7); }
  .row-ev__day { font-size: 1.625rem; font-weight: 900; letter-spacing: -0.03em; color: var(--site-primary, #f1ff32); font-variant-numeric: tabular-nums; }

  .row-ev__poster { display: block; width: 72px; aspect-ratio: 3 / 4; overflow: hidden; border-radius: 10px; background: #f0f0f0; }
  .row-ev__poster img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }

  .row-ev__body { min-width: 0; display: grid; gap: 0.35rem; }
  .row-ev__tags { display: flex; flex-wrap: wrap; gap: 0.35rem; }
  .row-ev__tags:empty { display: none; }
  .row-ev__countdown,
  .row-ev__price,
  .row-ev__flag {
    padding: 0.15rem 0.5rem;
    border-radius: 6px;
    font-size: 0.6875rem;
    font-weight: 800;
    letter-spacing: 0.02em;
  }
  .row-ev__countdown { background: var(--site-primary, #f1ff32); color: var(--site-primary-contrast, #111); }
  .row-ev__countdown.is-now { background: #16a34a; color: #fff; }
  .row-ev__price { background: #f3f4f6; color: #1a1a1a; }
  .row-ev__flag { background: #fee2e2; color: #991b1b; }

  .row-ev__name { margin: 0; font-size: 1.0625rem; font-weight: 800; line-height: 1.3; letter-spacing: -0.01em; }
  .row-ev__name a { color: #1a1a1a; text-decoration: none; }
  .row-ev__name a:hover { text-decoration: underline; text-decoration-color: var(--site-primary, #f1ff32); text-decoration-thickness: 2px; text-underline-offset: 3px; }
  .row-ev__name a:focus-visible { outline: 3px solid var(--site-dark, #111); outline-offset: 2px; border-radius: 4px; }

  .row-ev__meta { display: flex; flex-wrap: wrap; gap: 0.2rem 1rem; margin: 0; padding: 0; list-style: none; color: #4b5563; font-size: 0.8125rem; }
  .row-ev__meta li { display: inline-flex; align-items: center; gap: 0.35rem; }
  .row-ev__meta i { color: #9ca3af; }

  .row-ev__actions { display: flex; align-items: center; gap: 0.4rem; }

  .row-ev--past { opacity: 0.72; }
  .row-ev--past .row-ev__date { background: #e5e7eb; color: #4b5563; }
  .row-ev--past .row-ev__day { color: #1a1a1a; }
  .row-ev--past .row-ev__weekday,
  .row-ev--past .row-ev__month { color: #6b7280; }

  @media (max-width: 767px) {
    .row-ev { grid-template-columns: 56px minmax(0, 1fr); gap: 0.85rem; align-items: start; }
    .row-ev__date { width: 56px; }
    .row-ev__poster { display: none; }
    .row-ev__actions { grid-column: 2; }
    .row-ev__name { font-size: 1rem; }
  }
</style>
