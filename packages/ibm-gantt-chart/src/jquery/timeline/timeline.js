import $ from 'jquery';

import momentIntl from 'moment-with-locales-es6';
import vis from 'vis';

import Gantt from '../../core/core';

import './timeline.scss';

const defaultConfig = {
  scrollableHorizonFactor: 3,
  margin: 20,
};

export default class TimeLine extends Gantt.components.TimeLine {
  constructor(gantt, elt, config) {
    super(gantt, elt, Gantt.utils.mergeObjects({}, defaultConfig, config));
    this.create();
  }

  create() {
    this.scrollableHorizonFactor = Math.max((this.config && this.config.scrollableHorizonFactor) || 3, 1);
    this.items = [];
    this.itemsByIds = {};
    this._init = false;
  }

  setTimeWindow(start, end) {
    if (this.timeLineElt) {
      this.node.removeChild(this.timeLineElt);
    }
    this.timeLineElt = document.createElement('div');
    this.timeLineElt.style.width = `${this.node.offsetWidth * this.scrollableHorizonFactor}px`;
    this.timeLineElt.style.height = '100%';

    const data = [];
    const span = end - start;
    this.scrollableHorizon = {
      start: Math.round(start - ((this.scrollableHorizonFactor - 1) / 2) * span),
      end: Math.round(end + ((this.scrollableHorizonFactor - 1) / 2) * span),
    };
    const intl = Gantt.utils.getIntl();
    if (intl) {
      if (intl.locale) {
        momentIntl.locale(intl.locale);
      }
    }
    try {
      // See https://github.com/almende/vis/issues/24 for time zone hack
      this.visTimeline = new vis.Timeline(this.timeLineElt, data, {
        // 'millisecond', 'second', 'minute', 'hour', 'weekday', 'day', 'month', 'year'
        orientation: { axis: 'top', item: 'top' },
        height: '100%',
        start: this.scrollableHorizon.start,
        end: this.scrollableHorizon.end,
        moment: momentIntl,
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
    this.horizon = { start, end };
    this.node.appendChild(this.timeLineElt);
    this.zoomFactor = 1;

    const initPromise = new Promise((resolve, reject) => {
      this.initResolve = resolve;
    });
    this.visTimeline.on('rangechanged', () => {
      this.updateRatio();
    });
    this._init = false;
    var fireReady = () => {
      this._init = true;
      const window = this.visTimeline.getWindow();
      window.startMillis = window.start.getTime();
      window.endMillis = window.end.getTime();
      this.updateRatio();
      const wnd = { start, end };
      this.initResolve(wnd);
      this.visTimeline.off('changed', fireReady);
      this.triggerEvent(Gantt.events.TIME_LINE_INIT, wnd);
    };
    this.visTimeline.on('changed', fireReady);
    this.visTimeline.on('rangechange', () => {
      this.updateRatio();
      this.triggerEvent(Gantt.events.TIME_LINE_RANGE_CHANGE);
    });
    this.visTimeline.on('rangechanged', () => {
      this.updateRatio();
      this.triggerEvent(Gantt.events.TIME_LINE_RANGE_CHANGED);
    });
    this.visTimeline.on('pan', () => {
      this.triggerEvent(Gantt.events.TIME_LINE_PAN_MOVE);
    });
    this.visTimeline.on('panend', () => {
      this.triggerEvent(Gantt.events.TIME_LINE_PAN_MOVED);
    });
    return initPromise;
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

  updateRatio() {
    this.window = this.visTimeline.getWindow();
    this.window.startMillis = this.window.start.getTime();
    this.window.endMillis = this.window.end.getTime();
    this.scrollableHorizon.start = this.window.startMillis;
    this.scrollableHorizon.end = this.window.endMillis;
    this.ratio = this.getWidth() / (this.window.endMillis - this.window.startMillis);
  }

  getXFromMillis(time) {
    return Math.round((time - this.scrollableHorizon.start) * this.ratio);
    // return (time - this.window.startMillis) * this.ratio;
  }

  getX(time) {
    return Math.round((time - this.scrollableHorizon.start) * this.ratio);
  }

  getTimeAt(x) {
    return (
      this.scrollableHorizon.start +
      Math.round((x / this.getWidth()) * (this.scrollableHorizon.end - this.scrollableHorizon.start))
    );
  }

  getTimeAxisHeight(defaultValue) {
    const visTimeAxis = this.timeLineElt && this.timeLineElt.getElementsByClassName('vis-panel vis-top');
    // Cannot use native offsetHeight as it is rounding dimensions
    // See warning at https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetHeight
    return (visTimeAxis && visTimeAxis.length && $(visTimeAxis[0]).outerHeight()) || defaultValue;
  }

  getTimeWindow() {
    return this.visTimeline && this.visTimeline.getWindow();
  }

  draw() {}

  onResize() {
    if (this._init) {
      this.updateRatio();
    }
  }

  validateZoomFactor(zoomFactor) {
    if (this.zoomFactor + zoomFactor < 1) {
      return 0;
    }
    return zoomFactor;
  }

  zoom(zoomFactor, xCenter) {
    this.zoomFactor += zoomFactor;
    const w = this.getWidth() + zoomFactor * this.getWidth();
    this.timeLineElt.style.width = `${w}px`;
    this.updateRatio();

    this.triggerEvent(Gantt.events.TIME_LINE_SIZE_CHANGED, w, this.getTimeAxisHeight());
  }

  resetZoom() {
    this.zoomFactor = 1;
    const w = this.node.offsetWidth * this.scrollableHorizonFactor;
    this.timeLineElt.style.width = `${w}px`;
    this.updateRatio();
    this.triggerEvent(Gantt.events.TIME_LINE_SIZE_CHANGED, w, this.getTimeAxisHeight());
  }

  setVisibleTimeWindow(window) {
    if (!window || !window.start || !window.end) {
      this.resetZoom();
    } else {
      const horizPageCount = (this.scrollableHorizon.end - this.scrollableHorizon.start) / (window.end - window.start);
      this.zoomFactor = horizPageCount / this.scrollableHorizonFactor;
      const w = horizPageCount * this.node.offsetWidth;
      this.timeLineElt.style.width = `${w}px`;
      this.updateRatio();
      this.triggerEvent(Gantt.events.TIME_LINE_SIZE_CHANGED, w, this.getTimeAxisHeight());
    }
  }

  getVisibleTimes() {
    return { start: this.window.startMillis, end: this.window.endMillis };
  }

  scrollTo(time, animate) {
    const range = this.visTimeline.getWindow();
    const interval = range.end - range.start;

    this.visTimeline.setWindow(time, time + interval, animate === undefined ? undefined : { animation: animate });
  }

  /*           Markers        */
  addTimeMarker(id, time, classes) {
    const ar = this.visTimeline.customTimes;
    const l = ar && ar.length;
    this.visTimeline.addCustomTime(time, id);

    // Retrieve the node associate with the time marker
    if (ar && ar.length && ar.length !== l) {
      const markerObj = this.visTimeline.customTimes[l];
      if (markerObj && markerObj.bar) {
        $(markerObj.bar).css('top', `${this.getTimeAxisHeight() - 3}px`);
      }
    }
  }

  removeTimeMarker(id, time, classes) {
    this.visTimeline.removeCustomTime(id);
  }

  createVisItem(item) {
    return {
      start: item.start || (item.type === 'background' ? this.window.startMillis : undefined),
      end: item.end || (item.type === 'background' ? this.window.endMillis : undefined),
      title: item.title,
      type:
        item.type === 'background'
          ? 'background'
          : item.type === 'box'
          ? 'box'
          : item.type === 'point'
          ? 'point'
          : 'background',
      className: item.className,
      content: item.content,
    };
  }

  setTimeLineItem(id, item) {
    this.removeTimeLineItem(id, false);
    this.addTimeLineItem(id, item);
  }

  addTimeLineItem(id, item, update) {
    item = this.createVisItem(item);
    this.items.push(item);
    this.itemsByIds[id] = item;
    if (update === undefined || update) {
      this.visTimeline.setItems(this.items);
    }
  }

  removeTimeLineItem(id, update) {
    const item = this.itemsByIds[id];
    if (item) {
      delete this.itemsByIds[id];
      const index = this.items.indexOf(item);
      if (index > -1) {
        this.items.splice(index, 1);
      }
      if (update === undefined || update) {
        this.visTimeline.setItems(this.items);
      }
    }
  }

  //
  // Decorations
  getDecorationContainer() {
    const $panel = $(this.timeLineElt).find('.vis-panel.vis-background.vis-horizontal');
    return ($panel.length && $panel[0]) || null;
  }
}

Gantt.components.TimeLine.impl = TimeLine;
