<script lang="ts">
  import { onMount } from 'svelte';
  import { readerRequest, ReaderError, type ReaderArticleState } from '$lib/reader';
  export let postId: number;
  export let loggedIn = false;
  export let state: ReaderArticleState | null = null;

  onMount(() => {
    if (!loggedIn) return;
    let seconds = 0;
    const content = document.getElementById(`reader-content-${postId}`);
    const timer = window.setInterval(() => {
      if (!content || document.visibilityState !== 'visible') return;
      const bounds = content.getBoundingClientRect();
      if (bounds.top >= innerHeight || bounds.bottom <= 0) return;
      if (++seconds < 10) return;
      clearInterval(timer);
      void record();
    }, 1000);
    async function record() {
      try {
        const current = state ?? (await readerRequest<{ data: ReaderArticleState }>(`articles/${postId}`)).data;
        await readerRequest(`articles/${postId}`, 'PATCH', { kind: 'visit', revision: current.revision });
      } catch (cause) {
        if (cause instanceof ReaderError && cause.status === 409 && cause.state) {
          await readerRequest(`articles/${postId}`, 'PATCH', { kind: 'visit', revision: cause.state.revision }).catch(() => {});
        }
      }
    }
    return () => clearInterval(timer);
  });
</script>
