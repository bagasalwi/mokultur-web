<script lang="ts">
  /**
   * Entry point to the taste quiz, sized to sit beside the season and
   * airing-today rows rather than as a banner of its own.
   */
  export let compact = false;
</script>

<a class="taste-promo" class:taste-promo--compact={compact} href="/anime/selera">
  <div class="taste-promo__body">
    <span class="badge badge-main mb-2">Kuis</span>
    <h3 class="taste-promo__title">Know Your Taste of Anime</h3>
    <p class="taste-promo__desc">
      Tujuh pertanyaan, enam rekomendasi yang beneran cocok sama kamu — bukan daftar yang lagi ramai.
    </p>
    <span class="taste-promo__cta">
      Mulai kuis <i class="bi bi-arrow-right"></i>
    </span>
  </div>

  <!-- Decorative only: three tilted "posters" hinting at a result, drawn in CSS
       so the card costs no image requests. -->
  <div class="taste-promo__stack" aria-hidden="true">
    <span class="taste-promo__poster"></span>
    <span class="taste-promo__poster"></span>
    <span class="taste-promo__poster"></span>
  </div>
</a>

<style>
  .taste-promo {
    position: relative;
    display: block;
    overflow: hidden;
    border-radius: 16px;
    padding: 1.25rem;
    text-decoration: none;
    color: #fff;
    background:
      radial-gradient(
        circle at top right,
        color-mix(in srgb, var(--site-accent-glow, #f1ff32) 55%, transparent),
        transparent 45%
      ),
      linear-gradient(135deg, var(--site-dark, #0a0a0a) 0%, #101827 55%, #1f2937 100%);
    box-shadow: 0 10px 28px rgb(10 10 10 / 15%);
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }

  .taste-promo:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 36px rgb(10 10 10 / 24%);
    color: #fff;
  }

  .taste-promo__body {
    position: relative;
    z-index: 1;
    max-width: 22rem;
  }

  .taste-promo__title {
    font-size: 1.05rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin: 0 0 0.35rem;
    color: #fff;
  }

  .taste-promo__desc {
    font-size: 0.82rem;
    line-height: 1.5;
    color: rgb(255 255 255 / 72%);
    margin: 0 0 0.85rem;
  }

  .taste-promo__cta {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.9rem;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 800;
    background: var(--site-primary, #f1ff32);
    color: var(--site-primary-contrast, #0d0d0d);
  }

  .taste-promo__stack {
    position: absolute;
    right: -1.5rem;
    bottom: -2.5rem;
    display: flex;
    gap: 0.5rem;
    opacity: 0.35;
    pointer-events: none;
  }

  .taste-promo__poster {
    width: 62px;
    height: 92px;
    border-radius: 8px;
    background: linear-gradient(160deg, rgb(255 255 255 / 28%), rgb(255 255 255 / 6%));
    border: 1px solid rgb(255 255 255 / 18%);
  }

  .taste-promo__poster:nth-child(1) { transform: rotate(-8deg) translateY(6px); }
  .taste-promo__poster:nth-child(2) { transform: rotate(2deg); }
  .taste-promo__poster:nth-child(3) { transform: rotate(11deg) translateY(8px); }

  .taste-promo--compact {
    padding: 1rem;
  }

  .taste-promo--compact .taste-promo__desc {
    font-size: 0.78rem;
    margin-bottom: 0.7rem;
  }

  @media (max-width: 575.98px) {
    .taste-promo__stack {
      display: none;
    }

    .taste-promo__body {
      max-width: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .taste-promo {
      transition: none;
    }
  }
</style>
