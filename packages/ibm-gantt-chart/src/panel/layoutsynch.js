import Gantt from '../core/core';

function sameBounds(rect1, rect2) {
  if (!rect1 || !rect2) {
    return !rect1 === !rect2;
  }
  return rect1.x === rect2.x && rect1.y === rect2.y && rect1.width === rect2.width && rect1.height === rect2.height;
}

function bounds(x, y, width, height) {
  return {
    x,
    y,
    width,
    height,
    toString() {
      return `{ x = ${this.x}, y = ${this.y}, width = ${this.width}, height = ${this.height} }`;
    },
  };
}

export default class LayoutSynchronizer extends Gantt.components.LayoutSynchronizer {
  constructor(config, proto) {
    super(config, config);
    this.timeTableBounds = null;
  }

  setConfiguration(config) {
    if (config) {
      Gantt.utils.mergeObjects(this, config);
    }
  }

  connect(gantt) {
    this.gantt = gantt;
    this.resizeHandler = e => {
      this.checkBounds();
    };
    gantt.on([Gantt.events.RESIZED, Gantt.events.SPLIT_RESIZED], this.resizeHandler);

    this.timeWindowChangeListener = (e, start, end) => {
      this.timeWindowChanged(start, end);
    };
    gantt.on(Gantt.events.TIME_WINDOW_CHANGED, this.timeWindowChangeListener);

    this.timeLineSizeListener = (e, width, height) => {
      this.timeLineSizeChanged(width, height);
    };
    gantt.on(Gantt.events.TIME_LINE_SIZE_CHANGED, this.timeLineSizeListener);

    this.timeLineInitializedListener = e => {
      this.timeLineInitialized();
    };
    gantt.on(Gantt.events.TIME_LINE_INIT, this.timeLineInitializedListener);

    this.timeLineScrollListener = (e, x) => {
      this.timeLineScrolled(x);
    };
    gantt.on(Gantt.events.TIME_LINE_SCROLLED, this.timeLineScrollListener);
  }

  convertBounds(bounds, elt) {
    const parent = Gantt.utils.offsetParent(elt);
    const parentBounds = Gantt.utils.getScreenPoint(parent);
    parentBounds.x = bounds.x - parentBounds.x;
    parentBounds.y = bounds.y - parentBounds.y;
    parentBounds.width = bounds.width;
    parentBounds.height = bounds.height;
    return parentBounds;
  }

  //
  // Time line methods
  //

  getTimeLine() {
    return this.gantt.timeLine;
  }

  getTimeLineWidth() {
    return this.gantt.timeLine.getWidth();
  }

  getTimeLineHeight() {
    return this.gantt.timeLine.getTimeAxisHeight();
  }

  getTimeLineScrollLeft() {
    return this.gantt.timeTable.getScroller().scrollLeft;
  }

  getTimeAt(x) {
    return this.gantt.timeLine.getTimeAt(x);
  }

  timeLineInitialized() {}

  timeTableBoundsChanged(bounds) {}

  timeWindowChanged(start, end) {}

  timeLineSizeChanged(width, height) {}

  timeLineScrolled(x) {}

  checkBounds() {
    const newBounds = this.getScreenTimeTableScrollerBounds();
    if (newBounds) {
      if (!sameBounds(this.timeTableBounds, newBounds)) {
        this.timeTableBounds = newBounds;
        this.timeTableBoundsChanged(newBounds);
      }
    }
  }

  getScreenTimeTableScrollerBounds() {
    if (!this.gantt.timeTable) {
      // Called from first cycle of the Gantt initialization
      return null;
    }
    const timeTableScroller = this.gantt.timeTable.getScroller();
    const pt = Gantt.utils.getScreenPoint(timeTableScroller);
    return bounds(pt.x, pt.y, this.gantt.timeTable.getVisibleWidth(), this.gantt.timeTable.getVisibleHeight());
  }

  disconnect() {
    if (this.gantt) {
      this.gantt.off([Gantt.events.RESIZED, Gantt.events.SPLIT_RESIZED], this.resizeHandler);
      this.gantt.off(Gantt.events.TIME_WINDOW_CHANGED, this.timeWindowChangeListener);
      this.gantt.off(Gantt.events.TIME_LINE_SIZE_CHANGED, this.timeLineSizeListener);
      this.gantt.off(Gantt.events.TIME_LINE_INIT, this.timeLineInitializedListener);
      this.gantt.off(Gantt.events.TIME_LINE_SCROLLED, this.timeLineScrollListener);
    }
  }

  destroy() {}
}

Gantt.components.LayoutSynchronizer.impl = LayoutSynchronizer;
