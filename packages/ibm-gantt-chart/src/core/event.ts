/**
 * Event system types and utilities for Gantt chart.
 * Defines the event dispatch contracts and handler signatures.
 */

import type { Row, Activity, Resource, Constraint, Reservation, TimeWindow } from '../types';

// ============================================================================
// BASE EVENT TYPES
// ============================================================================

/**
 * Base event dispatched through the Gantt event system.
 * All events extend this interface.
 */
export interface GanttEvent {
  type: string;
  source?: unknown;
  data?: unknown;
  timestamp?: number;
}

/**
 * Event handler function signature.
 * Receives a GanttEvent and does not return a value.
 */
export type EventHandler = (event: GanttEvent) => void;

/**
 * Event handler registry mapping event types to handlers.
 */
export interface EventHandlerRegistry {
  [eventType: string]: EventHandler[];
}

// ============================================================================
// SELECTION EVENTS
// ============================================================================

/**
 * Result of a selection operation.
 * Contains arrays of selected and deselected item objects.
 */
export interface SelectionResult {
  selected: Activity[] | Resource[] | Constraint[] | Reservation[];
  deselected: Activity[] | Resource[] | Constraint[] | Reservation[];
  timestamp?: number;
}

/**
 * Selection event with specific selected/deselected items.
 */
export interface SelectionEvent extends GanttEvent {
  selected?: unknown[];
  deselected?: unknown[];
  result?: SelectionResult;
}

/**
 * Handler for selection changes.
 */
export type SelectionHandler = (result: SelectionResult) => void;

/**
 * Selection handler registry mapping selection event types.
 */
export interface SelectionHandlerRegistry {
  [key: string]: SelectionHandler[];
}

// ============================================================================
// DATA CHANGE EVENTS
// ============================================================================

/**
 * Event fired when rows are added to the model.
 */
export interface RowsAddedEvent extends GanttEvent {
  type: 'rows_added';
  rows: Row[];
}

/**
 * Event fired when rows are removed.
 */
export interface RowsRemovedEvent extends GanttEvent {
  type: 'rows_removed';
  rowIds: string[];
}

/**
 * Event fired when rows are modified.
 */
export interface RowsModifiedEvent extends GanttEvent {
  type: 'rows_modified';
  rows: Row[];
}

/**
 * Event fired when rows are sorted.
 */
export interface RowsSortedEvent extends GanttEvent {
  type: 'rows_sorted';
  rows: Row[];
}

/**
 * Event fired when rows are filtered.
 */
export interface RowsFilteredEvent extends GanttEvent {
  type: 'rows_filtered';
  rows: Row[];
  hiddenCount: number;
}

// ============================================================================
// UI EVENTS
// ============================================================================

/**
 * Event fired when the time window changes.
 */
export interface TimeWindowChangedEvent extends GanttEvent {
  type: 'timeWindowChanged';
  timeWindow: TimeWindow;
}

/**
 * Event fired when title is changed.
 */
export interface TitleChangedEvent extends GanttEvent {
  type: 'titleChanged';
  title: string;
}

/**
 * Event fired when UI is resized.
 */
export interface ResizedEvent extends GanttEvent {
  type: 'resized';
  width: number;
  height: number;
}

/**
 * Event fired when split pane is resized.
 */
export interface SplitResizedEvent extends GanttEvent {
  type: 'split_resized';
  position: number;
}

// ============================================================================
// TABLE/TIMELINE EVENTS
// ============================================================================

/**
 * Event fired when table is initialized.
 */
export interface TableInitEvent extends GanttEvent {
  type: 'tableinit';
}

/**
 * Event fired when time table is initialized.
 */
export interface TimeTableInitEvent extends GanttEvent {
  type: 'timesheetinit';
}

/**
 * Event fired when timeline is initialized.
 */
export interface TimeLineInitEvent extends GanttEvent {
  type: 'timeline_init';
}

/**
 * Timeline range change event (mid-change).
 */
export interface TimeLineRangeChangeEvent extends GanttEvent {
  type: 'timeline_rangechange';
  range: TimeWindow;
}

/**
 * Timeline range changed event (final).
 */
export interface TimeLineRangeChangedEvent extends GanttEvent {
  type: 'timeline_rangechanged';
  range: TimeWindow;
}

/**
 * Timeline size changed event.
 */
export interface TimeLineSizeChangedEvent extends GanttEvent {
  type: 'timeline_sizeChanged';
  width: number;
  height: number;
}

/**
 * Timeline pan move event (during pan).
 */
export interface TimeLinePanMoveEvent extends GanttEvent {
  type: 'timeline_panmove';
  offset: number;
}

/**
 * Timeline scrolled event.
 */
export interface TimeLineScrolledEvent extends GanttEvent {
  type: 'timeline_scrolled';
  offset: number;
}

// ============================================================================
// UNION TYPES
// ============================================================================

/**
 * All possible Gantt event types.
 * Use as discriminated union for type-safe event handling.
 */
export type GanttEventUnion =
  | SelectionEvent
  | RowsAddedEvent
  | RowsRemovedEvent
  | RowsModifiedEvent
  | RowsSortedEvent
  | RowsFilteredEvent
  | TimeWindowChangedEvent
  | TitleChangedEvent
  | ResizedEvent
  | SplitResizedEvent
  | TableInitEvent
  | TimeTableInitEvent
  | TimeLineInitEvent
  | TimeLineRangeChangeEvent
  | TimeLineRangeChangedEvent
  | TimeLineSizeChangedEvent
  | TimeLinePanMoveEvent
  | TimeLineScrolledEvent
  | GanttEvent; // Fallback for unmapped events

/**
 * Type-safe event handler that checks event type.
 * Use with discriminated unions for maximum type safety.
 */
export type TypeSafeEventHandler<T extends GanttEvent = GanttEvent> = (event: T) => void | unknown;

// ============================================================================
// EVENT DISPATCHER INTERFACE
// ============================================================================

/**
 * Interface for objects that dispatch events.
 * Implemented by components like GanttPanel, Component, etc.
 */
export interface EventDispatcher {
  /**
   * Register an event handler.
   * @param event - Event name(s) to listen for
   * @param handler - Function to call when event fires
   */
  on(event: string | string[], handler: EventHandler): void;

  /**
   * Unregister an event handler.
   * @param event - Event name(s)
   * @param handler - Handler to remove
   */
  off(event: string | string[], handler: EventHandler): void;

  /**
   * Trigger event handlers for an event.
   * @param event - Event name or GanttEvent object
   * @param data - Optional additional data to pass to handlers
   */
  trigger(event: string | GanttEvent, data?: unknown): void;
}

// ============================================================================
// EVENT FACTORY UTILITIES
// ============================================================================

/**
 * Create a typed event with common fields.
 * @param type - Event type identifier
 * @param data - Event payload
 * @param source - Source object that triggered the event
 */
export function createEvent<T extends GanttEvent = GanttEvent>(
  type: string,
  data?: unknown,
  source?: unknown
): T {
  return {
    type,
    source,
    data,
    timestamp: Date.now(),
  } as T;
}

/**
 * Create a selection event result.
 */
export function createSelectionResult(
  selected: Activity[] | Resource[] | Constraint[] | Reservation[],
  deselected: Activity[] | Resource[] | Constraint[] | Reservation[]
): SelectionResult {
  return {
    selected,
    deselected,
    timestamp: Date.now(),
  };
}
