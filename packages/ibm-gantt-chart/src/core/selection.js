import Gantt from './core';

const START_SELECTION_METHOD = 'startSelection';
const STOP_SELECTION_METHOD = 'stopSelection';
const CLEAR_SELECTION_METHOD = 'clearSelection';

const SELECTION_CHANGED_EVENT = 'SelectionChanged';
const UNSELECT_EVENT = 'Unselected';
const SELECT_EVENT = 'Selected';
const CLEAR_SELECTION_EVENT = 'SelectionCleared';
const START_SELECTING = 'StartSelecting';
const STOP_SELECTING = 'StopSelecting';

class Type {
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

export default class SelectionHandler extends Gantt.components.SelectionHandler {
  constructor(config, proto) {
    super(config, proto);
    this.lock = 0;
    this.types = [];
    this.genericType = new Type({ name: '' });
    this.genericType[CLEAR_SELECTION_EVENT] = {
      event() {
        return Gantt.events.SELECTION_CLEARED;
      },
      method() {
        return CLEAR_SELECTION_METHOD;
      },
    };
    this.genericType[START_SELECTING] = {
      event() {
        return Gantt.events.START_SELECTING;
      },
      method() {
        return START_SELECTION_METHOD;
      },
    };
    this.genericType[STOP_SELECTING] = {
      event() {
        return Gantt.events.STOP_SELECTING;
      },
      method() {
        return STOP_SELECTION_METHOD;
      },
    };
  }

  /**
   * @return {string}
   */
  static get SELECTION_CHANGED_EVENT() {
    return SELECTION_CHANGED_EVENT;
  }

  /**
   * @return {string}
   */
  static get UNSELECT_EVENT() {
    return UNSELECT_EVENT;
  }

  /**
   * @return {string}
   */
  static get SELECT_EVENT() {
    return SELECT_EVENT;
  }

  /**
   * @return {string}
   */
  static get CLEAR_SELECTION_EVENT() {
    return CLEAR_SELECTION_EVENT;
  }

  setConfiguration(config) {
    this.config = config;
    this.observers = [];
    if (config) {
      if (Gantt.utils.isArray(config)) {
        for (let i = 0; i < config.length; i++) {
          this.addConfiguration(config[i]);
        }
      } else {
        this.addConfiguration(config);
      }
    }
  }

  addConfiguration(config) {
    this.addObserver(config);
  }

  select(obj, clear, notActive) {
    if (obj) {
      this.startSelecting();
      const objType = this.getObjectType(obj);
      const selTypeChanged = this.selectionType !== objType;
      if (this.selections.length && (clear || selTypeChanged)) {
        const oldType = this.selectionType;
        this.clear();
        if (selTypeChanged) {
          this.notify(oldType, SELECTION_CHANGED_EVENT, this.selections);
        }
      }
      this.selectionType = objType;
      if (notActive && this.selections.length) {
        // Add the selections at the end of selections array so that the current active selection at
        // position zero remains active
        if (Gantt.utils.isArray(obj)) {
          for (let i = 0, count = obj.length; i < count; ++i) {
            this.setObjectSelected(obj[i], true);
          }
          this.selections = this.selections.concat(obj);
        } else {
          this.setObjectSelected(obj, true);
          this.selections.push(obj);
        }
      } else if (Gantt.utils.isArray(obj)) {
        for (let i = 0, count = obj.length; i < count; ++i) {
          this.setObjectSelected(obj[i], true);
        }
        this.selections = obj.concat(this.selections);
      } else {
        // obj becomes the new active selection
        this.setObjectSelected(obj, true);
        this.selections.unshift(obj);
      }
      if (this.selections.length) {
        this.notify(this.selectionType, SELECT_EVENT, this.selections, this.selections[0]);
      }
      this.stopSelecting();
    }
  }

  unselect(obj) {
    if (obj) {
      let selecting = false;
      const uns = (Gantt.utils.isArray(obj) && obj) || [obj];
      const foundUns = [];
      uns.forEach(o => {
        const index = this.selections.indexOf(obj);
        if (index >= 0) {
          if (!selecting) {
            this.startSelecting();
            selecting = true;
          }
          this.selections.splice(index, 1);
          this.setObjectSelected(obj, false);
          foundUns.push(obj);
        }
      });
      if (selecting) {
        this.notify(this.selectionType, UNSELECT_EVENT, foundUns);
        this.stopSelecting();
      }
    }
  }

  setObjectSelected(obj, selected) {}

  clear() {
    if (this.selections.length) {
      this.startSelecting();
      const oldSelection = this.selections;
      for (let i = 0, count = (oldSelection && oldSelection.length) || 0; i < count; ++i) {
        this.setObjectSelected(oldSelection[i], false);
      }
      this.selections = [];
      this.notify(this.selectionType, CLEAR_SELECTION_EVENT, oldSelection);
      this.notify(this.genericType, CLEAR_SELECTION_EVENT, oldSelection);
      this.stopSelecting();
    }
  }

  processClick(e, obj) {
    if (obj) {
      if (e.ctrlKey) {
        // toggle object selection.
        if (this.isSelected(obj)) {
          this.unselect(obj);
        } else {
          this.select(obj);
        }
      } else if (!this.isSelected(obj)) {
        this.select(obj, !e.shiftKey);
      }
    }
  }

  getObjectType(obj) {
    for (let i = 0, count = this.types.length; i < count; ++i) {
      if (this.types[i].accept(obj)) return this.types[i];
    }
    return null;
  }

  startSelecting() {
    if (++this.lock === 1) {
      this.notify(this.genericType, START_SELECTING);
    }
  }

  stopSelecting() {
    if (!--this.lock) {
      this.notify(this.genericType, STOP_SELECTING);
      if (this.selectionType) {
        this.notify(
          this.selectionType,
          SELECTION_CHANGED_EVENT,
          this.selections,
          this.selections.length ? this.selections[0] : null
        );
      }
    }
  }

  //
  // Notify selection observers
  //
  notify(type, event, ...params) {
    const typeEvent = type.getTypeEvent(event);
    if (typeEvent) {
      this.triggerEvent(true /* Specify 3rd parameter is an array of parameters */, typeEvent, params);
    }
    for (let i = 0, o; i < this.observers.length; i++) {
      o = this.observers[i];
      type.notify(o, event, params);
    }
  }

  /* notifyObserver(type, event, ...params) {
        for(let i = 0, o, m; i < this.observers.length; i++) {
            o = this.observers[i];
            type.notify(o, event, params);
        }
    } */

  addObserver(o) {
    this.observers.push(o);
  }

  removeObserver(o) {
    const index = this.observers.indexOf(o);
    if (index >= 0) {
      this.observers.splice(index, 1);
      return 0;
    }
    return null;
  }

  //
  // Object types
  //
  registerType(type) {
    type = new Type(type);
    this.types.push(type);
    return type;
  }
}

Gantt.components.SelectionHandler.impl = SelectionHandler;
