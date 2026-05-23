<script lang="ts">
  import type { PageData } from './$types';
  import Pagination from '$components/common/Pagination.svelte';

  export let data: PageData;

  function buildUrl(page: number): string {
    return `/author?page=${page}`;
  }
</script>

<svelte:head>
  <title>Penulis - {data.settings?.site_name ?? 'Mokultur'}</title>
  <meta name="description" content="Kenali para penulis dan kontributor kami." />
  <link rel="canonical" href="/author" />
</svelte:head>

<div class="container-xl py-4">
  <h1 class="fw-boldest h2 mb-4">Penulis</h1>

  {#if data.writers.length > 0}
    <div class="row g-4">
      {#each data.writers as writer}
        <div class="col-sm-6 col-lg-4">
          <a
            href="/@{writer.username ?? writer.id}"
            class="card h-100 text-decoration-none border-0 card-hover"
          >
            <div class="card-body d-flex gap-3 align-items-start p-3">
              {#if writer.img}
                <img src={writer.img} alt={writer.name} class="rounded-circle flex-shrink-0"
                  style="width:52px; height:52px; object-fit:cover;" loading="lazy" />
              {:else}
                <div class="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                  style="width:52px; height:52px; font-size:1.25rem;">
                  {writer.name[0]?.toUpperCase()}
                </div>
              {/if}
              <div class="min-w-0">
                <h6 class="fw-bold mb-1 text-dark">{writer.name}</h6>
                {#if writer.description}
                  <p class="small text-muted mb-2 line-clamp-2">{writer.description}</p>
                {/if}
                <div class="d-flex gap-3">
                  <small class="text-muted"><i class="bi bi-file-text me-1"></i>{writer.totalArticles}</small>
                  <small class="text-muted"><i class="bi bi-eye me-1"></i>{writer.totalViews.toLocaleString('id-ID')}</small>
                </div>
              </div>
            </div>
          </a>
        </div>
      {/each}
    </div>
    <Pagination currentPage={data.meta.page} totalPages={data.meta.totalPages} {buildUrl} />
  {:else}
    <p class="text-muted">Belum ada penulis.</p>
  {/if}
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
