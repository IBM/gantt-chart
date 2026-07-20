import '../core/utils';
import '../error';
import '../core/filter';
import '../core/updates';
import '../toolbar';
import '../core/tooltip';
import './layoutsynch';

import Gantt from '../core/core';
import { getComponent } from '../core/component-factory';
import { LOAD_RESOURCE_CHART_CLOSED, LOAD_RESOURCE_CHART_OPENED, LoadResourceChartCtrl } from '../loadchart';

// Type definitions
interface GanttConfiguration {
  [key: string]: string | number | boolean | GanttConfiguration | GanttConfiguration[] | object | null | undefined;
}

interface GanttComponent {
  destroy?(): void;
  initialized?(): Promise<void>;
  node?: HTMLElement;
  onResize?(): void;
  [key: string]: unknown;
}

interface ScrollableGanttComponent extends GanttComponent {
  getScroller?(): HTMLElement;
  scroller?: HTMLElement;
}

interface GanttPluginRegistry {
  call(event: string, panel: GanttPanel): void;
}

interface TimeWindow {
  start: number;
  end: number;
}

const DOM_DELTA_LINE = 1;
const WHEEL_LINE_DELTA_FACTOR = 32;
const WHEEL_PIXEL_DELTA_FACTOR = 0.8;
const MILLIS_PER_SECOND = 1000;
const SECONDS_PER_HOUR = 3600;
const HOURS_PER_DAY = 24;
const MILLIS_PER_DAY = MILLIS_PER_SECOND * SECONDS_PER_HOUR * HOURS_PER_DAY;
const EMPTY_GANTT_TIME_WINDOW_DAYS = 2;
const INITIAL_FLEX_BODY_HEIGHT = '10px';
const DEFAULT_LOAD_CHART_HEIGHT = 150;
const MIN_TABLE_PANEL_WIDTH = '100px';

function normalizeArray<T>(config: T | T[]): T[] {
  return Array.isArray(config) && config.length && Array.isArray(config[0]) ? (config as T[]) : [config as T];
}

/**
 * Gantt panel is structured as follows:
 *
 * <pre>
 *   .gantt-panel
 *   ------------------------------------------------------------------------------------------------------------
 *   | Split pane                                                                                               |
 *   | -------------------------------------------------------------------------------------------------------- |
 *   | | .table-panel      | .time-panel                                                                      | |
 *   | | ----------------- | -------------------------------------------------------------------------------  | |
 *   | | | Table         | | | .time-line-scroller                            .vertical-scroller-filler     | | |
 *   | | | ------------- | | | --------------------------------------------   ----------------------------  | | |
 *   | | | | Header    | | | | | Time Line                                |   |                          |  | | |
 *   | | | ------------- | | | --------------------------------------------   ----------------------------  | | |
 *   | | |               | | |                                                                              | | |
 *   | | |               | | | .time-table-scroller                                                         | | |
 *   | | | ------------- | | | ---------------------------------------------------------------------------  | | |
 *   | | | | Body    ^ | | | | | Time Table                                                            ^^ | | | |
 *   | | | |         : | | | | |< .............. timeTableWidthTester ...................................>| | | |
 *   | | | |         : | | | | |                                                                       :: | | | |
 *   | | | |         : | | | | |                                                 timeTableHeightTester :: | | | |
 *   | | | |         : | | | | |                                                                       :: | | | |
 *   | | | |         : | | | | |                                                                       v: | | | |
 *   | | ------------:-- | | ---------------------------------------------------------------------------:-- | | |
 *   | --------------:----------------------------------------------------------------------------------:------ |
 *   ----------------:----------------------------------------------------------------------------------:--------
 *                   :                                                                                  :
 *                   : Matches height of .time-table-body                              .time-table-body :
 *                   v                                                                                  v
 * </pre>
 */
class GanttPanel extends Gantt.components.GanttPanel {
  private resizeHandler: (() => void) | undefined;
  private initPromise: Promise<GanttComponent[]>;
  private destroyed: boolean = false;
  private initializing: boolean = false;
  private _ready: boolean = false;
  config: GanttConfiguration = {};
  private rowHeight: number = 0;
  private zoomFactor: number = 0;
  private tooltip: GanttComponent | null = null;
  private title: string | null = null;
  private rowFilter: GanttComponent | null = null;
  private activityFilter: GanttComponent | null = null;
  private selectionHandler: GanttComponent | null = null;
  private type: string | null = null;
  private errorHandler: GanttComponent | null = null;
  private updates: GanttComponent | null = null;
  private model: GanttComponent | null = null;
  private splitPane: GanttComponent | null = null;
  private loadChartSplit: GanttComponent | null = null;
  private loadChartCtrl: LoadResourceChartCtrl | null = null;
  private contentElt: HTMLElement | null = null;
  private body: HTMLElement | null = null;
  private toolbars: GanttComponent[] | null = null;
  private toolbarElt: HTMLElement | null = null;
  private headerElt: HTMLElement | null = null;
  private legendConfig: GanttConfiguration | undefined;
  private tablePanel: HTMLElement | null = null;
  private table: GanttComponent | null = null;
  private timePanel: HTMLElement | null = null;
  private timeLineScroller: HTMLElement | null = null;
  private timeTablePanel: HTMLElement | null = null;
  private timeTable: GanttComponent | null = null;
  private updateTimeLineRightMargin: (() => void) | undefined;
  private updateTableHeaderHeight: ((force?: boolean) => void) | undefined;
  private headersHeight: number = 0;
  private timeLineInit: Promise<TimeWindow> | null = null;
  private loadCharts: GanttComponent[] | null = null;
  private loadResPanel: HTMLElement | null | undefined = null;
  private timeLine: GanttComponent | null = null;
  private loadingPanel: HTMLElement | null | undefined = null;
  private loading: boolean = false;
  private timeWindow: TimeWindow | undefined;
  private _resourceGantt: boolean = false;
  private searchFilter: GanttConfiguration | null = null;
  private hideEmptyRowsFilter: GanttConfiguration | null = null;
  private loadOnDemand: boolean = false;
  private loadChartHidden: boolean = false;

  constructor(node: HTMLElement, config: GanttConfiguration) {
    super(node, config);
    this.resizeHandler = () => this.onResize();
    this.initPromise = (async () => {
      await Gantt.envReady();
      return this.setConfiguration(config);
    })();
  }

  async setConfiguration(config: GanttConfiguration): Promise<GanttComponent[]> {
    if (this.splitPane) {
      this.destroy();
    }
    this.destroyed = false;

    this.initializing = true;
    this._ready = false;
    window.addEventListener('resize', this.resizeHandler);

    this.config = { ...Gantt.defaultConfiguration, ...config };

    // Keep frequently used configuration values on the panel instance.
    this.rowHeight = this.config.rowHeight;
    this.zoomFactor = this.config.zoomFactor;

    if (this.tooltip && this.tooltip.destroy) {
      this.tooltip.destroy();
    }
    const TooltipClass = getComponent('Tooltip', Gantt.components.Tooltip);
    this.tooltip = new TooltipClass(this.config.tooltip);

    if (this.config.title) {
      if (Gantt.utils.isFunction(this.config.title)) {
        this.title = this.config.title(this);
      } else {
        this.title = this.config.title;
      }
    } else this.title = null;

    const stringMatcher = Gantt.utils.stringMatches;
    const FilterClass = getComponent('Filter', Gantt.components.Filter);
    this.rowFilter = Object.assign(new FilterClass(this.config && (this.config.rows as GanttConfiguration) && (this.config.rows as GanttConfiguration).filter), {
      stringMatches(string: string, pattern: string) {
        return stringMatcher(string, pattern);
      },
      getObjectFilterMethodName() {
        return 'acceptRow';
      },
      acceptString(row: GanttComponent, columnData: (string | number | boolean)[], rowIndex: number, text: string) {
        if (!text) {
          return true;
        }
        for (let col = 0; col < columnData.length; col++) {
          if (stringMatcher(String(columnData[col]), text)) {
            return true;
          }
        }
        return false;
      },
    });
    this.activityFilter = Object.assign(new FilterClass(this.config && (this.config.tasks as GanttConfiguration) && (this.config.tasks as GanttConfiguration).filter), {
      stringMatches(string: string, pattern: string) {
        return stringMatcher(string, pattern);
      },
      getObjectFilterMethodName() {
        return 'acceptTask';
      },
      acceptString(activity: GanttComponent, row: GanttComponent, text: string) {
        const actName = (activity as Record<string, string>).name;
        return !text || (actName && stringMatcher(actName, text));
      },
    });
    if (this.config.table && this.config.table.hideEmptyRows) {
      this.setHideEmptyRows(true, true);
    }

    if (this.config.palette) {
      this.setPaletteConfiguration(this.config.palette);
    } else {
      this.palettes = {};
      this.defaultPalette = null;
    }

    const SelectionClass = getComponent('SelectionHandler', Gantt.components.SelectionHandler);
    this.selectionHandler = new SelectionClass(this.config && (this.config.selection as GanttConfiguration), {
      setObjectSelected(obj: GanttComponent & { selected?: boolean }, selected: boolean) {
        if (selected) {
          obj.selected = true;
        } else {
          obj.selected = undefined;
        }
      },
    });
    const actType = this.selectionHandler.registerType({
      name: 'activity',
      accept(o: GanttComponent & { getObjectType(): string }) {
        return o.getObjectType() === Gantt.ObjectTypes.Activity;
      },
      clearSelectionMethod: 'clearActivitySelection',
      selectionChangedMethod: 'activitySelectionChanged',
      unselectionMethod: 'unselectActivities',
      selectionMethod: 'selectActivities',
    });
    const resType = this.selectionHandler.registerType({
      name: 'resource',
      accept(o: GanttComponent & { getObjectType(): string }) {
        return o.getObjectType() === Gantt.ObjectTypes.Resource;
      },
      clearSelectionMethod: 'clearResourceSelection',
      selectionChangedMethod: 'resourceSelectionChanged',
      unselectionMethod: 'unselectResources',
      selectionMethod: 'selectResources',
    });
    this.selectionHandler.registerType({
      name: 'constraint',
      accept(o: GanttComponent & { getObjectType(): string }) {
        return o.getObjectType() === Gantt.ObjectTypes.Constraint;
      },
      clearSelectionMethod: 'clearConstraintSelection',
      selectionChangedMethod: 'constraintSelectionChanged',
      unselectionMethod: 'unselectConstraints',
      selectionMethod: 'selectConstraints',
    });
    this.selectionHandler.registerType({
      name: 'reservation',
      accept(o: GanttComponent & { getObjectType(): string }) {
        return o.getObjectType() === Gantt.ObjectTypes.Reservation;
      },
      clearSelectionMethod: 'clearReservationSelection',
      selectionChangedMethod: 'reservationSelectionChanged',
      unselectionMethod: 'unselectReservations',
      selectionMethod: 'selectReservations',
    });
    const rowType = this.selectionHandler.registerType({
      name: 'row',
      clearSelectionMethod: 'clearRowSelection',
      selectionChangedMethod: 'rowSelectionChanged',
      unselectionMethod: 'unselectRows',
      selectionMethod: 'selectRows',
    });

    this.type = (config && (config.type as string)) || Gantt.type.SCHEDULE_CHART;
    const rc = this.isResourceGantt();
    // Selection of objects that are rows for the Gantt chart (activities or resources) must generate row specific events
    const typeForRow = rc ? resType : actType;
    const defaultNotify = (this.selectionHandler as Record<string, (...args: unknown[]) => void>).notify;
    const handler = this.selectionHandler;
    (this.selectionHandler as Record<string, (...args: unknown[]) => void>).notify = function notify(...args: unknown[]): void {
      defaultNotify.call(handler, ...args);
      if (args[0] === typeForRow) {
        args[0] = rowType;
        defaultNotify.call(handler, ...args);
      }
    };

    const ErrorClass = getComponent('ErrorHandler', Gantt.components.ErrorHandler);
    this.errorHandler = new ErrorClass(this.config && (this.config.error as GanttConfiguration));
    (this.errorHandler as GanttComponent).node = this.node;

    this.updates = new (getComponent('GanttUpdates', Gantt.components.GanttUpdates))(this);
    const oldApplyUpdates = (this.updates as Record<string, () => void>).applyUpdates;
    (this.updates as Record<string, (...args: unknown[]) => void>).applyUpdates = () => {
      const containsRowChanges = (this.updates as Record<string, () => boolean>).containsRowChanges?.();
      oldApplyUpdates.call(this.updates);
      if (containsRowChanges) {
        // Time sheet scroller height depends on the height of the time sheet displays rows.
        // Call updateScrollerHeight without modifying the time sheet rows first has no effect
        this.updateScrollerHeight();
      }
      if ((this.updates as Record<string, () => boolean>).hasTableScrollYChanged?.()) {
        const table = this.table && (this.table as Record<string, () => HTMLElement>).getScrollableTable?.();
        if (table) {
          const scrollTop = table.scrollTop;
          (this.timeTable as Record<string, (top: number) => void>).setScrollTop?.(scrollTop);
        }
      }
    };

    this.model = null;
    // Create the Gantt
    try {
      this.create();
      await Promise.all(
        [this.splitPane, this.loadChartSplit]
          .filter((split: GanttComponent) => split && (split as Record<string, () => Promise<void>>).initialized)
          .map((split: GanttComponent) => (split as Record<string, () => Promise<void>>).initialized?.())
      );
    } catch (err) {
      // Error already display in the Gantt
      return Promise.reject(err);
    }

    try {
      // Constructs the model, not loading it yet
      // Load data if specified in the configuration
      this.model = this.createModel(this.config.data || this.createDefaultModelConfig());
      this.initializing = false;
      this.triggerEvent(Gantt.events.RESIZED);
      if (this.model) {
        const rows = await this.load();
        this.updateScrollerHeight();
        return rows;
      }
      this.updateScrollerHeight();
      return [];
    } catch (err) {
      this.errorHandler.addError(err, 'Error initializing the Gantt');
      return Promise.reject(err);
    }
  }

  createDefaultModelConfig(config?: GanttConfiguration): GanttConfiguration {
    return {
      resources: { data: [] },
      activities: { data: [] },
      reservations: { data: [] },
    };
  }

  createModel(config: GanttConfiguration): GanttComponent {
    const ModelClass = getComponent('GanttModel', Gantt.components.GanttModel);
    const model = new ModelClass(this, config);
    (model as Record<string, (event: string, handler: (event: string, wnd: TimeWindow) => void) => void>).on?.(Gantt.events.TIME_WINDOW_CHANGED, (event: string, wnd: TimeWindow) => {
      this.timeLineInit = this.setTimeWindow(wnd);
    });
    return model;
  }

  create(): void {
    const normalizeLoadConfig = (): GanttConfiguration | null => {
      const raw = this.config.loadResourceChart;
      if (Array.isArray(raw)) {
        return raw.length ? raw[0] : null;
      }
      return raw || null;
    };

    const getLoadConfig = (p: string): string | number | boolean | GanttConfiguration | null | undefined => {
      const c = normalizeLoadConfig();
      return c?.[p];
    };
    if (this.loadChartCtrl) {
      this.loadChartCtrl.destroy();
      this.loadChartCtrl = undefined;
    }
    const loadChartHidden = !this.config.loadResourceChart || !getLoadConfig('visible');
    this.loadChartCtrl = new LoadResourceChartCtrl(this, !loadChartHidden, this.config);

    this.contentElt = document.createElement('div');
    this.contentElt.className = 'gantt-panel docloud-gantt';
    if (this.config.loadResourceChart) {
      this.contentElt.className +=
        ' gantt-load-resource-chart ' + (loadChartHidden ? LOAD_RESOURCE_CHART_CLOSED : LOAD_RESOURCE_CHART_OPENED);
    }
    this.contentElt.style.position = 'relative';
    this.contentElt.style.display = 'flex';
    this.contentElt.style.flexDirection = 'column';
    this.contentElt.style.height = '100%';

    this.toolbars = null;
    if (this.config.toolbar) {
      this.createToolbars(this.config.toolbar);
    } else {
      this.toolbarElt = null;
    }

    if (this.config.classes) {
      Gantt.utils.addClass(this.contentElt, this.config.classes);
    }
    if (this.config.header) {
      this.headerElt = this.createHeader(this.config.header);
      if (this.headerElt !== null) {
        this.contentElt.appendChild(this.headerElt);
      }
    } else {
      this.headerElt = null;
    }

    this.node.appendChild(this.contentElt);

    const bodyElt = (this.body = document.createElement('div'));
    bodyElt.className = 'gantt-body';
    bodyElt.style.position = 'relative'; // Position must be set for the child split pane to get its offsetTop relative to it and have the tooltips positioning work...
    bodyElt.style.flexGrow = '1';
    bodyElt.style.flexShrink = '1';
    // Give the flex child a non-zero initial height so split-pane measurements are stable before data renders.
    bodyElt.style.height = INITIAL_FLEX_BODY_HEIGHT;
    this.errorHandler.node = bodyElt;
    this.contentElt.appendChild(bodyElt); // Need to be added here for the split pane to be created in a element in the DOM

    let bodyCtnr: HTMLElement;
    const SplitClass = getComponent('Split', Gantt.components.Split);
    if (this.config.loadResourceChart) {
      this.legendConfig = {
        selector: () => this.loadChartCtrl.isVisible(),
        background: this.loadChartCtrl.getRowBackground.bind(this.loadChartCtrl),
      };
      let h = DEFAULT_LOAD_CHART_HEIGHT;
      const hConfig = getLoadConfig('height');
      if (hConfig) {
        if (Gantt.utils.isFunction(hConfig)) {
          h = hConfig();
        } else if (Gantt.utils.isString(hConfig)) {
          h = Number.parseInt(hConfig, 10);
        } else {
          h = hConfig;
        }
      }
      try {
        this.loadChartSplit = new SplitClass(bodyElt, {
          ...(this.config && this.config.divider),
          pos: -h,
          horizontal: false,
          fixedFirst: false,
          hideSecond: !this.loadChartCtrl.isVisible(),
        });
        (this.loadChartSplit as Record<string, (e: Event) => Promise<void>>).onDividerDragEnd = async (e: Event) => {
          if (this.initPromise) {
            await this.initPromise;
            this.triggerEvent(Gantt.events.SPLIT_RESIZED);
            this.onResize();
          }
        };
      } catch (err) {
        this.errorHandler.addError(err, 'Load split pane initialization error', this.node);
        throw new Error('Load split pane initialization error');
      }
      bodyCtnr = this.loadChartSplit.getLeftComponent();
    } else {
      bodyCtnr = bodyElt;
      this.legendConfig = undefined;
    }
    try {
      this.splitPane = new SplitClass(bodyCtnr, this.config && this.config.divider);
      (this.splitPane as Record<string, (e: Event) => void>).onresized = (e: Event) => {
        this.triggerEvent(Gantt.events.SPLIT_RESIZED);
      };
    } catch (err) {
      this.errorHandler.addError(err, 'Split pane initialization error', this.node);
      throw new Error('Split pane initialization error');
    }

    // Initialize the load resource chart if any
    // Initialization prior to table and timetable so that selection listeners are set before selection
    // listeners of those two components.
    this.loadCharts = null;
    this.loadResPanel = null;
    if (this.config.loadResourceChart) {
      this.loadResPanel = this.createLoadResourceChart(this.config.loadResourceChart);
      if (this.loadResPanel) {
        // Both width and height to 100% for IE
        this.loadResPanel.style.width = '100%';
        this.loadResPanel.style.height = '100%';
        this.loadChartSplit.getRightComponent().appendChild(this.loadResPanel);
        this.loadChartSplit.rightComponentCreated();
      }
    }

    // Initialize table panel
    this.tablePanel = null;
    const leftComp = this.splitPane.getLeftComponent();
    leftComp.style.overflow = 'hidden';
    try {
      this.tablePanel = this.createTreeTable(leftComp);
      // A non-zero width component has been created in the left component part of the split pane, we can now
      // fix the split position
      this.splitPane.leftComponentCreated();
    } catch (err) {
      this.errorHandler.addError(err, 'Tree table initialization error', this.tablePanel || this.node);
      const error = new Error(`Table creation error: ${err instanceof Error ? err.message : String(err)}`);
      Object.defineProperty(error, 'cause', { value: err, writable: true, enumerable: true });
      throw error;
    }

    // Initialize the time panel
    const rightPanel = this.splitPane.getRightComponent();
    rightPanel.style.overflow = 'hidden';
    try {
      this.createTimePanel(rightPanel);
    } catch (err) {
      this.errorHandler.addError(err, 'Error creating the time panel', rightPanel);
      throw new Error('Time panel creation error');
    }
    try {
      if (this.timeLineScroller) {
        this.createTimeLine(this.timeLineScroller);
      }
    } catch (err) {
      this.errorHandler.addError(err, 'Error create the time line', this.timeLineScroller);
      throw new Error('Time line creation error');
    }

    if (this.toolbars) {
      const toolbars = this.toolbars as GanttComponent[];
      for (let i = 0; i < toolbars.length; i++) {
        const toolbar = toolbars[i];
        if (toolbar && toolbar.connect && toolbar.node) {
          toolbar.connect(this, toolbar.node);
        }
      }
    }
  }

  async load(config?: GanttConfiguration): Promise<GanttComponent[]> {
    if (config) {
      if (this.model && (this.model as Record<string, () => void>).destroy) {
        (this.model as Record<string, () => void>).destroy();
      }
      this.model = this.createModel(config);
    }
    this.timeLineInit = null;

    // Loading panel
    this.loadingPanel = null;
    const loadTimeout = setTimeout(() => {
      this.loadingPanel = this.createLoadingPanel(this.config);
      if (this.body) {
        this.body.appendChild(this.loadingPanel);
      }
    }, (this.config.loadingPanelThreshold as number) || 0);
    const stopLoading = () => {
      if (!this.loadingPanel) {
        clearTimeout(loadTimeout);
      } else {
        if (this.body) {
          this.body.removeChild(this.loadingPanel);
        }
        this.loadingPanel = null;
      }
      this.loading = false;
    };

    try {
      const rows = await this.model.load();
      const wnd = this.getTimeWindow();
      if (!wnd || !wnd.start) {
        if (!rows.length) {
          // Empty Gantt, this is ok
          const today = new Date().getTime();
          this.timeLineInit = this.setTimeWindow({
            start: today - MILLIS_PER_DAY * EMPTY_GANTT_TIME_WINDOW_DAYS,
            end: today + MILLIS_PER_DAY * EMPTY_GANTT_TIME_WINDOW_DAYS,
          });
        } else {
          stopLoading();
          throw Gantt.utils.getString('gantt.error.no-time-window-defined');
        }
      }
      this.loading = true;
      this.startUpdating();
      this._resourceGantt = this.isResourceGantt();
      Gantt.utils.toggleClass(this.contentElt, 'schedule_chart', this._resourceGantt);
      Gantt.utils.toggleClass(this.contentElt, 'activity_chart', !this._resourceGantt);
      Gantt.utils.toggleClass(this.contentElt, 'constraints_chart', this.hasConstraints());
      await Promise.all([
        // Promise.all can be given non-promises as the parameter.
        // See example in https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
        this.table.setRows(rows) || rows,
        this.timeLineInit || rows,
      ]);
      stopLoading();
      // After table is initialized and time line ready with accurate time window
      // we can update the time table.

      this.triggerEvent(Gantt.events.DATA_LOADED, rows);
      this.timeTable.setConstraints(this.model?.constraints || []);
      this.stopUpdating();
      if (this.toolbars) {
        this.toolbars.forEach((bar: GanttComponent) => {
          (bar as Record<string, (panel: GanttPanel, rows: GanttComponent[]) => void>).ganttLoaded?.(this, rows);
        });
      }
      this.updateScrollerHeight();
      await this.timeTable.draw();
      this.markReady(rows);
      return rows;
    } catch (err) {
      stopLoading();
      this.errorHandler.addError(err, 'Loading error', this.tablePanel);
      throw err;
    }
  }

  isResourceGantt(): boolean {
    return !this.type || this.type !== Gantt.type.ACTIVITY_CHART;
  }

  hasConstraints(): boolean {
    return this.model && this.model.constraints && this.model.constraints.length;
  }

  isFlat(): boolean {
    return !this.model || this.model.isFlat();
  }

  getTimeWindow(): { start: number; end: number } | undefined {
    return this.timeWindow;
  }

  async setTimeWindow({ start, end }: TimeWindow): Promise<TimeWindow> {
    if (end === 0) {
      throw new Error(`Invalid time window + ${JSON.stringify({ start, end })}, may not have been processed correctly`);
    }
    if (this.timeWindow && this.timeWindow.start === start && this.timeWindow.end === end) {
      return this.timeWindow;
    }
    this.timeWindow = { start, end };
    const { start: s, end: e } = await this.timeLine.setTimeWindow(start, end);
    this.updateTableHeaderHeight?.();
    this.updateWidthFromTimeLine();
    this.scrollTimeTableToX(this.timeLine.getXFromMillis(this.timeLine.getHorizon().start));
    this.updateTimeLineHeight();
    this.triggerEvent(Gantt.events.TIME_WINDOW_CHANGED, s, e);
    return this.timeWindow;
  }

  getBody(): HTMLElement | null {
    return this.body;
  }

  initialized(): Promise<GanttComponent[]> {
    return this.initPromise;
  }

  markReady(rows: GanttComponent[], resolve?: (rows: GanttComponent[]) => void): void {
    if (this._ready) {
      if (resolve) {
        resolve(rows);
      }
      return;
    }
    // The time table has finished drawing,
    // so the DOM is in its final state. Declare the Gantt ready.
    this._ready = true;
    this.triggerEvent(Gantt.events.READY, rows);
    if (resolve) {
      resolve(rows);
    }
  }

  on(event: string, handler: (...args: unknown[]) => void): void {
    if (event === Gantt.events.READY && this._ready) {
      handler.call(this);
    } else {
      super.on(event, handler);
    }
  }

  createTreeTable(ctnr: HTMLElement): HTMLElement {
    // Initialize table panel
    const tablePanel = document.createElement('div');
    tablePanel.className = 'table-panel';
    tablePanel.style.position = 'relative';
    tablePanel.style.height = '100%';
    tablePanel.style.width = '100%';
    tablePanel.style.overflow = 'hidden';
    // If not setting the min width, the table width would be zero while data being loaded and
    // the split pane would not able to set its split position.
    tablePanel.style.minWidth = MIN_TABLE_PANEL_WIDTH;
    const TreeTableClass = getComponent('TreeTable', Gantt.components.TreeTable);
    let tableConfig = this.config.table as GanttConfiguration | undefined;
    if (this.legendConfig || this.config.rows) {
      const rowsConfig = {
        ...(this.legendConfig && { rows: { renderer: this.legendConfig } }),
        rows: this.config.rows,
      };
      tableConfig = Object.assign(rowsConfig, tableConfig);
    }
    this.table = new TreeTableClass(this, tablePanel, tableConfig);
    (this.table as Record<string, (filter: GanttComponent) => void>).setRowFilter?.(this.rowFilter);
    (this.updates as Record<string, GanttComponent>).table = (this.table as Record<string, (updates: GanttComponent) => GanttComponent>).createUpdates?.(this.updates) || null;
    ctnr.appendChild(tablePanel);
    Gantt.utils.addWheelListener(tablePanel, ((evt: WheelEvent) => {
      const factor = evt.deltaMode === DOM_DELTA_LINE ? WHEEL_LINE_DELTA_FACTOR : WHEEL_PIXEL_DELTA_FACTOR;
      const delta = factor * evt.deltaY;
      (this.timeTable as Record<string, (y: number) => void>).scrollToY?.((this.timeTable as Record<string, () => number>).getScrollTop?.() + delta);
      evt.preventDefault();
    }) as EventListener);
    return tablePanel;
  }

  createTimePanel(ctnr: HTMLElement): void {
    this.timePanel = document.createElement('div');
    this.timePanel.className = 'time-panel';
    // CSS layout
    this.timePanel.style.position = 'relative';
    this.timePanel.style.height = '100%';

    // Create the time right panel
    const vScrollerFiller = document.createElement('div');
    vScrollerFiller.className = 'vertical-scroller-filler';
    // CSS layout
    vScrollerFiller.style.position = 'absolute';
    vScrollerFiller.style.right = '0';
    vScrollerFiller.style.top = '0';
    this.timePanel.appendChild(vScrollerFiller);
    this.updateTimeLineRightMargin = () => {
      if (this.timeLineScroller) {
        const rightMargin = this.timeTable.getRightMargin();
        this.timeLineScroller.style.paddingRight = rightMargin ? `${rightMargin}px` : '0';
        vScrollerFiller.style.width = this.timeLineScroller.style.paddingRight;
        vScrollerFiller.style.display = rightMargin ? 'block' : 'none';
      }
    };

    this.updateTableHeaderHeight = (force?: boolean) => {
      if (!this.initializing && this.timeLine) {
        // Timeline is created after first resize events are fired
        const h = this.timeLine.getTimeAxisHeight();
        if (force || this.headersHeight !== h) {
          this.headersHeight = h;
          if (this.table) {
            this.table.setHeaderHeight(h);
          }
          if (h && this.timeTablePanel) {
            this.timeTablePanel.style.top = vScrollerFiller.style.height = `${h}px`;
          }
        }
      }
    };

    this.timeLineScroller = document.createElement('div');
    this.timeLineScroller.className = 'time-line-scroller';
    this.timeLineScroller.style.overflow = 'hidden';
    this.timeLineScroller.style.width = '100%';
    this.timeLineScroller.style.height = '100%';

    this.timePanel.appendChild(this.timeLineScroller);

    this.timeTablePanel = document.createElement('div');
    this.timeTablePanel.className = 'time-table';
    // CSS layout
    this.timeTablePanel.style.position = 'absolute';
    this.timeTablePanel.style.left = '0';
    this.timeTablePanel.style.right = '0';
    this.timeTablePanel.style.bottom = '0';

    this.timePanel.appendChild(this.timeTablePanel);

    const TimeTableClass = getComponent('TimeTable', Gantt.components.TimeTable);
    let timeTableConfig = (this.config && (this.config.timeTable as GanttConfiguration)) || undefined;
    if (this.legendConfig || this.config.rows) {
      const rowsConfig = {
        ...(this.legendConfig && { rows: { renderer: this.legendConfig } }),
        ...(this.config.rows && { rows: this.config.rows }),
      };
      timeTableConfig = Object.assign(rowsConfig, timeTableConfig);
    }
    this.timeTable = new TimeTableClass(this, this.timeTablePanel, timeTableConfig);
    (this.updates as Record<string, GanttComponent>).timeTable = (this.timeTable as Record<string, (updates: GanttComponent) => GanttComponent>).createUpdates?.(this.updates) || null;
    const scroller = (this.timeTable as Record<string, () => HTMLElement>).getScroller?.();
    if (scroller) {
      this.attachTimeTableMouseWheel(scroller);
      scroller.addEventListener('scroll', (e: Event) => {
        const target = e.target as HTMLElement & { scrollLeft: number };
        if (this.timeLineScroller) {
          this.timeLineScroller.scrollLeft = target.scrollLeft;
        }
        this.triggerEvent(Gantt.events.TIME_LINE_SCROLLED, target.scrollLeft);
      });
    }
    ctnr.appendChild(this.timePanel);
  }

  drawTimeTable(clear?: boolean): void {
    if (clear && this.table && this.table.deleteDrawCache) {
      this.table.deleteDrawCache();
    }
    if (this.timeTable) {
      this.timeTable.draw(clear);
    }
  }

  createLoadingPanel(config: GanttConfiguration): HTMLElement {
    const lp = document.createElement('div');
    lp.className = 'loading-panel';
    lp.style.position = 'absolute';
    lp.style.left = '0';
    lp.style.right = '0';
    lp.style.top = '0';
    lp.style.bottom = '0';
    lp.style.display = 'flex';
    lp.style.alignItems = 'center';
    lp.style.justifyContent = 'center';

    const loaderCtnr = document.createElement('div');
    loaderCtnr.style.position = 'absolute';
    loaderCtnr.style.left = '50%';
    loaderCtnr.style.top = '50%';
    loaderCtnr.style.transform = 'translate(-50%, -50%)';

    const loader = document.createElement('div');
    loader.className = 'loader';
    loaderCtnr.appendChild(loader);
    lp.appendChild(loaderCtnr);

    const label = document.createElement('div');
    label.className = 'label';
    label.appendChild(document.createTextNode(Gantt.utils.getString('gantt.loading')));
    lp.appendChild(label);
    return lp;
  }

  createLoadResourceChart(config: GanttConfiguration | GanttConfiguration[]): HTMLElement | undefined {
    let loadChartNode: HTMLElement;
    let chartPanel: HTMLElement | undefined;
    normalizeArray(config).forEach((loadConfig: GanttConfiguration) => {
      // Construct the bar node
      if (!chartPanel) {
        chartPanel = document.createElement('div');
        chartPanel.className = 'load-resource-chart-panel';
        chartPanel.style.flexShrink = '0';
        chartPanel.style.position = 'relative';
        chartPanel.style.display = 'flex';
        chartPanel.style.flexDirection = 'column';
      }
      loadChartNode = document.createElement('div');
      loadChartNode.className = 'load-resource-chart';
      chartPanel!.appendChild(loadChartNode);
      if (!this.loadCharts) {
        this.loadCharts = [];
      }
      const loadChart = new (getComponent('LoadResourceChart', Gantt.components.LoadResourceChart))(
        this,
        loadChartNode,
        { ...loadConfig, height: '' }
      );
      (this.loadChartCtrl as Record<string, (chart: GanttComponent) => void>).addLoadResourceChart?.(loadChart);
      ((loadChart as GanttComponent).node as HTMLElement).style.flex = '1 1';
      this.loadCharts.push(loadChart);
      const loadChartWithScroller: ScrollableGanttComponent = loadChart;
      const scroller = loadChartWithScroller.getScroller?.() || loadChartWithScroller.scroller;
      if (scroller) {
        Gantt.utils.addWheelListener(scroller, ((evt: WheelEvent) => {
          evt.preventDefault();
        }) as EventListener);
      }
    });

    return chartPanel;
  }

  toggleLoadChartVisible(): void {
    this.setLoadChartVisible(!this.isLoadChartVisible());
  }

  setLoadChartVisible(visible: boolean): void {
    this.loadChartHidden = !visible;
    this.loadChartSplit.setRightComponentVisible(visible);
    Gantt.utils.toggleClass(this.contentElt, LOAD_RESOURCE_CHART_OPENED, visible);
    Gantt.utils.toggleClass(this.contentElt, LOAD_RESOURCE_CHART_CLOSED, !visible);
    this.loadChartCtrl.setVisible(visible);
    this.onResize();
  }

  isLoadChartVisible(): boolean {
    return this.loadChartCtrl.isVisible();
  }

  getPanelNode(): HTMLElement | null {
    return this.contentElt;
  }

  updateTimeLineHeight(): void {
    const bottomMargin = this.timeTable.getBottomMargin();
    if (this.timeLineScroller) {
      this.timeLineScroller.style.paddingBottom = bottomMargin ? `${bottomMargin}px` : '0';
    }
  }

  attachTimeTableMouseWheel(scroller: HTMLElement): void {
    Gantt.utils.addWheelListener(scroller, ((evt: WheelEvent) => {
      if (evt.ctrlKey && evt.deltaY !== 0) {
        if (evt.deltaY < 0) {
          this.zoomIn(evt);
        } else {
          this.zoomOut(evt);
        }
        evt.preventDefault();
      }
    }) as EventListener);
  }

  createTimeLine(timeLineCtnr: HTMLElement): GanttComponent {
    const TimeLineClass = getComponent('TimeLine', Gantt.components.TimeLine);
    this.timeLine = new TimeLineClass(this, timeLineCtnr, this.config);
    (this.timeLine as Record<string, (events: string | string[], handler: (...args: unknown[]) => void) => void>).on?.(
      [Gantt.events.TIME_LINE_RANGE_CHANGE, Gantt.events.TIME_LINE_RANGE_CHANGED, Gantt.events.TIME_LINE_PAN_MOVED],
      () => {
        this.updateTableHeaderHeight?.();
        this.updateWidthFromTimeLine();
        this.drawTimeTable(true);
      }
    );
    (this.timeLine as Record<string, (event: string, handler: (e: unknown, w: number, h: number) => void) => void>).on?.(Gantt.events.TIME_LINE_SIZE_CHANGED, (e: unknown, w: number, h: number) => {
      this.updateWidthFromTimeLine();
      this.drawTimeTable(true);
      this.triggerEvent(Gantt.events.TIME_LINE_SIZE_CHANGED, w, h);
    });
    (this.timeLine as Record<string, (event: string, handler: (e: unknown) => void) => void>).on?.(Gantt.events.TIME_LINE_INIT, (e: unknown) => {
      this.triggerEvent(Gantt.events.TIME_LINE_INIT);
    });
    return this.timeLine;
  }

  createToolbars(config: GanttConfiguration | GanttConfiguration[]): HTMLElement | null {
    this.toolbars = [];
    const ToolbarClass = getComponent('Toolbar', Gantt.components.Toolbar);
    let toolbarNode: HTMLElement;
    this.toolbarElt = null;
    normalizeArray(config).forEach((barConfig: GanttConfiguration) => {
      if ((barConfig as Record<string, string | HTMLElement | ((panel: GanttPanel) => HTMLElement)>).node) {
        const node = (barConfig as Record<string, string | HTMLElement | ((panel: GanttPanel) => HTMLElement)>).node;
        if (Gantt.utils.isString(node)) {
          toolbarNode = document.getElementById(node as string)!;
        } else if (Gantt.utils.isDomElement(node)) {
          toolbarNode = node as HTMLElement;
        } else if (Gantt.utils.isFunction(node)) {
          toolbarNode = (node as (panel: GanttPanel) => HTMLElement)(this);
        } else {
          throw new Error(
            'The toolbar.node must be a string(Dom element ID) or a Dom element or a function returning a Dom element'
          );
        }
        barConfig = (barConfig as Record<string, GanttConfiguration>).components as GanttConfiguration;
      } else {
        // Construct the bar node
        if (!this.toolbarElt) {
          this.toolbarElt = document.createElement('div');
          this.toolbarElt.className = 'gantt-toolbars';
          this.toolbarElt.style.flexShrink = '0';
        }
        toolbarNode = document.createElement('div');
        toolbarNode.className = 'gantt-toolbar';
        this.toolbarElt!.appendChild(toolbarNode);
      }
      this.toolbars!.push(new ToolbarClass(this, toolbarNode, barConfig));
    });

    if (this.toolbarElt) {
      this.contentElt!.appendChild(this.toolbarElt);
    }
    // Wait for all toolbar components to be created before triggering onInitialized as components can refer to each others
    this.toolbars!.forEach((t: GanttComponent) => {
      (t as Record<string, () => void>).onInitialized?.();
    });
    return this.toolbarElt;
  }

  createHeader(config: string | ((panel: GanttPanel) => HTMLElement | null)): HTMLElement {
    const header = document.createElement('div');
    header.className = 'gantt-header';
    if (Gantt.utils.isString(config)) {
      header.appendChild(document.createTextNode(config as string));
    } else if (Gantt.utils.isFunction(config)) {
      const node = (config as (panel: GanttPanel) => HTMLElement | null)(this);
      if (node) {
        header.appendChild(node);
      }
    }
    return header;
  }

  getRowCount(): number {
    return this.table.getRowCount();
  }

  getRow(param: string | number): GanttComponent | null {
    return (this.table as Record<string, (param: string | number) => GanttComponent>).getRow?.(param) || null;
  }

  getRows(selector?: string | ((row: GanttComponent) => boolean)): GanttComponent[] {
    return (this.table as Record<string, (selector?: string | ((row: GanttComponent) => boolean)) => GanttComponent[]>).getRows?.(selector) || [];
  }

  getVisibleRows(): GanttComponent[] {
    return (this.table as Record<string, () => GanttComponent[]>).getVisibleRows?.() || [];
  }

  getVisibleHeight(): number {
    return this.timeTable.getVisibleHeight();
  }

  ensureRowVisible(param: string | number): void {
    const row = this.getRow(param);
    if (!row) {
      throw new Error(`Cannot find row for ${param}`);
    }
    if ((this.table as Record<string, (row: GanttComponent | null) => boolean>).isRowFiltered?.(row)) {
      throw new Error(`Cannot show the filtered row: ${param}`);
    }
    (this.table as Record<string, (row: GanttComponent | null) => void>).expandParents?.(row);
    (this.timeTable as Record<string, (row: GanttComponent | null) => void>).scrollToRow?.(row);
  }

  isRowVisible(param: string | number): boolean {
    return (this.table as Record<string, (param: string | number) => boolean>).isRowVisible?.(param) || false;
  }

  getFirstVisibleRow(): GanttComponent | null {
    return (this.table as Record<string, () => GanttComponent | null>).getFirstVisibleRow?.() || null;
  }

  setFirstVisibleRow(param: string | number): void {
    (this.timeTable as Record<string, (row: GanttComponent | null) => void>).setFirstVisibleRow?.(this.getRow(param));
  }

  isRowFiltered(param: string | number): boolean {
    return (this.table as Record<string, (param: string | number) => boolean>).isRowFiltered?.(param) || false;
  }

  toggleCollapseRow(param: string | number, collapse?: boolean): void {
    (this.table as Record<string, (row: GanttComponent | null, collapse?: boolean) => void>).toggleCollapseRow?.(this.getRow(param), collapse);
  }

  scrollToY(y: number): void {
    this.timeTable.scrollToY(y);
  }

  getRowHeight(row: string | number | GanttComponent): number | undefined {
    const r = typeof row === 'string' || typeof row === 'number' ? this.getRow(row) : row;
    return r && ((r as Record<string, { height: number }>).activityRow?.height || (this.table as Record<string, (row: GanttComponent | null) => number>).getRowHeight?.(r));
  }

  draw(forceTableRedraw?: boolean): void {
    if (this.timeLine) {
      (this.timeLine as Record<string, (force: boolean) => void>).draw?.(true);
      if ((this.table as Record<string, () => void>).deleteDrawCache) {
        (this.table as Record<string, () => void>).deleteDrawCache?.();
      }
      (this.table as Record<string, (force?: boolean) => void>).draw?.(forceTableRedraw);
      (this.timeTable as Record<string, () => void>).draw?.();
      this.updateScrollerHeight();
    }
  }

  drawRows(selector?: string | ((row: GanttComponent) => boolean)): void {
    const rows = this.getRows(selector);
    (this.table as Record<string, (rows: GanttComponent[]) => void>).drawRows?.(rows);
    (this.timeTable as Record<string, (rows: GanttComponent[]) => void>).drawRows?.(rows);
  }

  updateScrollerHeight(): void {
    this.timeTable.setBodyHeight(
      this.loadOnDemand ? this.table.getRowCount() * this.rowHeight : this.table.getHeight()
    );
    this.updateTimeLineRightMargin?.();
  }

  getRowActivities(row: string | number | GanttComponent): GanttComponent[] {
    const r = typeof row === 'string' || typeof row === 'number' ? this.getRow(row) : row;
    return (r && (r as Record<string, GanttComponent[]>).activities) || [];
  }

  getActivity(param: string | number, row?: string | number | GanttComponent): GanttComponent | null {
    if (row) {
      const acts = this.getRowActivities(row);
      if (Gantt.utils.isString(param)) {
        for (let i = 0, count = acts.length; i < count; ++i) {
          if ((acts[i] as Record<string, string>).id === param) {
            return acts[i];
          }
        }
        return null;
      }
      if (Number.isInteger(param)) {
        return acts[param] || null;
      }
      for (let i = 0, count = acts.length; i < count; ++i) {
        if ((acts[i] as Record<string, () => unknown>).getData?.() === param) {
          return acts[i];
        }
      }
      return null;
    }
    return (this.model as Record<string, (param: string | number) => GanttComponent>).getActivity?.(param) || null;
  }

  getActivityNode(param: string | number, res?: string | number | GanttComponent): HTMLElement | null {
    const activity = this.getActivity(param, res);
    return (activity && (activity as Record<string, HTMLElement>).node) || null;
  }

  getToolbarComponent(id: string): GanttComponent | null {
    for (let i = 0; i < this.toolbars!.length; i++) {
      const components = (this.toolbars![i] as Record<string, GanttComponent[]>).components || [];
      for (let j = 0; j < components.length; j++) {
        const c = components[j];
        if (c && id === (c as Record<string, string>).id) {
          return c;
        }
      }
    }
    return null;
  }

  onResize(): void {
    if (this.timeLine && this.timeLine.onResize) {
      this.timeLine.onResize();
    }
    if (this.updateTimeLineRightMargin) {
      this.updateTimeLineRightMargin();
    }
    if (this.table && this.table.onResize) {
      this.table.onResize();
    }
    if (this.updateTableHeaderHeight && this.timeLine) {
      this.updateTableHeaderHeight(true);
    }
    if (this.table) {
      this.triggerEvent(Gantt.events.RESIZED);
    }
    if (this.timeTable && this.timeTable.onResize) {
      this.timeTable.onResize();
    }
    if (this.timeTable) {
      this.updateScrollerHeight();
    }
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    const settleCancellation = (error: Error) => {
      if (error.name !== 'AbortError') {
        this.errorHandler?.addError(error, 'Gantt destruction interrupted initialization', this.node);
      }
    };
    this.timeLineInit?.catch(settleCancellation);
    this.initPromise?.catch(settleCancellation);
    const ganttWithPlugins: typeof Gantt & { plugins?: GanttPluginRegistry } = Gantt;
    ganttWithPlugins.plugins?.call('destroy', this);
    if (this.errorHandler && this.errorHandler.destroy) {
      this.errorHandler.destroy();
    }

    if (this.splitPane && this.splitPane.destroy) {
      this.splitPane.destroy();
    }

    if (this.loadChartSplit && this.loadChartSplit.destroy) {
      this.loadChartSplit.destroy();
    }

    if (this.table && this.table.destroy) {
      this.table.destroy();
    }

    if (this.timeTable && this.timeTable.destroy) {
      this.timeTable.destroy();
    }

    if (this.timeLine && this.timeLine.destroy) {
      this.timeLine.destroy();
    }

    if (this.tooltip && this.tooltip.destroy) {
      this.tooltip.destroy();
    }

    if (this.loadChartCtrl && this.loadChartCtrl.destroy) {
      this.loadChartCtrl.destroy();
    }

    if (this.model && this.model.destroy) {
      this.model.destroy();
    }

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = undefined;
    }

    if (this.updates) {
      this.updates.destroy();
    }

    if (this.toolbars) {
      this.toolbars.forEach((bar: GanttComponent) => {
        (bar as Record<string, () => void>).destroy?.();
      });

      this.toolbars = null;
    }

    while (this.node.firstChild) {
      this.node.removeChild(this.node.firstChild);
    }

    this.contentElt = null;
    this.errorHandler = null;
    this.model = null;
    this.table = null;
    this.timeTable = null;
    this.timeLine = null;
    this.tooltip = null;
    this.splitPane = null;
    this.loadChartSplit = null;
    this.loadChartCtrl = null;
    this.updates = null;
    this.body = null;
    this.disconnect();
  }

  disconnect(): void {}

  highlightRow(row: string | number | GanttComponent, highlight?: boolean, deselectAll?: boolean): void {
    let r: GanttComponent | null = null;
    if (typeof row === 'string' || typeof row === 'number') {
      r = this.getRow(row);
    } else {
      r = row;
    }
    highlight = highlight === undefined || highlight;
    (this.table as Record<string, (row: GanttComponent | null, highlight: boolean, deselectAll?: boolean) => void>).highlightRow?.(r, highlight, deselectAll);
    (this.timeTable as Record<string, (row: GanttComponent | null, highlight: boolean, deselectAll?: boolean) => void>).highlightRow?.(r, highlight, deselectAll);
  }

  get selection(): GanttComponent {
    return this.selectionHandler || ({} as GanttComponent);
  }

  set selection(sel: GanttComponent) {
    const currentSel = this.selectionHandler && (this.selectionHandler as Record<string, () => GanttComponent[]>).get?.();
    if (this.selectionHandler) {
      (this.selectionHandler as Record<string, () => void>).destroy?.();
    }
    this.selectionHandler = sel;
    if (this.selectionHandler) {
      if (currentSel && currentSel.length) {
        (this.selectionHandler as Record<string, (sel: GanttComponent) => void>).select?.(sel);
      }
    }
  }

  synchLayout(config: GanttConfiguration): GanttComponent {
    const ls = new (getComponent('LayoutSynchronizer', Gantt.components.LayoutSynchronizer))(config);
    (ls as Record<string, (panel: GanttPanel) => void>).connect?.(this);
    return ls;
  }

  resetZoom(): void {
    this.timeLine.resetZoom();
    this.scrollTimeTableToX(this.timeLine.getXFromMillis(this.timeLine.getHorizon().start));
  }

  zoomIn(evt?: WheelEvent): void {
    this.zoom(this.zoomFactor, evt);
  }

  zoomOut(evt?: WheelEvent): void {
    this.zoom(-this.zoomFactor, evt);
  }

  zoom(zoomFactor: number, evt?: WheelEvent): void {
    const validatedZoom = (this.timeLine as Record<string, (factor: number) => number>).validateZoomFactor?.(zoomFactor) || 0;
    if (validatedZoom !== 0) {
      const visibleW = (this.timeTable as Record<string, () => number>).getVisibleWidth?.() || 0;
      // When zooming, we want to keep the same time coordinate under the mouse, if mousewheel event is provided as a parameter.
      let xRef =
        (evt && this.getTimeTableCoordinates(evt.target as HTMLElement, { x: evt.offsetX, y: evt.offsetY }).x) ||
        ((this.timeTable as Record<string, () => number>).getScrollLeft?.() || 0) + visibleW / 2;
      const timeRef = (this.timeLine as Record<string, (x: number) => number>).getTimeAt?.(xRef) || 0;
      xRef -= (this.timeTable as Record<string, () => number>).getScrollLeft?.() || 0;

      (this.timeLine as Record<string, (factor: number) => void>).zoom?.(validatedZoom);

      const newScrollLeft = ((this.timeLine as Record<string, (ms: number) => number>).getXFromMillis?.(timeRef) || 0) - xRef;
      this.scrollTimeTableToX(newScrollLeft);
    }
  }

  fitToContent(): void {
    const timeRange = (this.timeTable as Record<string, () => TimeWindow | null>).getDisplayedActivitiesTimeRange?.() || null;
    (this.timeLine as Record<string, (range: TimeWindow | null) => void>).setVisibleTimeWindow?.(timeRange);
    this.scrollTimeTableToX(
      ((this.timeLine as Record<string, (ms: number) => number>).getXFromMillis?.((timeRange && timeRange.start) || (this.timeLine as Record<string, () => TimeWindow>).getHorizon?.().start) || 0)
    );
  }

  updateScrollFromTimeLine(): void {}

  updateWidthFromTimeLine(): void {
    this.timeTable.setBodyWidth(this.timeLine.getWidth());
  }

  addFilter(filter: string | ((obj: GanttComponent) => boolean), rows?: boolean, activities?: boolean): GanttConfiguration | null {
    const result: GanttConfiguration = { activities: activities && (this.activityFilter as Record<string, (filter: string | ((obj: GanttComponent) => boolean)) => GanttConfiguration>).addFilter?.(filter) };
    const actFilter = result.activities as GanttConfiguration | undefined;
    if (rows) {
      result.row = actFilter
        ? (this.rowFilter as Record<string, (filter: string | ((obj: GanttComponent) => boolean), handler: (row: GanttComponent, columnData: (string | number | boolean)[], rowIndex: number) => boolean) => GanttConfiguration>).addOrFilters?.(filter, (row: GanttComponent, columnData: (string | number | boolean)[], rowIndex: number) => {
            const count = (row as Record<string, GanttComponent[]>).activities?.length || 0;
            const params: unknown[] = [null, row];
            for (let i = 0; i < count; i++) {
              params[0] = ((row as Record<string, GanttComponent[]>).activities?.[i]);
              if (typeof actFilter === 'function' && actFilter(...params)) {
                return true;
              }
            }
            return false;
          })
        : (this.rowFilter as Record<string, (filter: string | ((obj: GanttComponent) => boolean)) => GanttConfiguration>).addFilter?.(filter);
    }
    if (result.row || result.activities) {
      this.filterChanged();
      return result;
    }
    return null;
  }

  removeFilter(key: GanttConfiguration | null, preventNotify?: boolean): boolean {
    let success = false;
    if (key) {
      if ((key as Record<string, GanttConfiguration>).row) {
        success = (this.rowFilter as Record<string, (key: GanttConfiguration) => boolean>).removeFilter?.((key as Record<string, GanttConfiguration>).row) || false;
      }
      if ((key as Record<string, GanttConfiguration>).activities) {
        success = (this.activityFilter as Record<string, (key: GanttConfiguration) => boolean>).removeFilter?.((key as Record<string, GanttConfiguration>).activities) || false;
      }
      if (this.searchFilter === key) {
        this.searchFilter = null;
      }
    }
    if (success && !preventNotify) {
      this.filterChanged();
    }
    return success;
  }

  search(text: string, rows?: boolean, activities?: boolean): void {
    if (this.searchFilter) {
      if ((this.searchFilter as Record<string, GanttConfiguration>).row) {
        (this.rowFilter as Record<string, (key: GanttConfiguration) => void>).removeFilter?.((this.searchFilter as Record<string, GanttConfiguration>).row);
      }
      if ((this.searchFilter as Record<string, GanttConfiguration>).activities) {
        (this.activityFilter as Record<string, (key: GanttConfiguration) => void>).removeFilter?.((this.searchFilter as Record<string, GanttConfiguration>).activities);
      }
    }
    if (text && (rows || activities)) {
      this.searchFilter = this.addFilter(text, rows, activities);
    } else {
      this.searchFilter = null;
      this.filterChanged();
    }
  }

  setHideEmptyRows(hide: boolean, preventNotify?: boolean): boolean {
    if ((hide && !this.hideEmptyRowsFilter) || (!hide && this.hideEmptyRowsFilter)) {
      if (this.hideEmptyRowsFilter) {
        (this.rowFilter as Record<string, (key: GanttConfiguration) => void>).removeFilter?.(this.hideEmptyRowsFilter);
        this.hideEmptyRowsFilter = null;
      } else {
        this.hideEmptyRowsFilter = (this.rowFilter as Record<string, (filter: (row: GanttComponent, columnData: (string | number | boolean)[], rowIndex: number) => boolean | number) => GanttConfiguration>).addFilter?.((row: GanttComponent, columnData: (string | number | boolean)[], rowIndex: number) => {
          let activityFilter = this.activityFilter;
          activityFilter = activityFilter && !(activityFilter as Record<string, () => boolean>).isEmpty?.() ? activityFilter : null;
          const count = (row as Record<string, GanttComponent[]>).activities?.length || 0;
          if (!count || !activityFilter) {
            return count;
          }
          for (let i = 0; i < count; i++) {
            if ((activityFilter as Record<string, (obj: GanttComponent, row: GanttComponent) => boolean>).accept?.(((row as Record<string, GanttComponent[]>).activities?.[i]), row)) {
              return true;
            }
          }
          return false;
        }) || null;
      }
      if (!preventNotify) {
        this.filterChanged();
      }
      return true;
    }
    return false;
  }

  filterChanged(): void {
    if (this.table && this.timeTable) {
      (this.table as Record<string, () => void>).filterChanged?.();
      const table = this.table && (this.table as Record<string, () => HTMLElement>).getScrollableTable?.();
      this.updateScrollerHeight();
      const scrollTop = (table as HTMLElement & { scrollTop: number })?.scrollTop || 0;
      (this.timeTable as Record<string, (top: number) => void>).setScrollTop?.(scrollTop);
      this.drawTimeTable(true);
      this.triggerEvent(Gantt.events.ROWS_FILTERED);
    }
  }

  getTitle(): string | null {
    return this.title;
  }

  setTitle(title: string): void {
    this.title = title;
    this.triggerEvent(Gantt.events.TITLE_CHANGED, title);
  }

  setRowColor(row: string | number | GanttComponent, color: string): void {
    row.color = color;
    if (this.table.setRowColor) {
      this.table.setRowColor(row, color);
    }
    if (this.timeTable.setRowColor) {
      this.timeTable.setRowColor(row, color);
    }
  }

  centerTimeSheetOnX(x: number): void {
    this.scrollTimeTableToX(x - this.timeTable.getVisibleWidth() / 2);
  }

  scrollTimeTableToX(x: number): void {
    x = Math.min(Math.max(Math.round(x), 0), this.timeTable.getBodyWidth() - this.timeTable.getVisibleWidth());
    this.timeTable.setScrollLeft(x);
    if (this.loadChartCtrl) {
      this.loadChartCtrl.timeTableXScrolled(x);
    }
    this.triggerEvent(Gantt.events.TIME_LINE_SCROLLED, x);
  }

  getTimeTableCoordinates(target: HTMLElement, position?: { x?: number; y?: number }): { x: number; y: number } {
    const result = Gantt.utils.walkToAncestor(
      [this.timeTable.getScroller(), this.timeLineScroller],
      target,
      (parent: Node, node: Node, pos: { x: number; y: number }) => {
        if (parent === this.timeLineScroller) {
          pos.x += this.timeTable.getScrollLeft();
        } else if (parent === this.timeTable.getScroller()) {
          return pos;
        }
        return {
          x: pos.x + (node as HTMLElement).offsetLeft - (parent as HTMLElement).scrollLeft,
          y: pos.y + (node as HTMLElement).offsetTop - (parent as HTMLElement).scrollTop,
        };
      },
      { x: (position && position.x) || 0, y: (position && position.y) || 0 }
    );
    return result || { x: 0, y: 0 };
  }

  addTimeMarker(id: string, time: number, classes?: string): void {
    this.timeLine.addTimeMarker(id, time, classes);
  }

  removeTimeMarker(id: string): void {
    this.timeLine.removeTimeMarker(id);
  }

  setTimeLineItem(id: string, item: GanttConfiguration): void {
    (this.timeLine as Record<string, (id: string, item: GanttConfiguration) => void>).setTimeLineItem?.(id, item);
  }

  addTimeLineItem(id: string, item: GanttConfiguration): void {
    (this.timeLine as Record<string, (id: string, item: GanttConfiguration) => void>).addTimeLineItem?.(id, item);
  }

  removeTimeLineItem(id: string): void {
    this.timeLine.removeTimeLineItem(id);
  }

  hasErrors(): boolean {
    return this.errorHandler?.hasErrors() || false;
  }

  setPaletteConfiguration(config: GanttConfiguration | GanttConfiguration[] | string | ((config: GanttConfiguration) => GanttConfiguration)): void {
    const PaletteClass = getComponent('Palette', Gantt.components.Palette);
    if (Array.isArray(config) || Gantt.utils.isFunction(config)) {
      this.palettes = null;
      this.defaultPalette = new PaletteClass(config);
    } else if (Gantt.utils.isString(config)) {
      this.palettes = null;
      this.defaultPalette = (Gantt.defaultPalettes as Record<string, GanttComponent>)[config as string];
      if (!this.defaultPalette) {
        Gantt.log.error(`Palette [${config}] does not exist`);
      }
    } else {
      const paletteNames = Object.keys(config);
      this.palettes = {};
      this.defaultPalette = null;
      for (let i = 0, count = paletteNames.length; i < count; ++i) {
        (this.palettes as Record<string, GanttComponent>)[paletteNames[i]] = new PaletteClass(
          (config as Record<string, GanttConfiguration>)[paletteNames[i]]
        );
      }
    }
  }

  getPalette(name?: string): GanttComponent | null {
    if (!name) {
      return this.defaultPalette || ((Gantt.defaultPaletteName && (Gantt.defaultPalettes as Record<string, GanttComponent>)[Gantt.defaultPaletteName]) || null);
    }
    return ((this.palettes as Record<string, GanttComponent> | null)?.[name]) || ((Gantt.defaultPalettes as Record<string, GanttComponent>)[name]) || null;
  }

  private palettes: Record<string, GanttComponent> | null = null;
  private defaultPalette: GanttComponent | null = null;

  startUpdating(): void {
    this.updates.startUpdating();
  }

  stopUpdating(): void {
    if (this.updates.stopUpdating()) {
      // nothing to do
    }
  }

  rowsChanged(event: string, rows: GanttComponent[]): void {
    (this.updates as Record<string, () => void>).startUpdating?.();
    this.triggerEvent(event, rows);
    (this.updates as Record<string, (event: string, rows: GanttComponent[]) => void>).rowsChanged?.(event, rows);
    (this.updates as Record<string, () => void>).stopUpdating?.();
  }
}

Gantt.components.GanttPanel.impl = GanttPanel;

export default GanttPanel;

