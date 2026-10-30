<script lang="ts">
  import { onMount } from 'svelte';
  let offline = false;
  onMount(() => {
    const update = () => offline = !navigator.onLine;
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  });
</script>

{#if offline}<p class="body-sm mx-auto mt-3 max-w-[1180px] px-4 text-ink2 lg:px-7">Offline — data mungkin tidak terbaru</p>{/if}
