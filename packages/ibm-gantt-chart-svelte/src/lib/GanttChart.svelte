<script lang="ts">
  // The core library does not inject its own styles (no style-loader in the
  // dist bundle) — consumers get them through this import.
  import 'ibm-gantt-chart/dist/ibm-gantt-chart.css'
  import Gantt from 'ibm-gantt-chart'
  import type { GanttConfig } from 'ibm-gantt-chart'
  import type { GanttChartProps } from './interfaces'
  import { normalizeClass, normalizeStyle } from './interfaces'

  let {
    config,
    class: className = '',
    style = '',
    id = `gantt-${Math.random().toString(36).slice(2, 8)}`,
    ref = $bindable<HTMLDivElement | undefined>(undefined),
    gantt = $bindable<ReturnType<typeof createGantt>>(undefined),
    onload,
    onupdate,
    ondestroy,
    ...rest
  }: GanttChartProps = $props()

  let error = $state<string | null>(null)

  const normalizedClass = $derived(normalizeClass(className))
  const normalizedStyle = $derived(normalizeStyle(style))

  function createGantt(node: HTMLDivElement, cfg: GanttConfig): Gantt | undefined {
    try {
      const instance = new Gantt(node, cfg)
      error = null
      return instance
    } catch (err) {
      error = err instanceof Error ? err.message : String(err)
      console.error('Failed to initialize Gantt chart:', err)
      return undefined
    }
  }

  function destroyGantt(instance: Gantt) {
    try {
      if (typeof instance.destroy === 'function') {
        instance.destroy()
      }
    } catch (err) {
      console.error('Error destroying Gantt chart:', err)
    }
    ondestroy?.()
  }

  // Single lifecycle effect: tracks only `config` and `ref`. Never reads `gantt`,
  // so writing it here cannot re-trigger the effect (no destroy/recreate loop).
  // The core has no hot-update API — on config change we destroy and recreate,
  // same as the React wrapper. Cleanup runs before each re-run and on unmount.
  let isFirstRun = true

  $effect(() => {
    const currentConfig = config
    const node = ref
    if (!node) return

    const instance = createGantt(node, currentConfig)
    gantt = instance

    if (instance) {
      if (isFirstRun) {
        isFirstRun = false
        onload?.()
      } else {
        onupdate?.(currentConfig)
      }
    }

    return () => {
      if (instance) {
        destroyGantt(instance)
      }
      gantt = undefined
    }
  })
</script>

<!--
  @component IBM Gantt Chart Svelte wrapper.
  Wraps the vanilla JS ibm-gantt-chart library in a reactive Svelte 5 component.
-->

<div
  {id}
  bind:this={ref}
  class={normalizedClass ? `ibm-gantt-chart-svelte ${normalizedClass}` : 'ibm-gantt-chart-svelte'}
  style={normalizedStyle}
  {...rest}
>
  {#if error}
    <div class="ibm-gantt-chart-svelte__error">
      <p>Failed to load Gantt chart: {error}</p>
    </div>
  {/if}
</div>

<style>
  .ibm-gantt-chart-svelte {
    width: 100%;
    height: 100%;
  }

  .ibm-gantt-chart-svelte__error {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'IBM Plex Sans', sans-serif;
    color: #da1e28;
  }
</style>
