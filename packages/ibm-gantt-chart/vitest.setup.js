import chai from 'chai';
import './dist/ibm-gantt-chart.css';
import fs from 'node:fs/promises';
import path from 'node:path';

// Load the bundled Gantt library
require('./dist/ibm-gantt-chart.js');

// ============================================================================
// Set up test globals
// ============================================================================
globalThis.chai = chai;
globalThis.expect = chai.expect;

// Get Gantt from the bundled library
const ganttGlobals = Object.keys(globalThis).filter(
  (k) => k.toLowerCase().includes('gantt') || k.toLowerCase().includes('ibm')
);
const Gantt =
  globalThis['ibm-gantt-chart'] || globalThis.Gantt || (ganttGlobals.length > 0 ? globalThis[ganttGlobals[0]] : null);
if (!Gantt) {
  throw new Error(`Gantt library failed to initialize. Found globals: ${ganttGlobals.join(', ')}`);
}
globalThis.Gantt = Gantt;

const nativeFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  if (url.startsWith('/data/')) {
    const file = path.resolve(process.cwd(), `.${url}`);
    const body = await fs.readFile(file, 'utf8');
    return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
  }
  return nativeFetch(input, init);
};

// ============================================================================
// Test Utilities (local, without jQuery)
// ============================================================================

const ROW_ID_PREFIX = 'timeTableRow_';
const TIME_TABLE_ROW_CLASS = 'time-table-row';
const minDate = new Date().getTime();
const maxDate = minDate + 3600000 * 24 * 4;
const actDuration = 3600000 * 2;

function expectNotNull(node) {
  if (!node) throw new Error('Not null object expected');
}

function getDOM(node) {
  if (!node) return null;
  if (typeof node === 'string') return document.getElementById(node);
  if (node.length !== undefined) return node.length ? node[0] : null;
  return node;
}

function checkGanttForErrors(gantt) {
  if (gantt.errorHandler?.getErrors?.().length) {
    throw new Error(`Gantt errors ${JSON.stringify(gantt.errorHandler.getErrors())}`);
  }
}

function expectInDom(node, visible) {
  node = getDOM(node);
  if (visible && (!node || !node.parentNode)) {
    throw new Error(`${node} should be in DOM`);
  } else if (!visible && node?.parentNode) {
    throw new Error(`${node} should not be in DOM`);
  }
}

function expectVisible(node, visible) {
  node = getDOM(node);
  if (!node) throw new Error('Not null DOM node expected');
  const { display } = window.getComputedStyle(node);
  if (visible && display === 'none') {
    throw new Error(`${node} should be visible`);
  } else if (!visible && display !== 'none') {
    throw new Error(`${node} should be hidden`);
  }
}

function convertColorToHex(c) {
  if (c.startsWith('#')) return c.toUpperCase();
  if (c.startsWith('rgb')) {
    const comps = c.split('(')[1].split(')')[0].split(',');
    const hexArray = comps.map((x) => {
      const hex = Number.parseInt(x, 10).toString(16);
      return hex.length === 1 ? `0${hex}` : hex;
    });
    return `#${hexArray.join('').toUpperCase()}`;
  }
  throw new Error(`Cannot process colors as ${c}`);
}

function sameColors(c1, c2) {
  return convertColorToHex(c1) === convertColorToHex(c2);
}

// ============================================================================
// Test Data Creators (jQuery-free)
// ============================================================================

function createActivities(resId, rowNum, options) {
  if (options?.createActivities) {
    return options.createActivities(resId, rowNum);
  }
  let count = options?.getActivityCount?.(resId, rowNum) ?? Math.floor(Math.random() * 10);
  let start = Math.floor(Math.random() * ((maxDate - minDate) / 5)) + minDate;
  const end = maxDate - Math.floor(Math.random() * ((maxDate - minDate) / 5)) - actDuration;
  let rest = end - start - actDuration * count;
  let inc = rest / count;
  const acts = [];
  const jobs = ['Mason', 'Painting', 'Ceiling', 'Electricity', 'Garden', 'Plomber'];
  for (let i = 0; i < count; ++i) {
    acts.push({
      id: options?.getActivityId?.(resId, i) ?? `${resId && `${resId}_`}${i}`,
      name: options?.getActivityName?.(resId, i) ?? jobs[Math.floor(Math.random() * jobs.length)],
      start,
      end: start + actDuration,
    });
    inc = Math.floor(Math.random() * (rest / (count - i)));
    start += actDuration + inc;
    rest -= inc;
  }
  return acts;
}

function generateResources(resources, parent, level, options) {
  resources ??= [];
  const count = options.getResourceCount(parent, level);
  for (let i = 0; i < count; ++i) {
    const res = options.customizeResource(options.generateResource(parent, level, i), parent, level, i);
    if (parent) res.parentId = parent.id;
    resources.push(res);
    generateResources(resources, res, level + 1, options);
  }
  return resources;
}

function createResources(options) {
  if (!options?.generateResources) {
    return [
      { id: 'zero', name: 'Johan' },
      { id: 1, name: 'Johan 1', parentId: 'zero' },
      { id: 2, name: 'Johan 2', parentId: 'zero' },
      { id: 3, name: 'Johan 3', parentId: 'zero' },
      { id: 4, name: 'Johan 3 1', parentId: 3 },
      { id: 5, name: 'Isabel' },
      { id: 6, name: 'Isabel 1', parentId: 5 },
      { id: 7, name: 'Isabel 2', parentId: 5 },
      { id: 8, name: 'Gabriel' },
      { id: 9, name: 'Gabriel 1', parentId: 8 },
      { id: 10, name: 'Gabriel 2', parentId: 8 },
      { id: 11, name: 'Fanta' },
      { id: 12, name: 'Fanta 1', parentId: 11 },
      { id: 13, name: 'Fanta 2', parentId: 11 },
      { id: 14, name: 'Alone' },
      { id: 15, name: 'Barbara' },
      { id: 16, name: 'Barbara 1', parentId: 15 },
    ];
  }

  const defaultOptions = {
    resourceCounts: [100, 3, 2],
    getResourceCount(parent, level) {
      return level >= this.resourceCounts.length ? 0 : this.resourceCounts[level];
    },
    resourceIdPrefix: 'Id',
    getResourceId(parent, level, index) {
      return `${parent ? parent.id : this.resourceIdPrefix}_${index}`;
    },
    resourceNamePrefix: 'Res',
    getResourceName(parent, level, index) {
      return `${parent ? parent.name : this.resourceNamePrefix}_${index}`;
    },
    generateResource(parent, level, index) {
      return {
        id: this.getResourceId(parent, level, index),
        name: this.getResourceName(parent, level, index),
      };
    },
    customizeResource(res) {
      return res;
    },
  };
  const finalOptions = Object.assign({}, defaultOptions, options.generateResources);
  return generateResources([], null, 0, finalOptions);
}

function createResourceWidthActivitiesData(options) {
  const resources = createResources(options);
  for (let i = 0; i < resources.length; i++) {
    resources[i].activities = createActivities(resources[i].id, i, options);
  }
  return {
    resources: {
      data: resources,
      id: 'id',
      name: 'name',
      parent: 'parentId',
      activities: 'activities',
    },
    activities: {
      start: 'start',
      end(actitivty) {
        return actitivty.end;
      },
      id: 'id',
      name(activity) {
        return activity.name;
      },
    },
    getActivities(row) {
      if (!this.__actsByResId) {
        this.__actsByResId = {};
        for (let iRes = 0, count = resources.length; iRes < count; iRes++) {
          this.__actsByResId[resources[iRes].id] = resources[iRes];
        }
      }
      return this.__actsByResId[row].activities;
    },
  };
}

function createResourceActivityData(options) {
  const resources = createResources(options);
  let activities = [];
  let resActs;
  for (var i = 0, iAct; i < resources.length; i++) {
    resActs = createActivities(resources[i].id, i, options);
    for (iAct = 0; iAct < resActs.length; iAct++) {
      resActs[iAct].resource = resources[i].id;
    }
    activities = activities.concat(resActs);
  }
  return {
    resources: {
      data: resources,
      id: 'id',
      name: 'name',
      parent: 'parentId',
    },
    activities: {
      start: 'start',
      end(actitivty) {
        return actitivty.end;
      },
      id: 'id',
      name(activity) {
        return activity.name;
      },
      data: activities,
      resource: 'resource',
    },
    getActivities(row) {
      if (!this.__actsByResId) {
        this.__actsByResId = {};
        for (let iRes = 0, count = resources.length; iRes < count; iRes++) {
          this.__actsByResId[resources[iRes].id] = [];
        }
        for (let iAct = 0, actCount = activities.length; iAct < actCount; iAct++) {
          this.__actsByResId[activities[iAct].resource].push(activities[iAct]);
        }
      }
      return this.__actsByResId[row];
    },
  };
}

function createResourceActivityReservationData(options) {
  const resources = createResources(options);
  let activities = [];
  const reservations = [];
  let resActs;
  for (var i = 0, iAct; i < resources.length; i++) {
    resActs = createActivities(resources[i].id, i, options);
    for (iAct = 0; iAct < resActs.length; iAct++) {
      reservations.push({ activityId: resActs[iAct].id, resourceId: resources[i].id });
    }
    activities = activities.concat(resActs);
  }
  return {
    resources: {
      data: resources,
      id: 'id',
      name: 'name',
      parent: 'parentId',
    },
    activities: {
      start: 'start',
      end(actitivty) {
        return actitivty.end;
      },
      id: 'id',
      name(activity) {
        return activity.name;
      },
      data: activities,
    },
    reservations: {
      data: reservations,
      activity: 'activityId',
      resource: 'resourceId',
    },
    getActivities(row) {
      if (!this.__actsByResId) {
        this.__actsByResId = {};
        for (let iRes = 0, count = resources.length; iRes < count; iRes++) {
          this.__actsByResId[resources[iRes].id] = [];
        }
        const actByIds = {};
        for (let iAct = 0, actCount = activities.length; iAct < actCount; iAct++) {
          actByIds[activities[iAct].id] = activities[iAct];
        }
        for (let iResa = 0, resaCount = reservations.length; iResa < resaCount; iResa++) {
          this.__actsByResId[reservations[iResa].resourceId].push(actByIds[reservations[iResa].activityId]);
        }
      }
      return this.__actsByResId[row];
    },
  };
}

function createActivityData(options = {}) {
  return {
    resources: { data: [], id: 'id', name: 'name', activities: 'activities' },
    activities: {
      data: options.createActivities?.() ?? [],
      id: 'id',
      parent: 'parent',
      name: 'name',
      start: 'start',
      end: 'end',
    },
  };
}

function createSortingConfig() {
  return {
    data: {
      resources: { data: [], id: 'id', name: 'name', activities: 'activities' },
      activities: { data: [], id: 'id', parent: 'parent', name: 'name', start: 'start', end: 'end' },
    },
  };
}

function createHouseBuildingConfig(options = {}) {
  const nowMillis = new Date(2016, 7, 8, 8).getTime();
  const makeDate = (value) => nowMillis + value * 12 * 60 * 60 * 1000;
  const postProcess = (workers) => {
    const maxSubRows = options.activitySubRows || 0;
    const results = workers.map((worker) => {
      const assignments = [];
      (worker.ASSIGNMENTS || []).forEach((assignment, index) => {
        assignments.push(assignment);
        for (let copy = 0; copy < maxSubRows - (index % maxSubRows) - 1; copy++) {
          assignments.push({ ...assignment });
        }
      });
      worker.ASSIGNMENTS = assignments;
      return worker;
    });
    return options.success?.(results) || results;
  };
  const config = {
    data: {
      resources: {
        url: '/data/house_building/workers.json',
        success: postProcess,
        parent: 'PARENT_ID',
        id: 'OBJECT_ID',
        activities: 'ASSIGNMENTS',
        name: 'NAME',
      },
      activities: {
        start: (assignment) => makeDate(assignment.START),
        end: (assignment) => makeDate(assignment.END),
        name: 'TASK.NAME',
      },
    },
    timeTable: {
      renderer: {
        text: (activity) => activity.TASK.NAME,
        background: { getValue: 'TASK.NAME' },
        color: 'automatic',
      },
    },
  };
  if (options.layoutStrategy) config.timeTable.layout = { strategy: options.layoutStrategy };
  if (options.rowHeight) config.timeTable.renderer.rowHeight = options.rowHeight;
  return config;
}

function createProjectActivityChartConfig(config) {
  // Use absolute path from current working directory
  const DATA_PATH = '/data';
  const data = {
    resources: {
      url: `${DATA_PATH}/project_activitychart/resources.json`,
      success: config?.success?.resources,
      parent: 'parent',
      name: 'name',
      id: 'id',
    },
    reservations: {
      url: `${DATA_PATH}/project_activitychart/resas.json`,
      success: config?.success?.reservations,
      activity: 'activity',
      resource: 'resource',
    },
    activities: {
      url: `${DATA_PATH}/project_activitychart/activities.json`,
      success: config?.success?.activities,
      start: 'start',
      end: 'end',
      name: 'name',
      parent: 'parent',
    },
    constraints: {
      url: `${DATA_PATH}/project_activitychart/constraints.json`,
      success: config?.success?.constraints,
      from: 'from',
      to: 'to',
      type: 'type',
    },
  };
  return {
    data,
    type: Gantt.type.ACTIVITY_CHART,
    title: 'Activity Chart example',
  };
}

// ============================================================================
// Import dummy table implementation
// ============================================================================
import { installDummyTable, uninstallDummyTable } from './test/table/dummy-table.js';

// ============================================================================
// GanttTest Utility Class
// ============================================================================

function GanttTest(gantt) {
  this.gantt = gantt;
}

GanttTest.prototype = {
  HIERARCHY_COLUMN_CLASS: 'hierarchy-control',
  SELECTED_CLASS: 'selected',
  getRow(param) {
    return this.gantt.getRow(param);
  },
  getTr(id) {
    return document.getElementById(id);
  },
  checkRowVisible(id, visible) {
    expect(visible === !!this.getTr(id)).to.be.true;
  },
  clickRow(row, ctrl) {
    row = this.getRow(row);
    this.gantt.ensureRowVisible(row);
    const td = row.tr.getElementsByClassName(this.HIERARCHY_COLUMN_CLASS)[0];
    this.click(td, ctrl);
  },
  isRowSelected(row) {
    row = this.getRow(row);
    return row.tr && Gantt.utils.hasClass(row.tr, this.SELECTED_CLASS);
  },
  getRowActivities(row) {
    return this.gantt.getRowActivities(row);
  },
  click(node, ctrl) {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      ctrlKey: ctrl,
    });
    node.dispatchEvent(event);
  },
  clickActivity(act) {
    let row;
    let ctrl;
    if (arguments.length === 3) {
      ctrl = arguments[2];
      row = arguments[1];
    } else if (arguments.length === 2) {
      if (typeof arguments[1] === 'boolean') {
        ctrl = arguments[1];
      } else {
        row = arguments[1];
      }
    }
    act = this.gantt.getActivityNode(act, row);
    if (!act) {
      throw new Error(`No activity found: ${act}, ${row}`);
    }
    this.click(act, ctrl);
  },
  isActivitySelected(act, row) {
    act = this.gantt.getActivityNode(act, row);
    if (!act) {
      throw new Error(`No activity found: ${act}, ${row}`);
    }
    return Gantt.utils.hasClass(act, this.SELECTED_CLASS);
  },
  getActivity(act, row) {
    return this.gantt.getActivity(act, row);
  },
  doubleClickActivity(act, row) {
    act = this.gantt.getActivityNode(act, row);
    let event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    act.dispatchEvent(event);
    event = new MouseEvent('dblclick', {
      bubbles: true,
      cancelable: true,
    });
    act.dispatchEvent(event);
  },
  getTimeTableScroller() {
    const tts = this.gantt.node.querySelector('.time-table-scroller');
    expect(tts).to.exist;
    return tts;
  },
  getTimeTableRowAt(top) {
    const tts = this.getTimeTableScroller();
    const rowCtnr = tts.querySelector('.time-table-row-container');
    expect(rowCtnr).to.exist;
    let rowTop = rowCtnr.offsetTop;
    let rowNode = rowCtnr.firstChild;
    let h;
    while (rowNode && rowTop <= top) {
      h = rowNode.offsetHeight || 32;
      if (rowTop + h > top) {
        return rowNode;
      }
      rowTop += h;
      rowNode = rowNode.nextSibling;
    }
    expect(false).to.be.false;
    throw new Error(`Not time table row found at top position: ${top}`);
  },
  checkRowDisplay(tr, id, rowIndex, top) {
    expect(id).to.equal(tr.id);
    const ttRow = this.getTimeTableRowAt(top);
    const rowId = ttRow.id.substring(ROW_ID_PREFIX.length);
    expect(id).to.equal(rowId);
  },
  checkRowsDisplayed(ids, fromIndex, cb) {
    const tbody = this.gantt.table.getScrollableBody();
    let rowIndex = 0;
    let top = 0;
    let tr = tbody.firstChild;
    while (rowIndex < fromIndex) {
      tr = tr.nextSibling;
      top += Number.parseFloat(tr.style.height) || tr.offsetHeight || 32;
      rowIndex++;
    }
    for (let i = 0; i < ids.length; i++, rowIndex++) {
      this.checkRowDisplay(tr, ids[i], rowIndex, top);
      if (cb) {
        cb(tr, ids[i], rowIndex, top);
      }
      top += Number.parseFloat(tr.style.height) || tr.offsetHeight || 32;
      tr = tr.nextSibling;
    }
  },
  findColumn(name) {
    const cols = this.gantt.node.querySelectorAll('.dataTables_scrollHead th');
    let colTitle;
    for (let iCol = 0; iCol < cols.length; iCol++) {
      const headerCell = cols[iCol];
      colTitle = Array.from(headerCell.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent.trim())
        .join('');
      if (name === colTitle) {
        return cols[iCol];
      }
    }
    return null;
  },
  ensureColumnVisible(name) {
    const col = this.findColumn(name);
    expect(col).to.exist;
    const x = col.offsetLeft;
    const scrollBody = this.gantt.node.querySelector('.table-panel .dataTables_scrollBody');
    const scrollHead = this.gantt.node.querySelector('.table-panel .dataTables_scrollHead');
    const left = scrollBody.scrollLeft;
    if (left > x) {
      scrollBody.scrollLeft = x;
      scrollHead.scrollLeft = x;
    } else if (left + scrollBody.offsetWidth < x) {
      scrollBody.scrollLeft = x;
      scrollHead.scrollLeft = x;
    }
  },
  sortColumn(name) {
    const col = this.findColumn(name);
    this.ensureColumnVisible(name);
    this.click(col);
  },
};

// ============================================================================
// Vitest Hooks: Set up test context and utilities
// ============================================================================
import { beforeEach, afterEach } from 'vitest';

// Stack of test contexts for nested describe/it blocks
const contextStack = [];

function getCurrentContext() {
  return contextStack.length > 0 ? contextStack[contextStack.length - 1] : null;
}

beforeEach((ctx) => {
  // Create test context for this test
  const context = {
    __testContainers: [],
    gantt: null,
    ganttModel: null,

    createGantt(config) {
      // Ensure config is an object
      if (!config) {
        config = {};
      }
      if (!config.header) {
        config.header = ctx.task?.name || 'Test';
      }
      this.ganttModel = config?.data;

      // Create test container
      const testContainer = document.createElement('div');
      testContainer.id = `test-gantt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      testContainer.style.width = '800px';
      testContainer.style.height = '600px';
      document.body.appendChild(testContainer);
      this.__testContainers.push(testContainer);

      // Instantiate Gantt
      const ganttInstance = new Gantt(testContainer, config);
      this.gantt = ganttInstance;

      // Return initialization promise
      if (ganttInstance.initialized) {
        return ganttInstance.initialized().then((rows) => {
          // Validate loaded rows
          if (!rows || rows.length === 0) {
            console.warn('[Gantt] No rows loaded');
          }
          // Wait for all async rendering to complete before checking for errors
          // This includes constraint graph rendering and timetable drawing
          const drawPromise = ganttInstance.timeTable?._drawPromise || Promise.resolve();
          const constraintReady = ganttInstance.timeTable?.ctsGraph?.ready || Promise.resolve();
          return Promise.all([drawPromise, constraintReady]).then(() => {
            // Check for errors after all async rendering is complete
            if (ganttInstance.hasErrors?.()) {
              const errors = ganttInstance.errorHandler?.getErrors?.() || [];
              const errorDetails = errors.map((entry) =>
                entry?.error?.stack || entry?.error?.message || entry?.stack || entry?.message || JSON.stringify(entry)
              );
              throw new Error(`Gantt errors: ${errorDetails.join('\n')}`);
            }
            // Store loaded rows
            ganttInstance.getLoadedRows = () => rows;
            return ganttInstance;
          });
        });
      }
      return Promise.resolve(ganttInstance);
    },

    timeout: (ms) => {
      // Vitest compatibility - sets timeout for current test
      ctx.task?.timeout?.(ms);
    },
  };

  // Push context onto stack and make it available via Object.assign
  contextStack.push(context);
  Object.assign(ctx, context);
});

afterEach((ctx) => {
  // Clean up test containers and Gantt instances from the context
  const context = contextStack.pop();
  if (context) {
    if (context.gantt && typeof context.gantt.destroy === 'function') {
      try {
        context.gantt.destroy();
      } catch (e) {
        console.warn('Error destroying Gantt instance:', e);
      }
    }
    context.__testContainers.forEach((el) => {
      try {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      } catch (e) {
        console.warn('Error removing test container:', e);
      }
    });
  }
});

// ============================================================================
// Export all test utilities globally
// ============================================================================

// Factory functions that delegate to the current test context
function createGantt(config) {
  const context = getCurrentContext();
  if (!context) {
    throw new Error('No active test context. createGantt() can only be called from within a test.');
  }
  return context.createGantt.call(context, config);
}

function timeout(ms) {
  const context = getCurrentContext();
  if (!context) {
    throw new Error('No active test context. timeout() can only be called from within a test.');
  }
  return context.timeout(ms);
}

function getTimeTableRowContainer(gantt) {
  return gantt.node.querySelector('.time-table-row-container');
}

function getTimeTableRow(gantt, id) {
  return document.getElementById(`${ROW_ID_PREFIX}${id}`);
}

Object.assign(globalThis, {
  // Test helper functions
  expectNotNull,
  getDOM,
  checkGanttForErrors,
  expectInDom,
  expectVisible,
  convertColorToHex,
  sameColors,

  // Test data creators
  createActivityData,
  createResourceWidthActivitiesData,
  createResourceActivityData,
  createResourceActivityReservationData,
  createSortingConfig,
  createHouseBuildingConfig,
  createProjectActivityChartConfig,

  // Global context factories
  createGantt,
  timeout,
  getTimeTableRowContainer,
  getTimeTableRow,

  // Dummy table utilities
  installDummyTable,
  uninstallDummyTable,

  // Constants
  ROW_ID_PREFIX,
  TIME_TABLE_ROW_ID_PREFIX: ROW_ID_PREFIX,
  ACTIVITY_CLASS: 'time-table-activity',
  TIME_TABLE_ROW_CLASS,
  minDate,
  maxDate,

  // Test utility class
  GanttTest,
});
