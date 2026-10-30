<script lang="ts">
  export let dense = false;
</script>

<div class="card bg-card border border-line rounded-card {dense ? 'py-1.5 px-4' : 'p-4'}">
  <slot />
</div>
