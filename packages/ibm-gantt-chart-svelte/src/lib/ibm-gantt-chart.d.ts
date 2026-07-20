// Type declarations for ibm-gantt-chart (vanilla JS library)
// This file provides TypeScript types for the untyped core library.

declare module 'ibm-gantt-chart' {
  /** Gantt chart event names. */
  export const events: {
    readonly TITLE_CHANGED: 'titleChanged'
    readonly TABLE_INIT: 'tableinit'
    readonly TIME_TABLE_INIT: 'timesheetinit'
    readonly TIME_LINE_INIT: 'timeline_init'
    readonly TIME_WINDOW_CHANGED: 'timeWindowChanged'
    readonly TIME_LINE_RANGE_CHANGE: 'timeline_rangechange'
    readonly TIME_LINE_RANGE_CHANGED: 'timeline_rangechanged'
    readonly TIME_LINE_SIZE_CHANGED: 'timeline_sizeChanged'
    readonly TIME_LINE_PAN_MOVE: 'timeline_panmove'
    readonly TIME_LINE_PAN_MOVED: 'timeline_panmove'
    readonly TIME_LINE_SCROLLED: 'timeline_scrolled'
    readonly RESIZED: 'resized'
    readonly SPLIT_RESIZED: 'split_resized'
    readonly ROWS_FILTERED: 'rows_filtered'
    readonly DATA_LOADED: 'data_loaded'
    readonly ROWS_ADDED: 'rows_added'
    readonly ROWS_REMOVED: 'rows_removed'
    readonly ROWS_MODIFIED: 'rows_modified'
    readonly ROWS_SORTED: 'rows_sorted'
    readonly START_SELECTING: 'startSelecting'
    readonly SELECTION_CLEARED: 'selectionCleared'
    readonly STOP_SELECTING: 'stopSelecting'
    readonly ACTIVITY_SELECTED: 'activitySelected'
    readonly ACTIVITY_UNSELECTED: 'activityUnselected'
    readonly ACTIVITY_SELECTION_CHANGED: 'activitySelectionChanged'
    readonly ACTIVITY_SELECTION_CLEARED: 'activitySelectionCleared'
    readonly RESOURCE_SELECTED: 'resourceSelected'
    readonly RESOURCE_UNSELECTED: 'resourceUnselected'
    readonly RESOURCE_SELECTION_CHANGED: 'resourceSelectionChanged'
    readonly RESOURCE_SELECTION_CLEARED: 'resourceSelectionCleared'
    readonly ROW_SELECTED: 'rowSelected'
    readonly ROW_UNSELECTED: 'rowUnselected'
    readonly ROW_SELECTION_CHANGED: 'rowSelectionChanged'
    readonly ROW_SELECTION_CLEARED: 'rowSelectionCleared'
    readonly CONSTRAINT_SELECTED: 'constraintSelected'
    readonly CONSTRAINT_UNSELECTED: 'constraintUnselected'
    readonly CONSTRAINT_SELECTION_CHANGED: 'constraintSelectionChanged'
    readonly CONSTRAINT_SELECTION_CLEARED: 'constraintSelectionCleared'
  }

  /** Gantt chart types. */
  export const type: {
    readonly ACTIVITY_CHART: 'ActivityChart'
    readonly SCHEDULE_CHART: 'ScheduleChart'
  }

  /** Constraint relationship types. */
  export const constraintTypes: {
    readonly START_TO_START: 0
    readonly START_TO_END: 2
    readonly END_TO_END: 3
    readonly END_TO_START: 1
    isFromStart(type: number): boolean
  }

  /** Object type bit flags. */
  export const ObjectTypes: {
    readonly Row: 1
    readonly Activity: 2
    readonly Resource: 4
    readonly Constraint: 8
    readonly Reservation: 16
  }

  /** Default configuration values. */
  export const defaultConfiguration: {
    rowHeight: number
    zoomFactor: number
    loadingPanelThresold: number
  }

  /** Activity model object. */
  export interface Activity {
    id: string
    name: string
    start: number
    end: number
    [key: string]: unknown
  }

  /** Resource model object. */
  export interface Resource {
    id: string
    name: string
    activities: Activity[]
    [key: string]: unknown
  }

  /** Toolbar button configuration. */
  export interface ToolbarButton {
    type: 'button'
    text: string
    fontIcon?: string
    onclick?: (ctx: { gantt: GanttInstance }) => void
  }

  /** Toolbar item: string shorthand or button config. */
  export type ToolbarItem = string | ToolbarButton

  /** Data configuration for resources and activities. */
  export interface DataConfig {
    resources: {
      data: Resource[]
      activities: string
      name: string
      id: string
    }
    activities: {
      start: string
      end: string
      name: string
    }
  }

  /** A single color or a per-object color definition used by a palette. */
  export type PaletteColor = string | Record<string, unknown>

  /**
   * Palette configuration. The core supports:
   * - a string naming a built-in palette (e.g. `'qualitative20'`)
   * - an array of colors / color definitions
   * - a function returning an array of colors for a requested count
   * - a map of palette names to color arrays (when per-resource palettes are used)
   */
  export type PaletteConfig =
    | string
    | PaletteColor[]
    | ((count: number) => PaletteColor[])
    | Record<string, PaletteColor[]>

  /** Top-level Gantt configuration. */
  export interface GanttConfig {
    data: DataConfig
    toolbar?: ToolbarItem[]
    title?: string
    /** Color palette / theming configuration. */
    palette?: PaletteConfig
    [key: string]: unknown
  }

  /** Time window used by the chart. */
  export interface TimeWindow {
    start: number
    end: number
  }

  /** Gantt panel instance (returned by constructor). */
  export interface GanttInstance {
    draw(): void
    destroy(): void
    [key: string]: unknown
  }

  /**
   * Gantt chart constructor. Instance methods below are the verified public
   * API of the underlying GanttPanel (packages/ibm-gantt-chart/src/panel/ganttpanel.js).
   */
  export default class Gantt {
    constructor(context: HTMLElement | string, config: GanttConfig)

    /** Promise that resolves once the chart is fully initialized and data loaded. */
    initialized(): Promise<Array<Record<string, unknown>>>
    /** Load a new data configuration (or reload the current one). */
    load(config?: unknown): Promise<Array<Record<string, unknown>>>
    /** Redraw the chart. */
    draw(forceTableRedraw?: boolean): void
    /** Destroy the chart and remove all DOM content from the container node. */
    destroy(): void
    /** Current time window. */
    getTimeWindow(): TimeWindow | undefined
    /** Set the visible time window. */
    setTimeWindow(wnd: TimeWindow): Promise<TimeWindow>
    /** Chart title. */
    getTitle(): string | null
    setTitle(title: string): void
    /** Zoom controls. */
    resetZoom(): void
    zoomIn(evt?: unknown): void
    zoomOut(evt?: unknown): void
    /** Fit the visible time window to the displayed activities. */
    fitToContent(): void
    /** True if the chart has initialization/loading errors. */
    hasErrors(): boolean

    static readonly events: typeof events
    static readonly type: typeof type
    static readonly constraintTypes: typeof constraintTypes
    static readonly ObjectTypes: typeof ObjectTypes
    static readonly defaultConfiguration: typeof defaultConfiguration
  }
}
