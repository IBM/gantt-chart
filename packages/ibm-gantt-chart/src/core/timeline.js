import { Timeline as VisTimeline } from 'vis-timeline/peer';

import Gantt from './core';

const defaultConfig = {
  scrollableHorizonFactor: 3,
  margin: 20,
};

class TimeLine extends Gantt.components.TimeLine {
  constructor(gantt, node, config) {
    super(gantt, node, Gantt.utils.mergeObjects({}, defaultConfig, config));
    this.scrollableHorizonFactor = Math.max(this.config.scrollableHorizonFactor || 3, 1);
    this.items = [];
    this.itemsByIds = Object.create(null);
    this.initialized = false;
  }

  setTimeWindow(start, end) {
    this.timeLineElt?.remove();
    this.timeLineElt = document.createElement('div');
    this.timeLineElt.style.width = `${this.node.offsetWidth * this.scrollableHorizonFactor}px`;
    this.timeLineElt.style.height = '100%';

    const span = end - start;
    this.scrollableHorizon = {
      start: Math.round(start - ((this.scrollableHorizonFactor - 1) / 2) * span),
      end: Math.round(end + ((this.scrollableHorizonFactor - 1) / 2) * span),
    };
    this.visTimeline = new VisTimeline(this.timeLineElt, [], {
      orientation: { axis: 'top', item: 'top' },
      height: '100%',
      start: this.scrollableHorizon.start,
      end: this.scrollableHorizon.end,
    });
    const intl = Gantt.utils.getIntl();
    if (intl?.locale) this.visTimeline.setOptions({ locale: intl.locale });

    this.horizon = { start, end };
    this.node.appendChild(this.timeLineElt);
    this.zoomFactor = 1;
    this.initialized = false;

    this.visTimeline.on('rangechange', () => {
      if (!this.initialized || !this.gantt?.timeTable || !this.gantt?.table) return;
      this.updateRatio();
      this.triggerEvent(Gantt.events.TIME_LINE_RANGE_CHANGE);
    });
    this.visTimeline.on('rangechanged', () => {
      if (!this.initialized || !this.gantt?.timeTable || !this.gantt?.table) return;
      this.updateRatio();
      this.triggerEvent(Gantt.events.TIME_LINE_RANGE_CHANGED);
    });
    this.visTimeline.on('pan', () => this.triggerEvent(Gantt.events.TIME_LINE_PAN_MOVE));
    this.visTimeline.on('panend', () => this.triggerEvent(Gantt.events.TIME_LINE_PAN_MOVED));

    this.visTimeline.redraw();
    this.initialized = true;
    this.updateRatio();
    const window = { start, end };
    this.triggerEvent(Gantt.events.TIME_LINE_INIT, window);
    return Promise.resolve(window);
  }

  updateRatio() {
    const window = this.visTimeline.getWindow();
    this.window = { startMillis: window.start.getTime(), endMillis: window.end.getTime() };
    this.scrollableHorizon.start = this.window.startMillis;
    this.scrollableHorizon.end = this.window.endMillis;
    this.ratio = this.getWidth() / (this.window.endMillis - this.window.startMillis);
  }

  getWidth() {
    return this.timeLineElt.offsetWidth;
  }

  getHorizon() {
    return this.horizon;
  }

  getScrollableHorizon() {
    return this.scrollableHorizon;
  }

  getXFromMillis(time) {
    return Math.round((time - this.scrollableHorizon.start) * this.ratio);
  }

  getX(time) {
    return this.getXFromMillis(time);
  }

  getTimeAt(x) {
    return (
      this.scrollableHorizon.start +
      Math.round((x / this.getWidth()) * (this.scrollableHorizon.end - this.scrollableHorizon.start))
    );
  }

  getTimeAxisHeight(defaultValue) {
    const axis = this.timeLineElt?.querySelector('.vis-panel.vis-top');
    return axis?.getBoundingClientRect().height || defaultValue;
  }

  getTimeWindow() {
    return this.visTimeline?.getWindow();
  }

  draw() {}

  onResize() {
    if (this.initialized) this.updateRatio();
  }

  validateZoomFactor(zoomFactor) {
    return this.zoomFactor + zoomFactor < 1 ? 0 : zoomFactor;
  }

  zoom(zoomFactor) {
    this.zoomFactor += zoomFactor;
    const width = this.getWidth() * (1 + zoomFactor);
    this.timeLineElt.style.width = `${width}px`;
    this.updateRatio();
    this.triggerEvent(Gantt.events.TIME_LINE_SIZE_CHANGED, width, this.getTimeAxisHeight());
  }

  resetZoom() {
    this.zoomFactor = 1;
    const width = this.node.offsetWidth * this.scrollableHorizonFactor;
    this.timeLineElt.style.width = `${width}px`;
    this.updateRatio();
    this.triggerEvent(Gantt.events.TIME_LINE_SIZE_CHANGED, width, this.getTimeAxisHeight());
  }

  setVisibleTimeWindow(window) {
    if (!window?.start || !window?.end) {
      this.resetZoom();
      return;
    }
    const pageCount = (this.scrollableHorizon.end - this.scrollableHorizon.start) / (window.end - window.start);
    this.zoomFactor = pageCount / this.scrollableHorizonFactor;
    const width = pageCount * this.node.offsetWidth;
    this.timeLineElt.style.width = `${width}px`;
    this.updateRatio();
    this.triggerEvent(Gantt.events.TIME_LINE_SIZE_CHANGED, width, this.getTimeAxisHeight());
  }

  getVisibleTimes() {
    return { start: this.window.startMillis, end: this.window.endMillis };
  }

  scrollTo(time, animate) {
    const range = this.visTimeline.getWindow();
    const interval = range.end.getTime() - range.start.getTime();
    this.visTimeline.setWindow(time, time + interval, animate === undefined ? undefined : { animation: animate });
  }

  addTimeMarker(id, time) {
    this.visTimeline.addCustomTime(time, id);
  }

  removeTimeMarker(id) {
    this.visTimeline.removeCustomTime(id);
  }

  createVisItem(item) {
    return {
      start: item.start || (item.type === 'background' ? this.window.startMillis : undefined),
      end: item.end || (item.type === 'background' ? this.window.endMillis : undefined),
      title: item.title,
      type: ['background', 'box', 'point'].includes(item.type) ? item.type : 'background',
      className: item.className,
      content: item.content,
    };
  }

  setTimeLineItem(id, item) {
    this.removeTimeLineItem(id, false);
    this.addTimeLineItem(id, item);
  }

  addTimeLineItem(id, item, update = true) {
    const visItem = this.createVisItem(item);
    this.items.push(visItem);
    this.itemsByIds[id] = visItem;
    if (update) this.visTimeline.setItems(this.items);
  }

  removeTimeLineItem(id, update = true) {
    const item = this.itemsByIds[id];
    if (!item) return;
    const index = this.items.indexOf(item);
    if (index >= 0) this.items.splice(index, 1);
    delete this.itemsByIds[id];
    if (update) this.visTimeline.setItems(this.items);
  }

  destroy() {
    this.initialized = false;
    this.visTimeline?.destroy();
    this.visTimeline = undefined;
    this.timeLineElt?.remove();
    this.timeLineElt = undefined;
    this.items = [];
    this.itemsByIds = Object.create(null);
    super.destroy();
  }
}

Gantt.components.TimeLine.impl = TimeLine;

export default TimeLine;
