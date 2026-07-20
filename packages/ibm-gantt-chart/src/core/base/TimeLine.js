import Gantt from '../core';
import Component from './Component';

/**
 *
 * <br>Emmits events: <ul>
 *   <li>Gantt.events.TIME_LINE_INIT</li>
 *   <li>Gantt.events.TIME_LINE_RANGE_CHANGE</li>
 *   <li>Gantt.events.TIME_LINE_RANGE_CHANGED</li>
 *   <li>Gantt.events.TIME_LINE_PAN_MOVED</li>
 *   <li>Gantt.events.TIME_LINE_SIZE_CHANGED</li>
 * </ul>
 */
export default class TimeLine extends Component {
  constructor(gantt, node, config) {
    super(gantt, config);
    this.node = node;
  }

  setTimeWindow(start, end) {}

  getTimeAxisHeight() {
    return 0;
  }

  draw() {}

  validateZoomFactor(zoomFactor) {}

  getXFromMillis(time) {}

  getDecorationContainer() {}

  /**
   * Returns the current time horizon, an object with two start and end time properties, time given in milliseconds
   */
  getHorizon() {}

  getScrollableHorizon() {}

  setVisibleTimeWindow(window) {}

  resetZoom() {}

  /**
   * Markers
   */
  addTimeMarker(id, time, classes) {}

  removeTimeMarker(id) {}

  setTimeLineItem(id, item) {}

  addTimeLineItem(id, item) {}

  removeTimeLineItem(id) {}
}
