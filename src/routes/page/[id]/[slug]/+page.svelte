<script lang="ts">
  import type { PageData } from './$types';
  import PopularTags from '$components/common/PopularTags.svelte';
  import SocialMediaCard from '$components/common/SocialMediaCard.svelte';

  export let data: PageData;

  $: p = data.page;
  $: siteName = data.settings?.site_name ?? 'Mokultur';
  $: metaDesc = p.description
    ? p.description.replace(/<[^>]+>/g, '').substring(0, 157)
    : `${p.name} — ${siteName}`;
</script>

<svelte:head>
  <title>{p.name} — {siteName}</title>
  <meta name="description" content={metaDesc} />
  <link rel="canonical" href="/page/{p.id}/{p.slug}" />
  <meta name="robots" content="index, follow" />
</svelte:head>

<div class="container-xl py-5">
  <nav aria-label="breadcrumb" class="mb-4">
    <ol class="breadcrumb">
      <li class="breadcrumb-item"><a href="/">Home</a></li>
      <li class="breadcrumb-item active" aria-current="page">{p.name}</li>
    </ol>
  </nav>

  <div class="row g-5">
    <div class="col-12 col-lg-8">
      <h1 class="fw-bold mb-4">{p.name}</h1>
      <div class="article-body">
        {@html p.description ?? ''}
      </div>
    </div>

    <div class="col-12 col-lg-4">
      <div class="sticky-top" style="top: 80px;">
        <SocialMediaCard socials={data.socials} />
        <PopularTags tags={data.popularTags} />
      </div>
    </div>
  </div>
</div>
