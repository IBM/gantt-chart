<script lang="ts">
  import GanttChart from '$lib/GanttChart.svelte'
  import { nursesConfig } from '$lib/fixtures/nurses'
</script>

<svelte:head>
  <title>IBM Gantt Chart Svelte — Demo</title>
</svelte:head>

<div class="app">
  <GanttChart config={nursesConfig} />
</div>

<style>
  :global(html) {
    height: 100%;
  }

  :global(body) {
    height: 100%;
    margin: 0;
    padding: 0;
  }

  .app {
    height: 100%;
  }
</style>
