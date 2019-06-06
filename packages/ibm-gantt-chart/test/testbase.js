mocha.setup('bdd');
mocha.reporter('html');
mocha.globals(['jQuery']);

const { expect } = chai;

let DATA_PATH = '../../data';
const KARMA_CTX = false;

const ROW_ID_PREFIX = 'timeTableRow_';
//
// Extend chai with DOM oriented utils
//

/* Assertion.addProperty('inDOM', function () {
 this.assert(
 typeof this._obj === 'string' && !!document.getElementById(this._obj) || !!this._obj.parentNode
 , 'expected #{this} to be a visible DOM element'
 , 'expected #{this} to not a visible DOM element'
 );
 });

 Assertion.addProperty('notNull', function () {
 this.assert(
 this._obj
 , 'expected #{this} to exist'
 , 'expected #{this} to not exist'
 );
 }); */

function expectNotNull(node) {
  if (!node) {
    throw 'Not null object expected';
  }
}

function getDOM(node) {
  if (!node) {
    return null;
  }
  if (typeof node === 'string') {
    return document.getElementById(node);
  }
  if (node.length !== undefined) {
    return node.length ? node[0] : null;
  }
  return node;
}

function expectInDom(node, visible) {
  node = getDOM(node);
  if (visible) {
    if (!node.parentNode) {
      throw new Error(`${node} should be in DOM`);
    }
  } else if (node) {
    if (node.parentNode) {
      throw `${node} should not be in DOM`;
    }
  } // Otherwise NULL passes the test too
}

function checkGanttForErrors(gantt) {
  if (gantt.errorHandler.getErrors().length) {
    throw new Error(`Gantt errors ${JSON.stringify(gantt.errorHandler.getErrors())}`);
  }
}

function expectVisible(node, visible) {
  node = getDOM(node);
  if (!node) {
    throw new Error('Not null DOM node expected');
  }
  const { display } = window.getComputedStyle(node);
  if (visible) {
    if (display === 'none') {
      throw new Error(`${node} should be visible`);
    }
  } else if (display !== 'none') {
    throw new Error(`${node} should hidden`);
  }
}

function convertColorToHex(c) {
  if (c.startsWith('#')) {
    return c.toUpperCase();
  }
  if (c.startsWith('rgb')) {
    let comps = c.split('(')[1].split(')')[0];
    comps = comps.split(',');
    const hexArray = comps.map(function(x) {
      x = Number.parseInt(x, 10).toString(16); // Convert to a base16 string
      return x.length === 1 ? `0${x}` : x; // Add zero if we get only one character
    });
    return `#${hexArray.join('').toUpperCase()}`;
  }
  throw new Error(`Cannot process colors as ${c}`);
}

function sameColors(c1, c2) {
  return convertColorToHex(c1) === convertColorToHex(c2);
}

const minDate = new Date().getTime();
const maxDate = minDate + 3600000 * 24 * 4;
const actDuration = 3600000 * 2;

function createActivities(resId, rowNum, options) {
  if (options && options.createActivities) {
    return options.createActivities(resId, rowNum);
  }
  let count = options && options.getActivityCount ? options.getActivityCount(resId, rowNum) : undefined;
  if (count === undefined || count < 0) {
    count = Math.floor(Math.random() * 10);
  }
  let start = Math.floor(Math.random() * ((maxDate - minDate) / 5)) + minDate;
  const end = maxDate - Math.floor(Math.random() * ((maxDate - minDate) / 5)) - actDuration;
  let rest = end - start - actDuration * count;
  let inc = rest / count;
  const acts = [];
  const jobs = ['Mason', 'Painting', 'Ceiling', 'Electricity', 'Garden', 'Plomber'];
  for (let i = 0; i < count; ++i) {
    acts.push({
      id: options && options.getActivityId ? options.getActivityId(resId, i) : `${(resId && `${resId}_`) || ''}${i}`,
      name:
        options && options.getActivityName
          ? options.getActivityName(resId, i)
          : jobs[Math.floor(Math.random() * jobs.length)],
      start,
      end: start + actDuration,
    });
    inc = Math.floor(Math.random() * (rest / (count - i)));
    start += actDuration + inc;
    rest -= inc;
  }
  /* if (count) {
     console.log("Time window for resource " + resId + ":" + new Date(acts[0].start).format() + "," + new Date(acts[acts.length - 1].end).format());
     }
     else {
     console.log("No time window for resource " + resId);
     } */
  return acts;
}

function generateResources(resources, parent, level, options) {
  resources = resources || [];
  for (var i = 0, count = options.getResourceCount(parent, level), res; i < count; ++i) {
    res = options.customizeResource(options.generateResource(parent, level, i), parent, level, i);
    if (parent) {
      res.parentId = parent.id;
    }
    resources.push(res);
    resources = generateResources(resources, res, level + 1, options);
  }
  return resources;
}

function createResources(options) {
  if (!options || !options.generateResources) {
    return [
      {
        id: 'zero',
        name: 'Johan',
      },
      {
        id: 1,
        name: 'Johan 1',
        parentId: 'zero',
      },
      {
        id: 2,
        name: 'Johan 2',
        parentId: 'zero',
      },
      {
        id: 3,
        name: 'Johan 3',
        parentId: 'zero',
      },
      {
        id: 6,
        name: 'Isabel 1',
        parentId: 5,
      },
      {
        id: 4,
        name: 'Johan 3 1',
        parentId: 3,
      },
      {
        id: 5,
        name: 'Isabel',
      },
      {
        id: 7,
        name: 'Isabel 2',
        parentId: 5,
      },
      {
        id: 8,
        name: 'Gabriel',
      },
      {
        id: 9,
        name: 'Gabriel 1',
        parentId: 8,
      },
      {
        id: 10,
        name: 'Gabriel 2',
        parentId: 8,
      },
      {
        id: 11,
        name: 'Fanta',
      },
      {
        id: 12,
        name: 'Fanta 1',
        parentId: 11,
      },
      {
        id: 13,
        name: 'Fanta 2',
        parentId: 11,
      },
      {
        id: 14,
        name: 'Alone',
      },
      {
        id: 15,
        name: 'Barbara',
      },
      {
        id: 16,
        name: 'Barbara 1',
        parentId: 15,
      },
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
    customizeResource(res, parent, level, index) {
      return res;
    },
  };
  const finalOptions = $.extend({}, defaultOptions, options.generateResources);
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

function createActivityData(options) {
  const defaultOptions = {
    activityCounts: [100, 3, 2],
    getActivityCount(parent, level, rowNum) {
      return level >= this.activityCounts.length ? 0 : this.activityCounts[level];
    },
    activityIdPrefix: 'Id',
    getActivityId(parent, index) {
      return `${parent || this.activityIdPrefix}_${index}`;
    },
    activityNamePrefix: 'Act',
    getActivityName(parent, index) {
      return `${parent || this.activityNamePrefix}_${index}`;
    },
    customizeActivity(act, parent, level, index) {
      return act;
    },
    level: 0,
    row: 0,
  };
  const finalOptions = $.extend({}, defaultOptions, options.generateActivities);
  const oldGetter = finalOptions.getActivityCount;
  finalOptions.getActivityCount = function(parent, num) {
    return oldGetter.call(finalOptions, parent, finalOptions.level, num);
  };
  const actsByIds = {};
  const allActivities = [];

  function createActs(parent) {
    const acts = createActivities(parent ? parent.id : null, finalOptions.row, finalOptions);
    const count = acts.length;
    if (parent) {
      parent.children = acts;
    }
    for (let i = 0; i < acts.length; i++) {
      finalOptions.level++;
      acts[i].parent = parent ? parent.id : null;
      allActivities.push(acts[i]);
      finalOptions.row++;
      if (createActs(acts[i]) > 0) {
        acts[i].start = undefined;
        acts[i].end = undefined;
      }
      actsByIds[acts[i].id] = acts[i];
      finalOptions.level--;
    }
    return count;
  }
  createActs(null);

  return {
    activities: {
      start: 'start',
      end(actitivty) {
        return actitivty.end;
      },
      id: 'id',
      name(activity) {
        return activity.name;
      },
      data: allActivities,
      parent: 'parent',
    },
    getActivities(row) {
      const act = actsByIds[(typeof row === 'string' && row) || row.id];
      return (act && act.children) || [];
    },
  };
}

function createHouseBuildingConfig(config) {
  const nowMillis = new Date(2016, 7, 8, 8, 0, 0, 0).getTime();
  function makeDate(num) {
    return nowMillis + num * 12 * 60 * 60 * 1000;
  }
  const maxSubRows = config.activitySubRows || 0;
  function postProcess(workers) {
    let worker;
    let assigns;
    let assign;
    const results = [];
    for (let i = 0; i < workers.length; i++) {
      worker = workers[i];
      results.push(worker);
      assigns = worker.ASSIGNMENTS;
      const newAssigns = [];
      for (let iAssign = 0, assignCount = assigns ? assigns.length : 0; iAssign < assignCount; iAssign++) {
        assign = assigns[iAssign];
        newAssigns.push(assign);
        if (maxSubRows) {
          for (let iCp = 0, copyCount = maxSubRows - (iAssign % maxSubRows) - 1; iCp < copyCount; iCp++) {
            // for(var iCp = 0, copyCount = 1; iCp < copyCount; iCp++) {
            newAssigns.push($.extend({}, assign));
          }
        }
      }
      worker.ASSIGNMENTS = newAssigns;
    }
    return (config.success && config.success(results)) || results;
  }
  const houseConfig = {
    data: {
      resources: {
        url: `${DATA_PATH}/house_building/workers.json`,
        success: postProcess,
        parent: 'PARENT_ID',
        id: 'OBJECT_ID',
        activities: 'ASSIGNMENTS',
        name: 'NAME',
      },
      activities: {
        start(assignment) {
          return makeDate(assignment.START);
        },
        end(assignment) {
          return makeDate(assignment.END);
        },
        name: 'TASK.NAME',
      },
    },
    timeTable: {
      renderer: {
        text(activity) {
          return activity.TASK.NAME;
        },
        background: {
          getValue: 'TASK.NAME',
        },
        color: 'automatic',
      },
    },
  };
  if (config.layoutStrategy) {
    houseConfig.timeTable.layout = {
      strategy: config.layoutStrategy,
    };
  }
  if (config.rowHeight) {
    houseConfig.timeTable.renderer.rowHeight = config.rowHeight;
  }
  return houseConfig;
}

function createProjectActivityChartConfig(config) {
  const data = {
    resources: {
      url: `${DATA_PATH}/project_activitychart/resources.json`,
      success: config && config.success && config.success.resources,
      parent: 'parent',
      name: 'name',
      id: 'id',
    },
    reservations: {
      url: `${DATA_PATH}/project_activitychart/resas.json`,
      success: config && config.success && config.success.reservations,
      activity: 'activity',
      resource: 'resource',
    },
    activities: {
      url: `${DATA_PATH}/project_activitychart/activities.json`,
      success: config && config.success && config.success.activities,
      start: 'start',
      end: 'end',
      name: 'name',
      parent: 'parent',
    },
    constraints: {
      url: `${DATA_PATH}/project_activitychart/constraints.json`,
      success: config && config.success && config.success.constraints,
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

/**
 * Creates generic Gantt model with row and activity IDs being numbers
 * @param options the options for the Gantt model to create.
 */
function createGanttModel(options) {}

function getModelRowActivities(model, row) {
  return model.getActivities(row);
}

function isLastTest(test) {
  const result =
    (test.parent.root || isLastTest(test.parent)) &&
    [test.parent.tests, test.parent.suites].some(function(arr) {
      const index = arr.indexOf(test);
      return index > -1 && index === arr.length - 1;
    });
  return result;
}

function checkForEmptyRows(rows) {
  for (let i = 0, count = rows.length; i < count; ++i) {
    expect(rows[i]).to.exist;
  }
}

function checkForGanttErrors(gantt) {
  expect(gantt.hasErrors()).to.be.false;
}

function getTimeTableRowContainer(gantt) {
  const timeTableScroller = gantt.node.getElementsByClassName('time-table-scroller')[0];
  expect(timeTableScroller).to.be.not.null;
  const ctnr = timeTableScroller.getElementsByClassName('time-table-row-container')[0];
  expect(ctnr).to.be.not.null;
  return ctnr;
}

const TIME_TABLE_ROW_ID_PREFIX = 'timeTableRow_';
const ACTIVITY_CLASS = 'time-table-activity';

function getTimeTableRow(gantt, id) {
  return document.getElementById(TIME_TABLE_ROW_ID_PREFIX + id);
}

const TIME_TABLE_ROW_CLASS = 'time-table-row';
function checkGanttActivities(gantt, model) {
  const ctnr = getTimeTableRowContainer(gantt);
  const timeRows = ctnr.getElementsByClassName(TIME_TABLE_ROW_CLASS);
  expect(timeRows).to.have.length.of.at.least(1);
  const resourceGantt = gantt.isResourceGantt();
  for (var i = 0, timeRow, id, l = 'timeTableRow_'.length, acts, actNodes; i < timeRows.length; i++) {
    timeRow = timeRows[i];
    id = timeRow.id.substring(l);
    acts = model.getActivities(id);
    actNodes = timeRow.getElementsByClassName('time-table-activity');
    expect(actNodes.length).to.equal(resourceGantt ? acts.length : 1);
  }
}

beforeEach(function() {
  const test = this.currentTest;
  const { ctx } = this.currentTest;
  ctx.createGantt = function(config) {
    if (config && !config.header) {
      config.header = test && test.title;
    }
    this.ganttModel = config && config.data;
    // If launched with Karma, create the DOM gantt node
    ctx.gantt = $('#gantt').Gantt(config);
    ctx.gantt.getTest = function() {
      return test;
    };
    return ctx.gantt
      .initialized()
      .then(function(rows) {
        checkForEmptyRows(rows);
        checkForGanttErrors(ctx.gantt);
        // If model is memory model, perform more checking
        const rowModel = ctx.ganttModel && (ctx.ganttModel.resources || ctx.ganttModel.activities);
        if (rowModel && rowModel.data) {
          expect(rows.length).to.equal(rowModel.data.length);
          checkGanttActivities(ctx.gantt, ctx.ganttModel);
        }
        ctx.gantt.getLoadedRows = function() {
          return rows;
        };
        return ctx.gantt;
      })
      .then(function(gantt) {
        return new Promise(function(resolve) {
          setTimeout(function() {
            resolve(gantt);
          }, 1000);
        });
        // return gantt;
      });
  };
  ctx.getGantt = function() {
    return ctx.gantt;
  };
  ctx.getGanttModel = function() {
    return ctx.ganttModel;
  };
});

afterEach(function() {
  let { gantt } = this.currentTest.ctx;
  if (gantt) {
    if (this.currentTest.state === 'passed') {
      // nothing to do
    }
  }
  if ((gantt = this.currentTest.ctx.gantt) && !gantt.hasErrors() && !isLastTest(this.currentTest)) {
    gantt.destroy();
  }
});

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
      view: window,
      bubbles: true,
      cancelable: true,
      ctrlKey: ctrl,
    });
    node.dispatchEvent(event);
    /* if (ctrl) {
            var e = jQuery.Event("click");
            e.ctrlKey = true;
            $(node).trigger(e);
        }
        else {
            $(node).trigger("click");
        } */
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
      view: window,
      bubbles: true,
      cancelable: true,
    });
    act.dispatchEvent(event);

    event = new MouseEvent('dblclick', {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    act.dispatchEvent(event);
  },

  getTimeTableScroller() {
    const $tts = $(this.gantt.node).find('.time-table-scroller');
    expect($tts.length).to.equal(1);
    return $tts[0];
  },

  getTimeTableRowAt(top) {
    const tts = this.getTimeTableScroller();
    const $rowCtnr = $(tts).find('.time-table-row-container');
    expect($rowCtnr.length).to.equal(1);
    let rowTop = $rowCtnr.position().top;
    const rowCtnr = $rowCtnr[0];
    let rowNode = $rowCtnr[0].firstChild;
    let $rowNode;
    let h;
    while (rowNode && rowTop <= top) {
      $rowNode = $(rowNode);
      h = $rowNode.height();
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
      top += $(tr).height();
      rowIndex++;
    }
    for (let i = 0; i < ids.length; i++, rowIndex++) {
      this.checkRowDisplay(tr, ids[i], rowIndex, top);
      if (cb) {
        cb(tr, id, rowIndex, top);
      }
      top += $(tr).height();
      tr = tr.nextSibling;
    }
  },

  //
  // Column management
  //

  findColumn(name) {
    const $cols = $(this.gantt.node).find('.dataTables_scrollHead th');
    let colTitle;

    for (let iCol = 0; iCol < $cols.length; iCol++) {
      colTitle = $($cols[iCol])
        .contents()
        .filter(function() {
          return this.nodeType === Node.TEXT_NODE;
        })
        .text();
      if (name === colTitle) {
        return $cols[iCol];
      }
    }
    return null;
  },

  ensureColumnVisible(name) {
    const col = this.findColumn(name);
    expect(col).to.exist;
    const x = $(col).position().left;

    const $scrollBody = $(this.gantt.node).find('.table-panel .dataTables_scrollBody');
    const $scrollHead = $(this.gantt.node).find('.table-panel .dataTables_scrollHead');
    const left = $scrollBody.scrollLeft();
    if (left > x) {
      $scrollBody.scrollLeft(x);
      $scrollHead.scrollLeft(x); // /if doing nothing, the scroller header will scroll to the same left asynchroneously but here, we need to be done synchroneously
    } else if (left + $scrollBody.width() < x) {
      $scrollBody.scrollLeft(x);
      $scrollHead.scrollLeft(x); // /if doing nothing, the scroller header will scroll to the same left asynchroneously but here, we need to be done synchroneously
    }
  },

  sortColumn(name) {
    const col = this.findColumn(name);
    this.ensureColumnVisible(name);
    this.click(col);
  },
};

// Karma initialization
function initKarma() {
  let node = document.createElement('div');
  node.id = 'gantt';
  node.style.width = '100%';
  node.style.height = '400px';
  document.body.appendChild(node);

  node = document.createElement('div');
  node.id = 'mocha';
  document.body.appendChild(node);

  function importCSS(path) {
    const link = document.createElement('link');
    link.href = path;
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.media = 'screen,print';

    document.getElementsByTagName('head')[0].appendChild(link);
  }

  /* http://www.mattjmorrison.com/today-i-learned/2014/09/24/learned.html */
  importCSS('/base/node_modules/datatables.net-dt/css/jquery.dataTables.css');
  importCSS('/base/node_modules/vis/dist/vis.min.css');
  importCSS('/base/dist/ibm-gantt-chart-jquery.css');
  importCSS('/base/node_modules/mocha/mocha.css');

  DATA_PATH = '/base/data';
}
if (!document.getElementById('gantt')) {
  initKarma();
} else {
  $(document).ready(function() {
    mocha.run();
  });
}
