<script lang="ts">
  import { imgUrl, initials, threadUrl, formatRelative, type Thread } from '$lib/threads';
  export let siteName = 'Mokultur';
  export let threads: Thread[] = [];
</script>

<section class="container-xl py-3">
  <div class="mt-promo">
    <div class="mt-promo__glow"></div>

    <div class="mt-promo__left">
      <span class="mt-promo__badge"><i class="bi bi-stars"></i> Baru</span>
      <h2 class="mt-promo__title"><em>Culture Lounge</em></h2>
      <p class="mt-promo__desc">
        Lounge culture buat para wibukiawan. Ngobrolin kultur yang lagi ramai,
        anime, event, dan lainnya bareng komunitas {siteName}.
      </p>
      <div class="mt-promo__chips">
        <span><i class="bi bi-lightning-charge"></i> Posting kilat</span>
        <span><i class="bi bi-image"></i> Share gambar</span>
        <span><i class="bi bi-heart"></i> Like &amp; balas</span>
      </div>
      <a class="mt-promo__cta" href="/lounge">Mulai posting <i class="bi bi-arrow-right"></i></a>
    </div>

    {#if threads.length}
      <div class="mt-promo__preview">
        <div class="mt-promo__preview-head">
          <i class="bi bi-fire"></i> Lagi ramai
        </div>
        <ul class="mt-promo__list">
          {#each threads.slice(0, 2) as t (t.id)}
            <a class="mt-promo__item" href={threadUrl(t)}>
              <div class="mt-promo__avatar">
                {#if t.authorImg}<img src={imgUrl(t.authorImg)} alt="" />{:else}<span>{initials(t.authorName)}</span>{/if}
              </div>
              <div class="mt-promo__item-body">
                <div class="mt-promo__item-head">
                  <strong>{t.authorName ?? 'User'}</strong>
                  <span>· {formatRelative(t.createdAt)}</span>
                </div>
                <p class="mt-promo__item-text">{(t.body ?? t.title ?? '').slice(0, 90)}{(t.body ?? t.title ?? '').length > 90 ? '…' : ''}</p>
                <div class="mt-promo__item-stats">
                  <span><i class="bi bi-chat"></i> {t.replyCount}</span>
                  <span><i class="bi bi-heart"></i> {t.likeCount}</span>
                  {#if t.animeTitle}<span class="mt-promo__tag">{t.animeTitle}</span>{/if}
                </div>
              </div>
            </a>
          {/each}
        </ul>
        <a class="mt-promo__more" href="/lounge">Lihat semua thread <i class="bi bi-arrow-right"></i></a>
      </div>
    {:else}
      <div class="mt-promo__art" aria-hidden="true">
        <div class="mt-promo__bubble mt-promo__bubble--1"><i class="bi bi-chat-dots"></i></div>
        <div class="mt-promo__bubble mt-promo__bubble--2"><i class="bi bi-heart-fill"></i></div>
        <div class="mt-promo__bubble mt-promo__bubble--3"><i class="bi bi-share"></i></div>
      </div>
    {/if}
  </div>
</section>

<style>
  .mt-promo {
    position: relative; display: flex; align-items: stretch; gap: 28px;
    overflow: hidden; border-radius: 18px; padding: 28px 30px;
    background: linear-gradient(120deg, #0a0a0a 0%, #1a1a2e 60%, #16213e 100%);
    color: #fff;
  }
  .mt-promo__glow {
    position: absolute; top: -40%; right: -8%; width: 380px; height: 380px;
    background: radial-gradient(circle, var(--site-primary, #f1ff32) 0%, transparent 70%);
    opacity: 0.16; pointer-events: none;
  }
  .mt-promo__left { position: relative; flex: 1 1 60%; min-width: 0; z-index: 1; display: flex; flex-direction: column; align-items: flex-start; }
  .mt-promo__badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: var(--site-primary, #f1ff32); color: #0a0a0a;
    font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 999px; margin-bottom: 10px;
  }
  .mt-promo__title { font-size: 32px; font-weight: 800; margin: 0 0 6px; letter-spacing: -0.5px; color: #ffffff; }
  .mt-promo__title em { font-style: italic; }
  .mt-promo__desc { color: #cbd5e1; font-size: 14.5px; line-height: 1.55; margin: 0 0 14px; max-width: 520px; }
  .mt-promo__chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
  .mt-promo__chips span {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
    padding: 5px 12px; border-radius: 999px; font-size: 12.5px; color: #e2e8f0;
  }
  .mt-promo__cta {
    margin-top: auto; display: inline-flex; align-items: center; gap: 8px;
    background: var(--site-primary, #f1ff32); color: #0a0a0a;
    font-weight: 700; font-size: 14px; padding: 9px 18px; border-radius: 999px;
    text-decoration: none; transition: gap 0.2s ease;
  }
  .mt-promo__cta:hover { gap: 12px; }

  /* Live trending preview */
  .mt-promo__preview {
    position: relative; z-index: 1; flex: 1 1 40%; min-width: 0;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 14px; padding: 14px; display: flex; flex-direction: column;
  }
  .mt-promo__preview-head { display: flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 700; color: #fff; margin-bottom: 10px; }
  .mt-promo__preview-head i { color: #ff9f43; }
  .mt-promo__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
  .mt-promo__item { display: flex; gap: 10px; padding: 8px; border-radius: 10px; text-decoration: none; color: inherit; transition: background 0.15s; }
  .mt-promo__item:hover { background: rgba(255,255,255,0.07); }
  .mt-promo__avatar {
    width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; overflow: hidden;
    background: var(--site-primary, #f1ff32); color: #0a0a0a; font-weight: 700; font-size: 11px;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .mt-promo__avatar img { width: 100%; height: 100%; object-fit: cover; }
  .mt-promo__item-body { flex: 1; min-width: 0; }
  .mt-promo__item-head { font-size: 12px; color: #94a3b8; display: flex; gap: 5px; align-items: baseline; }
  .mt-promo__item-head strong { color: #fff; font-weight: 600; }
  .mt-promo__item-text { margin: 2px 0 4px; font-size: 12.5px; line-height: 1.4; color: #cbd5e1; }
  .mt-promo__item-stats { display: flex; gap: 12px; font-size: 11px; color: #94a3b8; align-items: center; }
  .mt-promo__item-stats i { margin-right: 3px; }
  .mt-promo__tag { background: rgba(255,255,255,0.1); padding: 1px 7px; border-radius: 999px; color: #e2e8f0; }
  .mt-promo__more { margin-top: 8px; font-size: 12.5px; font-weight: 600; color: var(--site-primary, #f1ff32); text-decoration: none; display: inline-flex; align-items: center; gap: 5px; align-self: flex-start; }

  .mt-promo__art { position: relative; width: 170px; height: 150px; flex-shrink: 0; z-index: 1; }
  .mt-promo__bubble {
    position: absolute; width: 64px; height: 64px; border-radius: 18px;
    display: flex; align-items: center; justify-content: center; font-size: 26px;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
    backdrop-filter: blur(4px); animation: mt-float 3.5s ease-in-out infinite;
  }
  .mt-promo__bubble--1 { top: 6px; left: 18px; color: var(--site-primary, #f1ff32); }
  .mt-promo__bubble--2 { top: 56px; right: 4px; color: #ff6b9d; animation-delay: 0.6s; }
  .mt-promo__bubble--3 { bottom: 2px; left: 38px; color: #7dd3fc; animation-delay: 1.2s; }
  @keyframes mt-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  @media (prefers-reduced-motion: reduce) { .mt-promo__bubble { animation: none; } }

  @media (max-width: 991.98px) {
    .mt-promo { flex-direction: column; gap: 20px; }
    .mt-promo__preview { width: 100%; }
  }
  @media (max-width: 767.98px) {
    .mt-promo { padding: 22px; }
    .mt-promo__art { display: none; }
    .mt-promo__title { font-size: 26px; }
  }
</style>
