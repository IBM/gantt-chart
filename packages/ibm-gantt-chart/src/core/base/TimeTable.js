import Gantt from '../core';
import { getComponent } from '../component-factory';
import Component from './Component';

export default class TimeTable extends Component {
  constructor(gantt, node, config) {
    super(gantt, config);
    this.node = node;
    this.setConfiguration(config);
  }

  setConfiguration(config) {}

  draw() {}

  createUpdates(parent) {
    return new (getComponent('GanttUpdates', Gantt.components.GanttUpdates))(parent);
  }

  highlightRow(row, highlight, deselectAll) {}

  getDisplayedActivitiesTimeRange() {}

  searchActivities(row, callback) {}

  setConstraints(constraints) {}

  update() {}

  scrollToRow(row) {}

  scrollToY(y) {}

  setScrollTop(y) {}

  setFirstVisibleRow(row) {}

  getScrollLeft() {}

  setScrollLeft(x) {}

  /**
   * Returns the component responsible for scrolling the time table.
   */
  getScroller() {}

  getVisibleWidth() {}

  getVisibleHeight() {}

  // Called to adjust the time table body width according to the time line width
  setBodyWidth(w) {}

  getBodyWidth() {}

  // Called to adjust the height of the time  table body according to the height of the gantt table
  setBodyHeight(h) {}

  getBodyHeight() {}

  // To perfectly horizontally align the time line and the time table, we need to apply a right margin
  // to the time line corresponding to the width of the vertical scroller in the time table, if any.
  getRightMargin() {}

  // The time line bottom must stops where the horizontal scrollbar of the time table starts.
  // The getBottomMargin returns the height of this scrollbar.
  getBottomMargin() {}
}
