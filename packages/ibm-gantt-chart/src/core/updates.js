import Gantt from './core';

class GanttUpdates extends Gantt.components.GanttUpdates {
  constructor(parent, proto) {
    super(parent);
    this.children = [];
    this.updates = [];
    this.updateLocks = 0;
    this._reload = false;
    if (parent) {
      parent.children.push(this);
    }
    if (proto) {
      Gantt.utils.mergeObjects(this, proto);
    }
    this._containsRowChanges = false;
    this._tableYScrollChanged = false;
  }

  reload() {
    this._reload = true;
    this._containsRowChanges = true;
  }

  isReload() {
    return this._reload || (this.parent && this.parent.isReload());
  }

  rowsChanged(event, rows, rowRef) {
    this.addUpdate({ type: event, rows, rowRef });
    this._containsRowChanges = true;
  }

  addUpdate(update) {
    this.updates.push(update);
  }

  removeUpdate(update) {
    const index = this.updates.indexOf(update);
    if (index >= 0) {
      this.updates.splice(index, 1);
    }

    for (let i = 0, count = this.children ? this.children.length : 0; i < count; i++) {
      this.children[i].removeUpdate(update);
    }
  }

  tableScrollYChanged() {
    this._tableYScrollChanged = true;
  }

  hasTableScrollYChanged() {
    return this._tableYScrollChanged || (this.parent && this.parent.hasTableScrollYChanged());
  }

  startUpdating() {
    ++this.updateLocks;
  }

  stopUpdating() {
    if (--this.updateLocks === 0) {
      this.applyUpdates();
      return true;
    }
    return false;
  }

  applyUpdates() {
    this.doApplyUpdates();
    this.updates = [];
    this._reload = false;
    for (let i = 0, count = this.children ? this.children.length : 0; i < count; i++) {
      this.children[i].applyUpdates();
    }
    this._containsRowChanges = false;
  }

  containsRowChanges() {
    return this._containsRowChanges || (this.parent && this.parent.containsRowChanges());
  }

  applyReload() {}

  doApplyUpdates() {
    if (this._reload) {
      this.applyReload();
    } else {
      for (let iUpdate = 0, count = this.updates.length; iUpdate < count; iUpdate++) {
        this.applyUpdate(this.updates[iUpdate]);
      }
    }
  }

  applyUpdate(update) {}

  destroy() {
    for (let i = 0, count = this.children ? this.children.length : 0; i < count; i++) {
      this.children[i].destroy();
    }
    this.children = null;
  }
}

Gantt.components.GanttUpdates.impl = GanttUpdates;
