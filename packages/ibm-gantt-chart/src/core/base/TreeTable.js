import Gantt from '../core';
import { getComponent } from '../component-factory';
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
class TreeTable extends Component {
  constructor(gantt, node, config) {
    super(gantt, config);
    this.node = node;
  }

  setRows(rows) {}

  getRowCount() {
    return 0;
  }

  isRowVisible(param) {}

  deleteDrawCache() {}

  draw() {}

  drawRows(selector) {}

  createUpdates(parent) {
    return new (getComponent('GanttUpdates', Gantt.components.GanttUpdates))(parent);
  }

  highlightRow(row, highlight, deselectAll) {}

  setRowFilter(filter) {}

  filterChanged() {}

  isRowFiltered(row) {
    return false;
  }

  toggleCollapseRow(param, collapse) {}

  setHeaderHeight(height) {}

  getTableBody() {}

  getScrollableTable() {}

  getTop(tr) {
    return (tr && tr.offsetTop - this.getTableBody().offsetTop) || 0;
  }

  getRowAt(y) {}

  getHeight() {}

  nextRow(row) {
    return null;
  }

  prevRow(row) {
    return null;
  }

  getRow(id) {
    return null;
  }

  getRows(selector) {}

  getRowName(row) {
    return row.name;
  }

  getRowTop(row) {
    return (row.tr && row.tr.offsetTop - this.getTableBody().offsetTop) || 0;
  }

  expandParents(row) {}
}

const CallableTreeTable = new Proxy(TreeTable, {
  apply(target, instance, args) {
    const [gantt, node, config] = args;
    instance.gantt = gantt;
    instance.config = config;
    instance.utils = Gantt.utils;
    instance.__events = undefined;
    instance.node = node;
    return instance;
  },
});

CallableTreeTable.defaultClass = '';

export default CallableTreeTable;
