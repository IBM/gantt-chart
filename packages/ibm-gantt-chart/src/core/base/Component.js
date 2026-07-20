import Gantt from '../core';

/** @typedef {import('../types').ComponentConfig} ComponentConfig */
/** @typedef {import('../types').EventHandler} EventHandler */
/** @typedef {import('../types').GanttInstance} GanttInstance */

export default class Component {
  /**
   * @param {unknown} gantt
   * @param {ComponentConfig} [config]
   */
  /**
   * @param {GanttInstance} gantt
   * @param {ComponentConfig} [config]
   */
  constructor(gantt, config) {
    this.gantt = gantt;
    this.config = config;
    this.utils = Gantt.utils;
    /** @type {Record<string, EventHandler[]>} */
    this.__events = undefined;
  }

  /**
   * @param {string|string[]} event
   * @param {EventHandler} handler
   */
  on(event, handler) {
    const events = this.__events || (this.__events = {});
    let ar;
    const eventList = (this.utils.isArray(event) && event) || event.split(' ');
    for (let i = 0; i < eventList.length; i++) {
      event = eventList[i];
      if (!(ar = events[event])) {
        events[event] = ar = [handler];
      } else {
        ar.push(handler);
      }
    }
  }

  one(events, handler) {
    const wrapperHandler = (...params) => {
      handler.apply(this, params);
      // remove the handler after it has been notified
      const event = params[0];
      const index = this.__events[event].indexOf(wrapperHandler);
      if (index > -1) {
        this.__events[event].splice(index, 1);
      }
    };
    this.on(events, wrapperHandler);
  }

  off(event, handler) {
    if (this.__events) {
      let ar, i;
      const eventList = (this.utils.isArray(event) && event) || event.split(' ');
      for (let iEvent = 0; iEvent < eventList.length; iEvent++) {
        event = eventList[iEvent];
        if ((ar = this.__events[event])) {
          for (i = 0; i < ar.length; i++) {
            if (ar[i] === handler) {
              ar.splice(i, 1);
              break;
            }
          }
        }
      }
    }
  }

  /**
   * Trigger event handlers
   * @param {string|string[]|boolean} events - Event name(s) or true for apply mode
   * @returns {void}
   */
  triggerEvent(events) {
    let ar, params;
    if (events === true) {
      // Apply mode, event parameters are provided as an array
      events = arguments[1];
      const paramsArg = arguments[2] || [];
      params = new Array(paramsArg.length + 1);
      for (let iParam = 0; iParam < paramsArg.length; ++iParam) {
        params[iParam + 1] = paramsArg[iParam];
      }
    } else {
      params = new Array(arguments.length);
      for (let iParam = 1; iParam < arguments.length; ++iParam) {
        params[iParam] = arguments[iParam];
      }
    }

    const eventList = (this.utils.isArray(events) && events) || events.split(' ');
    for (let iEvent = 0, event, evCount = eventList.length; iEvent < evCount; iEvent++) {
      if ((ar = this.__events && this.__events[(params[0] = event = eventList[iEvent])])) {
        for (let i = 0, count = ar.length; i < count;) {
          const handler = ar[i];
          if (typeof handler === 'function') {
            handler.apply(this, params);
          }
          // If the handler being notified still in the array, go to next array elt
          if (count === ar.length) {
            ++i;
          } else {
            // If the handler was removed during notification (see one method), next element is at same index
            count = ar.length;
          }
        }
      }
    }
  }
}
