<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { EventItem } from '$lib/api';
  import { countdownLabel, formatDateRange, STATUS_LABELS } from '$lib/event';
  import { imgFallback } from '$lib/format';
  import { imgUrl } from '$lib/img';

  export let events: EventItem[] = [];

  let activeIdx = 0;
  let timer: ReturnType<typeof setInterval> | null = null;

  /**
   * Rotates through the schedule the way the curhatan promo rotates quotes.
   *
   * A sidebar slot only has room for one event, but a reader who sees just the
   * nearest one never learns there are five more. Auto-advancing is what turns
   * one slot into a list.
   */
  function start() {
    if (events.length < 2 || timer) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    timer = setInterval(() => {
      activeIdx = (activeIdx + 1) % events.length;
    }, 5000);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  /** Picking a dot means the reader is steering; stop moving the target. */
  function select(i: number) {
    activeIdx = i;
    stop();
  }

  onMount(start);
  onDestroy(stop);

</script>

{#if events.length > 0}
  <aside class="event-promo" aria-label="Event mendatang" on:mouseenter={stop} on:focusin={stop}>
    <div class="event-promo__inner">
      <div class="event-promo__head">
        <span class="badge badge-main">Jadwal Event</span>
        <span class="event-promo__pulse" aria-hidden="true"></span>
      </div>

      <h2 class="event-promo__title">Event yang akan datang</h2>
      <p class="event-promo__desc">Jangan sampai kelewatan acaranya.</p>

      <div class="event-promo__deck">
        {#each events as event, i (event.slug)}
          <a
            class="event-promo__card"
            class:is-active={i === activeIdx}
            href="/event/{event.slug}"
            aria-hidden={i === activeIdx ? undefined : 'true'}
            tabindex={i === activeIdx ? 0 : -1}
          >
            <div class="event-promo__thumb">
              {#if event.poster}
                <img src={imgUrl(event.poster, 160) ?? event.poster} alt="" width="62" height="78" loading="lazy" on:error={imgFallback} />
              {:else}
                <i class="bi bi-calendar-event" aria-hidden="true"></i>
              {/if}
            </div>
            <div class="event-promo__meta">
              <span class="event-promo__when">
                {countdownLabel(event.daysUntil, event.status) ?? STATUS_LABELS[event.status]}
              </span>
              <strong class="event-promo__name">{event.name}</strong>
              <span class="event-promo__date">{formatDateRange(event.startDate, event.endDate)}</span>
              {#if event.location}
                <span class="event-promo__place">
                  <i class="bi bi-geo-alt"></i>
                  {event.location}
                </span>
              {/if}
            </div>
          </a>
        {/each}
      </div>

      {#if events.length > 1}
        <div class="event-promo__dots" role="tablist" aria-label="Pilih event">
          {#each events as event, i (event.slug)}
            <button
              type="button"
              role="tab"
              class="event-promo__dot"
              class:is-active={i === activeIdx}
              aria-selected={i === activeIdx}
              aria-label={event.name}
              on:click={() => select(i)}
            ></button>
          {/each}
        </div>
      {/if}

      <div class="event-promo__actions">
        <a href="/event" class="theme-btn theme-btn--primary event-promo__cta">
          <i class="bi bi-calendar3"></i> Lihat jadwal
        </a>
      </div>
    </div>
  </aside>
{/if}

<style>
  .event-promo {
    margin-bottom: 1.25rem;
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    background:
      radial-gradient(
        circle at top right,
        color-mix(in srgb, var(--site-accent-glow, #f1ff32) 45%, transparent),
        transparent 55%
      ),
      linear-gradient(135deg, var(--site-dark, #0a0a0a) 0%, #101827 55%, #1f2937 100%);
    color: #fff;
    box-shadow: 0 10px 28px rgb(10 10 10 / 15%);
    transition: transform 220ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 220ms ease;
  }

  .event-promo:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 36px rgb(10 10 10 / 22%);
  }

  .event-promo__inner {
    padding: 1rem 1.1rem 1.1rem;
    position: relative;
    z-index: 1;
  }

  .event-promo__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.65rem;
  }

  .event-promo__pulse {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--site-primary, #f1ff32);
    animation: eventPromoPulse 1.8s ease-out infinite;
  }

  .event-promo__title {
    font-size: 1.05rem;
    font-weight: 800;
    margin: 0 0 0.35rem;
    color: #fff;
    letter-spacing: -0.015em;
  }

  .event-promo__desc {
    font-size: 0.8rem;
    line-height: 1.45;
    margin: 0 0 0.85rem;
    color: rgb(255 255 255 / 72%);
  }

  /* Fixed height so the sidebar does not jump as cards of different name
     lengths rotate through. */
  .event-promo__deck {
    position: relative;
    min-height: 104px;
    border-radius: 10px;
    background: rgb(255 255 255 / 5%);
    border: 1px solid rgb(255 255 255 / 10%);
    overflow: hidden;
  }

  .event-promo__card {
    position: absolute;
    inset: 0;
    display: flex;
    gap: 0.7rem;
    padding: 0.65rem 0.75rem;
    text-decoration: none;
    color: inherit;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 500ms ease, transform 500ms ease;
    pointer-events: none;
  }

  .event-promo__card.is-active {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .event-promo__thumb {
    flex: none;
    width: 62px;
    height: 78px;
    border-radius: 8px;
    overflow: hidden;
    background: rgb(255 255 255 / 8%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgb(255 255 255 / 35%);
    font-size: 1.4rem;
  }

  .event-promo__thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
  }

  .event-promo__meta {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .event-promo__when {
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--site-primary, #f1ff32);
  }

  .event-promo__name {
    font-size: 0.85rem;
    font-weight: 700;
    line-height: 1.3;
    color: #fff;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .event-promo__date,
  .event-promo__place {
    font-size: 0.72rem;
    color: rgb(255 255 255 / 66%);
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .event-promo__dots {
    display: flex;
    gap: 0.3rem;
    justify-content: center;
    margin-top: 0.65rem;
  }

  .event-promo__dot {
    width: 18px;
    height: 4px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: rgb(255 255 255 / 22%);
    cursor: pointer;
    transition: background 200ms ease, width 200ms ease;
  }

  .event-promo__dot.is-active {
    width: 26px;
    background: var(--site-primary, #f1ff32);
  }

  .event-promo__dot:focus-visible {
    outline: 2px solid var(--site-primary, #f1ff32);
    outline-offset: 2px;
  }

  .event-promo__actions {
    margin-top: 0.85rem;
  }

  .event-promo__cta {
    width: 100%;
    justify-content: center;
  }

  @keyframes eventPromoPulse {
    0% {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--site-primary, #f1ff32) 60%, transparent);
    }

    70% {
      box-shadow: 0 0 0 8px transparent;
    }

    100% {
      box-shadow: 0 0 0 0 transparent;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .event-promo,
    .event-promo__card,
    .event-promo__dot {
      transition: none;
    }

    .event-promo__pulse {
      animation: none;
    }
  }
</style>
