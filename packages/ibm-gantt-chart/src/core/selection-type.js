import Gantt from './core';

const SELECTION_CHANGED_EVENT = 'SelectionChanged';
const UNSELECT_EVENT = 'Unselected';
const SELECT_EVENT = 'Selected';
const CLEAR_SELECTION_EVENT = 'SelectionCleared';
const START_SELECTING = 'StartSelecting';
const STOP_SELECTING = 'StopSelecting';

class SelectionType {
  constructor(config) {
    Gantt.utils.mergeObjects(this, config);
    this[SELECTION_CHANGED_EVENT] = {
      event: () => this.getSelectionChangedEvent(),
      method: () => this.getSelectionChangedMethod(),
    };
    this[SELECT_EVENT] = {
      event: () => this.getSelectionEvent(),
      method: () => this.getSelectionMethod(),
    };
    this[UNSELECT_EVENT] = {
      event: () => this.getUnselectionEvent(),
      method: () => this.getUnselectionMethod(),
    };
    this[CLEAR_SELECTION_EVENT] = {
      event: () => this.getClearSelectionEvent(),
      method: () => this.getClearSelectionMethod(),
    };
  }

  accept(obj) {
    return false;
  }

  getTypeEvent(event) {
    return this[event] && this[event].event();
  }

  getTypeMethod(method) {
    return this.name + method;
  }

  notify(o, event, params) {
    let m = this[event] && this[event].method();
    if ((m = o[m])) {
      m.apply(o, params);
    }
  }

  getClearSelectionEvent() {
    return this.name + CLEAR_SELECTION_EVENT;
  }

  getClearSelectionMethod() {
    return this.clearSelectionMethod || this.getTypeMethod(SELECT_EVENT);
  }

  getSelectionEvent() {
    return this.name + SELECT_EVENT;
  }

  getSelectionMethod() {
    return this.selectionMethod || this.getTypeMethod(SELECT_EVENT);
  }

  getUnselectionEvent() {
    return this.name + UNSELECT_EVENT;
  }

  getUnselectionMethod() {
    return this.unselectionMethod || this.getTypeMethod(UNSELECT_EVENT);
  }

  getSelectionChangedEvent() {
    return this.name + SELECTION_CHANGED_EVENT;
  }

  getSelectionChangedMethod() {
    return this.selectionChangedMethod || this.getTypeMethod(SELECTION_CHANGED_EVENT);
  }
}

export default SelectionType;
