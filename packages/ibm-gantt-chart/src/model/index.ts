import Gantt from '../core/core';
import { getComponent } from '../core/component-factory';
import type {
  TimeWindow,
  Activity,
  Resource,
  Row,
  Constraint,
  Reservation,
  IDataFetcher,
  DataFetcherInternal,
  ModelConfig,
  DateParser,
  DataFetchConfig,
} from '../types';

interface ConstraintPrototypeType {
  isDisplayed(this: ConstraintNode): boolean;
  clearLink(this: ConstraintNode): void;
  setNodes(this: ConstraintNode, nodes: unknown): void;
}

interface ActivityNode extends Activity {
  getData(): unknown;
  gantt: unknown;
  getObjectType(): number;
  consOuts?: ConstraintNode[];
  consIns?: ConstraintNode[];
}

interface TimeBoundedNode {
  start: number;
  end: number;
}

interface ResourceNode extends Resource {
  start: number;
  end: number;
  getData(): unknown;
  gantt: unknown;
  getObjectType(): number;
  parent?: ResourceNode;
  children?: ResourceNode[];
  hasAncestor(node: ResourceNode): boolean;
  getAncestorsCount(): number;
  setRowHeight(row: ResourceNode, h: number): void;
  isGanttRow(): boolean;
}

interface ConstraintNode extends Constraint {
  getData(): unknown;
  gantt: unknown;
  getObjectType(): number;
  from: ActivityNode;
  to: ActivityNode;
  nodes: unknown;
}

interface DataArray<T> extends Array<T> {
  byIds: Record<string, T>;
}

const ConstraintPrototype: ConstraintPrototypeType = {
  isDisplayed(this: ConstraintNode): boolean {
    return this.nodes !== null;
  },

  clearLink(this: ConstraintNode): void {
    this.nodes = null;
  },

  setNodes(this: ConstraintNode, nodes: unknown): void {
    this.nodes = nodes;
  },
};

function updateTimeWindow<T extends TimeBoundedNode>(wnd: TimeWindow, activity: T): T {
  if (activity.start && wnd.start > activity.start) {
    wnd.start = activity.start;
  }
  if (activity.end && wnd.end < activity.end) {
    wnd.end = activity.end;
  }
  return activity;
}

export default class GanttModel extends Gantt.components.GanttModel {
  private dateParser: DateParser | null = null;
  private allFetcher: DataFetcherInternal | null = null;
  private resourceFetcher: DataFetcherInternal | null = null;
  private activityFetcher: DataFetcherInternal | null = null;
  private reservationFetcher: DataFetcherInternal | null = null;
  private constraintFetcher: DataFetcherInternal | null = null;
  private timeWindowFetcher: DataFetcherInternal | null = null;

  private allData: unknown = null;
  activities: DataArray<ActivityNode> = Object.assign([], { byIds: {} });
  resources: DataArray<ResourceNode> = Object.assign([], { byIds: {} });
  constraints: DataArray<ConstraintNode> = Object.assign([], { byIds: {} });
  reservations: DataArray<Reservation> = Object.assign([], { byIds: {} });
  rows: DataArray<Row> = Object.assign([], { byIds: {} });
  timeWindow: TimeWindow | null = null;
  private flat: boolean = true;

  private gantt: unknown;

  constructor(gantt: unknown, config: ModelConfig) {
    super(gantt, config);
    this.gantt = gantt;
  }

  setConfiguration(config: ModelConfig): void {
    this.destroy();
    const FetcherClass = getComponent('DataFetcher', Gantt.components.DataFetcher);
    let fetchConfig: unknown;

    const checkFetcher = (fetcher: IDataFetcher, type: string): void => {
      if (!('get' in fetcher)) {
        throw new Error(
          `Could not configure data for ${type}. Probably a configuration issue with key(s) ${Object.keys(fetcher).join(',')}`
        );
      }
    };

    this.dateParser = null;
    if (config.dateFormat && typeof config.dateFormat === 'string') {
      try {
        this.dateParser = Gantt.utils.createDateParser(config.dateFormat);
      } catch (err) {
        throw new Error(`Could not process date format ${config.dateFormat}: ${err}`);
      }
    }

    const makeTimeFct = (fct: (obj: unknown) => number): ((obj: unknown) => number) => {
      if (this.dateParser) {
        let final: ((obj: unknown) => number) | null = null;
        return (obj: unknown): number => {
          if (!final) {
            const value = fct(obj);
            if (Gantt.utils.isString(value)) {
              final = (obj: unknown): number => this.dateParser!(fct(obj) as string);
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

    if ((fetchConfig = config.all)) {
      this.allFetcher = new FetcherClass(
        fetchConfig,
        ['reader', 'resources', 'activities', 'reservations', 'constraints'],
        { gantt: this.gantt }
      ) as DataFetcherInternal;
      checkFetcher(this.allFetcher, 'all');
      const fetchConfigTyped = fetchConfig as DataFetchConfig;
      this.allFetcher._reader =
        fetchConfigTyped.reader && Gantt.utils.isFunction(fetchConfigTyped.reader)
          ? (fetchConfigTyped.reader as (data: unknown) => unknown)
          : function getReader(data: unknown) {
              return fetchConfigTyped.reader;
            };
      this.allFetcher._resourcesGetter =
        fetchConfigTyped.resources && Gantt.utils.propertyEvaluator(String(fetchConfigTyped.resources));
      this.allFetcher._activitiesGetter =
        fetchConfigTyped.activities && Gantt.utils.propertyEvaluator(String(fetchConfigTyped.activities));
      this.allFetcher._reservationsGetter =
        fetchConfigTyped.reservations && Gantt.utils.propertyEvaluator(String(fetchConfigTyped.reservations));
      this.allFetcher._constraintsGetter =
        fetchConfigTyped.constraints && Gantt.utils.propertyEvaluator(String(fetchConfigTyped.constraints));
    }

    if ((fetchConfig = config.resources)) {
      this.resourceFetcher = new FetcherClass(fetchConfig, ['id', 'parent', 'name', 'activities'], {
        gantt: this.gantt,
      }) as DataFetcherInternal;
      checkFetcher(this.resourceFetcher, 'resources');
      const fetchConfigTyped = fetchConfig as DataFetchConfig;
      if (fetchConfigTyped.parent) {
        this.resourceFetcher._parentIdGetter = Gantt.utils.propertyEvaluator(
          String(fetchConfigTyped.parent) || 'parentId'
        );
      }
      this.resourceFetcher._idGetter = Gantt.utils.propertyEvaluator(String(fetchConfigTyped.id) || 'id');
      this.resourceFetcher._nameGetter =
        (fetchConfigTyped.name && Gantt.utils.propertyEvaluator(String(fetchConfigTyped.name))) ||
        this.resourceFetcher._idGetter;
      if (fetchConfigTyped.activities) {
        this.resourceFetcher._activityGetter = Gantt.utils.propertyEvaluator(String(fetchConfigTyped.activities));
      }
    }

    if ((fetchConfig = config.activities)) {
      const resourceActivityGetter =
        this.gantt.isResourceGantt() && this.resourceFetcher && this.resourceFetcher._activityGetter;
      this.activityFetcher = (
        resourceActivityGetter
          ? ({} as DataFetcherInternal)
          : new FetcherClass(fetchConfig, ['id', 'parent', 'name', 'start', 'end', 'resource'], { gantt: this.gantt })
      ) as DataFetcherInternal;
      if (!this.resourceFetcher || !resourceActivityGetter) {
        checkFetcher(this.activityFetcher, 'activities');
      }
      const fetchConfigTyped = fetchConfig as DataFetchConfig;
      if (fetchConfigTyped.parent) {
        this.activityFetcher._parentIdGetter = Gantt.utils.propertyEvaluator(
          String(fetchConfigTyped.parent) || 'parentId'
        );
      }
      this.activityFetcher._idGetter = Gantt.utils.propertyEvaluator(String(fetchConfigTyped.id) || 'id');
      this.activityFetcher._nameGetter =
        (fetchConfigTyped.name && Gantt.utils.propertyEvaluator(String(fetchConfigTyped.name))) ||
        this.activityFetcher._idGetter;
      this.activityFetcher._startGetter = makeTimeFct(
        Gantt.utils.propertyEvaluator(String(fetchConfigTyped.start) || 'start') as (obj: unknown) => number
      );
      this.activityFetcher._endGetter = makeTimeFct(
        Gantt.utils.propertyEvaluator(String(fetchConfigTyped.end) || 'end') as (obj: unknown) => number
      );
      if (fetchConfigTyped.resource) {
        this.activityFetcher._resourceIdGetter = Gantt.utils.propertyEvaluator(String(fetchConfigTyped.resource));
      }
    }

    if ((fetchConfig = config.reservations)) {
      this.reservationFetcher = new FetcherClass(fetchConfig, ['activity', 'resource'], {
        gantt: this.gantt,
      }) as DataFetcherInternal;
      checkFetcher(this.reservationFetcher, 'reservations');
      const fetchConfigTyped = fetchConfig as DataFetchConfig;
      this.reservationFetcher._activityGetter = Gantt.utils.propertyEvaluator(
        String(fetchConfigTyped.activity) || 'activity'
      );
      this.reservationFetcher._resourceGetter = Gantt.utils.propertyEvaluator(
        String(fetchConfigTyped.resource) || 'resource'
      );
    }

    if ((fetchConfig = config.constraints)) {
      this.constraintFetcher = new FetcherClass(fetchConfig, ['from', 'to', 'type'], {
        gantt: this.gantt,
      }) as DataFetcherInternal;
      checkFetcher(this.constraintFetcher, 'constraints');
      const fetchConfigTyped = fetchConfig as DataFetchConfig;
      this.constraintFetcher._fromGetter = Gantt.utils.propertyEvaluator(String(fetchConfigTyped.from) || 'from');
      this.constraintFetcher._toGetter = Gantt.utils.propertyEvaluator(String(fetchConfigTyped.to) || 'to');
      this.constraintFetcher._typeGetter = Gantt.utils.propertyEvaluator(String(fetchConfigTyped.type) || 'type');
      this.constraintFetcher._idGetter =
        (fetchConfigTyped.id && Gantt.utils.propertyEvaluator(String(fetchConfigTyped.id))) || null;
    }

    if ((fetchConfig = config.timeWindow)) {
      this.timeWindowFetcher = new FetcherClass(fetchConfig, null, { gantt: this.gantt }) as DataFetcherInternal;
      checkFetcher(this.timeWindowFetcher, 'timeWindow');
      const fetchConfigTyped = fetchConfig as DataFetchConfig;
      this.timeWindowFetcher._startGetter = makeTimeFct(
        Gantt.utils.propertyEvaluator(String(fetchConfigTyped.start) || 'start') as (obj: unknown) => number
      );
      this.timeWindowFetcher._endGetter = makeTimeFct(
        Gantt.utils.propertyEvaluator(String(fetchConfigTyped.end) || 'end') as (obj: unknown) => number
      );
    }
  }

  load(config?: ModelConfig): Promise<Row[]> {
    if (config) {
      this.destroy();
      this.setConfiguration(config);
    }

    this.allData = null;
    if (this.allFetcher) {
      return this.allFetcher.get().then((data: unknown) => this.loadFromData(data));
    }
    return this.loadFromData();
  }

  loadFromData(data?: unknown): Promise<Row[]> {
    let actPromise: Promise<ActivityNode[]> | undefined;
    let resaPromise: Promise<unknown> | undefined;
    let resourcePromise: Promise<ResourceNode[]> | undefined;
    let consPromise: Promise<unknown> | undefined;

    this.activities = Object.assign([], { byIds: {} });
    this.rows = Object.assign([], { byIds: {} });
    this.constraints = Object.assign([], { byIds: {} });
    this.resources = Object.assign([], { byIds: {} });
    this.reservations = Object.assign([], { byIds: {} });
    this.timeWindow = null;
    this.flat = true;

    let wnd: TimeWindow | null;
    let wndPromise: Promise<TimeWindow> | undefined;
    if (this.timeWindowFetcher) {
      wndPromise = this.timeWindowFetcher.get(data).then((obj: unknown) => ({
        start: this.timeWindowFetcher!._startGetter!(obj),
        end: this.timeWindowFetcher!._endGetter!(obj),
      }));
    } else {
      wnd = { start: Number.MAX_VALUE, end: 0 };
    }

    const ganttTyped = this.gantt as Record<string, () => boolean>;
    const resourceGantt = ganttTyped.isResourceGantt?.();
    if (!this.resourceFetcher && !this.activityFetcher) {
      if (resourceGantt) resourcePromise = Promise.resolve([]);
      else actPromise = Promise.resolve([]);
    } else {
      let timeWindowProcessed = !!wndPromise;
      if (this.resourceFetcher) {
        resourcePromise = this.resourceFetcher.get(data).then((resources: unknown) => {
          const computeTimeWindow = !timeWindowProcessed && resourceGantt && this.resourceFetcher._activityGetter;
          this.resources = this.createTreeNodes(
            resources,
            this.resourceFetcher,
            false,
            computeTimeWindow && wnd
          ) as DataArray<ResourceNode>;
          timeWindowProcessed = timeWindowProcessed || computeTimeWindow;
          return this.resources;
        });
      }

      if (this.activityFetcher && (!resourceGantt || !this.resourceFetcher || !this.resourceFetcher._activityGetter)) {
        actPromise = this.activityFetcher.get(data).then((activities: unknown) => {
          this.activities = this.createTreeNodes(
            activities,
            this.activityFetcher,
            true,
            !timeWindowProcessed && wnd
          ) as DataArray<ActivityNode>;
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
        if (this.activityFetcher && this.activityFetcher._resourceIdGetter) {
          this.createReservationsFromActivityResources(resourceGantt ? this.resources.byIds : this.activities.byIds);
        }
        if (resas && Array.isArray(resas) && resas.length) {
          this.createReservations(resas);
        }
        if (cons && Array.isArray(cons) && cons.length) {
          this.createConstraints(cons);
        }
        wndResult = wndResult || wnd;
        if (wndResult && !wndResult.end && resourceGantt && activities && activities.length) {
          wndResult.start = activities[0].start;
          wndResult.end = activities[0].end;
          for (let i = activities.length - 1; i; i--) {
            updateTimeWindow(wndResult, activities[i]);
          }
        }
        if (wndResult && wndResult.end) {
          this.timeWindow = { start: wndResult.start, end: wndResult.end };
          const ganttEvent = this.gantt as Record<string, (event: string, data: TimeWindow) => void>;
          ganttEvent.triggerEvent?.(Gantt.events.TIME_WINDOW_CHANGED, this.timeWindow);
        }
        this.rows = resourceGantt ? (resources as DataArray<Row>) : (activities as DataArray<Row>);
        return this.rows;
      }
    );
  }

  createReservations(data: unknown[]): void {
    this.reservations = Object.assign([], { byIds: {} });
    if (!data || data.length === 0) {
      return;
    }
    const resByIds = this.resources.byIds;
    const actByIds = this.activities.byIds;
    const resIdGetter = this.reservationFetcher!._resourceGetter!;
    const actIdGetter = this.reservationFetcher!._activityGetter!;
    for (let i = 0, len = data.length; i < len; ++i) {
      const resa = data[i];
      const resId = resIdGetter(resa);
      if ((resId || resId === 0) && resId in resByIds) {
        const res = resByIds[resId];
        const actId = actIdGetter(resa);
        if ((actId || actId === 0) && actId in actByIds) {
          const act = actByIds[actId];
          (res.activities || (res.activities = [])).push(this.createReservationNode(act, res));
          const resaTyped = resa as Record<string, unknown>;
          const reservation = resa as Reservation;
          this.reservations.push(reservation);
          if (resaTyped.id) {
            this.reservations.byIds[String(resaTyped.id)] = reservation;
          }
        } else if (actId) {
          Gantt.log.error(`Cannot find activity "${actId}" for reservation ${JSON.stringify(resa)}`);
        } else {
          Gantt.log.error(`No activity specified for reservation ${JSON.stringify(resa)}`);
        }
      } else if (resId || resId === 0) {
        Gantt.log.error(`Cannot find resource "${resId}" for reservation ${JSON.stringify(resa)}`);
      } else {
        Gantt.log.error(`No resource specified for reservation ${JSON.stringify(resa)}`);
      }
    }
  }

  createReservationsFromActivityResources(rowByIds: Record<string, ResourceNode>): void {
    const resGetter = this.activityFetcher!._resourceIdGetter!;
    for (let i = 0, len = this.activities.length; i < len; ++i) {
      const actNode = this.activities[i];
      const resId = resGetter(actNode.getData());
      if (resId || resId === 0) {
        if (resId in rowByIds) {
          const res = rowByIds[resId];
          (res.activities || (res.activities = [])).push(this.createReservationNode(actNode, res));
        } else {
          Gantt.log.error(`Cannot find resource "${resId}" for activity ${JSON.stringify(actNode.getData())}`);
        }
      } else {
        Gantt.log.error(`No resource specified for activity ${JSON.stringify(actNode.getData())}`);
      }
    }
  }

  createConstraints(data: unknown[]): DataArray<ConstraintNode> {
    const len = data.length;
    const consNodes: DataArray<ConstraintNode> = Object.assign(new Array(len), { byIds: {} });
    for (let i = 0; i < len; ++i) {
      const node = this.createConstraintNode(data[i], this.activities, i);
      consNodes[i] = node;
      consNodes.byIds[node.id] = node;
    }
    this.constraints = consNodes;
    return this.constraints;
  }

  isResourceGanttModel(): boolean {
    return !!this.resourceFetcher;
  }

  isFlat(): boolean {
    return this.flat;
  }

  createActivityNode(activity: unknown): ActivityNode {
    const node = Object.create(activity) as ActivityNode;
    node.id = this.activityFetcher!._idGetter!(activity);
    node.name = this.activityFetcher!._nameGetter!(activity);
    node.start = this.activityFetcher!._startGetter!(activity);
    node.end = this.activityFetcher!._endGetter!(activity);
    node.getData = (): unknown => activity;
    node.gantt = this.gantt;
    node.getObjectType = (): number => Gantt.ObjectTypes.Activity;
    return node;
  }

  createReservationNode(activity: ActivityNode, row: ResourceNode): ActivityNode {
    const node = Object.create(activity) as ActivityNode;
    Object.defineProperty(node, 'row', { value: row, enumerable: true });
    node.gantt = this.gantt;
    node.getObjectType = (): number => Gantt.ObjectTypes.Activity;
    return node;
  }

  createConstraintNode(cons: unknown, activities: DataArray<ActivityNode>, index: number): ConstraintNode {
    let id = this.constraintFetcher!._fromGetter!(cons);
    if (!id) {
      throw new Error(`No from activity specified for the constraint ${JSON.stringify(cons)}`);
    }
    const from = activities.byIds[id];
    if (!from) {
      throw new Error(`No activity could be found with the ID ${id}for constraint ${JSON.stringify(cons)}`);
    }

    id = this.constraintFetcher!._toGetter!(cons);
    if (!id) {
      throw new Error(`No to activity specified for the constraint ${JSON.stringify(cons)}`);
    }
    const to = activities.byIds[id];
    if (!to) {
      throw new Error(`No activity could be found with the ID ${id}for constraint ${JSON.stringify(cons)}`);
    }

    const node = Object.create(cons, { ...Object.getOwnPropertyDescriptors(ConstraintPrototype) }) as ConstraintNode;
    node.from = from;
    node.to = to;
    node.type = this.constraintFetcher!._typeGetter!(cons);
    node.gantt = this.gantt;
    node.getData = (): unknown => cons;
    node.id = this.constraintFetcher!._idGetter ? this.constraintFetcher!._idGetter!(cons) : `cons_${index}`;
    if (!from.consOuts) from.consOuts = [node];
    else from.consOuts.push(node);
    if (!to.consIns) to.consIns = [node];
    else to.consIns.push(node);
    node.getObjectType = (): number => Gantt.ObjectTypes.Constraint;
    return node;
  }

  createTreeNode(id: string, data: unknown): ResourceNode {
    const row = Object.create(data) as ResourceNode;
    row.id = id;
    row.gantt = this.gantt;
    row.getData = (): unknown => data;
    row.hasAncestor = (node: ResourceNode): boolean => {
      for (let p = row.parent; p; p = p.parent) {
        if (p === node) {
          return true;
        }
      }
      return false;
    };

    row.getAncestorsCount = (): number => {
      let count = 0;
      for (let p = row.parent; p; p = p.parent) {
        count++;
      }
      return count;
    };

    row.setRowHeight = (): void => {};
    row.isGanttRow = (): boolean => true;
    return row;
  }

  createTreeNodes(data: unknown, rowFetcher: IDataFetcher, isActivity: boolean, wnd: TimeWindow | null): unknown[] {
    if (!Array.isArray(data)) {
      throw new TypeError('Tree node data must be an array');
    }
    const dataArray: unknown[] = data;
    const result: DataArray<ResourceNode> = Object.assign(new Array(dataArray.length), { byIds: {} });
    const byIds = result.byIds;
    const children: Record<string, ResourceNode[]> = {};
    let row: ResourceNode;
    let origData: unknown;
    let parentId: unknown;
    let arr: ResourceNode[] | undefined;
    let i: number;
    let resultIndex = 0;
    let id: string;
    const roots: ResourceNode[] = [];

    const allActivities = this.activities;
    const rowFetcherInternal = rowFetcher as DataFetcherInternal;
    const actsGetter: ((data: unknown) => unknown[]) | null = isActivity
      ? null
      : rowFetcherInternal._activityGetter || null;
    const startGetter = isActivity ? this.activityFetcher!._startGetter : null;
    const endGetter = isActivity ? this.activityFetcher!._endGetter : null;

    const addNode = (node: ResourceNode, parentNode?: ResourceNode): void => {
      result[resultIndex++] = node;
      node.parent = parentNode;
      const childNodes = children[node.id];
      node.children = childNodes;
      const childCount = childNodes?.length || 0;
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
    };

    const idGetter = rowFetcherInternal._idGetter!;
    const nameGetter = rowFetcherInternal._nameGetter;
    const parentIdGetter = rowFetcherInternal._parentIdGetter;

    for (i = 0; i < dataArray.length; ++i) {
      origData = dataArray[i];
      parentId = parentIdGetter ? parentIdGetter(origData) : null;
      id = idGetter(origData);
      row = this.createTreeNode(id, origData);
      if (!children[id]) {
        children[id] = [];
      }
      if (nameGetter) {
        row.name = nameGetter(origData);
      }
      if (isActivity) {
        row.start = startGetter ? startGetter(origData) : 0;
        row.end = endGetter ? endGetter(origData) : 0;
        Object.defineProperty(row, 'activities', { value: [row], enumerable: true });
        row.getObjectType = (): number => Gantt.ObjectTypes.Activity;
      } else {
        row.getObjectType = (): number => Gantt.ObjectTypes.Resource;
      }

      if (wnd) {
        if (!isActivity) {
          const activities = actsGetter?.(origData);
          if (activities) {
            const activityList = new Array(activities.length);
            for (let iAct = 0; iAct < activities.length; ++iAct) {
              const act = activities[iAct];
              const actNode = this.createActivityNode(act);
              allActivities.push(actNode);
              if (actNode.id) {
                allActivities.byIds[actNode.id] = actNode;
              }
              activityList[iAct] = this.createReservationNode(updateTimeWindow(wnd, actNode), row);
            }
            Object.defineProperty(row, 'activities', { value: activityList, enumerable: true });
          } else {
            Object.defineProperty(row, 'activities', { value: [], enumerable: true });
          }
        } else {
          updateTimeWindow(wnd, row);
        }
      }
      byIds[id] = row;
      if (parentId !== null && parentId !== undefined) {
        const parentIdStr = String(parentId);
        arr = children[parentIdStr];
        if (!arr) {
          children[parentIdStr] = [row];
        } else {
          arr.push(row);
        }
      } else {
        roots.push(row);
      }
    }
    const ganttTyped = this.gantt as Record<string, () => boolean>;
    if (ganttTyped.isResourceGantt?.() !== isActivity) {
      this.flat = roots.length === dataArray.length;
    }
    for (i = 0, resultIndex = 0; i < roots.length; ++i) {
      addNode(roots[i]);
    }

    return result;
  }

  destroy(): void {
    if (this.allFetcher && this.allFetcher.destroy) {
      this.allFetcher.destroy();
    }
    this.allFetcher = null;
    if (this.resourceFetcher && this.resourceFetcher.destroy) {
      this.resourceFetcher.destroy();
    }
    this.resourceFetcher = null;
    this.resources = Object.assign([], { byIds: {} });

    if (this.activityFetcher && this.activityFetcher.destroy) {
      this.activityFetcher.destroy();
    }
    this.activityFetcher = null;
    this.activities = Object.assign([], { byIds: {} });

    if (this.reservationFetcher && this.reservationFetcher.destroy) {
      this.reservationFetcher.destroy();
    }
    this.reservationFetcher = null;
    this.reservations = Object.assign([], { byIds: {} });

    if (this.constraintFetcher && this.constraintFetcher.destroy) {
      this.constraintFetcher.destroy();
    }
    this.constraintFetcher = null;
    this.constraints = Object.assign([], { byIds: {} });

    if (this.timeWindowFetcher && this.timeWindowFetcher.destroy) {
      this.timeWindowFetcher.destroy();
    }
    this.timeWindowFetcher = null;
    this.timeWindow = null;
  }

  getActivity(param: string | unknown): ActivityNode | null {
    if (Gantt.utils.isString(param)) {
      return (this.activities && this.activities.byIds[param as string]) || null;
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
