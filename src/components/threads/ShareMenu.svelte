<script lang="ts">
  export let url: string;
  export let title = '';
  export let compact = false;

  let open = false;
  let copied = false;

  $: enc = encodeURIComponent(url);
  $: encText = encodeURIComponent(`${title ? title + ' ' : ''}${url}`);

  function toggle(e: MouseEvent) { e.stopPropagation(); open = !open; }
  function close() { open = false; }

  function copyLink() {
    navigator.clipboard?.writeText(url).then(() => {
      copied = true;
      setTimeout(() => (copied = false), 1500);
    });
    close();
  }
  function openWin(href: string) {
    window.open(href, '_blank', 'noopener,noreferrer');
    close();
  }
  function shareInstagram() {
    navigator.clipboard?.writeText(url).then(() => {
      copied = true;
      setTimeout(() => (copied = false), 1500);
    });
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
    close();
  }
</script>

<svelte:window on:click={close} />

<div class="share">
  <button type="button" class="share__btn" on:click={toggle} aria-label="Bagikan" aria-expanded={open}>
    <i class="bi {copied ? 'bi-check2' : 'bi-share'}"></i>
    {#if !compact}<span>{copied ? 'Disalin' : 'Bagikan'}</span>{/if}
  </button>

  {#if open}
    <div class="share__menu" role="menu" on:click|stopPropagation on:keydown>
      <button type="button" class="share__item" on:click={copyLink}>
        <i class="bi bi-link-45deg"></i> Salin link
      </button>
      <button type="button" class="share__item" on:click={() => openWin(`https://wa.me/?text=${encText}`)}>
        <i class="bi bi-whatsapp" style="color:#25d366"></i> WhatsApp
      </button>
      <button type="button" class="share__item" on:click={() => openWin(`https://www.facebook.com/sharer/sharer.php?u=${enc}`)}>
        <i class="bi bi-facebook" style="color:#1877f2"></i> Facebook
      </button>
      <button type="button" class="share__item" on:click={shareInstagram}>
        <i class="bi bi-instagram" style="color:#e1306c"></i> Instagram
      </button>
    </div>
  {/if}
</div>

<style>
  .share { position: relative; display: inline-flex; }
  .share__btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: none; border: none; cursor: pointer;
    color: #6b7280; font-size: 13px; font-weight: 500;
    padding: 5px 10px; border-radius: 999px;
  }
  .share__btn:hover { background: #f3f4f6; color: #111; }
  .share__menu {
    position: absolute; bottom: calc(100% + 6px); left: 0; z-index: 30;
    background: #fff; border: 1px solid #e5e7eb; border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 6px; min-width: 170px;
  }
  .share__item {
    display: flex; align-items: center; gap: 10px; width: 100%;
    background: none; border: none; cursor: pointer; text-align: left;
    padding: 8px 10px; border-radius: 7px; font-size: 13.5px; color: #111;
  }
  .share__item:hover { background: #f3f4f6; }
  .share__item i { font-size: 16px; width: 18px; text-align: center; }
</style>
