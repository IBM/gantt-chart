import 'font-awesome/css/font-awesome.css';

/* eslint-disable */
import './core.scss';
import './fonts.scss';

export default class Gantt {
  constructor(context, config) {
    this.context = Gantt.utils.isString(context) ? document.getElementById(context) : context;
    const panelClass = Gantt.components.GanttPanel.impl || Gantt.components.GanttPanel;
    this.gantt = new panelClass(this.context, config);
    return this.gantt;
  }
}

Gantt.defaultConfiguration = {
  rowHeight: 27,
  zoomFactor: 0.2,
  loadingPanelThresold: 500,
};

// noinspection SpellCheckingInspection
Gantt.events = {
  TITLE_CHANGED: 'titleChanged',
  TABLE_INIT: 'tableinit',
  TIME_TABLE_INIT: 'timesheetinit',
  TIME_LINE_INIT: 'timeline_init',
  TIME_WINDOW_CHANGED: 'timeWindowChanged',
  TIME_LINE_RANGE_CHANGE: 'timeline_rangechange',
  TIME_LINE_RANGE_CHANGED: 'timeline_rangechanged',
  TIME_LINE_SIZE_CHANGED: 'timeline_sizeChanged',
  TIME_LINE_PAN_MOVE: 'timeline_panmove',
  TIME_LINE_PAN_MOVED: 'timeline_panmove',
  TIME_LINE_SCROLLED: 'timeline_scrolled',
  RESIZED: 'resized',
  SPLIT_RESIZED: 'split_resized',
  ROWS_FILTERED: 'rows_filtered',
  DATA_LOADED: 'data_loaded',
  ROWS_ADDED: 'rows_added',
  ROWS_REMOVED: 'rows_removed',
  ROWS_MODIFIED: 'rows_modified',
  ROWS_SORTED: 'rows_sorted',

  START_SELECTING: 'startSelecting',
  SELECTION_CLEARED: 'selectionCleared',
  STOP_SELECTING: 'stopSelecting',

  // Event names are generated from the Type objects associated with the SelectionHandler, with the format type.name + 'Selected|Unselected|SelectionChanged|SelectionCleared'
  ACTIVITY_SELECTED: 'activitySelected',
  ACTIVITY_UNSELECTED: 'activityUnselected',
  ACTIVITY_SELECTION_CHANGED: 'activitySelectionChanged',
  ACTIVITY_SELECTION_CLEARED: 'activitySelectionCleared',

  RESOURCE_SELECTED: 'resourceSelected',
  RESOURCE_UNSELECTED: 'resourceUnselected',
  RESOURCE_SELECTION_CHANGED: 'resourceSelectionChanged',
  RESOURCE_SELECTION_CLEARED: 'resourceSelectionCleared',

  ROW_SELECTED: 'rowSelected',
  ROW_UNSELECTED: 'rowUnselected',
  ROW_SELECTION_CHANGED: 'rowSelectionChanged',
  ROW_SELECTION_CLEARED: 'rowSelectionCleared',

  CONSTRAINT_SELECTED: 'constraintSelected',
  CONSTRAINT_UNSELECTED: 'constraintUnselected',
  CONSTRAINT_SELECTION_CHANGED: 'constraintSelectionChanged',
  CONSTRAINT_SELECTION_CLEARED: 'constraintSelectionCleared',
};

Gantt.type = {
  ACTIVITY_CHART: 'ActivityChart',
  SCHEDULE_CHART: 'ScheduleChart',
};

Gantt.constraintTypes = {
  START_TO_START: 0,
  START_TO_END: 2,
  END_TO_END: 3,
  END_TO_START: 1,
  isFromStart(type) {
    return type === 0 || type === 2;
  },
  isToStart(type) {
    return type < 2;
  },
};

class Tooltip {
  constructor(config) {}
  showTooltip(elt, ctx, cb) {}
  hideTooltip() {}
  destroy() {}
}

class DataFetcher {
  get(obj) {}
}

class Split {
  constructor(elt, config) {}
  getLeftComponent() {}
  getRightComponent() {}
  leftComponentCreated() {}
}

class Component {
  constructor(gantt, config) {
    this.gantt = gantt;
    this.config = config;
    this.utils = Gantt.utils;
  }

  on(event, handler) {
    let events = this.__events || (this.__events = {});
    let ar;
    let eventList = (this.utils.isArray(event) && event) || event.split(' ');
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
      let eventList = (this.utils.isArray(event) && event) || event.split(' ');
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
        for (let i = 0, count = ar.length; i < count; ) {
          ar[i].apply(this, params);
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

class ErrorHandler extends Component {
  constructor(config) {
    super(null, config);
    this.config = config;
  }

  addError(err) {}

  hasErrors() {
    return false;
  }

  clear() {}

  showError(err) {}

  getErrors() {
    return [];
  }

  createErrorNode(err) {
    const node = document.createElement('div');
    node.className = 'gantt_error';
    return node;
  }

  removeGroup(node) {}
}

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
class TimeLine extends Component {
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

class TimeTable extends Component {
  constructor(gantt, node, config) {
    super(gantt, config);
    this.node = node;
    this.setConfiguration(config);
  }
  setConfiguration(config) {}

  draw() {}

  createUpdates(parent) {
    return new (Gantt.components.GanttUpdates.impl || Gantt.components.GanttUpdates)(parent);
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

/**
 *
 * <br>Emmits events: <ul>
 *   <li>Gantt.events.TABLE_INIT</li>
 *   <li>Gantt.events.ROWS_ADDED</li>
 *   <li>Gantt.events.ROWS_REMOVED</li>
 *   <li>Gantt.events.ROWS_MODIFIED</li>
 *   <li>Gantt.events.ROWS_FILTERED</li>
 * </ul>
 */
class TreeTable extends Component {
  constructor(gantt, node, config) {
    super(gantt, config);
    this.node = node;
  }

  setRows(rows) {}

  getRowCount() {
    return 0;
  }

  isRowVisible(param) {}

  deleteDrawCache() {}

  draw() {}

  drawRows(selector) {}

  createUpdates(parent) {
    return new (Gantt.components.GanttUpdates.impl || Gantt.components.GanttUpdates)(parent);
  }

  highlightRow(row, highlight, deselectAll) {}

  setRowFilter(filter) {}

  filterChanged() {}

  isRowFiltered(row) {
    return false;
  }

  toggleCollapseRow(param, collapse) {}

  setHeaderHeight(height) {}

  getTableBody() {}

  getScrollableTable() {}

  getTop(tr) {
    return (tr && tr.offsetTop - this.getTableBody().offsetTop) || 0;
  }

  getRowAt(y) {}

  getHeight() {}

  nextRow(row) {
    return null;
  }

  getRow(id) {
    return null;
  }

  getRows(selector) {}

  getRowName(row) {
    return row.name;
  }

  getRowTop(row) {
    return (row.tr && row.tr.offsetTop - this.getTableBody().offsetTop) || 0;
  }

  expandParents(row) {}
}

TreeTable.defaultClass = '';

class GanttModel extends Component {
  constructor(gantt, config) {
    super(gantt, config);
    if (config) {
      this.setConfiguration(config);
    }
  }

  setConfiguration(config) {}
}

/**
 *
 * <br>Emmits events: <ul>
 *   <li>Gantt.events.TABLE_INIT</li>
 *   <li>Gantt.events.ROWS_ADDED</li>
 *   <li>Gantt.events.ROWS_REMOVED</li>
 *   <li>Gantt.events.ROWS_MODIFIED</li>
 *   <li>Gantt.events.ROWS_FILTERED</li>
 * </ul>
 */
class GanttPanel extends Component {
  constructor(node, config) {
    super(node, config);
    this.node = node;
    this.events = Gantt.events;
    this.constraintTypes = Gantt.constraintTypes;
  }

  setConfiguration(config) {}

  draw() {}

  startUpdating() {}

  stopUpdating() {}

  getModel() {}

  getRowCount() {
    return 0;
  }

  getRow(param) {
    return null;
  }

  getVisiibleRows() {
    return [];
  }

  ensureRowVisible(param) {}

  isRowVisible(param) {}

  getFirstVisibleRow() {}

  setFirstVisibleRow(row) {}

  isRowFiltered(param) {}

  toggleCollapseRow(param, collapse) {}

  scrollToY(y) {}

  getRowActivities(param) {}

  resetZoom() {}

  zoomIn(evt) {}

  zoomOut(evt) {}

  zoom(zoomFactor, evt) {}

  fitToContent() {}

  getVisibleHeight() {
    return 0;
  }

  highlightRow(row, highlight, deselectAll) {}

  /*                        */
  /*    Search and filter   */
  /*                        */
  addFilter(rowFilter, rows, activities) {}

  addFilter(rowFilter, filterTasks) {}

  removeFilter(key, preventNotify) {}

  search(text, rows, activities) {}

  setHideEmptyRows(hide, preventNotify) {}

  /*                        */
  /*          Utils         */
  /*                        */
}

class Filter {
  constructor(options) {}
}

class Renderer {
  constructor(config, proto, paletteHandler) {
    if (proto) {
      Gantt.utils.mergeObjects(this, proto);
    }
    this.config = config;
    this.paletteHandler = paletteHandler;
    this.setConfiguration(config);
  }

  setConfiguration(config) {}
}

class ActivityLayout {
  constructor(config) {}

  layout(row) {}

  allowVariableRowHeight() {
    return false;
  }
}

Gantt.ObjectTypes = {
  Activity: 2,
  Resource: 4,
  Row: 1,
  Constraint: 8,
  Reservation: 16,
};

class SelectionHandler extends Component {
  constructor(config, proto) {
    super(null, config);
    this.selections = [];
    this.selectionType = null;
    if (proto) {
      Gantt.utils.mergeObjects(this, proto);
    }
    this.setConfiguration(config);
  }

  setConfiguration(config) {}

  getObjectType(obj) {}

  select(obj, clear, notActive) {}

  clearSelection() {
    this.selections = [];
  }

  isSelected(obj) {
    return this.selections.indexOf(obj) >= 0;
  }

  processClick(e, obj) {}

  destroy() {
    this.selections = [];
  }
}

class LayoutSynchronizer extends Component {
  constructor(config, proto) {
    super(null, config);
    if (proto) {
      Gantt.utils.mergeObjects(this, proto || config);
    }
    this.setConfiguration(config);
  }

  setConfiguration(config) {}

  connect(gantt) {}

  disconnect() {}

  destroy() {
    this.disconnect();
  }
}

class Palette {
  constructor(config) {}
  getColors(count) {}
}

Gantt.defaultPaletteName = null;
Gantt.defaultPalettes = {};

class GanttUpdates {
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

class Toolbar extends Component {
  constructor(gantt, node, config) {
    super(gantt, config);
    this.node = node;
    this.setConfiguration(config, node);
  }

  setConfiguration(config, node) {
    this.config = config;
  }

  connect(gantt) {}

  ganttLoaded(gantt, rows) {}

  onInitialized() {}

  destroy() {}
}

Toolbar.createTitle = function(title) {
  const node = document.createElement('div');
  node.innerHTML = title;
  node.className = 'toolbar-title';
  return node;
};

class Button extends Component {
  constructor(gantt, config) {
    super(gantt, config);
    this.callbacks = [];
    this.setConfiguration(config);
  }

  setConfiguration(config) {
    const btn = document.createElement('div');
    if (config.id) {
      btn.id = config.id;
    }
    btn.className = `toolbar-button g-hoverable g-selectable${config.classes ? ' ' + config.classes : ''}`;
    if (config.icon) {
      const img = document.createElement('img');
      img.src = config.icon;
      img.alt = '';
      btn.appendChild(img);
    }
    if (config.fontIcon) {
      const fontIcon = document.createElement('i');
      fontIcon.className = config.fontIcon + (config.text ? ' fa-fw' : '');
      btn.appendChild(fontIcon);
    }
    if (config.svg) {
      Gantt.utils.appendSVG(btn, config.svg);
    }
    if (config.text) {
      btn.appendChild(document.createTextNode(config.text));
    }
    this.node = btn;
    this.node.onclick = e => {
      this.clicked(e);
      this.callbacks.map(cb => {
        cb({ gantt: this.gantt, event: e });
      });
    };
    if (config.onclick) {
      this.onclick(config.onclick);
    }
    return btn;
  }

  onclick(callback) {
    this.callbacks.push(callback);
  }

  clicked(e) {}

  setId(id) {
    this.node.id = id;
  }

  update() {}

  setSelected(selected) {
    Gantt.utils.toggleClass(this.node, 'selected', selected);
  }
}

class CheckBox extends Component {
  constructor(gantt, config) {
    super(gantt, config);
    this.setConfiguration(config);
  }

  setConfiguration(config) {
    const ctnr = (this.node = document.createElement('div'));
    ctnr.style.whiteSpace = 'nowrap';
    const input = (this.inputNode = document.createElement('input'));
    input.setAttribute('type', 'checkbox');
    input.setAttribute('value', 'None');
    input.className = 'g-selectable g-hoverable';
    if (config.id) {
      input.id = id;
    }
    if (config.classes) {
      ctnr.className = config.classes;
    }
    ctnr.appendChild(input);
    const label = document.createElement('label');
    if (config.id) {
      label.setAttribute('for', config.id);
    }
    if (config.icon) {
      const img = document.createElement('img');
      img.src = config.icon;
      img.alt = '';
      label.appendChild(img);
    }
    if (config.svg) {
      Gantt.utils.appendSVG(label, config.svg);
    }
    if (config.text) {
      label.appendChild(document.createTextNode(config.text));
    }
    if (config.onclick) {
      this.onclick(config.onclick);
    }
    ctnr.appendChild(label);
    return ctnr;
  }

  setChecked(checked) {
    this.inputNode.checked = checked;
  }

  onclick(callback) {
    this.inputNode.onclick = e => {
      callback(this.inputNode.checked, { gantt: this.gantt, event: e });
    };
  }

  update() {}

  setId(id) {
    this.inputNode.id = id;
  }
}

CheckBox.defaultClass = null;

class Toggle extends Component {
  constructor(gantt, config) {
    super(gantt, config);
    this.setConfiguration(config);
  }

  setConfiguration(config) {
    this.callbacks = [];
    const ctnr = (this._node = document.createElement('div'));
    this._isSel = config.isSelected && config.isSelected(this.gantt);
    this.btnUnselected = new (Gantt.components.Button.impl || Gantt.components.Button)(this.gantt, config.unselected);
    this.btnSelected = new (Gantt.components.Button.impl || Gantt.components.Button)(this.gantt, config.selected);
    ctnr.appendChild(this._isSel ? this.btnSelected.node : this.btnUnselected.node);
    if (config.id) {
      ctnr.id = id;
    }
    const onclick = e => {
      this._isSel = !this._isSel;
      this.updateButtons(this._isSel);
      this.callbacks.forEach(c => {
        c(this._isSel, { gantt: this.gantt, event: e });
      });
    };
    this.btnUnselected.node.onclick = this.btnSelected.node.onclick = onclick;
    if (config.onclick) {
      this.onclick(config.onclick);
    }
    return ctnr;
  }

  isSelected() {
    return this._isSel;
  }

  setSelected(selected) {
    this._isSel = selected;
    this.updateButtons(selected);
  }

  get node() {
    return this._node;
  }

  set node(node) {
    this._node = node;
  }

  onclick(callback) {
    this.callbacks.push(callback);
  }

  update() {
    this.updateButtons(this.config.isSelected ? (this._isSel = this.config.isSelected(this.gantt)) : this._isSel);
  }

  updateButtons(isSel) {
    if (this.btnSelected.node.parentNode) {
      if (!isSel) this._node.replaceChild(this.btnUnselected.node, this.btnSelected.node);
    } else if (this.btnUnselected.node.parentNode) {
      this._node.replaceChild(this.btnSelected.node, this.btnUnselected.node);
    }
  }
}

Toggle.defaultClass = null;

class DropDownList extends Component {
  constructor(gantt, config) {
    super(gantt, config);
    this.setConfiguration(config);
  }

  setConfiguration(config) {
    const node = (this.node = document.createElement('div'));
    const defaultClass = DropDownList.defaultClass;
    if (defaultClass) {
      node.className = defaultClass;
    }
    if (config.classes) {
      Gantt.utils.addClass(node, config.classes);
    }
    if (config.text || config.icon || config.fontIcon) {
      const labelNode = document.createElement('div');
      labelNode.className = 'label';
      if (config.icon) {
        const img = document.createElement('img');
        img.src = config.icon;
        img.alt = '';
        labelNode.appendChild(img);
      }
      if (config.fontIcon) {
        const fontIcon = document.createElement('i');
        fontIcon.className = config.fontIcon + (config.text ? ' fa-fw' : '');
        labelNode.appendChild(fontIcon);
      }
      if (config.text) {
        labelNode.appendChild(document.createTextNode(config.text));
      }
      node.appendChild(labelNode);
    }
    const select = (this.selectNode = document.createElement('select'));
    select.className = 'g-hoverable';
    for (let i = 0, count = config.options.length, opt, optNode; i < count; i++) {
      opt = config.options[i];
      optNode = document.createElement('option');
      optNode.text = opt.text;
      optNode.value = opt.value;
      select.appendChild(optNode);
    }
    node.appendChild(select);
    if (config.onchange) {
      this.onchange(config.onchange);
    }
    return node;
  }

  select(value) {
    this.selectNode.value = value;
  }

  onchange(callback) {
    this.selectNode.onchange = e => {
      callback(this.selectNode.value, { gantt: this.gantt, event: e });
    };
  }

  update() {}

  setId(id) {
    this.selectNode.id = id;
  }
}

DropDownList.defaultClass = 'dropdown-list';

class Input extends Component {
  constructor(gantt, config) {
    super(gantt, config);
    this.setConfiguration(config);
  }

  setConfiguration(config) {
    const node = (this.node = document.createElement('div'));
    if (Input.defaultClass) {
      node.className = Input.defaultClass;
    }
    if (config.classes) {
      Gantt.utils.addClass(node, config.classes);
    }
    node.style.display = 'flex';
    node.style.flexDirection = 'row';
    node.style.alignItems = 'center';

    if (config.text || config.icon || config.fontIcon || config.type === 'search') {
      const labelNode = document.createElement('div');
      labelNode.className = 'label';
      labelNode.style.display = 'inline-block';
      if (config.icon) {
        const img = document.createElement('img');
        img.src = config.icon;
        img.alt = '';
        labelNode.appendChild(img);
      }
      if (config.fontIcon) {
        const fontIcon = document.createElement('i');
        fontIcon.className = config.fontIcon + (config.text ? ' fa-fw' : '');
        fontIcon.setAttribute('aria-disabled', true);
        labelNode.appendChild(fontIcon);
      } else if (config.type === 'search') {
        const fontIcon = document.createElement('i');
        fontIcon.setAttribute('aria-disabled', true);
        fontIcon.className = `fa fa-search fa-lg${config.text ? ' fa-fw' : ''}`;
        labelNode.appendChild(fontIcon);
      }
      if (config.text) {
        labelNode.appendChild(document.createTextNode(config.text));
      }
      node.appendChild(labelNode);
    }
    const input = (this.inputNode = document.createElement('input'));
    node.appendChild(input);

    const deleteBtn = document.createElement('div');
    deleteBtn.className = 'delete-button';
    deleteBtn.display = 'inline-block';
    const deleteIcon = document.createElement('i');
    deleteIcon.className = 'fa fa-times fa-lg';
    deleteBtn.appendChild(deleteIcon);
    node.appendChild(deleteBtn);
    deleteBtn.onclick = () => {
      input.value = '';
      if ('createEvent' in document) {
        let evt = document.createEvent('HTMLEvents');
        evt.initEvent('change', false, true);
        input.dispatchEvent(evt);
      } else {
        input.fireEvent('onchange');
      }
    };

    if (config.onchange) {
      this.onchange(config.onchange);
    }
    return node;
  }

  setText(value) {
    this.input.value = value;
  }

  onchange(userCallback) {
    const callback = e => {
      userCallback(this.inputNode.value, { gantt: this.gantt, event: e });
    };
    this.inputNode.onchange = callback;
    this.inputNode.onkeyup = callback;
  }

  setId(id) {
    this.inputNode.id = id;
  }
}

Input.defaultClass = 'input-box';

class ButtonGroup extends Component {
  constructor(gantt, config) {
    super(gantt, config);
    this.selected = null;
    this.callbacks = [];
    this.setConfiguration(config);
  }

  setConfiguration(config) {
    const node = (this.node = document.createElement('div'));
    if (config.classes) {
      node.className = config.classes;
    }
    this.buttons = [];
    Gantt.utils.addClass(node, 'button-group');
    node.style.display = 'flex';
    node.style.flexDirection = 'row';
    node.style.alignItems = 'center';

    const self = this;
    function installBtnClicked(button) {
      button.clicked = () => {
        self.setSelected(button);
      };
    }

    this.value = null;
    let cfgBtns = config.buttons;
    for (let i = 0; i < cfgBtns.length; ++i) {
      let btn = new (Gantt.components.Button.impl || Gantt.components.Button)(this.gantt, cfgBtns[i]);
      this.buttons.push(btn);
      installBtnClicked(btn);
      if (cfgBtns[i].selected) {
        this.selected = btn;
        btn.setSelected(true);
        this.value = btn.value;
      }
      btn.value = cfgBtns[i].value;
      node.appendChild(btn.node);
    }
    if (config.onchange) {
      this.onchange(config.onchange);
    }
    if (config.value !== undefined) {
      this.setValue(config.value);
    }
    return node;
  }

  setValue(value, noNotify) {
    for (let i = 0; i < this.buttons.length; i++) {
      if (this.buttons[i].value === value) {
        this.setSelected(this.buttons[i], noNotify);
        break;
      }
    }
  }

  getValue() {
    return this.value;
  }

  setSelected(btn, noNotify) {
    if (this.selected !== btn) {
      if (this.selected) {
        this.selected.setSelected(false);
      }
      this.selected = btn;
      if (btn) {
        this.value = btn.value;
        btn.setSelected(true);
      } else {
        this.value = null;
      }
      if (!noNotify) {
        this.callbacks.map(cb => {
          cb(this.value);
        });
      }
    }
  }

  onchange(userCallback) {
    this.callbacks.push(userCallback);
  }

  setId(id) {
    this.inputNode.id = id;
  }
}

class LoadResourceChart extends Component {
  constructor(gantt, node, config) {
    super(gantt, node, config);
    this.node = node;
    this.setConfiguration(config);
  }

  setConfiguration(config) {}

  setVisible(visible) {}
  setScrollLeft(left) {}
}

class ConstraintsGraph extends Component {
  constructor(gantt, node, config) {
    super(gantt, node, config);
    this.node = node;
    this.setConfiguration(config);
  }

  setConfiguration(config) {}
  setConstraints(cts) {}
  setNode(node) {}
}

class ConstraintLayout extends Component {
  constructor(gantt, config) {
    super(gantt, null, config);
    this.setConfiguration(config);
  }

  setConfiguration(config) {}
  startInitialize() {}
  addNode(node) {}
  addConstraint(nodeFrom, nodeTo, cons) {}
  stopInitialize() {}
  forEachLink(node, cb) {}
  layoutNode(node) {}
  layoutRowNodeLinks(rowIndex) {}
  drawRowLinks(rowIndex, parentElt, renderer, ctx) {}
}

Gantt.components = {
  Component,
  GanttPanel,
  GanttModel,
  TreeTable,
  TimeLine,
  TimeTable,
  Split,
  Tooltip,
  Filter,
  DataFetcher,
  ErrorHandler,
  Renderer,
  ActivityLayout,
  SelectionHandler,
  LayoutSynchronizer,
  GanttUpdates,
  Palette,
  Toolbar,
  Button,
  CheckBox,
  Toggle,
  DropDownList,
  Input,
  ButtonGroup,
  LoadResourceChart,
  ConstraintsGraph,
  ConstraintLayout,
};

Gantt.envReady = function() {
  return Promise.resolve(true);
};

if (module.hot) {
  module.hot.accept();
}
