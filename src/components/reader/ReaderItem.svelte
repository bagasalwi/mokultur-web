<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { imgSrcset, imgUrl } from '$lib/img';
  import { articleHref, type ReaderArticle, type ReaderArticleState } from '$lib/reader';
  import BookmarkButton from './BookmarkButton.svelte';
  export let article: ReaderArticle;
  export let loggedIn = false;
  export let collection = false;
  /** Opening story of a feed: wide photo beside a larger headline. */
  export let lead = false;
  /** Extra line in the meta row, e.g. when it was read or saved. */
  export let note: string | null = null;
  const dispatch = createEventDispatcher<{ updated: { id: number; state: ReaderArticleState } }>();
  $: state = article.reader;
  function updated(next: ReaderArticleState) {
    article = { ...article, reader: next };
    dispatch('updated', { id: article.id, state: next });
  }
  function formatDate(value: string | null) {
    return value ? new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  }
</script>

<article class="reader-item" class:reader-item--lead={lead}>
  {#if article.image}
    <a class="reader-item__image" href={articleHref(article)} tabindex="-1" aria-hidden="true">
      {#if lead}
        <img src={imgUrl(article.image, 768) ?? article.image} srcset={imgSrcset(article.image, 640)} sizes="(max-width: 767px) 92vw, 640px" alt="" width="640" height="400" decoding="async" />
      {:else}
        <img src={imgUrl(article.image, 320) ?? article.image} alt="" width="160" height="120" loading="lazy" decoding="async" />
      {/if}
    </a>
  {/if}
  <div class="reader-item__body">
    <div class="reader-item__meta">
      {#if article.category}<span class="badge badge-main">{article.category.name}</span>{/if}
      <time datetime={article.publishDate ?? ''}>{formatDate(article.publishDate)}</time>
      {#if article.format === 'photo-story'}<span>Photo Story</span>{/if}
      {#if note}<span class="reader-item__note">{note}</span>{/if}
    </div>
    <h2><a href={articleHref(article)}>{article.title}</a></h2>
    {#if article.description}<p class="reader-item__description">{article.description}</p>{/if}
    {#if !collection && article.reason}<p class="reader-item__reason"><i class="bi bi-stars" aria-hidden="true"></i>{article.reason}</p>{/if}
  </div>
  {#if collection}
    <div class="reader-item__save">
      <BookmarkButton variant="compact" postId={article.id} {state} {loggedIn} returnTo={articleHref(article)} on:updated={(event) => updated(event.detail)} />
    </div>
  {/if}
</article>
