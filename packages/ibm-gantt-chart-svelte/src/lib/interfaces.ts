import type Gantt from 'ibm-gantt-chart'
import type { GanttConfig } from 'ibm-gantt-chart'

/** CSS class value: string, array of strings, or object mapping class names to booleans. */
export type ClassValue = string | string[] | Record<string, boolean> | undefined

/** Style value: inline CSS string or object mapping properties to values. */
export type StyleValue = string | Record<string, string> | undefined

function normalizeClass(value: ClassValue): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.filter(Boolean).join(' ')
  return Object.entries(value)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(' ')
}

function normalizeStyle(value: StyleValue): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  return Object.entries(value)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${v}`)
    .join(';')
}

export { normalizeClass, normalizeStyle }

export interface GanttChartProps {
  /** Gantt chart configuration object. */
  config: GanttConfig
  /** Optional CSS class name(s) for the container. */
  class?: ClassValue
  /** Optional inline styles for the container. */
  style?: StyleValue
  /** Optional HTML ID for the container. */
  id?: string
  /** Bindable reference to the container div element. */
  ref?: HTMLDivElement
  /** Bindable reference to the underlying Gantt instance (undefined until created). */
  gantt?: Gantt
  /** Optional callback fired when the Gantt chart is loaded. */
  onload?: () => void
  /** Optional callback fired when the Gantt chart config updates. */
  onupdate?: (config: GanttConfig) => void
  /** Optional callback fired when the Gantt chart is destroyed. */
  ondestroy?: () => void
}

export interface GanttChartInstance {
  /** Underlying IBM Gantt chart instance. */
  gantt: Gantt
}
