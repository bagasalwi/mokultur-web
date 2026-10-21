<script lang="ts">
  export let currentPage: number;
  export let totalPages: number;
  export let buildUrl: (page: number) => string;

  $: pages = buildPageList(currentPage, totalPages);

  function buildPageList(current: number, total: number): (number | null)[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const list: (number | null)[] = [1];
    if (current > 3) list.push(null);
    for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) list.push(p);
    if (current < total - 2) list.push(null);
    list.push(total);
    return list;
  }
</script>

{#if totalPages > 1}
  <nav aria-label="Navigasi halaman" class="my-4">
    <ul class="pagination pagination-dark justify-content-center">
      <!-- An arrow with nowhere to go is not a link: crawlers followed the
           disabled ones to ?page=0 and to the page after the last. -->
      <li class="page-item {currentPage <= 1 ? 'disabled' : ''}">
        {#if currentPage > 1}
          <a class="page-link" href={buildUrl(currentPage - 1)} rel="prev" aria-label="Sebelumnya">
            <i class="bi bi-chevron-left"></i>
          </a>
        {:else}
          <span class="page-link" aria-hidden="true"><i class="bi bi-chevron-left"></i></span>
        {/if}
      </li>

      {#each pages as p}
        {#if p === null}
          <li class="page-item disabled"><span class="page-link">…</span></li>
        {:else}
          <li class="page-item {p === currentPage ? 'active' : ''}">
            <a class="page-link" href={buildUrl(p)} aria-current={p === currentPage ? 'page' : undefined}>{p}</a>
          </li>
        {/if}
      {/each}

      <li class="page-item {currentPage >= totalPages ? 'disabled' : ''}">
        {#if currentPage < totalPages}
          <a class="page-link" href={buildUrl(currentPage + 1)} rel="next" aria-label="Berikutnya">
            <i class="bi bi-chevron-right"></i>
          </a>
        {:else}
          <span class="page-link" aria-hidden="true"><i class="bi bi-chevron-right"></i></span>
        {/if}
      </li>
    </ul>
  </nav>
{/if}
