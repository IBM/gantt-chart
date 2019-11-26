import Gantt from '../core/core';
import DragDrop from '../core/dragdrop';
import ActivityRendererPrototype from './activityrenderer';
import RowRendererPrototype from './rowrenderer';

import {
  DECORATION_BREAK_CLASS,
  DECORATION_BREAK_TYPE,
  DECORATION_INVALID_CLASS,
  DECORATION_INVALID_TYPE,
  HIGHLIGHT_CLASS,
  SELECTION_CLASS,
  TIME_MARKER_DRAG_ITEM,
  TIME_TABLE_ACTIVITY_CLASSNAME,
  TIME_TABLE_ROW,
  UNSELECTABLE_CLASSNAME,
} from './css-classes';

import './activitylayout';
import '../constraintgraph';
import './timetable.scss';

const ROW_ID_PREFIX = 'timeTableRow_';
const ACTIVITY_ID_PREFIX = '';
const defaultOptions = {
  bufferPageSize: 3,
};

export default class TimeTable extends Gantt.components.TimeTable {
  constructor(gantt, node, config) {
    super(gantt, node, Gantt.utils.mergeObjects({}, defaultOptions, config));

    // Selection management
    Gantt.utils.addEventListener(node, 'click', e => this.processClick(e), true);
    Gantt.utils.addEventListener(node, 'dblclick', e => this.processDoubleClick(e), true);
    Gantt.utils.addEventListener(node, 'contextmenu', e => this.processMouseDown(e), true);
    const selectionHandler = gantt.selection;
    selectionHandler.on(Gantt.events.ACTIVITY_SELECTION_CLEARED, (e, sels) => this.clearActivitySelection(sels));
    selectionHandler.on(Gantt.events.ACTIVITY_SELECTED, (e, sels) => this.selectActvities(sels));
    selectionHandler.on(Gantt.events.ACTIVITY_UNSELECTED, (e, sels) => this.unselectActvities(sels));
    selectionHandler.on(Gantt.events.ROW_SELECTED, (e, sels) => this.selectRows(sels));
    selectionHandler.on(Gantt.events.ROW_UNSELECTED, (e, sels) => this.unselectRows(sels));
    selectionHandler.on(Gantt.events.ROW_SELECTION_CLEARED, (e, sels) => this.unselectRows(sels));
    selectionHandler.on(Gantt.events.ROW_SELECTION_CHANGED, (e, sels) => this.rowSelectionChanged(sels));
  }

  // Method called from super class
  // noinspection JSUnusedGlobalSymbols
  setConfiguration(config) {
    this.destroy();

    this.create();

    this.bufferPageSize = config.bufferPageSize;

    const RendererClass = Gantt.components.Renderer.impl || Gantt.components.Renderer;
    this.activityRenderer = new RendererClass(config.renderer, ActivityRendererPrototype, this.gantt);

    this.rowRenderer =
      config.rows && config.rows.renderer && new RendererClass(config.rows.renderer, RowRendererPrototype, this.gantt);

    this.interactor = this.config.interactor;
    this.moveInterator = this.interactor && this.interactor.move;
    this.mouseHandler = this.interactor && this.interactor.click;

    const onScroll = e => {
      if (this.synchronizeTableTop(e.target.scrollTop)) {
        e.preventDefault && e.preventDefault();
      }
    };
    Gantt.utils.addEventListener(this.scroller, 'scroll', onScroll);
    if (this.moveInterator) this.initDragAndDrop();
    this.initTooltip();
    this.events = {};

    const LayoutClass = Gantt.components.ActivityLayout.impl || Gantt.components.ActivityLayout;
    this.layout = new LayoutClass(config && config.layout, null /* proto */, { gantt: this.gantt });
  }

  create() {
    this.scroller = document.createElement('div');
    this.scroller.className = 'time-table-scroller';
    // CSS layout
    this.scroller.style.position = 'absolute';
    this.scroller.style.height = '100%';
    this.scroller.style.top = '0';
    this.scroller.style.left = '0';
    this.scroller.style.right = '0';
    this.scroller.style.bottom = '0';
    this.scroller.style.overflowX = 'scroll';
    this.node.appendChild(this.scroller);

    // Element used for getting the width of the visible time table area.
    const timeTableWidthTester = document.createElement('div');
    this.getVisibleWidth = function() {
      return timeTableWidthTester.offsetWidth;
    };
    // CSS layout
    timeTableWidthTester.style.width = '100%';
    timeTableWidthTester.style.height = 0;
    this.scroller.appendChild(timeTableWidthTester);

    // Element used for getting the height of the visible time table area,
    // excluding the horizontal scrollbar height
    const timeTableHeightTester = document.createElement('div');
    // noinspection JSUnusedGlobalSymbols
    this.getVisibleHeight = function() {
      return timeTableHeightTester.offsetHeight;
    };
    timeTableHeightTester.style.width = 0;
    timeTableHeightTester.style.position = 'absolute';
    timeTableHeightTester.style.top = 0;
    timeTableHeightTester.style.height = '100%';
    this.scroller.appendChild(timeTableHeightTester);

    // noinspection JSUnresolvedVariable
    this.body = document.createElement('div');
    this.body.style.minHeight = '1px'; // Horizontal scroll position for this.scroll is set before the body is given a height. If this.scroll content (this.body) has no height, the h-scroll position does not apply
    this.body.className = 'time-table-body';
    // this.scroller.style.width = 0;

    this.scroller.appendChild(this.body);

    Gantt.utils.addEventListener(
      this.body,
      'mouseenter',
      e => {
        const row = this.getTimeTableRowNode(e.target);
        if (row) {
          this.gantt.highlightRow(row.id.substring(ROW_ID_PREFIX.length), true, true);
        }
      },
      true
    );
    Gantt.utils.addEventListener(
      this.body,
      'mouseleave',
      e => {
        const row = this.getTimeTableRowNode(e.target);
        if (row) {
          this.gantt.highlightRow(row.id.substring(ROW_ID_PREFIX.length), false, true);
        }
      },
      true
    );
  }

  update() {
    this.draw();
  }

  createUpdates(parent) {
    return new (Gantt.components.GanttUpdates.impl || Gantt.components.GanttUpdates)(parent, {
      applyReload: () => {
        this.draw();
      },

      applyUpdates: () => {
        if (parent.containsRowChanges()) {
          if (this.ctsGraph) {
            this.resetConstraints();
          }
          this.draw(true);
        } else {
          this.draw();
        }
      },
    });
  }

  // noinspection JSUnusedLocalSymbols
  renderRow(row, ctx) {
    const timeLine = this.gantt.timeLine;
    const actRow = {
      row,
      getX(date) {
        return timeLine.getXFromMillis(date);
      },
      setRowHeight(h) {
        this.height = h;
      },
    };
    const node = document.createElement('div');
    node.id = ROW_ID_PREFIX + row.id;
    const table = this.gantt.table;
    // In Firefox, the use of tr.offsetHeight leads to error.
    // For a row of height 32.5px, tr.offsetHeight will return 33px where
    // as the actual display of the row takes 32px.
    // Gantt.utils.getHeight internally invokes the jQuery.height() function which is more reliable.
    let oldRowHeight = table.getRowHeight(row);
    const variableLayoutRowHeight = this.layout.allowVariableRowHeight();
    actRow.tableRowHeight = actRow.height =
      (!variableLayoutRowHeight && this.activityRenderer.rowHeight && this.activityRenderer.rowHeight(row)) ||
      oldRowHeight;
    if (!variableLayoutRowHeight && actRow.height !== oldRowHeight) {
      table.setRowHeight(row, actRow.height);
      // For example if actRow.height < minimum table row height
      actRow.height = oldRowHeight = table.getRowHeight(row);
    }

    // See http://help.dottoro.com/lhwdpnva.php
    // for making nodes unselectable
    node.className =
      `${ctx.odd ? `${TIME_TABLE_ROW} odd` : TIME_TABLE_ROW} ${UNSELECTABLE_CLASSNAME}` +
      (row.classes ? ' ' + row.classes : '') +
      (row.selected ? ' ' + SELECTION_CLASS : '');
    if (this.rowRenderer) {
      this.rowRenderer.draw(row, node, ctx);
    }
    // node.style.backgroundColor = row.tr.style.backgroundColor;

    const rowSpan = document.createElement('div');
    rowSpan.innerHTML = `${row.index + 1}`;
    rowSpan.className = 'row-number';
    node.appendChild(rowSpan);
    actRow.rowNode = node;

    if (this.activityRenderer.generateRowDecorations) {
      this.generateRowDecorations(row, node, ctx);
    }

    this.renderActivities(actRow, ctx);

    if (actRow.height !== oldRowHeight) {
      table.setRowHeight(row, actRow.height);
      // For example if actRow.height < minimum table row height
      actRow.height = table.getRowHeight(row);
    }

    node.style.height = `${actRow.height}px`;
    return actRow;
  }

  renderActivities(activityRow) {
    const activityFilter = this.getActivityFilter(),
      activities = activityRow.row.activities,
      actCount = (activities && activities.length) || 0;
    let actNodes, iAct, act, actNode;
    activityRow.activities = actNodes = [];
    if (actCount) {
      for (iAct = 0; iAct < actCount; ++iAct) {
        act = activities[iAct];

        act.node = actNode =
          ((!activityFilter || activityFilter.accept(act, activityRow.row)) &&
            this.renderActivity(act, activityRow.row, activityRow.rowNode)) ||
          null;
        if (actNode) {
          if (act.id) {
            actNode.id = ACTIVITY_ID_PREFIX + activityRow.rowNode.id + act.id;
          }
          actNodes.push(act);
          activityRow.rowNode.appendChild(actNode);
        }
      }
      this.layout.layout(activityRow);
    }
  }

  getActivityFilter() {
    const activityFilter = this.gantt.activityFilter;
    return activityFilter && !activityFilter.isEmpty() ? activityFilter : null;
  }

  renderActivity(act, row, timeTableRowNode) {
    return this.activityRenderer.draw(act, timeTableRowNode, row);
  }

  getX(date) {
    return this.gantt.timeLine.getXFromMillis(date);
  }

  draw(forceRedraw) {
    if (this.container) {
      this.body.removeChild(this.container);
      this.container = null;
    }
    let ctsNode;
    if (this.ctsGraph && forceRedraw) {
      this.resetConstraints();
    }

    // Draw the height of several row pages
    let top = this.scroller.scrollTop;
    this.lastRepaintY = top;
    if (top < 0) {
      top = 0;
    }
    const table = this.gantt.table;
    top -= Math.abs(((this.bufferPageSize - 1) / 2) * this.scroller.clientHeight);
    if (top < 0) {
      top = 0;
    }

    const timeLine = this.gantt.timeLine;
    const ctx = {
      getX(millis) {
        timeLine.getXFromMillis(millis);
      },
      horiz: this.gantt.timeLine.getScrollableHorizon(),
      gantt: this.gantt,
    };
    // Generate  global decorations
    if (this.activityRenderer.generateDecorations && (forceRedraw || !this.backgroundCtnr)) {
      this.generateGlobalDecorations(ctx);
    }
    let row = table.getRowAt(top);
    if (row && row.getData()) {
      // If no rows are displayed, a row displaying
      // 'No matching records found' is displayed instead: no activities to display
      top = table.getRowTop(row);

      const ctsRows = this.ctsGraph ? [] : null,
        firstRowIndex = row.index;

      const maxBufferHeight = top + this.bufferPageSize * this.scroller.clientHeight;
      let yFinal = Math.min(maxBufferHeight, table.getHeight());
      const variableHeightLayout = this.layout.allowVariableRowHeight() || this.activityRenderer.rowHeight;
      ctx.odd = row.index % 2 === 0; // This is the way datatables work...

      this.container = this.createContainer(top);

      let activityRow;
      while (row && top < yFinal) {
        activityRow = row.activityRow;
        if (forceRedraw || !activityRow || !activityRow.rowNode) {
          row.activityRow = activityRow = this.renderRow(row, ctx);
        }
        this.container.appendChild(activityRow.rowNode);

        if (ctsRows) {
          ctsRows.push({ y: top, height: activityRow.height, row });
        }

        top += activityRow.height;
        if (variableHeightLayout) {
          // Row height can change so that the yFinal
          yFinal = Math.min(maxBufferHeight, table.getHeight());
        }
        ctx.odd = !ctx.odd;
        row = table.nextRow(row);
      }

      if (this.ctsGraph && this.ctsGraph.node) {
        this.body.insertBefore(this.container, this.ctsGraph.node);
      } else {
        this.body.appendChild(this.container);
      }
      if (variableHeightLayout) {
        this.gantt.updateScrollerHeight();
      }

      if (this.ctsGraph) {
        let updateScrolls = false;
        this.ctsGraph
          .draw(ctsRows, row => {
            // Draw callback to draw additional rows
            activityRow = row.activityRow;
            if (forceRedraw || !activityRow || !activityRow.rowNode) {
              row.activityRow = activityRow = this.renderRow(row, ctx);
            }
            if (row.index > firstRowIndex) {
              // We only add row nodes rendered after the last row node above.
              // The constraint draw algorithm ensures that additional rows to be rendered are drawn
              // in ascending order, from the lowest to the highest index.
              this.container.appendChild(activityRow.rowNode);
              updateScrolls = true;
            }
          })
          .then(() => {
            if (forceRedraw && ctsNode) {
              this.body.appendChild(ctsNode);
            }
            if (updateScrolls) {
              this.gantt.updateScrollerHeight();
            }
          });
      }
    }
    this._ready = true;
  }

  drawRows() {
    this.draw(true);
  }

  createContainer(y) {
    const c = document.createElement('div');
    c.className = 'time-table-row-container';
    // c.style.width = this.gantt.getTimeTableWidth() + 'px';
    c.style.width = `${this.getBodyWidth()}px`;
    c.style.overflow = 'none';
    c.style.position = 'absolute';
    c.style.padding = 0;
    c.style.border = 'none';
    c.style.top = `${y}px`;
    c.style.left = 0;
    return c;
  }

  on(event, handler) {
    if (event === Gantt.events.TIME_TABLE_INIT) {
      if (this._ready) {
        handler.call(this);
      } else {
        super.on(this, Gantt.events.TIME_TABLE_INIT, handler);
      }
    }
  }

  onResize() {
    this.draw(false);
  }

  static isActivityNode(elt) {
    return Gantt.utils.hasClass(elt, TIME_TABLE_ACTIVITY_CLASSNAME);
  }

  getActivityNode(elt) {
    for (; elt && elt !== this.body; elt = elt.parentNode) {
      if (TimeTable.isActivityNode(elt)) {
        return elt;
      }
    }
    return null;
  }

  getActivity(activityElt) {
    const tr = this.getTimeTableRowNode(activityElt);
    if (tr) {
      const row = this.getRow(tr.id.substring(ROW_ID_PREFIX.length));

      const activities = row && row.activityRow && row.activityRow.activities;
      if (activities) {
        for (let iAct = 0; iAct < activities.length; iAct++) {
          if (activities[iAct].node === activityElt) {
            return activities[iAct];
          }
        }
      }
    }
    return null;
  }

  getTimeTableRowNode(activityNode) {
    for (let tr = activityNode; tr !== this.body; tr = tr.parentNode) {
      if (Gantt.utils.hasClass(tr, TIME_TABLE_ROW)) {
        return tr;
      }
    }
    return null;
  }

  // noinspection JSUnusedGlobalSymbols
  getActivityRow(activity) {
    let tr;
    const actNode = (activity.node && activity.start && activity.node) || activity;
    for (tr = actNode.parentNode; tr !== this.body; tr = tr.parentNode) {
      if (this.utils.hasClass(tr, TIME_TABLE_ROW)) {
        break;
      }
    }
    return tr && this.getRow(tr.id.substring(ROW_ID_PREFIX.length));
  }

  getRow(id) {
    return this.gantt.table.getRow(id);
  }

  scrollToRow(row) {
    const y = this.gantt.table.getRowTop(row);
    const top = this.scroller.scrollTop;
    // If row before or after visible area
    if (y < top || y > top + this.getVisibleHeight()) {
      this.scrollToY(y);
    }
    // Check if row is fully visible
    else {
      // Draw of row has been called, we can access its height.
      const rowHeight = this.gantt.getRowHeight(row);
      if (top + this.getVisibleHeight() < y + rowHeight) {
        this.scrollToY(y);
      }
    }
  }

  setFirstVisibleRow(row) {
    const y = this.gantt.table.getRowTop(row);
    this.scrollToY(y);
  }

  scrollToY(y) {
    this.scroller.scrollTop = y;
    // For unit test, we want both the time table and table have their top synchronised immediatly
    this.synchronizeTableTop(y);
  }

  setScrollTop(y) {
    this.scroller.scrollTop = y;
  }

  getScrollTop() {
    return this.scroller.scrollTop;
  }

  synchronizeTableTop(top) {
    const table = this.gantt.table && this.gantt.table.getScrollableTable();
    if (table) {
      // Table may not be initialized yet.
      table.scrollTop = top;

      const scrollTop = table.scrollTop;
      // No empty space below the table which impacts the default scrolling strategy of the element.
      // When reaching the bottom of the table, last scroll down events won't impact table's display
      // We need to reflect that on the time table scrollbar
      // e.target.scrollTop = scrollTop;
      if (this.lastRepaintY === undefined || Math.abs(scrollTop - this.lastRepaintY) > this.scroller.clientHeight) {
        this.draw();
      }
      return true;
    }
    return false;
  }

  highlightActivity(act, highlight, deSelectAll) {
    if (deSelectAll && (!act || !Gantt.utils.hasClass(act, HIGHLIGHT_CLASS))) {
      const highlightActs = this.body.querySelectorAll(`.${TIME_TABLE_ACTIVITY_CLASSNAME}.${HIGHLIGHT_CLASS}`);
      if (highlightActs && highlightActs.length) {
        for (let i = 0; i < highlightActs.length; i++) {
          Gantt.utils.removeClass(highlightActs[i], HIGHLIGHT_CLASS);
        }
      }
    }
    if (act) {
      Gantt.utils.toggleClass(act, HIGHLIGHT_CLASS, highlight);
    }
  }

  highlightRow(row, highlight, deSelectAll) {
    if (deSelectAll) {
      const highlightRows = this.body.querySelectorAll(`.${TIME_TABLE_ROW}.${HIGHLIGHT_CLASS}`);
      if (highlightRows && highlightRows.length) {
        for (let i = 0; i < highlightRows.length; i++) {
          Gantt.utils.removeClass(highlightRows[i], HIGHLIGHT_CLASS);
        }
      }
    }
    if (row) {
      if (row.activityRow && row.activityRow.rowNode) {
        Gantt.utils.toggleClass(row.activityRow.rowNode, HIGHLIGHT_CLASS, highlight);
      }
    }
  }

  getDisplayedActivitiesTimeRange() {
    let top = this.scroller.scrollTop;
    if (top < 0) {
      top = 0;
    }
    const table = this.gantt.table;

    let row = table.getRowAt(top);
    if (!row || !row.getData()) {
      return null; // If no rows are displayed, a row displaying 'No matching records found' is displayed instead: no activities to display
    }
    top = table.getRowTop(row);
    const yFinal = Math.min(top + this.scroller.clientHeight, table.getHeight());
    const activityFilter = this.getActivityFilter();
    let minDate,
      maxDate = 0,
      activities,
      act,
      iAct,
      start,
      end,
      actCount;
    while (row && top < yFinal) {
      top += row.tr.offsetHeight;
      activities = row.activityRow && row.activityRow.activities;
      if ((actCount = activities && activities.length)) {
        for (iAct = 0; iAct < actCount; ++iAct) {
          act = activities[iAct];
          if (!activityFilter || activityFilter.accept(act, row)) {
            start = act.start;
            end = act.end;
            if (minDate) {
              if (minDate > start) {
                minDate = start;
              }
              if (maxDate < end) {
                maxDate = end;
              }
            } else {
              minDate = start;
              maxDate = end;
            }
          }
        }
      }
      row = table.nextRow(row);
    }
    return minDate && { start: minDate, end: maxDate };
  }

  getScrollLeft() {
    return this.scroller.scrollLeft;
  }

  setScrollLeft(x) {
    this.scroller.scrollLeft = x;
  }

  getScroller() {
    return this.scroller;
  }

  getRightMargin() {
    return this.scroller.offsetWidth - this.getVisibleWidth();
  }

  getBottomMargin() {
    return this.scroller.offsetHeight - this.getVisibleHeight();
  }

  setBodyWidth(w) {
    // this.timeScroller.style.width = this.timeLine.getWidth() + 'px';
    this.body.style.width = `${w}px`;
  }

  getBodyWidth() {
    return this.body.offsetWidth;
  }

  setBodyHeight(h) {
    this.body.style.height = `${h}px`;
  }

  // noinspection JSUnusedGlobalSymbols
  getBodyHeight() {
    return Gantt.utils.getHeight(this.scroller);
  }

  /*                 */
  /*     Tooltips    */
  /*                 */
  initTooltip() {
    const timeTable = this;
    const resGantt = this.gantt.isResourceGantt();
    this.gantt.tooltip.installTooltip({
      // The container that contains elements to display tooltip for.
      container: this.body,
      // The container inside which bounds the tooltip can be displayed
      getTooltipDisplayContainer() {
        return timeTable.gantt.getBody();
      },
      // Returns an element in the node hierarchy for which a tooltip can be displayed
      getTooltipElement(node) {
        return timeTable.getActivityNode(node);
      },
      getTooltipData(actNode) {
        return timeTable.getActivity(actNode);
      },
      renderTooltip(
        actNode /* The element returned by getTooltipElement */,
        act /* data returned by getTooltipData for the specified tooltipElt */,
        tooltipCtnr /* The container of the tooltip to fill with info. */
      ) {
        if (act && ((resGantt && act.row) || act)) {
          timeTable.activityRenderer.getTooltip(tooltipCtnr, act, act.row);
        }
      },
      enteringTooltipElement(actNode, act) {
        if (timeTable.isDragAndDropping()) return false;
        if (actNode) {
          timeTable.highlightActivity(actNode, true, true);
        }
        return true;
      },
      leavingTooltipElement(actNode, act) {
        if (actNode) {
          timeTable.highlightActivity(actNode, false, true);
        }
      },
    });
  }

  hideTooltip() {
    this.gantt.tooltip.hideTooltip(0);
  }
  /*                 */
  /*      Search     */
  /*                 */

  // noinspection JSUnusedGlobalSymbols
  searchActivities(row, filter) {
    const activities = row.activities;
    const actCount = activities && activities.length;
    if (actCount) {
      const filterFct =
        (typeof filter === 'string' && ((act, object, filter) => this.activityRenderer.filter(act, row, filter))) ||
        filter;
      for (let iAct = 0; iAct < actCount; ++iAct) {
        if (filterFct(activities[iAct], row, filter)) {
          return true;
        }
      }
    }
    return false;
  }

  /*                   */
  /*   Drag and drop   */
  /*                   */

  initDragAndDrop() {
    const node = this.body,
      timeTable = this;
    this.dragDropHandler = new DragDrop(node);
    this.dragDropHandler.addHandler({
      startMove(target, initOffsetX, initOffsetY) {
        const actNode = timeTable.getActivityNode(target);
        if (actNode) {
          this.activity = timeTable.getActivity(actNode);
          if (this.activity === null) {
            console.log('null activity!');
            return false;
          }
          this.initActivityRow = timeTable.getTimeTableRowNode(actNode);
          this.row = this.initRow = timeTable.getRow(this.initActivityRow.id.substring(ROW_ID_PREFIX.length));
          this.initTimeTablePos = timeTable.gantt.getTimeTableCoordinates(target, { x: initOffsetX, y: initOffsetY });
          this.initScrollLeft = node.scrollLeft;
          this.initScrollTop = node.scrollTop;
          this.timeLineItem = {
            start: new Date(this.activity.start),
            type: 'box',
          };
          this.timeLineItem.context = {
            start: this.timeLineItem.start.format(),
            startRow: this.initRow.name,
          };
          timeTable.hideTooltip();
          timeTable.gantt.highlightRow(this.row, true, true);
          timeTable.startDraggingActivity(this);
          return actNode;
        }
        return false;
      },
      move(pos) {
        pos.y = undefined; // We don't change the activity Y position
        const scrollDiffX = node.scrollLeft - this.initScrollLeft;
        if (scrollDiffX) {
          pos.dx += scrollDiffX;
          pos.x += scrollDiffX;
        }
        const scrollDiffY = node.scrollTop - this.initScrollTop;
        if (scrollDiffY) {
          pos.dy += scrollDiffY;
        }
        const preRow = this.row;
        const newRow = timeTable.gantt.table.getRowAt(this.initTimeTablePos.y + pos.dy, preRow);
        this.currentTime = new Date(timeTable.gantt.timeLine.getTimeAt(pos.x));
        if (newRow) {
          this.row = newRow;
          if (preRow.id !== newRow.id && this.initRow.id !== preRow.id) {
            // Keep highlighting the init row
            timeTable.gantt.highlightRow(preRow, false);
          }
          if (preRow.id !== newRow.id) {
            if (this.initRow.id !== preRow.id) {
              timeTable.gantt.highlightRow(preRow, false);
            }
            if (this.initRow.id !== newRow.id) {
              timeTable.gantt.highlightRow(newRow, true);
            }
            if (newRow.activityRow) {
              newRow.activityRow.rowNode.appendChild(timeTable.dragDropHandler.draggedObject);
            }
          }
          return this.row.id !== this.initRow.id
            ? timeTable.acceptActivityRowChange(this)
            : timeTable.acceptActivityMove(this);
        }

        return false;
      },
      moved() {
        this.updateTimeLineItem();
      },
      restoreInitPosition() {
        if (this.row && this.initRow.id !== this.row.id) {
          timeTable.gantt.highlightRow(this.row, false);
          this.row = this.initRow;
        }
        node.scrollTop = this.initTop;
      },
      stopMove() {
        timeTable.stopDraggingActivity(this);
        timeTable.gantt.timeLine.removeTimeLineItem(TIME_MARKER_DRAG_ITEM);
        if (this.row) {
          timeTable.gantt.highlightRow(this.row, true, true);
        }
      },
      applyMove() {
        timeTable.applyActivityMove(this);
      },
      cancel() {
        timeTable.abortActivityMove();
      },
      updateTimeLineItem() {
        timeTable.gantt.timeLine.setTimeLineItem(TIME_MARKER_DRAG_ITEM, this.createDragTimeLineItem());
      },
      createDragTimeLineItem() {
        const item = this.timeLineItem,
          changeRow = this.row.id !== this.initRow.id;
        item.className = `${TIME_MARKER_DRAG_ITEM} ${
          timeTable.dragDropHandler.invalid ? 'dragg-invalid' : 'dragg-valid'
        }`;
        // item.context.draggStatusClass = dragDropHandler.invalid? 'dragg-invalid' : 'dragg-valid';
        item.context.current = this.currentTime.format();
        item.start = this.currentTime;
        item.context.title = Gantt.utils.formatString(
          changeRow ? 'Gantt.ChangeActivityRow' : 'Gantt.MoveActivity',
          this.activity
        );
        if (changeRow) {
          item.context.currentRow = this.row.name;
        }
        item.content = Gantt.utils.formatString(
          changeRow ? 'timeLine.changeRowItem.fmt' : 'timeLine.newTimeItem.fmt',
          item.context
        );
        return item;
      },
    });
    this.dragDropHandler.addEventListener(node, 'mousedown', this.dragDropHandler.startDragMouse, true); // Capturing!
  }

  startDraggingActivity(actParam) {
    if (this.moveInterator && this.moveInterator.startMove) {
      this.moveInterator.startMove(actParam);
    }
  }

  acceptActivityRowChange(actParam) {
    if (this.moveInterator && this.moveInterator.acceptRowChange) {
      return this.moveInterator.acceptRowChange(actParam);
    }
    return true;
  }

  acceptActivityMove(actParam) {
    if (this.moveInterator && this.moveInterator.acceptMove) {
      return this.moveInterator.acceptMove(actParam);
    }
    return true;
  }

  abortActivityMove(actParam) {
    if (this.moveInterator && this.moveInterator.abortMove) {
      return this.moveInterator.abortMove(actParam);
    }
    return true;
  }

  applyActivityMove(actParam) {
    if (this.moveInterator && this.moveInterator.applyMove) {
      return this.moveInterator.applyMove(actParam);
    }
    return true;
  }

  stopDraggingActivity(actParam) {
    if (this.moveInterator && this.moveInterator.stopMove) {
      return this.moveInterator.stopMove(actParam);
    }
    return true;
  }

  isDragAndDropping() {
    return this.dragDropHandler && this.dragDropHandler.draggedObject;
  }

  /*  Selection methods  */
  processClick(e) {
    this.hideTooltip();
    this.processMouseEvent(
      e,
      (e, row, date) => {
        this.gantt.highlightRow(row, true, true);
        this.gantt.selection.processClick(e, row);
        if (this.mouseHandler && this.mouseHandler.rowClicked) {
          this.mouseHandler.rowClicked(e, row, date);
        }
      },
      (e, activity, date, row) => {
        this.gantt.selection.processClick(e, activity);
        if (this.mouseHandler && this.mouseHandler.activityClicked) {
          this.mouseHandler.activityClicked(e, activity, date, row);
        }
      }
    );
  }

  processMouseEvent(e, rowCB, activityCB) {
    // const date = new Date(this.gantt.timeLine.getTimeAt(pos.x));
    const coord = this.gantt.getTimeTableCoordinates(e.target, { x: event.offsetX, y: event.offsetY });
    const date = new Date(this.gantt.timeLine.getTimeAt(coord.x));
    if (e.target && Gantt.utils.hasClass(e.target, TIME_TABLE_ROW)) {
      const row = this.getRow(e.target.id.substring(ROW_ID_PREFIX.length));
      if (row) {
        this.gantt.highlightRow(row, true, true);
        if (rowCB) {
          rowCB(e, row, date);
        }
        this.gantt.selection.processClick(e, row);
      }
    } else {
      const actNode = Gantt.utils.closest(e.target, `.${TIME_TABLE_ACTIVITY_CLASSNAME}`);
      const act = actNode && this.getActivity(actNode);
      if (act) {
        let row = act.row;
        if (!row) {
          const rowNode = Gantt.utils.closest(e.target, `.${TIME_TABLE_ROW}`);
          row = this.getRow(rowNode.id.substring(ROW_ID_PREFIX.length));
        }
        if (row) {
          this.gantt.highlightRow(row, true, true);
        }
        if (activityCB) {
          activityCB(e, act, date, row);
        }
      }
    }
  }

  processDoubleClick(e) {
    this.hideTooltip();
    this.processMouseEvent(
      e,
      (e, row, date) => {
        if (this.mouseHandler && this.mouseHandler.rowDoubleClicked && row) {
          this.mouseHandler.rowDoubleClicked(e, row, date);
        }
      },
      (e, activity, date, row) => {
        if (this.mouseHandler && this.mouseHandler.activityDoubleClicked) {
          this.mouseHandler.activityDoubleClicked(e, activity, date, row);
        }
      }
    );
  }

  processMouseDown(e) {
    this.hideTooltip();
    if (e.which === 3) {
      this.processMouseEvent(
        e,
        (e, row, date) => {
          if (this.mouseHandler && this.mouseHandler.rowRightClicked && row) {
            this.mouseHandler.rowRightClicked(e, row, date);
          }
        },
        (e, activity, date, row) => {
          if (this.mouseHandler && this.mouseHandler.activityRightClicked) {
            this.mouseHandler.activityRightClicked(e, activity, date, row);
          }
        }
      );
      e && e.preventDefault && e.preventDefault();
      e && e.stopPropagation && e.stopPropagation();
      return false;
    }
  }

  // noinspection JSMethodCanBeStatic
  clearActivitySelection(sels) {
    for (let i = 0, count = sels.length, sel; i < count; ++i) {
      sel = sels[i];
      if (sel.node) {
        Gantt.utils.removeClass(sel.node, SELECTION_CLASS);
      }
    }
  }

  // noinspection JSMethodCanBeStatic
  selectActvities(sels) {
    for (let i = 0, node; i < sels.length; i++) {
      if ((node = sels[i].node)) {
        Gantt.utils.addClass(node, SELECTION_CLASS);
      }
    }
  }

  // noinspection JSMethodCanBeStatic
  unselectActvities(sels) {
    for (let i = 0, node; i < sels.length; i++) {
      if ((node = sels[i].node)) {
        Gantt.utils.removeClass(node, SELECTION_CLASS);
      }
    }
  }

  // noinspection JSMethodCanBeStatic
  selectRows(rows) {
    for (let i = 0, node; i < rows.length; i++) {
      if ((node = rows[i].activityRow) && (node = node.rowNode)) {
        Gantt.utils.addClass(node, SELECTION_CLASS);
      }
    }
  }

  // noinspection JSMethodCanBeStatic
  unselectRows(rows) {
    for (let i = 0, node; i < rows.length; i++) {
      if ((node = rows[i].activityRow) && (node = node.rowNode)) {
        Gantt.utils.removeClass(node, SELECTION_CLASS);
      }
    }
  }

  rowSelectionChanged() {
    this.draw();
  }

  //
  // Decoration management
  //
  generateGlobalDecorations(ctx) {
    const decoContainer = this.gantt.timeLine.getDecorationContainer();
    if (!decoContainer) {
      console.warn('No decoration container found in time line');
      return;
    }
    if (this.backgroundCtnr) {
      decoContainer.removeChild(this.backgroundCtnr);
      this.backgroundCtnr = null;
    }
    if (this.activityRenderer.generateDecorations) {
      const ctnr = document.createElement('div');
      ctnr.className = 'time-table-decoration-ctnr decoration-background-ctnr';
      ctnr.style.position = 'absolute';
      ctnr.style.left = 0;
      ctnr.style.top = 0;
      ctnr.style.bottom = 0;
      ctnr.style.width = '100%';
      ctnr.style.height = '100%';

      const objs = this.activityRenderer.generateDecorations(ctx.horiz.start, ctx.horiz.end, ctx);
      for (let i = 0, count = objs ? objs.length : 0, obj; i < count; ++i) {
        obj = objs[i];
        // noinspection JSUnresolvedVariable
        this.addDecoration(obj, ctnr);
      }
      if (ctnr.firstChild) {
        decoContainer.appendChild((this.backgroundCtnr = ctnr));
      }
    }
  }

  generateRowDecorations(row, rowNode, ctx) {
    const objs = this.activityRenderer.generateRowDecorations(row, ctx.horiz.start, ctx.horiz.end, ctx);
    for (let i = 0, count = objs ? objs.length : 0, obj, node; i < count; ++i) {
      obj = objs[i];
      node = this.addDecoration(obj, rowNode);
      // noinspection JSUnresolvedVariable
      node.style.zIndex = obj.foreground ? 1 : -1;
    }
  }

  addDecoration(obj, ctnr) {
    let node;
    if (obj.create) {
      node = obj.create();
    } else {
      node = document.createElement('div');
      if (obj.type) {
        if (obj.type === DECORATION_INVALID_TYPE) {
          node.className = DECORATION_INVALID_CLASS;
        } else if (obj.type === DECORATION_BREAK_TYPE) {
          node.className = DECORATION_BREAK_CLASS;
        }
      } else {
        node.className = DECORATION_BREAK_CLASS;
      }
      node.display = 'inline-block';
    }

    if (obj.className) {
      Gantt.utils.addClass(node, obj.className);
    }

    node.style.position = 'absolute';
    if (obj.background) {
      node.style.background = obj.background;
    }
    // noinspection JSUnresolvedVariable
    if (obj.color || obj.foreground) {
      // noinspection JSUnresolvedVariable
      node.style.color = obj.color || obj.foreground;
    }
    const left = this.gantt.timeLine.getXFromMillis(obj.start);
    node.style.left = `${left}px`;
    node.style.width = this.gantt.timeLine.getXFromMillis(obj.end) - left;
    node.style.top = '1px';
    node.style.bottom = '1px';
    ctnr.appendChild(node);
    return node;
  }

  //
  // Constraints
  //

  createConstraintGrapherNode() {
    if (this.ctsGraph && this.ctsGraph.node) {
      this.body.removeChild(this.ctsGraph.node);
    }
    const ctsNode = document.createElement('div');
    ctsNode.className = 'constraints-grapher';
    ctsNode.style.height = '100%';
    ctsNode.style.width = '100%';
    ctsNode.style.position = 'relative';
    ctsNode.style.pointerEvents = 'none';
    return ctsNode;
  }

  setConstraints(constraints) {
    this.constraints = constraints;
    if (constraints && constraints.length) {
      if (!this.ctsGraph) {
        const ctsNode = this.createConstraintGrapherNode();
        this.ctsGraph = new (Gantt.components.ConstraintsGraph.impl || Gantt.components.ConstraintsGraph)(
          this.gantt,
          ctsNode,
          this.gantt.config && this.gantt.config.constraints
        );
        this.body.appendChild(ctsNode);
      }
      this.ctsGraph.setConstraints(constraints);
    } else if (this.ctsGraph) {
      if (this.ctsGraph.node) {
        this.body.removeChild(this.ctsGraph.node);
      }
      if (this.ctsGraph.destroy) {
        this.ctsGraph.destroy();
      }
      this.ctsGraph = null;
    }
  }

  resetConstraints() {
    const ctsNode = this.createConstraintGrapherNode();
    this.ctsGraph.setNode(ctsNode); // Instead of removing all links, we change the link container
    this.ctsGraph.setConstraints(this.constraints);
    this.body.appendChild(ctsNode);
  }

  //
  // Destroy
  //
  destroy() {
    if (this.backgroundCtnr) {
      this.node.removeChild(this.backgroundCtnr);
      this.backgroundCtnr = null;
    }
    if (this.foregroundCtnr) {
      this.node.removeChild(this.foregroundCtnr);
      this.foregroundCtnr = null;
    }
    if (this.activityRenderer) {
      this.activityRenderer.destroy();
      this.activityRenderer = null;
    }

    if (this.ctsGraph) {
      this.ctsGraph.destroy();
      this.ctsGraph = null;
    }
  }
}

Gantt.components.TimeTable.impl = TimeTable;

if (module.hot) {
  module.hot.accept();
}
