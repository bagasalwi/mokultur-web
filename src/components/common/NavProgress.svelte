<script lang="ts">
  import { navigating } from '$app/stores';
</script>

{#if $navigating}
  <div class="nav-progress" aria-hidden="true">
    <div class="nav-progress__bar"></div>
  </div>
{/if}

<style>
  .nav-progress {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    z-index: 9999;
    pointer-events: none;
  }

  .nav-progress__bar {
    height: 100%;
    background: var(--site-primary, #f1ff32);
    animation: nav-progress-indeterminate 1.4s ease-in-out infinite;
    transform-origin: left center;
    border-radius: 0 2px 2px 0;
    box-shadow: 0 0 8px color-mix(in srgb, var(--site-primary, #f1ff32) 60%, transparent);
  }

  @keyframes nav-progress-indeterminate {
    0%   { transform: scaleX(0); margin-left: 0; }
    40%  { transform: scaleX(0.6); margin-left: 0; }
    70%  { transform: scaleX(0.25); margin-left: 75%; }
    100% { transform: scaleX(0); margin-left: 100%; }
  }
</style>
