<script lang="ts">
  /**
   * The text of a channel heading ("Terbaru", "Event Mendatang", "Liputan &
   * Press Release"). On mokultur.com it is the plain title. Under the Seputar
   * Otaku theme the last word sits in a red box, the way the brand writes
   * "Seputar Otaku's [Pick]": `mark` names a different (or longer) tail, and
   * `lead` supplies a word before a one-word title so the box never stands
   * alone. Neither prop changes what Mokultur renders.
   */
  import { page } from '$app/stores';

  export let title: string;
  export let lead: string | null = null;
  export let mark: string | null = null;

  $: themed = $page.data?.site?.theme === 'seputarotaku';
  $: boxed = mark && title.includes(mark) ? mark : title.trim().split(/\s+/).pop() ?? title;
  $: at = title.lastIndexOf(boxed);
  $: head = title.slice(0, at).trim() || (at === 0 ? lead ?? '' : '');
  $: rest = title.slice(at + boxed.length).trim();
</script>

{#if themed}{#if head}{head} {/if}<mark class="channel-mark">{boxed}</mark>{#if rest} {rest}{/if}{:else}{title}{/if}
