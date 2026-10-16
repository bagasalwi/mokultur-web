<script lang="ts">
  import { onMount } from 'svelte';
  import { CF23_PROMO_UNTIL } from '$lib/cf23/assets';

  /**
   * Homepage card for the CF23 cosplay card generator. Typing a name redraws a
   * live miniature of the card (the real render engine, loaded only once the
   * card is near the screen); the form is a plain GET to /comifuro23, so it
   * works before any script has run. It retires itself a week after the event.
   */
  const visible = Date.now() < CF23_PROMO_UNTIL;

  let name = $state('');
  let canvas = $state<HTMLCanvasElement>();
  let host = $state<HTMLElement>();
  let live = $state(false);
  let renderCard: ((value: string) => void) | null = null;
  let tiltX = $state(0);
  let tiltY = $state(0);

  $effect(() => {
    const value = name;
    renderCard?.(value);
  });

  function onTilt(event: PointerEvent) {
    if (event.pointerType !== 'mouse' || !host) return;
    const rect = host.getBoundingClientRect();
    tiltY = ((event.clientX - rect.left) / rect.width - 0.5) * 14;
    tiltX = -((event.clientY - rect.top) / rect.height - 0.5) * 10;
  }

  onMount(() => {
    if (!visible || !host) return;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      const [{ default: R }, { loadCf23Assets }] = await Promise.all([import('$lib/cf23/render.js'), import('$lib/cf23/assets')]);
      await loadCf23Assets();
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      renderCard = (value: string) => {
        R.render(ctx, 'day1', {
          name: value,
          username: '',
          days: {
            1: { character: '', series: '', accent: R.DEFAULT_ACCENT[1], photo: null },
            2: { character: '', series: '', accent: R.DEFAULT_ACCENT[2], photo: null },
          },
        }, { hints: true });
      };
      renderCard(name);
      live = true;
    }, { rootMargin: '300px 0px' });
    observer.observe(host);
    return () => observer.disconnect();
  });
</script>

{#if visible}
  <section class="cf23-promo" aria-labelledby="cf23-promo-title" bind:this={host} onpointermove={onTilt} onpointerleave={() => { tiltX = 0; tiltY = 0; }}>
    <div class="cf23-promo__copy">
      <span class="cf23-promo__event">CF23 · 31 Okt – 1 Nov</span>
      <h2 id="cf23-promo-title">Bikin Cosplay Card CF23</h2>
      <p>Foto Day 1 &amp; Day 2 jadi Cosplay Card siap posting untuk feed dan story. Tag @mokultur!</p>
    </div>

    <div class="cf23-promo__preview" style:transform={`perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotate(3deg)`}>
      <canvas bind:this={canvas} width="1080" height="1350" class:is-live={live} aria-hidden="true"></canvas>
    </div>

    <form class="cf23-promo__form" action="/comifuro23" method="get">
      <label class="visually-hidden" for="cf23-promo-name">Nama kamu</label>
      <input id="cf23-promo-name" name="nama" type="text" bind:value={name} maxlength="40" placeholder="Ketik nama kamu" autocomplete="nickname" enterkeyhint="go" />
      <button type="submit">Buat card <i class="bi bi-arrow-right" aria-hidden="true"></i></button>
    </form>
  </section>
{/if}

<style lang="scss">
  .cf23-promo {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 108px;
    grid-template-areas: 'copy preview' 'form form';
    gap: 0.9rem 1rem;
    margin-bottom: 1.5rem;
    padding: 1.1rem 1.1rem 1.2rem;
    overflow: hidden;
    border: 3px solid #531f12;
    border-radius: 1.25rem;
    background:
      radial-gradient(120% 80% at 100% 0%, #8154bd 0%, transparent 55%),
      radial-gradient(140% 70% at 0% 110%, #ff9664 0%, transparent 45%),
      #3e0f3d;
    color: #ffece8;
    box-shadow: 5px 5px 0 #531f12;
  }

  .cf23-promo__copy {
    grid-area: copy;
    min-width: 0;

    h2 {
      margin: 0.45rem 0 0.35rem;
      color: #ffece8;
      font-family: 'Lilita One', 'Arial Black', sans-serif;
      font-size: 1.55rem;
      font-weight: 400;
      line-height: 1.05;
      letter-spacing: 0.01em;
      -webkit-text-stroke: 5px #531f12;
      paint-order: stroke fill;
      text-shadow: 0 3px 0 #531f12;
    }

    p {
      margin: 0;
      color: #fdcf9e;
      font-size: 0.875rem;
      line-height: 1.4;
    }
  }

  .cf23-promo__event {
    display: inline-block;
    padding: 0.15rem 0.55rem;
    border: 2px solid #ffece8;
    border-radius: 999px;
    background: #531f12;
    font-size: 0.6875rem;
    font-weight: 800;
    letter-spacing: 0.02em;
  }

  .cf23-promo__preview {
    grid-area: preview;
    align-self: start;
    transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);

    canvas {
      display: block;
      width: 100%;
      height: auto;
      aspect-ratio: 4 / 5;
      border: 2px solid #531f12;
      border-radius: 0.6rem;
      background: #683087;
      box-shadow: 4px 4px 0 #531f12;
    }

    @media (prefers-reduced-motion: reduce) {
      transform: rotate(3deg) !important;
      transition: none;
    }
  }

  .cf23-promo__form {
    grid-area: form;
    display: flex;
    gap: 0.5rem;

    input {
      flex: 1;
      min-width: 0;
      min-height: 46px;
      padding: 0.5rem 0.8rem;
      border: 3px solid #531f12;
      border-radius: 12px;
      background: #fff8f5;
      color: #531f12;
      font-size: 1rem;
      font-weight: 600;

      &::placeholder { color: #9a6b5f; }
      &:focus-visible { outline: 3px solid #f52b77; outline-offset: 2px; }
    }

    button {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      gap: 0.35rem;
      min-height: 46px;
      padding: 0.4rem 0.9rem;
      border: 3px solid #531f12;
      border-radius: 12px;
      background: #f52b77;
      color: #ffece8;
      font-weight: 800;
      white-space: nowrap;
      box-shadow: 3px 3px 0 #531f12;
      cursor: pointer;

      &:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 #531f12; }
      &:focus-visible { outline: 3px solid #ffece8; outline-offset: 2px; }
    }
  }
</style>
