/**
 * Core type definitions for IBM Gantt Chart.
 * Provides the foundation for all internal and public API typing.
 */

// ============================================================================
// MODEL TYPES
// ============================================================================

export interface TimeWindow {
  start: number;
  end: number;
}

export interface DateParser {
  (dateString: string): number;
}

export interface Activity<TFields = {}> {
  id: string;
  name: string;
  start: number;
  end: number;
}

export interface Resource<TFields = {}> {
  id: string;
  name: string;
  activities: Activity<TFields>[];
}

export interface Row<TFields = {}> {
  id: string;
  name: string;
}

export interface Constraint {
  id: string;
  from: string;
  to: string;
  type: number;
}

export interface Reservation {
  id: string;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

// ============================================================================
// DATA FETCHER CONFIGURATION
// ============================================================================

export interface DataFetchConfig {
  context?: unknown;
  url?: string;
  data?: unknown[] | string | ((model: unknown) => unknown);
  success?: (data: unknown, settings: unknown) => unknown | Promise<unknown>;
  ajaxConfig?: unknown;
  [key: string]: unknown;
}

export interface ModelConfig {
  dateFormat?: string;
  all?: DataFetchConfig;
  resources?: DataFetchConfig;
  activities?: DataFetchConfig;
  reservations?: DataFetchConfig;
  constraints?: DataFetchConfig;
  [key: string]: unknown;
}

// ============================================================================
// COMPONENT CONFIGURATION
// ============================================================================

export interface ComponentConfig {
  [key: string]: unknown;
}

export interface ButtonClickContext {
  gantt: unknown;
  event: Event;
}

export interface ButtonConfig extends ComponentConfig {
  id?: string;
  classes?: string;
  icon?: string;
  fontIcon?: string;
  svg?: string;
  text?: string;
  onclick?: (context: ButtonClickContext) => void;
}

export interface ComponentChangeContext {
  gantt: unknown;
  event: Event;
}

export interface InputConfig extends ComponentConfig {
  classes?: string;
  text?: string;
  icon?: string;
  fontIcon?: string;
  type?: string;
  onchange?: (value: string, context: ComponentChangeContext) => void;
}

export interface CheckBoxConfig extends ComponentConfig {
  id?: string;
  text?: string;
  classes?: string;
  checked?: boolean;
  onchange?: (checked: boolean, context: ComponentChangeContext) => void;
}

export interface DropDownListConfig extends ComponentConfig {
  classes?: string;
  text?: string;
  items?: unknown[];
  onchange?: (value: unknown, context: ComponentChangeContext) => void;
}

export interface ToggleConfig extends ComponentConfig {
  id?: string;
  classes?: string;
  text?: string;
  checked?: boolean;
  onchange?: (checked: boolean, context: ComponentChangeContext) => void;
}

// ============================================================================
// DRAG DROP CONFIGURATION
// ============================================================================

export interface DragDropConfig {
  keySpeed?: number;
  showMoveOnInvalid?: boolean;
  dragActivationThresoldWidth?: number;
  dragActivationThresoldHeight?: number;
  [key: string]: unknown;
}

export interface DragHandler {
  startDrag?(event: Event): boolean;
  endDrag?(event: Event): void;
  cancel?(event: Event): void;
  [key: string]: unknown;
}

export interface DragHandlerRegistry {
  [eventType: string]: DragHandler;
}

// ============================================================================
// RENDERER CONFIGURATION
// ============================================================================

export interface RendererConfig {
  [key: string]: unknown;
}

export type RenderObject = Record<string, unknown>;
export type RenderContext = Record<string, unknown>;

// ============================================================================
// PALETTE CONFIGURATION
// ============================================================================

export type PaletteConfig = string[][] | string[] | ((count: number) => string[] | null) | Record<string, string[]>;

export interface PaletteHandler {
  getColors(count: number): string[] | null;
}

export interface PaletteRegistry {
  [name: string]: PaletteHandler;
}

// ============================================================================
// SELECTION CONFIGURATION
// ============================================================================

export interface SelectionConfig {
  [key: string]: unknown;
}

export interface SelectionResult {
  selected: unknown[];
  deselected: unknown[];
}

// ============================================================================
// GANTT PANEL CONFIGURATION
// ============================================================================

export interface GanttPanelConfig {
  [key: string]: unknown;
}

export interface GanttConfig {
  [key: string]: unknown;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface GanttEvent {
  type: string;
  [key: string]: unknown;
}

export interface SelectionEvent extends GanttEvent {
  selected?: unknown[];
  deselected?: unknown[];
}

// ============================================================================
// COMPONENT/CLASS TYPES
// ============================================================================

// ============================================================================
// GANTT INSTANCE (PUBLIC API)
// ============================================================================

export interface GanttInstance<TFields = {}> {
  create(): void;
  destroy(): void;
  initialized(): Promise<Row<TFields>[]>;
  load(config?: GanttConfig): Promise<Row<TFields>[]>;
  setTimeWindow(wnd: TimeWindow): Promise<TimeWindow>;
  getTimeWindow(): TimeWindow | undefined;
  draw(forceTableRedraw?: boolean): void;
  on(event: string, handler: EventHandler): void;
  off(event: string, handler: EventHandler): void;
  setConfiguration(config: GanttConfig): void;
  [key: string]: unknown; // Legacy interface compatibility
}

// ============================================================================
// INTERFACE CONTRACTS
// ============================================================================

export interface DataFetcherInternal extends IDataFetcher {
  _reader?: ((data: unknown) => unknown) | null;
  _resourcesGetter?: ((data: unknown) => unknown) | null;
  _activitiesGetter?: ((data: unknown) => unknown) | null;
  _reservationsGetter?: ((data: unknown) => unknown) | null;
  _constraintsGetter?: ((data: unknown) => unknown) | null;
  _idGetter?: ((data: unknown) => string) | null;
  _nameGetter?: ((data: unknown) => string) | null;
  _parentIdGetter?: ((data: unknown) => string | null) | null;
  _startGetter?: ((data: unknown) => number) | null;
  _endGetter?: ((data: unknown) => number) | null;
  _resourceIdGetter?: ((data: unknown) => string) | null;
  _fromGetter?: ((data: unknown) => string) | null;
  _toGetter?: ((data: unknown) => string) | null;
  _typeGetter?: ((data: unknown) => number) | null;
  _activityGetter?: ((data: unknown) => unknown[]) | null;
  _resourceGetter?: ((data: unknown) => string) | null;
  destroy?(): void;
}

export interface IDataFetcher {
  get(data?: unknown): Promise<unknown>;
}

export interface IRenderer {
  draw(object: RenderObject, parentElt: HTMLElement | null, ctx: RenderContext): HTMLElement | null;
}

export interface IModel {
  setConfiguration(config: ModelConfig): void;
}

export interface IPanel {
  create(): void;
  destroy(): void;
  initialized(): Promise<Row[]>;
  load(config?: GanttConfig): Promise<Row[]>;
  setTimeWindow(wnd: TimeWindow): Promise<TimeWindow>;
  getTimeWindow(): TimeWindow | undefined;
  draw(forceTableRedraw?: boolean): void;
}

// ============================================================================
// CALLBACK & EVENT HANDLER TYPES
// ============================================================================

export type EventHandler = (event: GanttEvent) => void;
export type SelectionHandler = (result: SelectionResult) => void;
export interface ClickContext {
  gantt: GanttInstance;
  event: Event;
}
export type ClickHandler = (context: ClickContext) => void;
export interface ChangeContext<T = string> {
  gantt: GanttInstance;
  event: Event;
}
export type ChangeHandler<T = string> = (value: T, context: ChangeContext<T>) => void;

export interface EventHandlerRegistry {
  [eventType: string]: EventHandler[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type PropertyEvaluator = (obj: Activity | Resource | Row | object) => Activity | Resource | Row | string | number | boolean | null;

export interface StringMatcher {
  (text: string, pattern: string): boolean;
}

export interface LoggerFunctions {
  warn(...args: (string | number | boolean | object)[]): void;
  error(...args: (string | number | boolean | object)[]): void;
  log(...args: (string | number | boolean | object)[]): void;
}

export interface ObjectAccessor<T = Activity | Resource | Row> {
  [key: string]: T;
}

export interface TypedObjectAccessor<T = string> {
  [key: string]: T;
}

// ============================================================================
// INTERNAL STATE TYPES
// ============================================================================

export interface DateParserCache {
  format: string;
  parser: DateParser;
}

export interface FetcherRegistry {
  [key: string]: IDataFetcher | null;
}

export interface HandlerRegistry {
  [key: string]: DragHandler;
}

export interface ComponentRegistry {
  [key: string]: unknown;
}

// ============================================================================
// EXTERNAL API TYPES (VIS-TIMELINE)
// ============================================================================

export interface VisTimelineOptions {
  orientation?: { axis?: string; item?: string };
  height?: string | number;
  start?: number | string | Date;
  end?: number | string | Date;
  locale?: string;
  [key: string]: unknown;
}

export interface VisTimelineRange {
  body?: {
    emitter?: {
      off(event: string): void;
      on(event: string, callback: (data: unknown) => void): void;
    };
  };
}

export interface VisTimelineItem {
  id?: string | number;
  content?: string;
  start?: string | number | Date;
  end?: string | number | Date;
  [key: string]: unknown;
}

export interface VisTimeline {
  setOptions(options: VisTimelineOptions): void;
  setItems(items: VisTimelineItem[]): void;
  off(event: string, handler: (data: unknown) => void): void;
  on(event: string, handler: (data: unknown) => void): void;
  range?: VisTimelineRange;
}
