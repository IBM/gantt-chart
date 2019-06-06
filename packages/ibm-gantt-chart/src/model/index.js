import Gantt from '../core/core';

function updateTimeWindow(wnd, activity) {
  if (activity.start && wnd.start > activity.start) {
    wnd.start = activity.start;
  }
  if (activity.end && wnd.end < activity.end) {
    wnd.end = activity.end;
  }
  return activity;
}

const ConstraintPrototype = {
  isDisplayed() {
    return this.nodes !== null;
  },

  clearLink() {
    this.nodes = null;
  },

  setNodes(nodes) {
    this.nodes = nodes;
  },
};

export default class GanttModel extends Gantt.components.GanttModel {
  constructor(gantt, config) {
    super(gantt, config);
  }

  setConfiguration(config) {
    this.destroy();
    const ftchClass = Gantt.components.DataFetcher.impl || Gantt.components.DataFetcher;
    let fetchConfig;
    const checkFetcher = (fetcher, type) => {
      if (!fetcher.get) {
        throw new Error(
          `Could not configure data for ${type}. Probably a configuration issue with key(s) ${Object.keys(fetcher).join(
            ','
          )}`
        );
      }
    };
    this.dateParser = null;
    if (config.dateFormat) {
      try {
        this.dateParser = Gantt.utils.createDateParser(config.dateFormat);
      } catch (err) {
        throw new Error(`Could not process date format ${config.dateFormat}: ${err}`);
      }
    }
    const makeTimeFct = fct => {
      if (this.dateParser) {
        let final;
        return obj => {
          if (!final) {
            const value = fct(obj);
            if (Gantt.utils.isString(value)) {
              final = obj => this.dateParser(fct(obj));
              return this.dateParser(value);
            }
            final = fct;
            return value;
          }
          return final(obj);
        };
      }
      return fct;
    };

    this.allFetcher = null;
    if ((fetchConfig = config.all)) {
      this.allFetcher = new ftchClass(
        fetchConfig,
        ['reader', 'resources', 'activities', 'reservations', 'constraints'],
        { gantt: this.gantt }
      );
      checkFetcher(this.allFetcher, 'all');
      this.allFetcher._reader =
        fetchConfig.reader && Gantt.utils.isFunction(fetchConfig.reader)
          ? fetchConfig.reader
          : function(data) {
              return fetchConfig.reader;
            };
      this.allFetcher._resourcesGetter = fetchConfig.resources && Gantt.utils.propertyEvaluator(fetchConfig.resources);
      this.allFetcher._activitiesGetter =
        fetchConfig.activities && Gantt.utils.propertyEvaluator(fetchConfig.activities);
      this.allFetcher._reservationsGetter =
        fetchConfig.reservations && Gantt.utils.propertyEvaluator(fetchConfig.reservations);
      this.allFetcher._constraintsGetter =
        fetchConfig.constraints && Gantt.utils.propertyEvaluator(fetchConfig.constraints);
    }

    this.resourceFetcher = null;
    if ((fetchConfig = config.resources)) {
      this.resourceFetcher = new ftchClass(fetchConfig, ['id', 'parent', 'name', 'activities'], { gantt: this.gantt });
      checkFetcher(this.resourceFetcher, 'resources');
      if (fetchConfig.parent) {
        this.resourceFetcher._parentIdGetter = Gantt.utils.propertyEvaluator(fetchConfig.parent || 'parentId');
      }
      this.resourceFetcher._idGetter = Gantt.utils.propertyEvaluator(fetchConfig.id || 'id');
      this.resourceFetcher._nameGetter =
        (fetchConfig.name && Gantt.utils.propertyEvaluator(fetchConfig.name)) || this.resourceFetcher._idGetter;
      if (fetchConfig.activities) {
        this.resourceFetcher._activityGetter = Gantt.utils.propertyEvaluator(fetchConfig.activities);
      }
    }

    if ((fetchConfig = config.activities)) {
      // Do no not create an activity getter if activities are provided along with the resources
      this.activityFetcher =
        (this.resourceFetcher && this.resourceFetcher._activityGetter && {}) ||
        new ftchClass(fetchConfig, ['id', 'parent', 'name', 'start', 'end', 'resource'], { gantt: this.gantt });
      if (!this.resourceFetcher || !this.resourceFetcher._activityGetter) {
        checkFetcher(this.activityFetcher, 'activities');
      }
      if (fetchConfig.parent) {
        this.activityFetcher._parentIdGetter = Gantt.utils.propertyEvaluator(fetchConfig.parent || 'parentId');
      }
      this.activityFetcher._idGetter = Gantt.utils.propertyEvaluator(fetchConfig.id || 'id');
      this.activityFetcher._nameGetter =
        (fetchConfig.name && Gantt.utils.propertyEvaluator(fetchConfig.name)) || this.activityFetcher._idGetter;
      this.activityFetcher._startGetter = makeTimeFct(Gantt.utils.propertyEvaluator(fetchConfig.start || 'start'));
      this.activityFetcher._endGetter = makeTimeFct(Gantt.utils.propertyEvaluator(fetchConfig.end || 'end'));
      if (fetchConfig.resource) {
        this.activityFetcher._resourceIdGetter = Gantt.utils.propertyEvaluator(fetchConfig.resource);
      }
    }

    if ((fetchConfig = config.reservations)) {
      this.reservationFetcher = new ftchClass(fetchConfig, ['activity', 'resource'], { gantt: this.gantt });
      checkFetcher(this.reservationFetcher, 'reservations');
      // noinspection JSUnresolvedVariable
      this.reservationFetcher._activityGetter = Gantt.utils.propertyEvaluator(fetchConfig.activity || 'activity');
      this.reservationFetcher._resourceGetter = Gantt.utils.propertyEvaluator(fetchConfig.resource || 'resource');
    }

    if ((fetchConfig = config.constraints)) {
      this.constraintFetcher = new ftchClass(fetchConfig, ['from', 'to', 'type'], { gantt: this.gantt });
      checkFetcher(this.constraintFetcher, 'constraints');
      this.constraintFetcher._fromGetter = Gantt.utils.propertyEvaluator(fetchConfig.from || 'from');
      // noinspection JSUnresolvedVariable
      this.constraintFetcher._toGetter = Gantt.utils.propertyEvaluator(fetchConfig.to || 'to');
      this.constraintFetcher._typeGetter = Gantt.utils.propertyEvaluator(fetchConfig.type || 'type');
      this.constraintFetcher._idGetter = (fetchConfig.id && Gantt.utils.propertyEvaluator(fetchConfig.id)) || null;
    }

    if ((fetchConfig = config.timeWindow)) {
      this.timeWindowFetcher = new ftchClass(fetchConfig, null, { gantt: this.gantt });
      checkFetcher(this.timeWindowFetcher, 'timeWindow');
      this.timeWindowFetcher._startGetter = makeTimeFct(Gantt.utils.propertyEvaluator(fetchConfig.start || 'start'));
      this.timeWindowFetcher._endGetter = makeTimeFct(Gantt.utils.propertyEvaluator(fetchConfig.end || 'end'));
    }
  }

  load(config) {
    if (config) {
      this.destroy();
      this.setConfiguration(config);
    }

    this.allData = null;
    if (this.allFetcher) {
      return this.allFetcher.get().then(data => this.loadFromData(data));
    }
    return this.loadFromData();
  }

  loadFromData(data /* May be null */) {
    let actPromise;
    let resaPromise;
    let resourcePromise;
    let consPromise;
    this.activities = [];
    this.activities.byIds = {};
    this.rows = [];
    this.constraints = [];
    this.constraints.byIds = {};
    this.resources = [];
    this.resources.byIds = {};
    this.reservations = [];
    this.reservations.byIds = {};
    this.timeWindow = null;
    this.flat = true;

    let wnd;
    let wndPromise;
    if (this.timeWindowFetcher) {
      wndPromise = this.timeWindowFetcher.get(data).then(obj => ({
        start: this.timeWindowFetcher._startGetter(obj),
        end: this.timeWindowFetcher._endGetter(obj),
      }));
    } else {
      // If time window not provided with a specified data fetcher, we compute it.
      wnd = { start: Number.MAX_VALUE, end: 0 } || null;
    }

    const resourceGantt = this.gantt.isResourceGantt();
    if (!this.resourceFetcher && !this.activityFetcher) {
      if (resourceGantt) resourcePromise = Promise.resolve([]);
      else actPromise = Promise.resolve([]);
    } else {
      let timeWindowProcessed = !!wndPromise;
      if (this.resourceFetcher) {
        resourcePromise = this.resourceFetcher.get(data).then(resources => {
          // Compute here the time window only if this is resource chart with activities provided along with resources
          const computeTimeWindow = !timeWindowProcessed && (resourceGantt && this.resourceFetcher._activityGetter);
          this.resources = this.createTreeNodes(resources, this.resourceFetcher, false, computeTimeWindow && wnd);
          timeWindowProcessed = timeWindowProcessed || computeTimeWindow;
          return this.resources;
        });
      }

      if (this.activityFetcher && (!resourceGantt || !this.resourceFetcher || !this.resourceFetcher._activityGetter)) {
        actPromise = this.activityFetcher.get(data).then(activities => {
          // Compute here the time window only if a time window fetcher was not specified
          this.activities = this.createTreeNodes(activities, this.activityFetcher, true, !timeWindowProcessed && wnd);
          return this.activities;
        });
      }

      if (this.reservationFetcher) {
        resaPromise = this.reservationFetcher.get(data);
      }

      if (this.constraintFetcher) {
        consPromise = this.constraintFetcher.get(data);
      }
    }

    return Promise.all([resourcePromise, actPromise, resaPromise, consPromise, wndPromise]).then(
      ([resources, activities, resas, cons, wndResult]) => {
        // If assigning activities to resources through a resource ID getter on activities
        if (this.activityFetcher && this.activityFetcher._resourceIdGetter) {
          this.createReservationsFromActivityResources(resourceGantt ? this.resources.byIds : this.activities.byIds);
        }
        if (resas && resas.length) {
          this.createReservations(resas);
        }
        if (cons && cons.length) {
          this.createConstraints(cons);
        }
        wndResult = wndResult || wnd;
        if (!wndResult.end && resourceGantt && activities && activities.length) {
          // Gantt without reservations, process time window from unused activities
          wndResult.start = activities[0].start;
          wndResult.end = activities[0].end;
          for (let i = activities.length - 1; i; i--) {
            updateTimeWindow(wndResult, activities[i]);
          }
        }
        if (wndResult.end) {
          this.timeWindow = { start: wndResult.start, end: wndResult.end };
          this.triggerEvent(Gantt.events.TIME_WINDOW_CHANGED, this.timeWindow);
        }
        return (this.rows = resourceGantt ? resources : activities);
      }
    );
  }

  createReservations(data) {
    this.reservations = [];
    this.reservations.byIds = {};
    if (!data || data.length === 0) {
      return;
    }
    const resByIds = this.resources.byIds;
    const actByIds = this.activities.byIds;
    const resIdGetter = this.reservationFetcher._resourceGetter;
    const actIdGetter = this.reservationFetcher._activityGetter;
    for (let i = 0, resId, res, actId, act, len = data.length, resa; i < len; ++i) {
      resa = data[i];
      resId = resIdGetter(resa);
      if ((resId || resId === 0) && (res = resByIds[resId])) {
        actId = actIdGetter(resa);
        if ((actId || actId === 0) && (act = actByIds[actId])) {
          (res.activities || (res.activities = [])).push((resa = this.createReservationNode(act, res)));
          this.reservations.push(resa);
          if (resa.id) {
            this.reservations.byIds[resa.id] = resa;
          }
        } else if (actId) {
          console.error(`Cannot find activity "${actId}" for reservation ${JSON.stringify(resa)}`);
        } else {
          console.error(`No activity specified for reservation ${JSON.stringify(resa)}`);
        }
      } else if (resId || resId === 0) {
        console.error(`Cannot find resource "${resId}" for reservation ${JSON.stringify(resa)}`);
      } else {
        console.error(`No resource specified for reservation ${JSON.stringify(resa)}`);
      }
    }
  }

  createReservationsFromActivityResources(rowByIds) {
    const resGetter = this.activityFetcher._resourceIdGetter;
    for (let i = 0, resId, res, len = this.activities.length, actNode; i < len; ++i) {
      resId = resGetter((actNode = this.activities[i]).getData());
      if (resId || resId === 0) {
        if ((res = rowByIds[resId])) {
          (res.activities || (res.activities = [])).push(this.createReservationNode(actNode, res));
        } else {
          console.error(`Cannot find resource "${resId}" for activity ${JSON.stringify(actNode.getData())}`);
        }
      } else {
        console.error(`No resource specified for activity ${JSON.stringify(actNode.getData())}`);
      }
    }
  }

  createConstraints(data) {
    const len = data.length;
    const consNodes = new Array(len);
    consNodes.byIds = {};
    for (let i = 0, node; i < len; ++i) {
      consNodes[i] = node = this.createConstraintNode(data[i], this.activities, i);
      consNodes.byIds[node.id] = node;
    }
    return (this.constraints = consNodes);
  }

  isResourceGanttModel() {
    return !!this.resourceFetcher;
  }

  isFlat() {
    return this.flat;
  }

  createActivityNode(activity) {
    const node = Object.create(activity);
    node.id = this.activityFetcher._idGetter(activity);
    node.name = this.activityFetcher._nameGetter(activity);
    node.start = this.activityFetcher._startGetter(activity);
    node.end = this.activityFetcher._endGetter(activity);
    node.getData = function() {
      return activity;
    };
    node.gantt = this.gantt;
    node.getObjectType = function() {
      return Gantt.ObjectTypes.Activity;
    };
    return node;
  }

  createReservationNode(activity, row) {
    const node = Object.create(activity);
    node.row = row;
    node.gantt = this.gantt;
    node.getObjectType = function() {
      return Gantt.ObjectTypes.Activity;
    }; // No reservation type as for now an activity acts as a reservation as the copy objects points to a row
    return node;
  }

  createConstraintNode(cons, activities, index) {
    let id = this.constraintFetcher._fromGetter(cons);
    if (!id) {
      throw `No from activity specified for the constraint ${JSON.stringify(cons)}`;
    }
    const from = activities.byIds[id];
    if (!from) {
      throw `No activity could be found with the ID ${id}for constraint ${JSON.stringify(cons)}`;
    }

    id = this.constraintFetcher._toGetter(cons);
    if (!id) {
      throw `No to activity specified for the constraint ${JSON.stringify(cons)}`;
    }
    const to = activities.byIds[id];
    if (!to) {
      throw `No activity could be found with the ID ${id}for constraint ${JSON.stringify(cons)}`;
    }
    const node = Object.create(cons, ConstraintPrototype);
    node.from = from;
    node.to = to;
    node.type = this.constraintFetcher._typeGetter(cons);
    node.gantt = this.gantt;
    node.getData = function() {
      return cons;
    };
    node.id = this.constraintFetcher._idGetter ? this.constraintFetcher._idGetter(cons) : `cons_${index}`;
    if (!from.consOuts) from.consOuts = [node];
    else from.consOuts.push(node);
    if (!to.consIns) to.consIns = [node];
    else to.consIns.push(node);
    node.getObjectType = function() {
      return Gantt.ObjectTypes.Constraint;
    };
    return node;
  }

  createTreeNode(id, data) {
    const row = Object.create(data);

    row.id = id;
    row.gantt = this.gantt;
    row.getData = function() {
      return data;
    };
    row.hasAncestor = function(node) {
      for (let p = row.parent; p; p = p.parent) {
        if (p === node) {
          return true;
        }
      }
      return true;
    };

    row.getAncestorsCount = function() {
      let count = 0;
      for (let { parent } = row; parent; parent = parent.parent) {
        count++;
      }
      return count;
    };

    row.setRowHeight = function(row, h) {};

    row.isGanttRow = function() {
      return true;
    };
    return row;
  }

  createTreeNodes(data, rowFetcher, isActivity, wnd) {
    const result = new Array(data.length);
    const byIds = (result.byIds = {});
    const children = {};
    let row;
    let origData;
    let parentId;
    let arr;
    let i;
    let resultIndex;
    let id;
    let activities;
    let iAct;
    let len;
    const roots = [];

    const allActivities = this.activities;
    let actNode;
    let startGetter;
    let endGetter;
    let actsGetter;
    let act;
    if (isActivity || (actsGetter = rowFetcher._activityGetter)) {
      startGetter = this.activityFetcher._startGetter;
      endGetter = this.activityFetcher._endGetter;
    }

    /* function sortNodes(a, b) {
      // Put child nodes with children first
      const aChildren = children[a.id], bChildren = children[b.id];
      return aChildren && aChildren.length
          ? (bChildren && bChildren.length? 0 : -1) : (bChildren && bChildren.length? 1 : 0)
    } */

    function addNode(node, parentNode) {
      result[resultIndex++] = node;
      node.parent = parentNode;
      // const childNodes = children[node.id].sort(sortNodes);
      const childNodes = children[node.id];
      node.children = childNodes;
      const childCount = childNodes.length;
      for (let iChild = 0; iChild < childCount; ++iChild) {
        addNode(childNodes[iChild], node);
      }
      if (isActivity && childCount && (!node.start || !node.end)) {
        if (!node.start) {
          node.start = childNodes[0].start;
        }
        if (!node.end) {
          node.end = childNodes[0].end;
        }
        for (let iChild = 1; iChild < childCount; ++iChild) {
          updateTimeWindow(node, childNodes[iChild]);
        }
      }
      if (wnd && isActivity) {
        updateTimeWindow(wnd, node);
      }
    }

    const idGetter = rowFetcher._idGetter;
    const nameGetter = rowFetcher._nameGetter;
    const parentIdGetter = rowFetcher._parentIdGetter;

    for (i = 0, len = data.length; i < len; ++i) {
      origData = data[i];
      parentId = parentIdGetter ? parentIdGetter(origData) : null;
      id = idGetter(origData);
      row = this.createTreeNode(id, origData, children[id]);
      if (!children[id]) {
        children[id] = [];
      }
      if (nameGetter) {
        row.name = nameGetter(origData);
      }
      if (isActivity) {
        row.start = rowFetcher._startGetter(origData);
        row.end = rowFetcher._endGetter(origData);
        row.activities = [row];
        row.getObjectType = function() {
          return Gantt.ObjectTypes.Activity;
        };
      } else {
        row.getObjectType = function() {
          return Gantt.ObjectTypes.Resource;
        };
      }

      // Process the time window
      if (wnd) {
        if (!isActivity) {
          activities = actsGetter(origData);
          if (activities) {
            row.activities = new Array(activities.length);
            for (iAct = 0; iAct < activities.length; ++iAct) {
              actNode = this.createActivityNode((act = activities[iAct]));
              allActivities.push(actNode);
              if (actNode.id) {
                allActivities.byIds[actNode.id] = actNode;
              }
              row.activities[iAct] = this.createReservationNode(updateTimeWindow(wnd, actNode), row);
            }
          } else {
            row.activities = [];
          }
        } else {
          // We are defining an activity chart, rows are activities
          updateTimeWindow(wnd, row);
        }
      }
      byIds[id] = row;
      if (parentId || parentId === 0) {
        arr = children[parentId];
        if (!arr) {
          children[parentId] = [row];
        } else {
          arr.push(row);
        }
      } else {
        roots.push(row);
      }
    }
    if (this.gantt.isResourceGantt() !== isActivity) {
      this.flat = roots.length === data.length;
    }
    for (i = 0, len = roots.length, resultIndex = 0; i < len; ++i) {
      addNode(roots[i]);
    }

    return result;
  }

  destroy() {
    if (this.allFetcher && this.allFetcher.destroy) {
      this.allFetcher.destroy();
    }
    this.allFetcher = null;
    if (this.resourceFetcher && this.resourceFetcher.destroy) {
      this.resourceFetcher.destroy();
    }
    this.resourceFetcher = null;
    this.resources = null;

    if (this.activityFetcher && this.activityFetcher.destroy) {
      this.activityFetcher.destroy();
    }
    this.activityFetcher = null;
    this.activities = null;

    if (this.reservationFetcher && this.reservationFetcher.destroy) {
      this.reservationFetcher.destroy();
    }
    this.reservationFetcher = null;
    this.reservations = null;

    if (this.constraintFetcher && this.constraintFetcher.destroy) {
      this.constraintFetcher.destroy();
    }
    this.constraintFetcher = null;
    this.constraints = null;

    if (this.timeWindowFetcher && this.timeWindowFetcher.destroy) {
      this.timeWindowFetcher.destroy();
    }
    this.timeWindowFetcher = null;
    this.timeWindow = null;
  }

  getActivity(param) {
    if (Gantt.utils.isString(param)) {
      return this.activities && this.activities.byIds[param];
    }
    if (this.activities) {
      for (let i = 0, count = this.activities.length; i < count; ++i) {
        if (this.activities[i].getData() === param) {
          return this.activities[i];
        }
      }
    }
    return null;
  }
}

Gantt.components.GanttModel = GanttModel;
