import { getComponent } from './component-factory';

import ActivityLayout from './base/ActivityLayout';
import Button from './base/Button';
import ButtonGroup from './base/ButtonGroup';
import CheckBox from './base/CheckBox';
import Component from './base/Component';
import ConstraintLayout from './base/ConstraintLayout';
import ConstraintsGraph from './base/ConstraintsGraph';
import DataFetcher from './base/DataFetcher';
import DropDownList from './base/DropDownList';
import ErrorHandler from './base/ErrorHandler';
import Filter from './base/Filter';
import GanttModel from './base/GanttModel';
import GanttPanel from './base/GanttPanel';
import GanttUpdates from './base/GanttUpdates';
import Input from './base/Input';
import LayoutSynchronizer from './base/LayoutSynchronizer';
import LoadResourceChart from './base/LoadResourceChart';
import Palette from './base/Palette';
import Renderer from './base/Renderer';
import SelectionHandler from './base/SelectionHandler';
import Split from './base/Split';
import TimeLine from './base/TimeLine';
import TimeTable from './base/TimeTable';
import Toggle from './base/Toggle';
import Toolbar from './base/Toolbar';
import Tooltip from './base/Tooltip';
import TreeTable from './base/TreeTable';
import TreeTableImpl from './base/TreeTableImpl';

import './core.scss';
import './fonts.scss';

export default class Gantt {
  constructor(context, config) {
    this.context = Gantt.utils.isString(context) ? document.getElementById(context) : context;
    const PanelClass = getComponent('GanttPanel', Gantt.components.GanttPanel);
    this.gantt = new PanelClass(this.context, config);
    return this.gantt;
  }
}

Gantt.defaultConfiguration = {
  rowHeight: 27,
  zoomFactor: 0.2,
  loadingPanelThresold: 500,
};

Gantt.defaultPalettes = {};

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

Gantt.ObjectTypes = Object.freeze({
  Activity: 'Activity',
  Resource: 'Resource',
  Constraint: 'Constraint',
  Reservation: 'Reservation',
  Row: 'Row',
});

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

Gantt.components = {
  ActivityLayout,
  Button,
  ButtonGroup,
  CheckBox,
  Component,
  ConstraintLayout,
  ConstraintsGraph,
  DataFetcher,
  DropDownList,
  ErrorHandler,
  Filter,
  GanttModel,
  GanttPanel,
  GanttUpdates,
  Input,
  LayoutSynchronizer,
  LoadResourceChart,
  Palette,
  Renderer,
  SelectionHandler,
  Split,
  TimeLine,
  TimeTable,
  Toggle,
  Toolbar,
  Tooltip,
  TreeTable,
};

// Register default implementations
Gantt.components.TreeTable.impl = TreeTableImpl;

Gantt.envReady = function envReady() {
  return Promise.resolve(true);
};

if (module.hot) {
  module.hot.accept();
}
