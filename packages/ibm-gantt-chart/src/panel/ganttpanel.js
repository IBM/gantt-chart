import Gantt from '../core/core';

import {
  GANTT_LOAD_RESOURCE_CHART,
  LOAD_RESOURCE_CHART_CLOSED,
  LOAD_RESOURCE_CHART_OPENED,
  LoadResourceChart,
  LoadResourceChartCtrl,
} from '../loadchart';

import '../core/utils';
import '../error';
import '../core/filter';
import '../core/updates';
import '../toolbar';
import '../core/tooltip';
import './layoutsynch';
import './ganttpanel.scss';

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
  constructor(node, config) {
    super(node, config);
    this.resizeHandler = () => this.onResize();
    this.initPromise = Gantt.envReady().then(() => this.setConfiguration(config));
  }

  setConfiguration(config) {
    if (this.splitPane) {
      this.destroy();
    }

    this.initializing = true;
    window.addEventListener('resize', this.resizeHandler);

    this.config = Gantt.utils.mergeObjects({}, Gantt.defaultConfiguration, config);

    // TODO
    this.rowHeight = this.config.rowHeight;
    this.zoomFactor = this.config.zoomFactor;

    if (this.tooltip && this.tooltip.destroy) {
      this.tooltip.destroy();
    }
    const TooltipClass = Gantt.components.Tooltip.impl || Gantt.components.Tooltip;
    this.tooltip = new TooltipClass(this.config.tooltip);

    if (this.config.title) {
      if (Gantt.utils.isFunction(this.config.title)) {
        this.title = this.config.title(this);
      } else {
        this.title = this.config.title;
      }
    } else this.title = null;

    const stringMatcher = Gantt.utils.stringMatches;
    const FilterClass = Gantt.components.Filter.impl || Gantt.components.Filter;
    this.rowFilter = Gantt.utils.mergeObjects(
      new FilterClass(this.config && this.config.rows && this.config.rows.filter),
      {
        stringMatches(string, pattern) {
          return stringMatcher(string, pattern);
        },
        getObjectFilterMethodName() {
          return 'acceptRow';
        },
        acceptString(row, columnData, rowIndex, text) {
          if (!text) {
            return true;
          }
          for (let col = 0; col < columnData.length; col++) {
            if (stringMatcher(columnData[col], text)) {
              return true;
            }
          }
          return false;
        },
      }
    );
    this.activityFilter = Gantt.utils.mergeObjects(
      new FilterClass(this.config && this.config.tasks && this.config.tasks.filter),
      {
        stringMatches(string, pattern) {
          return stringMatcher(string, pattern);
        },
        getObjectFilterMethodName() {
          return 'acceptTask';
        },
        acceptString(activity, row, text) {
          const actName = activity.name;
          return !text || (actName && stringMatcher(actName, text));
        },
      }
    );
    if (this.config.table && this.config.table.hideEmptyRows) {
      this.setHideEmptyRows(true, true);
    }

    if (this.config.palette) {
      this.setPaletteConfiguration(this.config.palette);
    } else {
      this.palettes = {};
      this.defaultPalette = null;
    }

    const SelectionClass = Gantt.components.SelectionHandler.impl || Gantt.components.SelectionHandler;
    this.selectionHandler = new SelectionClass(this.config && this.config.selection, {
      setObjectSelected(obj, selected) {
        if (selected) {
          obj.selected = true;
        } else {
          delete obj.selected;
        }
      },
    });
    const actType = this.selectionHandler.registerType({
      name: 'activity',
      accept(o) {
        return o.getObjectType() === Gantt.ObjectTypes.Activity;
      },
      clearSelectionMethod: 'clearActivitySelection',
      selectionChangedMethod: 'activitySelectionChanged',
      unselectionMethod: 'unselectActivities',
      selectionMethod: 'selectActivities',
    });
    const resType = this.selectionHandler.registerType({
      name: 'resource',
      accept(o) {
        return o.getObjectType() === Gantt.ObjectTypes.Resource;
      },
      clearSelectionMethod: 'clearResourceSelection',
      selectionChangedMethod: 'resourceSelectionChanged',
      unselectionMethod: 'unselectResources',
      selectionMethod: 'selectResources',
    });
    this.selectionHandler.registerType({
      name: 'constraint',
      accept(o) {
        return o.getObjectType() === Gantt.ObjectTypes.Constraint;
      },
      clearSelectionMethod: 'clearConstraintSelection',
      selectionChangedMethod: 'constraintSelectionChanged',
      unselectionMethod: 'unselectConstraints',
      selectionMethod: 'selectConstraints',
    });
    this.selectionHandler.registerType({
      name: 'reservation',
      accept(o) {
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

    this.type = (config && config.type) || Gantt.type.SCHEDULE_CHART;
    const rc = this.isResourceGantt();
    // Selection of objects that are rows for the Gantt chart (activities or resources) must generate row specific events
    const typeForRow = rc ? resType : actType;
    const defaultNotify = this.selectionHandler.notify;
    const handler = this.selectionHandler;
    this.selectionHandler.notify = function(type, event) {
      const args = new Array(arguments.length);
      for (let i = 0; i < arguments.length; i++) {
        args[i] = arguments[i];
      }
      defaultNotify.apply(handler, args);
      if (type === typeForRow) {
        args[0] = rowType;
        defaultNotify.apply(handler, args);
      }
    };

    const ErrorClass = Gantt.components.ErrorHandler.impl || Gantt.components.ErrorHandler;
    this.errorHandler = new ErrorClass(this.node, this.config && this.config.error);

    this.updates = new (Gantt.components.GanttUpdates.impl || Gantt.components.GanttUpdates)();
    const oldApplyUpdates = this.updates.applyUpdates;
    this.updates.applyUpdates = () => {
      const containsRowChanges = this.updates.containsRowChanges;
      oldApplyUpdates.call(this.updates);
      if (containsRowChanges) {
        // Time sheet scroller height depends on the height of the time sheet displays rows.
        // Call updateScrollerHeight without modifying the time sheet rows first has no effect
        this.updateScrollerHeight();
      }
      if (this.updates.hasTableScrollYChanged()) {
        const table = this.table && this.table.getScrollableTable();
        const scrollTop = table.scrollTop;
        this.timeTable.setScrollTop(scrollTop);
      }
    };

    this.model = null;
    // Create the Gantt
    try {
      this.create();
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
      return (this.model && this.load()) || Promise.resolve([]).then(() => this.updateScrollerHeight());
    } catch (err) {
      this.errorHandler.addError(err, 'Error initializing the Gantt');
      return Promise.reject(err);
    }
  }

  createDefaultModelConfig(config) {
    return {
      resources: { data: [] },
      activities: { data: [] },
      reservations: { data: [] },
    };
  }

  createModel(config) {
    const ModelClass = Gantt.components.GanttModel.impl || Gantt.components.GanttModel;
    const model = new ModelClass(this, config);
    model.on(Gantt.events.TIME_WINDOW_CHANGED, (event, wnd) => this.setTimeWindow(wnd));
    return model;
  }

  create() {
    const getLoadConfig = p => {
      const c = this.config.loadResourceChart;
      return Gantt.utils.isArray(c) ? (c.length ? c[0][p] : undefined) : c[p];
    };
    if (this.loadChartCtrl) {
      this.loadChartCtrl.destroy();
      delete this.loadChartCtrl;
    }
    const loadChartHidden = !this.config.loadResourceChart || !getLoadConfig('visible');
    this.loadChartCtrl = new LoadResourceChartCtrl(this, !loadChartHidden);

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
    bodyElt.style.flexGrow = 1;
    bodyElt.style.flexShrink = 1;
    // Impressive hack: the flex layout does not manage well resizing of components of height initially to zero!
    bodyElt.style.height = '10px';
    this.errorHandler.node = bodyElt;
    this.contentElt.appendChild(bodyElt); // Need to be added here for the split pane to be created in a element in the DOM

    let bodyCtnr;
    const SplitClass = Gantt.components.Split.impl || Gantt.components.Split;
    if (this.config.loadResourceChart) {
      this.legendConfig = {
        selector: () => this.loadChartCtrl.isVisible(),
        background: this.loadChartCtrl.getRowBackground.bind(this.loadChartCtrl),
      };
      let h = 150;
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
        this.loadChartSplit = new SplitClass(
          bodyElt,
          Gantt.utils.mergeObjects({}, this.config && this.config.divider, {
            pos: -h,
            horizontal: false,
            fixedFirst: false,
            hideSecond: !this.loadChartCtrl.isVisible(),
          })
        );
        this.loadChartSplit.onDividerDragEnd = e => {
          if (this.initPromise) {
            this.initPromise.then(() => {
              this.triggerEvent(Gantt.events.SPLIT_RESIZED);
              this.onResize();
            });
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
      this.splitPane.onresized = e => {
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
      throw new Error('Table creation error');
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
      this.createTimeLine(this.timeLineScroller);
    } catch (err) {
      this.errorHandler.addError(err, 'Error create the time line', this.timeLineScroller);
      throw new Error('Time line creation error');
    }

    if (this.toolbars) {
      for (let i = 0; i < this.toolbars.length; i++) {
        this.toolbars[i].connect(this, this.toolbars[i].node);
      }
    }
  }

  load(config) {
    if (config) {
      if (this.model && this.model.destroy) {
        this.model.destroy();
      }
      this.model = this.createModel(config);
    }
    this.timeLineInit = null;

    // Loading panel
    this.loadingPanel = null;
    const loadTimeout = setTimeout(() => {
      this.loadingPanel = this.createLoadingPanel(this.config);
      this.body.appendChild(this.loadingPanel);
    }, this.config.loadingPanelThresold);
    const stopLoading = () => {
      if (!this.loadingPanel) {
        clearTimeout(loadTimeout);
      } else {
        this.body.removeChild(this.loadingPanel);
      }
      this.loading = false;
    };

    return this.model
      .load()
      .then(rows => {
        const wnd = this.getTimeWindow();
        if (!wnd || !wnd.start) {
          if (!rows.length) {
            // Empty Gantt, this is ok
            const today = new Date().getTime();
            const day = 1000 * 3600 * 24;
            this.setTimeWindow({ start: today - day * 2, end: today + day * 2 });
          } else {
            stopLoading();
            return Promise.reject(Gantt.utils.getString('gantt.error.no-time-window-defined'));
          }
        }
        this.loading = true;
        this.startUpdating();
        this._resourceGantt = this.isResourceGantt();
        Gantt.utils.toggleClass(this.contentElt, 'schedule_chart', this._resourceGantt);
        Gantt.utils.toggleClass(this.contentElt, 'activity_chart', !this._resourceGantt);
        Gantt.utils.toggleClass(this.contentElt, 'constraints_chart', this.hasConstraints);
        return Promise.all([
          // Promise.all can be given non-promises as the parameter.
          // See example in https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
          this.table.setRows(rows) || rows,
          this.timeLineInit || rows,
        ]).then(() => {
          stopLoading();
          // After table is initialized and time line ready with accurate time window
          // We can update the time table

          this.triggerEvent(Gantt.events.DATA_LOADED, rows);
          this.timeTable.setConstraints(this.model.constraints);
          this.updates.timeTable.reload();
          this.stopUpdating();
          if (this.toobars) {
            this.toolbars.forEach(bar => {
              bar.ganttLoaded(this, rows);
            });
          }
          return rows;
        });
      })
      .catch(err => {
        stopLoading();
        this.errorHandler.addError(err, 'Loading error', this.tablePanel);
        return Promise.reject(err);
      });
  }

  isResourceGantt() {
    return !this.type || this.type !== Gantt.type.ACTIVITY_CHART;
  }

  hasConstraints() {
    return this.model && this.model.constraints && this.model.constraints.length;
  }

  isFlat() {
    return !this.model || this.model.isFlat();
  }

  getTimeWindow() {
    return this.timeWindow;
  }

  setTimeWindow({ start, end }) {
    if (end === 0) {
      throw new Error(`Invalid time window + ${JSON.stringify({ start, end })}, may not have been processed correctly`);
    }
    if (this.timeWindow && this.timeWindow.start === start && this.timeWindow.end === end) {
      return Promise.resolve(this.timeWindow);
    }
    this.timeWindow = { start, end };
    return (this.timeLineInit = this.timeLine.setTimeWindow(start, end).then(({ start, end }) => {
      this.updateTableHeaderHeight();
      this.updateWidthFromTimeLine();
      this.scrollTimeTableToX(this.timeLine.getXFromMillis(this.timeLine.getHorizon().start));
      this.updateTimeLineHeight();
      this.triggerEvent(Gantt.events.TIME_WINDOW_CHANGED, start, end);
    }));
  }

  getBody() {
    return this.body;
  }

  initialized() {
    return this.initPromise;
  }

  // noinspection JSUnusedLocalSymbols
  createTreeTable(ctnr) {
    // Initialize table panel
    const tablePanel = document.createElement('div');
    tablePanel.className = 'table-panel';
    tablePanel.style.position = 'relative';
    tablePanel.style.height = '100%';
    tablePanel.style.width = '100%';
    tablePanel.style.overflow = 'hidden';
    // If not setting the min width, the table width would be zero while data being loaded and
    // the split pane would not able to set its split position.
    tablePanel.style.minWidth = '100px';
    const TreeTableClass = Gantt.components.TreeTable.impl || Gantt.components.TreeTable;
    let tableConfig = this.config.table;
    if (this.legendConfig || this.config.rows) {
      const rowsConfig = Gantt.utils.mergeObjects({}, this.legendConfig && { rows: { renderer: this.legendConfig } }, {
        rows: this.config.rows,
      });
      tableConfig = Gantt.utils.mergeObjects(rowsConfig, tableConfig);
    }
    this.table = new TreeTableClass(this, tablePanel, tableConfig);
    this.table.setRowFilter(this.rowFilter);
    this.updates.table = this.table.createUpdates(this.updates);
    ctnr.appendChild(tablePanel);
    window.addWheelListener(tablePanel, evt => {
      const factor = evt.deltaMode === 1 /** DOM_DELTA_LINE */ ? 32 : 0.8; // necessary for FF !
      const delta = factor * evt.deltaY || -evt.wheelDelta || evt.detail;
      this.timeTable.scrollToY(this.timeTable.getScrollTop() + delta);
      if (evt.preventDefault) {
        evt.preventDefault();
      }
    });
    return tablePanel;
  }

  // noinspection JSUnusedLocalSymbols
  createTimePanel(ctnr) {
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
    vScrollerFiller.style.right = 0;
    vScrollerFiller.top = 0;
    this.timePanel.appendChild(vScrollerFiller);
    this.updateTimeLineRightMargin = () => {
      const rightMargin = this.timeTable.getRightMargin();
      this.timeLineScroller.style.paddingRight = rightMargin ? `${rightMargin}px` : '0';
      vScrollerFiller.style.width = this.timeLineScroller.style.paddingRight;
      vScrollerFiller.style.display = rightMargin ? 'block' : 'none';
    };

    this.updateTableHeaderHeight = force => {
      if (!this.initializing && this.timeLine) {
        // Timeline is created after first resize events are fired
        const h = this.timeLine.getTimeAxisHeight();
        if (force || this.headersHeight !== h) {
          this.headersHeight = h;
          if (!this.table) {
            console.log('no table');
          }
          this.table.setHeaderHeight(h);
          if (h) {
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

    const TimeTableClass = Gantt.components.TimeTable.impl || Gantt.components.TimeTable;
    let timeTableConfig = this.config && this.config.timeTable;
    if (this.legendConfig || this.config.rows) {
      const rowsConfig = Gantt.utils.mergeObjects(
        {},
        this.legendConfig && { rows: { renderer: this.legendConfig } },
        this.config.rows && { rows: this.config.rows }
      );
      timeTableConfig = Gantt.utils.mergeObjects(rowsConfig, timeTableConfig);
    }
    this.timeTable = new TimeTableClass(this, this.timeTablePanel, timeTableConfig);
    this.updates.timeTable = this.timeTable.createUpdates(this.updates);
    this.attachTimeTableMouseWheel(this.timeTable.getScroller());
    this.timeTable.getScroller().addEventListener('scroll', e => {
      this.timeLineScroller.scrollLeft = e.target.scrollLeft;
      this.triggerEvent(Gantt.events.TIME_LINE_SCROLLED, e.target.scrollLeft);
    });
    ctnr.appendChild(this.timePanel);
    return this.timePanel;
  }

  drawTimeTable(clear) {
    if (clear && this.table.deleteDrawCache) {
      this.table.deleteDrawCache();
    }
    this.timeTable.draw(clear);
  }

  createLoadingPanel(config) {
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

  createLoadResourceChart(config) {
    let loadChartNode;
    let chartPanel;
    (Gantt.utils.isArray(config) && config.length && Gantt.utils.isArray(config[0]) ? config : [config]).forEach(
      loadConfig => {
        // Construct the bar node
        if (!chartPanel) {
          chartPanel = document.createElement('div');
          chartPanel.className = 'load-resource-chart-panel';
          chartPanel.style.flexShrink = 0;
          chartPanel.style.position = 'relative';
          // IE specific
          chartPanel.style.display = 'flex';
          chartPanel.style.flexDirection = 'columm';
        }
        loadChartNode = document.createElement('div');
        loadChartNode.className = 'load-resource-chart';
        chartPanel.appendChild(loadChartNode);
        if (!this.loadCharts) {
          this.loadCharts = [];
        }
        const loadChart = new (Gantt.components.LoadResourceChart.impl || Gantt.components.LoadResourceChart)(
          this,
          loadChartNode,
          Gantt.utils.mergeObjects({}, loadConfig, { height: '' })
        );
        this.loadChartCtrl.addLoadResourceChart(loadChart);
        loadChart.node.style.flex = '1 1';
        this.loadCharts.push(loadChart);
        window.addWheelListener(loadChart.getScroller(), evt => {
          evt.preventDefault();
        });
      }
    );

    return chartPanel;
  }

  toggleLoadChartVisible() {
    this.setLoadChartVisible(!this.isLoadChartVisible());
  }

  setLoadChartVisible(visible) {
    this.loadChartHidden = !visible;
    this.loadChartSplit.setRightComponentVisible(visible);
    Gantt.utils.toggleClass(this.contentElt, LOAD_RESOURCE_CHART_OPENED, visible);
    Gantt.utils.toggleClass(this.contentElt, LOAD_RESOURCE_CHART_CLOSED, !visible);
    this.loadChartCtrl.setVisible(visible);
    this.onResize();
  }

  isLoadChartVisible() {
    return this.loadChartCtrl.isVisible();
  }

  getPanelNode() {
    return this.contentElt;
  }

  updateTimeLineHeight() {
    const bottomMargin = this.timeTable.getBottomMargin();
    this.timeLineScroller.style.paddingBottom = bottomMargin ? `${bottomMargin}px` : '0';
  }

  attachTimeTableMouseWheel(scroller) {
    window.addWheelListener(scroller, evt => {
      if (evt.ctrlKey && evt.deltaY !== 0) {
        if (evt.deltaY < 0) {
          this.zoomIn(evt);
        } else {
          this.zoomOut(evt);
        }
        evt.preventDefault();
      }
    });
  }

  // noinspection JSUnusedLocalSymbols
  createTimeLine(timeLineCtnr) {
    const TimeLineClass = Gantt.components.TimeLine.impl || Gantt.components.TimeLine;
    this.timeLine = new TimeLineClass(this, timeLineCtnr, this.config);
    this.timeLine.on(
      [Gantt.events.TIME_LINE_RANGE_CHANGE, Gantt.events.TIME_LINE_RANGE_CHANGED, Gantt.events.TIME_LINE_PAN_MOVED],
      () => {
        this.updateTableHeaderHeight();
        this.updateWidthFromTimeLine();
        this.drawTimeTable(true);
      }
    );
    this.timeLine.on(Gantt.events.TIME_LINE_SIZE_CHANGED, (e, w, h) => {
      this.updateWidthFromTimeLine();
      this.drawTimeTable(true);
      this.triggerEvent(Gantt.events.TIME_LINE_SIZE_CHANGED, w, h);
    });
    this.timeLine.on(Gantt.events.TIME_LINE_INIT, e => {
      this.triggerEvent(Gantt.events.TIME_LINE_INIT);
    });
    return this.timeLine;
  }

  createToolbars(config) {
    this.toolbars = [];
    const ToolbarClass = Gantt.components.Toolbar.impl || Gantt.components.Toolbar;
    let toolbarNode;
    this.toolbarElt = null;
    (Gantt.utils.isArray(config) && config.length && Gantt.utils.isArray(config[0]) ? config : [config]).forEach(
      barConfig => {
        if (barConfig.node) {
          if (Gantt.utils.isString(barConfig.node)) {
            toolbarNode = document.getElementById(barConfig.node);
          } else if (Gantt.utils.isDomElement(node)) {
            toolbarNode = node;
          } else if (Gantt.utils.isFunction(barConfig.node)) {
            toolbarNode = barConfig.node(this);
          } else {
            throw new Error(
              'The toolbar.node must be a string(Dom element ID) or a Dom element or a function returning a Dom element'
            );
          }
          barConfig = barConfig.components;
        } else {
          // Construct the bar node
          if (!this.toolbarElt) {
            this.toolbarElt = document.createElement('div');
            this.toolbarElt.className = 'gantt-toolbars';
            this.toolbarElt.style.flexShrink = 0;
          }
          toolbarNode = document.createElement('div');
          toolbarNode.className = 'gantt-toolbar';
          this.toolbarElt.appendChild(toolbarNode);
        }
        this.toolbars.push(new ToolbarClass(this, toolbarNode, barConfig));
      }
    );

    if (this.toolbarElt) {
      this.contentElt.appendChild(this.toolbarElt);
    }
    // Wait for all toolbar components to be created before triggering onInitialized as components can refer to each others
    this.toolbars.forEach(t => {
      t.onInitialized();
    });
    return this.toolbarElt;
  }

  createHeader(config) {
    const header = document.createElement('div');
    header.className = 'gantt-header';
    if (Gantt.utils.isString(config)) {
      header.appendChild(document.createTextNode(config));
    } else if (Gantt.utils.isFunction(config)) {
      const node = config(this);
      if (node) {
        header.appendChild(node);
      }
    }
    return header;
  }

  getRowCount() {
    return this.table.getRowCount();
  }

  getRow(param) {
    return this.table.getRow(param);
  }

  getRows(selector) {
    return this.table.getRows(selector);
  }

  getVisibleRows() {
    return this.table.getVisibleRows();
  }

  getVisibleHeight() {
    return this.timeTable.getVisibleHeight();
  }

  ensureRowVisible(param) {
    const row = this.table.getRow(param);
    if (!row) {
      throw new Error(`Cannot find row for ${param}`);
    }
    if (this.table.isRowFiltered(row)) {
      throw new Error(`Cannot show the filtered row: ${param}`);
    }
    this.table.expandParents(row);
    this.timeTable.scrollToRow(row);
  }

  isRowVisible(param) {
    return this.table.isRowVisible(param);
  }

  getFirstVisibleRow() {
    return this.table.getFirstVisibleRow();
  }

  setFirstVisibleRow(param) {
    this.timeTable.setFirstVisibleRow(this.getRow(param));
  }

  isRowFiltered(param) {
    return this.table.isRowFiltered(param);
  }

  toggleCollapseRow(param, collapse) {
    this.table.toggleCollapseRow(this.getRow(param), collapse);
  }

  scrollToY(y) {
    this.timeTable.scrollToY(y);
  }

  getRowHeight(row) {
    row = this.getRow(row);
    return row && (row.activityRow ? row.activityRow.height : row.tr.offsetHeight);
  }

  draw(forceTableRedraw) {
    if (this.timeLine) {
      this.timeLine.draw(true);
      if (this.table.deleteDrawCache) {
        this.table.deleteDrawCache();
      }
      this.table.draw(forceTableRedraw);
      this.timeTable.draw();
      this.updateScrollerHeight();
    }
  }

  drawRows(selector) {
    const rows = this.getRows(selector);
    this.table.drawRows(rows);
    this.timeTable.drawRows(rows);
  }

  updateScrollerHeight() {
    this.timeTable.setBodyHeight(
      this.loadOnDemand ? this.table.getRowCount() * this.getRowHeight() : this.table.getHeight()
    );
    this.updateTimeLineRightMargin();
  }

  getRowActivities(row) {
    row = this.getRow(row);
    return (row && row.activities) || [];
  }

  getActivity(param, row) {
    if (row) {
      const acts = this.getRowActivities(row);
      if (Gantt.utils.isString(param)) {
        for (let i = 0, count = acts.length; i < count; ++i) {
          if (acts[i].id === param) {
            return acts[i];
          }
        }
        return undefined;
      }
      if (Gantt.utils.isInteger(param)) {
        return acts[param];
      }
      for (let i = 0, count = acts.length; i < count; ++i) {
        if (acts[i].getData() === param) {
          return acts[i];
        }
      }
    } else {
      return this.model.getActivity(param);
    }
  }

  getActivityNode(param, res) {
    const activity = this.getActivity(param, res);
    return activity && activity.node;
  }

  getToolbarComponent(id) {
    for (let i = 0; i < this.toolbars.length; i++) {
      for (let j = 0; j < this.toolbars[i].components.length; j++) {
        const c = this.toolbars[i].components[j];
        if (c && id === c.id) {
          return c;
        }
      }
    }
  }

  onResize() {
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

  destroy() {
    Gantt.plugins.call('destroy', this);
    if (this.errorHandler && this.errorHandler.destroy) {
      this.errorHandler.destroy();
    }

    if (this.splitPane && this.splitPane.destroy) {
      this.splitPane.destroy();
    }

    if (this.table && this.table.destroy) {
      this.table.destroy();
    }

    if (this.model && this.model.destroy) {
      this.model.destroy();
    }

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    if (this.updates) {
      this.updates.destroy();
    }

    if (this.toolbars) {
      this.toolbars.forEach(bar => {
        bar.destroy();
      });

      this.toobars = null;
    }

    while (this.node.firstChild) {
      this.node.removeChild(this.node.firstChild);
    }

    this.contentElt = null;
    this.table = null;
    this.body = null;
  }

  disconnect() {}

  /*             */
  /*     Rows    */
  /*             */

  highlightRow(row, highlight, deselectAll) {
    if (typeof row === 'string') {
      row = this.table.getRow(row);
    }
    highlight = highlight === undefined || highlight;
    this.table.highlightRow(row, highlight, deselectAll);
    this.timeTable.highlightRow(row, highlight, deselectAll);
  }

  /*                */
  /*   Selection    */
  /*                */

  get selection() {
    return this.selectionHandler;
  }

  set selection(sel) {
    const currentSel = this.selectionHandler && this.selectionHandler.get();
    if (this.selectionHandler) {
      this.selectionHandler.destroy();
    }
    this.selectionHandler = sel;
    if (this.selectionHandler) {
      if (currentSel && currentSel.length) {
        this.selectionHandler.select(sel);
      }
    }
  }

  /*                         */
  /*   Layout synchronizer   */
  /*                         */
  synchLayout(config) {
    const ls = new (Gantt.components.LayoutSynchronizer.impl || Gantt.components.LayoutSynchronizer)(config);
    ls.connect(this);
    return ls;
  }

  /*             */
  /*     Zoom    */
  /*             */

  resetZoom() {
    this.timeLine.resetZoom();
    this.scrollTimeTableToX(this.timeLine.getXFromMillis(this.timeLine.getHorizon().start));
  }

  zoomIn(evt) {
    this.zoom(this.zoomFactor, evt);
  }

  zoomOut(evt) {
    this.zoom(-this.zoomFactor, evt);
  }

  zoom(zoomFactor, evt) {
    zoomFactor = this.timeLine.validateZoomFactor(zoomFactor);
    if (zoomFactor !== 0) {
      const visibleW = this.timeTable.getVisibleWidth();
      // When zooming, we want to keep the same time coordinate under the mouse, if mousewheel event is provided as a parameter.
      let xRef =
        (evt && this.getTimeTableCoordinates(evt.target, { x: evt.offsetX, y: evt.offsetY }).x) ||
        this.timeTable.getScrollLeft() + visibleW / 2;
      const timeRef = this.timeLine.getTimeAt(xRef);
      xRef -= this.timeTable.getScrollLeft();

      this.timeLine.zoom(zoomFactor);

      const newScrollLeft = this.timeLine.getXFromMillis(timeRef) - xRef;
      this.scrollTimeTableToX(newScrollLeft);
    }
  }

  fitToContent() {
    const timeRange = this.timeTable.getDisplayedActivitiesTimeRange();
    this.timeLine.setVisibleTimeWindow(timeRange);
    this.scrollTimeTableToX(
      this.timeLine.getXFromMillis((timeRange && timeRange.start) || this.timeLine.getHorizon().start)
    );
  }

  updateScrollFromTimeLine() {}

  updateWidthFromTimeLine() {
    this.timeTable.setBodyWidth(this.timeLine.getWidth());
  }

  /*                        */
  /*    Search and filter   */
  /*                        */
  addFilter(filter, rows, activities) {
    const result = { activities: activities && this.activityFilter.addFilter(filter) };
    const actFilter = result.activities;
    if (rows) {
      // noinspection JSUnusedLocalSymbols
      result.row = actFilter
        ? this.rowFilter.addOrFilters(filter, (row, columnData, rowIndex) => {
            const count = row.activities.length;
            const params = [null, row];
            for (let i = 0; i < count; i++) {
              params[0] = row.activities[i];
              if (actFilter(params)) {
                return true;
              }
            }
            return false;
          })
        : this.rowFilter.addFilter(filter);
    }
    if (result.row || result.activities) {
      this.filterChanged();
      return result;
    }
    return null;
  }

  removeFilter(key, preventNotify) {
    let success = false;
    if (key) {
      if (key.row) {
        success = this.rowFilter.removeFilter(key.row);
      }
      if (key.activities) {
        success = this.activityFilter.removeFilter(key.activities);
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

  search(text, rows, activities) {
    if (this.searchFilter) {
      if (this.searchFilter.row) {
        this.rowFilter.removeFilter(this.searchFilter.row);
      }
      if (this.searchFilter.activities) {
        this.activityFilter.removeFilter(this.searchFilter.activities);
      }
    }
    if (text && (rows || activities)) {
      this.searchFilter = this.addFilter(text, rows, activities);
    } else {
      this.searchFilter = null;
      this.filterChanged();
    }
  }

  setHideEmptyRows(hide, preventNotify) {
    if ((hide && !this.hideEmptyRowsFilter) || (!hide && this.hideEmptyRowsFilter)) {
      if (this.hideEmptyRowsFilter) {
        this.rowFilter.removeFilter(this.hideEmptyRowsFilter);
        this.hideEmptyRowsFilter = null;
      } else {
        // noinspection JSUnusedLocalSymbols
        this.hideEmptyRowsFilter = this.rowFilter.addFilter((row, columnData, rowIndex) => {
          let activityFilter = this.activityFilter;
          activityFilter = activityFilter && !activityFilter.isEmpty() ? activityFilter : null;
          const count = row.activities && row.activities.length;
          if (!count || !activityFilter) {
            return count;
          }
          for (let i = 0; i < count; i++) {
            if (activityFilter.accept(row.activities[i], row)) {
              return true;
            }
          }
          return false;
        });
      }
      if (!preventNotify) {
        this.filterChanged();
      }
      return true;
    }
    return false;
  }

  filterChanged() {
    if (this.table && this.timeTable) {
      this.table.filterChanged();
      const table = this.table && this.table.getScrollableTable();
      this.updateScrollerHeight();
      const scrollTop = table.scrollTop;
      this.timeTable.setScrollTop(scrollTop);
      this.drawTimeTable(true);
      this.triggerEvent(Gantt.events.ROWS_FILTERED);
    }
  }

  /*             */
  /*     Title   */
  /*             */
  getTitle() {
    return this.title;
  }

  setTitle(title) {
    this.title = title;
    this.triggerEvent(Gantt.events.TITLE_CHANGED, title);
  }

  /*                */
  /*   Row colors   */
  /*                */

  setRowColor(row, color) {
    row.color = color;
    if (this.table.setRowColor) {
      this.table.setRowColor(row, color);
    }
    if (this.timeTable.setRowColor) {
      this.timeTable.setRowColor(row, color);
    }
  }

  /*             */
  /*     Utils   */
  /*             */

  // noinspection JSUnusedGlobalSymbols
  centerTimeSheetOnX(x) {
    this.scrollTimeTableToX(x - this.timeTable.getVisibleWidth() / 2);
  }

  scrollTimeTableToX(x) {
    x = Math.min(Math.max(Math.round(x), 0), this.timeTable.getBodyWidth() - this.timeTable.getVisibleWidth());
    this.timeTable.setScrollLeft(x);
    if (this.loadChartCtrl) {
      this.loadChartCtrl.timeTableXScrolled(x);
    }
    this.triggerEvent(Gantt.events.TIME_LINE_SCROLLED, x);
  }

  getTimeTableCoordinates(target, position) {
    return Gantt.utils.walkToAncestor(
      [this.timeTable.getScroller(), this.timeLineScroller],
      target,
      (parent, node, position) => {
        if (parent === this.timeLineScroller) {
          position.x += this.timeTable.getScrollLeft();
        } else if (parent === this.timeTable.getScroller()) {
          return position;
        }
        return {
          x: position.x + node.offsetLeft - parent.scrollLeft,
          y: position.y + node.offsetTop - parent.scrollTop,
        };
      },
      { x: (position && position.x) || 0, y: (position && position.y) || 0 }
    );
  }

  addTimeMarker(id, time, classes) {
    this.timeLine.addTimeMarker(id, time, classes);
  }

  removeTimeMarker(id) {
    this.timeLine.removeTimeMarker(id);
  }

  setTimeLineItem(id, item) {
    this.timeLine.setTimeLineItem(id, item);
  }

  addTimeLineItem(id, item) {
    this.timeLine.addTimeLineItem(id, item);
  }

  removeTimeLineItem(id) {
    this.timeLine.removeTimeLineItem(id);
  }

  /*             */
  /*    Errors   */
  /*             */

  hasErrors() {
    return this.errorHandler.hasErrors();
  }

  /*             */
  /*   Palettes  */
  /*             */

  setPaletteConfiguration(config) {
    if (Gantt.utils.isArray(config) || Gantt.utils.isFunction(config)) {
      this.palettes = null;
      this.defaultPalette = new (Gantt.components.Palette.impl || Gantt.components.Palette)(config);
    } else if (Gantt.utils.isString(config)) {
      this.palettes = null;
      this.defaultPalette = Gantt.defaultPalettes[config];
      if (!this.defaultPalette) {
        console.error(`Palette [${config}] does not exist`);
      }
    } else {
      const paletteNames = Object.keys(config);
      this.palettes = {};
      this.defaultPalette = null;
      for (let i = 0, count = paletteNames.length; i < count; ++i) {
        this.palettes[paletteNames[i]] = new (Gantt.components.Palette.impl || Gantt.components.Palette)(
          config[paletteNames[i]]
        );
      }
    }
  }

  getPalette(name) {
    if (!name) {
      return this.defaultPalette || (Gantt.defaultPaletteName && Gantt.defaultPalettes[Gantt.defaultPaletteName]);
    }
    return (this.palettes && this.palettes[name]) || Gantt.defaultPalettes[name];
  }

  /*             */
  /*   Updates   */
  /*             */
  startUpdating() {
    this.updates.startUpdating();
  }

  stopUpdating() {
    if (this.updates.stopUpdating()) {
      // nothing to do
    }
  }

  rowsChanged(event, rows) {
    this.updates.startUpdating();
    this.triggerEvent(event, rows);
    this.updates.rowsChanged(event, rows);
    this.updates.stopUpdating();
  }
}

Gantt.components.GanttPanel.impl = GanttPanel;

export default GanttPanel;
