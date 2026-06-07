<script lang="ts">
  import type { PageData } from "./$types";
  import ArticleCard from "$components/articles/ArticleCard.svelte";
  import PopularTags from "$components/common/PopularTags.svelte";
  import SocialMediaCard from "$components/common/SocialMediaCard.svelte";
  import AdBanner from "$components/common/AdBanner.svelte";
  import CurhatPromoCard from "$components/curhatan/CurhatPromoCard.svelte";
  import ArticleRankItem from "$components/common/ArticleRankItem.svelte";
  import { onMount } from "svelte";
  import { PUBLIC_API_URL } from "$env/static/public";
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";

  export let data: PageData;

  $: a = data.article;
  $: seo = data.seo;
  $: siteName = data.settings?.site_name ?? "Mokultur";
  $: detailStyle = data.settings?.article_detail_style ?? "classic";

  // Like state
  let liked = false;
  let likeCount = 0;
  let likeLoading = false;

  // Copy feedback
  let copyFeedback = false;

  // Comments
  let comments: any[] = [];
  let commentBody = "";

  onMount(async () => {
    try {
      const res = await fetch(
        `${PUBLIC_API_URL}/api/articles/${a.id}/interactions`,
      );
      if (res.ok) {
        const d = await res.json();
        likeCount = d.data?.likeCount ?? 0;
      }
    } catch {}

    try {
      const res = await fetch(
        `${PUBLIC_API_URL}/api/articles/${a.id}/comments`,
      );
      if (res.ok) {
        const d = await res.json();
        comments = d.data ?? [];
      }
    } catch {}

    if (typeof window !== "undefined") {
      document.querySelectorAll(".carousel").forEach((el) => {
        // @ts-ignore
        if (window.bootstrap?.Carousel) new window.bootstrap.Carousel(el);
      });
    }

    // Gallery lightbox
    const lb = document.createElement('div');
    lb.className = 'fb-lightbox';
    lb.innerHTML = `
      <button class="fb-lightbox-close" aria-label="Tutup">&times;</button>
      <div class="fb-lightbox-img-wrap">
        <button class="fb-lightbox-nav fb-lightbox-prev" aria-label="Sebelumnya"><i class="bi bi-chevron-left"></i></button>
        <img src="" alt="" />
        <button class="fb-lightbox-nav fb-lightbox-next" aria-label="Berikutnya"><i class="bi bi-chevron-right"></i></button>
      </div>
      <div class="fb-lightbox-footer">
        <div class="fb-lightbox-caption"></div>
        <div class="fb-lightbox-counter"></div>
      </div>
    `;
    document.body.appendChild(lb);

    const lbImg = lb.querySelector('img') as HTMLImageElement;
    const lbCaption = lb.querySelector('.fb-lightbox-caption') as HTMLElement;
    const lbCounter = lb.querySelector('.fb-lightbox-counter') as HTMLElement;
    const lbClose = lb.querySelector('.fb-lightbox-close') as HTMLElement;
    const lbPrev = lb.querySelector('.fb-lightbox-prev') as HTMLElement;
    const lbNext = lb.querySelector('.fb-lightbox-next') as HTMLElement;

    let lbImages: { src: string; caption: string }[] = [];
    let lbIndex = 0;

    function showImage(idx: number) {
      lbIndex = (idx + lbImages.length) % lbImages.length;
      const img = lbImages[lbIndex]!;
      lbImg.src = img.src;
      lbImg.alt = img.caption;
      lbCaption.textContent = img.caption;
      lbCounter.textContent = `${lbIndex + 1} / ${lbImages.length}`;
      lbPrev.style.display = lbImages.length <= 1 ? 'none' : '';
      lbNext.style.display = lbImages.length <= 1 ? 'none' : '';
    }

    function openLightbox(galleryEl: HTMLElement, idx: number) {
      try { lbImages = JSON.parse(galleryEl.getAttribute('data-images') ?? '[]'); } catch { lbImages = []; }
      if (!lbImages.length) return;
      showImage(idx);
      lb.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lb.classList.remove('active');
      document.body.style.overflow = '';
      lbImg.src = '';
    }

    const articleBody = document.querySelector('.bodyArticle');
    function onGalleryClick(e: Event) {
      const item = (e.target as Element).closest('.fb-gallery-item');
      if (!item) return;
      const galleryEl = item.closest('.fb-gallery') as HTMLElement;
      if (!galleryEl) return;
      openLightbox(galleryEl, parseInt(item.getAttribute('data-index') ?? '0', 10));
    }
    articleBody?.addEventListener('click', onGalleryClick);

    lbClose.addEventListener('click', closeLightbox);
    lbPrev.addEventListener('click', () => showImage(lbIndex - 1));
    lbNext.addEventListener('click', () => showImage(lbIndex + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });

    function onKeydown(e: KeyboardEvent) {
      if (!lb.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showImage(lbIndex - 1);
      if (e.key === 'ArrowRight') showImage(lbIndex + 1);
    }
    window.addEventListener('keydown', onKeydown);

    return () => {
      articleBody?.removeEventListener('click', onGalleryClick);
      window.removeEventListener('keydown', onKeydown);
      lb.remove();
      document.body.style.overflow = '';
    };
  });

  async function toggleLike() {
    if (likeLoading) return;
    likeLoading = true;
    try {
      const res = await fetch(`${PUBLIC_API_URL}/api/articles/${a.id}/like`, {
        method: "POST",
      });
      if (res.ok) {
        const d = await res.json();
        liked = d.data?.liked ?? !liked;
        likeCount = d.data?.likeCount ?? likeCount;
      }
    } finally {
      likeLoading = false;
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      copyFeedback = true;
      setTimeout(() => {
        copyFeedback = false;
      }, 2000);
    } catch {}
  }


  function formatDate(d: string | null) {
    if (!d) return "";
    // Slice date part only (YYYY-MM-DD) to avoid UTC→local timezone shift
    const [year, month, day] = d.slice(0, 10).split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  $: shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `/article/${a.id}/${a.slug}`;
  $: waUrl = `https://wa.me/?text=${encodeURIComponent(a.title + " " + shareUrl)}`;
  $: fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
</script>

<svelte:head>
  <title>{seo.title}</title>
  <meta name="description" content={seo.description} />
  <link rel="canonical" href={seo.canonical} />
  <meta name="robots" content={seo.robots} />
  <meta property="og:title" content={seo.og.title} />
  <meta property="og:description" content={seo.og.description} />
  <meta property="og:type" content={seo.og.type} />
  <meta property="og:url" content={seo.og.url} />
  {#if seo.og.image}<meta property="og:image" content={seo.og.image} />{/if}
  <meta name="twitter:card" content={seo.twitter.card} />
  <meta name="twitter:title" content={seo.twitter.title} />
  <meta name="twitter:description" content={seo.twitter.description} />
  {#if seo.twitter.image}<meta
      name="twitter:image"
      content={seo.twitter.image}
    />{/if}
  {#if a.publishDate}<meta
      property="article:published_time"
      content={new Date(a.publishDate).toISOString()}
    />{/if}
  {#if a.updatedAt}<meta
      property="article:modified_time"
      content={new Date(a.updatedAt).toISOString()}
    />{/if}
  {#if a.category}<meta
      property="article:section"
      content={a.category.name}
    />{/if}
  {#if a.author}<meta property="article:author" content={a.author.name} />{/if}
  {#each data.jsonLd as schema}
    {@html `<script type="application/ld+json">${JSON.stringify(schema)}<\/script>`}
  {/each}
  {#if a.image}
    <link rel="preload" as="image" href={a.image} fetchpriority="high" />
  {/if}
</svelte:head>

<!-- Hero -->
<article
  class="article-detail article-detail--{detailStyle} home-collab-card anime-hero-full mb-0"
>
  <div class="container-xl" id="header-article">
    <div class="row g-4 align-items-center article-detail__hero-row">
      <div class="col-12 col-lg-7 article-detail__hero-copy">
        <nav aria-label="breadcrumb" class="mb-3">
          <ol class="breadcrumb small mb-0 article-hero-breadcrumb">
            <li class="breadcrumb-item">
              <a href="/" class="text-white-50 text-decoration-none">Home</a>
            </li>
            {#if a.category}
              <li
                class="breadcrumb-item active text-white-50"
                aria-current="page"
              >
                <a
                  href="/category/{a.category.slug}"
                  class="text-white-50 text-decoration-none"
                >
                  {a.category.name}
                </a>
              </li>
            {/if}
          </ol>
        </nav>

        {#if a.category}
          <a href="/category/{a.category.slug}">
            <span class="badge badge-main mb-3">{a.category.name}</span>
          </a>
        {/if}

        <h1
          class="home-collab-card__title article-detail__title mb-2 text-white"
        >
          {a.title}
        </h1>

        {#if a.description}
          <p
            class="home-collab-card__description article-detail__description mb-3"
          >
            {a.description}
          </p>
        {/if}

        <div class="home-collab-card__chips article-detail__meta">
          {#if a.author}
            <span>
              Publish By <a
                href="/@{a.author.username ?? a.author.id}"
                class="ms-1 text-decoration-none"
                style="color: var(--site-primary, #f1ff32);"
              >
                {a.author.name}
              </a>
            </span>
          {/if}
          <span>
            <time datetime={a.publishDate ?? ""}
              >{formatDate(a.publishDate)}</time
            >
          </span>
        </div>
      </div>

      {#if a.image}
        <div class="col-12 col-lg-5 article-detail__hero-media">
          <figure class="article-hero-figure mb-0">
            <img
              src={a.image}
              alt={a.title}
              class="article-hero-img w-100"
              fetchpriority="high"
              loading="eager"
              decoding="async"
            />
          </figure>
        </div>
      {/if}
    </div>
  </div>
</article>

<!-- Ad below hero -->
<div class="container-xl mt-3">
  <AdBanner ad={data.adHero} adSlot="article_ad_1" />
</div>

<!-- Body -->
<div class="section-md container-xl article-detail__content-shell">
  <div class="row g-4">
    <div class="col-12 col-lg-8">
      <!-- Share card -->
      <div class="share-social-card mb-4">
        <div class="share-social-card__actions">
          <button
            class="share-social-card__button {liked ? 'is-active' : ''}"
            on:click={toggleLike}
            disabled={likeLoading}
            title={liked ? "Batalkan love" : "Love artikel"}
          >
            <i class="bi {liked ? 'bi-heart-fill' : 'bi-heart'}"></i>
            <span>{likeCount}</span>
          </button>

          <button
            class="share-social-card__button share-social-card__button--copy {copyFeedback
              ? 'is-copied'
              : ''}"
            on:click={copyLink}
            title="Copy Link"
          >
            <i class="bi {copyFeedback ? 'bi-check-lg' : 'bi-link-45deg'}"></i>
            <span>Copy Link</span>
          </button>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="share-social-card__button share-social-card__button--whatsapp"
            title="Share ke WhatsApp"
          >
            <i class="bi bi-whatsapp"></i>
            <span>WhatsApp</span>
          </a>

          <a
            href={fbUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="share-social-card__button share-social-card__button--facebook"
            title="Share ke Facebook"
          >
            <i class="bi bi-facebook"></i>
            <span>Facebook</span>
          </a>

          <a
            href="#komentar"
            class="share-social-card__button share-social-card__button--comment"
            title="Ikut diskusi"
          >
            <i class="bi bi-chat-dots"></i>
            <span>Komentar</span>
          </a>
        </div>
      </div>

      <!-- TOC -->
      {#if a.toc && a.toc.length >= 2}
        <details class="article-toc mb-2" aria-label="Daftar isi artikel" open>
          <summary class="article-toc__summary">
            <span class="article-toc__title">Daftar Isi</span>
            <i class="bi bi-chevron-down" aria-hidden="true"></i>
          </summary>
          <ol class="article-toc__list">
            {#each a.toc as item}
              <li
                style={item.level > 2
                  ? `margin-left:${(item.level - 2) * 1}rem`
                  : ""}
              >
                <a href="#{item.id}">{item.title}</a>
              </li>
            {/each}
          </ol>
        </details>
      {/if}

      <!-- Review card -->
      {#if a.review}
        <section
          class="article-review-card home-collab-card mb-4"
          aria-label="Ringkasan review"
        >
          <div class="article-review-card__header">
            <div class="article-review-card__score-card">
              <span class="article-review-card__score-label">Review Score</span>
              <div class="article-review-card__score-value">
                {a.review.score}
              </div>
              <span class="article-review-card__score-scale">dari 10</span>
            </div>
            <div class="article-review-card__header-side">
              <span class="badge badge-main">Review Highlight</span>
              {#if a.review.summary}
                <p class="article-review-card__summary mb-0">
                  {a.review.summary}
                </p>
              {/if}
            </div>
          </div>

          <div class="home-collab-card__chips mt-3">
            <span>Score {a.review.score}/10</span>
            {#if a.review.pros?.length}
              <span>{a.review.pros.length} Kelebihan</span>
            {/if}
            {#if a.review.cons?.length}
              <span>{a.review.cons.length} Kekurangan</span>
            {/if}
          </div>

          {#if a.review.pros?.length || a.review.cons?.length}
            <div class="article-review-card__facts mt-3">
              <div
                class="home-collab-card__panel article-review-card__fact-panel"
              >
                <div class="article-review-card__facts-grid">
                  {#if a.review.pros?.length}
                    <div>
                      <strong class="article-review-card__detail-title"
                        >Kelebihan</strong
                      >
                      <ul class="article-review-card__list">
                        {#each a.review.pros as pro}<li>{pro}</li>{/each}
                      </ul>
                    </div>
                  {/if}
                  {#if a.review.cons?.length}
                    <div>
                      <strong class="article-review-card__detail-title"
                        >Kekurangan</strong
                      >
                      <ul class="article-review-card__list">
                        {#each a.review.cons as con}<li>{con}</li>{/each}
                      </ul>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/if}

          {#if a.review.verdict}
            <div
              class="home-collab-card__panel article-review-card__verdict mt-3"
            >
              <strong class="article-review-card__detail-title"
                >Kesimpulan</strong
              >
              <p class="mb-0">{a.review.verdict}</p>
            </div>
          {/if}
        </section>
      {/if}

      <!-- Article content -->
      <div class="bodyArticle article-detail__reader pt-lg-2">
        {@html a.content}
      </div>

      <!-- Ad after content -->
      <AdBanner ad={data.adAfterContent} adSlot="article_ad_3" />

      <!-- Tags -->
      {#if a.tags && a.tags.length > 0}
        <div class="mt-4 pt-4 border-top">
          <h6
            class="fw-bold mb-2 text-muted small text-uppercase"
            style="letter-spacing: 0.05em;"
          >
            Tagar
          </h6>
          <div class="d-flex flex-wrap gap-2">
            {#each a.tags as tag}
              <a href="/tag/{tag.slug}" class="hashtag-pill">
                <span class="hashtag-symbol">#</span>{tag.name}
              </a>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Comments -->
      <section class="article-comments mt-5" id="komentar">
        <div class="article-comments__header">
          <h4 class="article-comments__title">Komentar</h4>
          <span class="article-comments__count">{comments.length} komentar</span
          >
        </div>

        {#if data.user}
          <form
            method="POST"
            action="?/comment"
            use:enhance={({ formElement }) => {
              return async ({ result, update }) => {
                if (result.type === 'success' && result.data?.data) {
                  comments = [result.data.data, ...comments];
                  formElement.reset();
                  commentBody = '';
                }
                await update({ reset: false });
              };
            }}
            class="article-comments__composer"
          >
            <label
              class="article-comments__label d-block mb-2"
              for="commentTextarea">Tulis Komentar</label
            >
            <textarea
              id="commentTextarea"
              name="body"
              class="form-control article-comments__textarea mb-0"
              rows="3"
              placeholder="Tulis komentar..."
              bind:value={commentBody}
            ></textarea>
            <div class="article-comments__composer-actions">
              {#if $page.form?.error}
                <span class="text-danger small">{$page.form.error}</span>
              {:else}
                <span></span>
              {/if}
              <button type="submit" class="theme-btn theme-btn--dark theme-btn--sm">
                Kirim Komentar
              </button>
            </div>
          </form>
        {:else}
          <div class="article-comments__login">
            <span class="article-comments__empty">Masuk untuk menulis komentar.</span>
            <a href="/auth/login?redirect=/article/{a.id}/{a.slug}#komentar" class="theme-btn theme-btn--dark theme-btn--sm">
              Masuk
            </a>
          </div>
        {/if}

        {#if comments.length > 0}
          <div class="article-comments__list">
            {#each comments as comment}
              <div class="article-comment">
                <div class="article-comment__avatar">
                  <span>{comment.user?.name?.[0]?.toUpperCase() ?? "A"}</span>
                </div>
                <div class="article-comment__body">
                  <div class="article-comment__meta">
                    <strong>{comment.user?.name ?? "Anonim"}</strong>
                  </div>
                  <p class="small mb-0">{comment.body}</p>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="article-comments__composer">
            <p class="article-comments__empty mb-0">
              Belum ada komentar. Jadilah yang pertama!
            </p>
          </div>
        {/if}
      </section>
    </div>

    <!-- Sidebar -->
    <div class="col-12 col-lg-4 mt-4 mt-lg-0">
      <div class="sticky-top" style="top: 80px;">
        <AdBanner ad={data.adSidebar} adSlot="article_ad_2" size="sidebar" />
        <SocialMediaCard socials={data.socials} />

        {#if data.settings?.curhat_enabled && data.promoCurhatan?.length > 0}
          <CurhatPromoCard curhatan={data.promoCurhatan} {siteName} />
        {/if}

        {#if data.related.length > 0}
          <div class="mb-4">
            <div class="line-heading mb-3">
              <h3 class="fw-bold h5 mb-0"><span>Rekomendasi</span></h3>
            </div>
            <div class="d-flex flex-column">
              {#each data.related as article, i}
                <ArticleRankItem {article} rank={i + 1} />
              {/each}
            </div>
          </div>
        {/if}

        <PopularTags tags={data.popularTags} />
      </div>
    </div>
  </div>
</div>
