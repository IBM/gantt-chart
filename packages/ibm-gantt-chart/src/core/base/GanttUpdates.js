import Gantt from '../core';

export default class GanttUpdates {
  constructor(parent) {
    this.parent = parent;
  }

  addUpdate(update) {}

  removeUpdate(update) {}

  reload() {
    this._reload = true;
  }

  isReload() {
    return false;
  }

  destroy() {}

  startUpdating() {}

  stopUpdating() {}
}
