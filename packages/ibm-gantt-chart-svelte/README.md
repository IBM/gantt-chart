# ibm-gantt-chart-svelte

IBM Gantt Chart component for Svelte 5.

## Install

```bash
npm install ibm-gantt-chart-svelte
# or
yarn add ibm-gantt-chart-svelte
```

Peer dependency:

```bash
npm install svelte@^5.0.0
```

## Usage

```svelte
<script lang="ts">
  import { GanttChart } from 'ibm-gantt-chart-svelte'
  import type { GanttConfig } from 'ibm-gantt-chart'

  const config: GanttConfig = {
    data: {
      resources: {
        data: [
          { id: '1', name: 'Alice', activities: [
            { id: 'a1', name: 'Task A', start: Date.now(), end: Date.now() + 86400000 }
          ]},
        ],
        activities: 'activities',
        name: 'name',
        id: 'id',
      },
      activities: {
        start: 'start',
        end: 'end',
        name: 'name',
      },
    },
    title: 'My Gantt',
  }
</script>

<GanttChart {config} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config` | `GanttConfig` | required | Gantt chart configuration |
| `class` | `string` | `''` | CSS class for container |
| `style` | `string` | `''` | Inline styles for container |
| `onload` | `() => void` | — | Fired when chart loads |
| `onupdate` | `(config: GanttConfig) => void` | — | Fired when config updates |
| `ondestroy` | `() => void` | — | Fired when chart destroys |

## Bindables

| Prop | Type | Description |
|------|------|-------------|
| `ref` | `HTMLDivElement` | Container DOM node |
| `gantt` | `Gantt` | Underlying Gantt instance |

## Development

```bash
yarn install
yarn dev          # Dev server on :3003
yarn storybook    # Storybook on :6006
yarn test         # Type-check Svelte + TS
yarn build        # Package build
```

## License

Apache-2.0
