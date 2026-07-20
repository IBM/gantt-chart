/**
 * Gantt namespace type definitions - the backbone of the public API
 * Eliminates .impl || pattern through proper type hierarchy and discriminated unions
 */

import type {
  GanttInstance,
  TimeWindow,
  Activity,
  Resource,
  Row,
  Constraint,
  Reservation,
  GanttConfig,
  ModelConfig,
  GanttEvent,
  SelectionEvent,
} from './types';

// ============================================================================
// COMPONENT REGISTRY
// ============================================================================

export interface ComponentConstructor<T = unknown> {
  new(...args: never[]): T;
}

export interface ComponentImpl<T = unknown> {
  impl?: ComponentConstructor<T>;
}

/**
 * Component registry: maps component names to their implementations
 * Supports both base and custom impl variants
 */
export interface ComponentRegistry {
  // UI Components
  Button: ComponentImpl;
  ButtonGroup: ComponentImpl;
  CheckBox: ComponentImpl;
  DropDownList: ComponentImpl;
  ErrorHandler: ComponentImpl;
  Filter: ComponentImpl;
  Input: ComponentImpl;
  SelectionHandler: ComponentImpl;
  Split: ComponentImpl;
  Toggle: ComponentImpl;
  Tooltip: ComponentImpl;
  TreeTable: ComponentImpl;
  TimeTable: ComponentImpl;

  // Core Components
  ActivityLayout: ComponentImpl;
  ConstraintLayout: ComponentImpl;
  ConstraintsGraph: ComponentImpl;
  DataFetcher: ComponentImpl;
  GanttModel: ComponentImpl;
  GanttPanel: ComponentImpl;
  GanttUpdates: ComponentImpl;
  LayoutSynchronizer: ComponentImpl;
  LoadResourceChart: ComponentImpl;
  Palette: ComponentImpl;
  Renderer: ComponentImpl;
  TimeLine: ComponentImpl;
  Toolbar: ComponentImpl;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export interface UtilityFunctions {
  // Type checking
  isString(val: unknown): val is string;
  isFunction(val: unknown): val is (...args: never[]) => unknown;
  isArray<T = unknown>(val: unknown): val is T[];
  isDomElement(val: unknown): val is HTMLElement;
  isPromise(val: unknown): val is Promise<unknown>;

  // Object manipulation
  mergeObjects<T extends object>(target: T, ...sources: Partial<T>[]): T;
  clone<T>(obj: T): T;
  propertyEvaluator(path: string): (obj: Record<string, unknown>) => unknown;

  // DOM utilities
  addClass(el: HTMLElement, className: string): void;
  removeClass(el: HTMLElement, className: string): void;
  toggleClass(el: HTMLElement, className: string, force?: boolean): void;
  appendChild(parent: HTMLElement, child: HTMLElement | string): void;
  appendSVG(parent: HTMLElement, svgContent: string): void;
  addEventListener(
    el: HTMLElement | Document,
    event: string,
    handler: EventListener,
    useCapture?: boolean
  ): void;
  removeEventListener(
    el: HTMLElement | Document,
    event: string,
    handler: EventListener
  ): void;

  // String utilities
  getString(key: string): string;
  formatString(template: string, data: Record<string, unknown>): string;

  // Date utilities
  getDateFormatter(format: string): (date: Date | number) => string;
  parseDateString(dateString: string, format: string): Date | number;

  // Internationalization
  getIntl(): { locale: string; formatMessage(key: string, defaultValue?: string): string } | null;

  // AJAX
  ajax<T = unknown>(url: string, config?: RequestInit): Promise<T>;

  // Logging
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
  log(...args: unknown[]): void;
}

// ============================================================================
// EVENT DEFINITIONS
// ============================================================================

export interface EventDefinitions {
  TITLE_CHANGED: 'titleChanged';
  TABLE_INIT: 'tableinit';
  TIME_TABLE_INIT: 'timesheetinit';
  TIME_LINE_INIT: 'timeline_init';
  TIME_WINDOW_CHANGED: 'timeWindowChanged';
  TIME_LINE_RANGE_CHANGE: 'timeline_rangechange';
  TIME_LINE_RANGE_CHANGED: 'timeline_rangechanged';
  TIME_LINE_SIZE_CHANGED: 'timeline_sizeChanged';
  TIME_LINE_PAN_MOVE: 'timeline_panmove';
  TIME_LINE_PAN_MOVED: 'timeline_panmove';
  TIME_LINE_SCROLLED: 'timeline_scrolled';
  RESIZED: 'resized';
  SPLIT_RESIZED: 'split_resized';
  ROWS_FILTERED: 'rows_filtered';
  DATA_LOADED: 'data_loaded';
  ROWS_ADDED: 'rows_added';
  ROWS_REMOVED: 'rows_removed';
  ROWS_MODIFIED: 'rows_modified';
  ROWS_SORTED: 'rows_sorted';
  START_SELECTING: 'startSelecting';
  SELECTION_CLEARED: 'selectionCleared';
  STOP_SELECTING: 'stopSelecting';
  ACTIVITY_SELECTED: 'activitySelected';
  ACTIVITY_UNSELECTED: 'activityUnselected';
  ACTIVITY_SELECTION_CHANGED: 'activitySelectionChanged';
  ACTIVITY_SELECTION_CLEARED: 'activitySelectionCleared';
  RESOURCE_SELECTED: 'resourceSelected';
  RESOURCE_UNSELECTED: 'resourceUnselected';
  RESOURCE_SELECTION_CHANGED: 'resourceSelectionChanged';
  RESOURCE_SELECTION_CLEARED: 'resourceSelectionCleared';
  ROW_SELECTED: 'rowSelected';
  ROW_UNSELECTED: 'rowUnselected';
  ROW_SELECTION_CHANGED: 'rowSelectionChanged';
  ROW_SELECTION_CLEARED: 'rowSelectionCleared';
  CONSTRAINT_SELECTED: 'constraintSelected';
  CONSTRAINT_UNSELECTED: 'constraintUnselected';
  CONSTRAINT_SELECTION_CHANGED: 'constraintSelectionChanged';
  CONSTRAINT_SELECTION_CLEARED: 'constraintSelectionCleared';
}

// ============================================================================
// DATA TYPE DEFINITIONS
// ============================================================================

export interface TypeDefinitions {
  ACTIVITY_CHART: 'ActivityChart';
  ACTIVITY_CHART_GROUPED: 'ActivityChartGrouped';
  ACTIVITY_CHART_STACKED: 'ActivityChartStacked';
  RESOURCE_LOAD_CHART: 'ResourceLoadChart';
}

// ============================================================================
// GANTT GLOBAL NAMESPACE
// ============================================================================

/**
 * Main Gantt interface - the global namespace that contains all API surface
 */
export interface GanttNamespace {
  // Constructor
  new(context: string | HTMLElement, config?: GanttConfig): GanttInstance;

  // Static configuration
  defaultConfiguration: GanttConfig;
  defaultPalettes: Record<string, string[]>;

  // Registries
  components: ComponentRegistry;
  events: EventDefinitions;
  type: TypeDefinitions;

  // Utilities
  utils: UtilityFunctions;

  // Version
  version: string;

  // Optional: Plugin support
  plugins?: Record<string, unknown>;
}

// ============================================================================
// SAFE COMPONENT ACCESS HELPER
// ============================================================================

/**
 * Safe helper to access components with .impl fallback
 * Replaces: const ComponentClass = Gantt.components.Component.impl || Gantt.components.Component
 *
 * @example
 * const ButtonClass = getGanttComponent(Gantt, 'Button', Button);
 */
export function getGanttComponent<K extends keyof ComponentRegistry, T>(
  gantt: GanttNamespace,
  componentName: K,
  defaultConstructor: ComponentConstructor<T>
): ComponentConstructor<T> {
  const registry = gantt.components;
  const component = registry[componentName];
  if (component && component.impl) {
    return component.impl as ComponentConstructor<T>;
  }
  return defaultConstructor;
}

/**
 * Batch access multiple components at once
 * @example
 * const { Button, CheckBox } = getGanttComponents(Gantt, ['Button', 'CheckBox'], {
 *   Button: ButtonImpl,
 *   CheckBox: CheckBoxImpl
 * });
 */
export function getGanttComponents<T extends Record<string, ComponentConstructor>>(
  gantt: GanttNamespace,
  componentNames: (keyof ComponentRegistry)[],
  defaults: T
): T {
  const result: Record<string, ComponentConstructor> = {};
  for (const name of componentNames) {
    const key = name as keyof T;
    result[name as string] = getGanttComponent(gantt, name, defaults[key]);
  }
  return result as T;
}
