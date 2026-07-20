import Gantt from '../core';
import Component from './Component';

/**
 *
 * <br>Emmits events: <ul>
 *   <li>Gantt.events.TABLE_INIT</li>
 *   <li>Gantt.events.ROWS_ADDED</li>
 *   <li>Gantt.events.ROWS_REMOVED</li>
 *   <li>Gantt.events.ROWS_MODIFIED</li>
 *   <li>Gantt.events.ROWS_FILTERED</li>
 * </ul>
 */
export default class GanttPanel extends Component {
  constructor(node, config) {
    super(node, config);
    this.node = node;
    this.events = Gantt.events;
    this.constraintTypes = Gantt.constraintTypes;
  }

  setConfiguration(config) {}

  draw() {}

  startUpdating() {}

  stopUpdating() {}

  getModel() {}

  getRowCount() {
    return 0;
  }

  getRow(param) {
    return null;
  }

  getVisiibleRows() {
    return [];
  }

  ensureRowVisible(param) {}

  isRowVisible(param) {}

  getFirstVisibleRow() {}

  setFirstVisibleRow(row) {}

  isRowFiltered(param) {}

  toggleCollapseRow(param, collapse) {}

  scrollToY(y) {}

  getRowActivities(param) {}

  resetZoom() {}

  zoomIn(evt) {}

  zoomOut(evt) {}

  zoom(zoomFactor, evt) {}

  fitToContent() {}

  getVisibleHeight() {
    return 0;
  }

  highlightRow(row, highlight, deselectAll) {}

  /*                        */
  /*    Search and filter   */
  /*                        */
  addFilter(rowFilter, rows, activities) {}

  removeFilter(key, preventNotify) {}

  search(text, rows, activities) {}

  setHideEmptyRows(hide, preventNotify) {}

  /*                        */
  /*          Utils         */
  /*                        */
}
