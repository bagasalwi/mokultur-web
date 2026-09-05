<script lang="ts">
  import type { EventItem } from '$lib/api';
  import { countdownLabel, formatDateRange, STATUS_LABELS } from '$lib/event';
  import { imgSrcset, imgUrl } from '$lib/img';
  import { imgFallback } from '$lib/format';

  export let event: EventItem;

  $: countdown = countdownLabel(event.daysUntil, event.status);
  $: place = [event.location, event.city].filter(Boolean).join(', ');
  $: muted = event.status === 'done' || event.status === 'cancelled';
  // The pill says whichever is more useful: a countdown while it is coming up,
  // the state itself once it is not.
  $: pill = event.status === 'upcoming' ? countdown : STATUS_LABELS[event.status];

  $: posterSrcset = imgSrcset(event.poster, 300);

</script>

<!-- Built from the same pieces as the homepage article card — card-hover, the
     8px inset image, badge-main — so the two read as one family. -->
<a href="/event/{event.slug}" class="text-decoration-none event-card" class:event-card--muted={muted}>
  <div class="card border-0 card-hover h-100" style="border-radius: 10px; overflow: hidden;">
    <div class="px-2 pt-2 position-relative">
      {#if event.poster}
        <img
          src={imgUrl(event.poster, 480)}
          srcset={posterSrcset}
          sizes="(max-width: 767px) 45vw, (max-width: 991px) 30vw, 25vw"
          alt={event.name}
          class="event-card__poster w-100"
          loading="lazy"
          decoding="async"
          on:error={imgFallback}
        />
      {:else}
        <div class="event-card__poster event-card__poster--empty" aria-hidden="true">
          <i class="bi bi-calendar-event"></i>
        </div>
      {/if}

      {#if pill}
        <span class="badge badge-main event-card__pill" class:event-card__pill--muted={muted}>
          {pill}
        </span>
      {/if}
    </div>

    <div class="p-3 pt-2 d-flex flex-column flex-grow-1">
      <span class="event-card__date">{formatDateRange(event.startDate, event.endDate)}</span>
      <h3 class="event-card__name">{event.name}</h3>
      {#if place}
        <span class="event-card__place mt-auto">
          <i class="bi bi-geo-alt"></i>
          {place}
        </span>
      {/if}
    </div>
  </div>
</a>

<style>
  .event-card--muted .card {
    opacity: 0.75;
  }

  /*
   * Landscape, not the poster's own portrait shape.
   *
   * At 3/4 the artwork took 79% of the card and left the name and date as a
   * strip along the bottom. The full poster is one click away on the detail
   * page; what a listing needs is for the picture and the words to carry
   * comparable weight.
   */
  .event-card__poster {
    aspect-ratio: 4 / 3;
    object-fit: cover;
    /* Anchored to the top: event posters put the name and logo up there, and a
       centred crop was slicing exactly the part that identifies the event. */
    object-position: top center;
    border-radius: 8px;
    display: block;
    background: #14171c;
  }

  .event-card__poster--empty {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    color: rgb(255 255 255 / 22%);
  }

  .event-card__pill {
    position: absolute;
    top: 0.75rem;
    left: 1rem;
    font-size: 0.65rem;
  }

  /* A finished or cancelled event should not wear the brand's "look here" yellow. */
  .event-card__pill--muted {
    background: rgb(0 0 0 / 72%);
    color: #fff;
  }

  .event-card__date {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    color: var(--site-primary-contrast, #0d0d0d);
    opacity: 0.62;
    margin-bottom: 0.2rem;
  }

  .event-card__name {
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: -0.01em;
    color: #0a0a0a;
    margin: 0 0 0.4rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .event-card__place {
    font-size: 0.8rem;
    color: var(--bs-secondary-color, #6c757d);
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
