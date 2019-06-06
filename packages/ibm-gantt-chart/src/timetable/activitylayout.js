import Gantt from '../core/core';

const defaultOptions = {
  cascadeOffset: 5,
  topMargin: 1,
  bottomMargin: 1,
  subRowPadding: 1,
  constantRowHeight: false,
  compareBoundingBoxes: false,
  miniWidth: 4,
};

const STRATEGY_LOGISTIC = 'logistic';
const STRATEGY_TILE = 'tile';
const STRATEGIES = {};
const MINI_ACTIVITY_CLASS = 'mini-activity';
const MILESTONE = 'milestone';

STRATEGIES[STRATEGY_LOGISTIC] = function(row) {
  // this is the activity layout calling this function
  ActivityLayout.sortTasksOnStart(row);
  const subRowsCount = ActivityLayout.computeSubRows(row);
  let offset;
  let actHeight = row.height - this.topMargin - this.bottomMargin - 1;
  if (subRowsCount > 1) {
    offset = this.cascadeOffset;
    actHeight = Math.max(actHeight - this.cascadeOffset * (subRowsCount - 1), 0);
    if (actHeight === 0) {
      offset = 0;
    }
  }
  const actCount = (row.activities && row.activities.length) || 0;
  for (let iAct = 0, act; iAct < actCount; ++iAct) {
    act = row.activities[iAct];
    if (act.node) {
      act.node.style.top = `${this.topMargin + offset * act.subRowIndex}px`;
      act.node.style.height = actHeight;
    }
  }
};

STRATEGIES[STRATEGY_TILE] = function(row) {
  let rowHeight = row.tableRowHeight;

  let { topMargin } = this;
  let { bottomMargin } = this;
  let subRowHeight = rowHeight - topMargin - bottomMargin - 1;
  if (subRowHeight <= 0) {
    subRowHeight = 1;
    const availMargin = rowHeight - subRowHeight;
    topMargin = (availMargin * topMargin) / (topMargin + bottomMargin);
    bottomMargin = availMargin - topMargin;
  }

  // Compute the overlap, tiling, and number of subrows required to accommodate the
  // graphics. First, we associate each graphic with its the bounds in view coordinates.
  // Then we sort the array by start time or x position, depending on the overlap
  // detection strategy being used.
  const activitiyComparator = this.compareBoundingBoxes
    ? function(act1, act2) {
        return act1.left - act2.left;
      }
    : function(act1, act2) {
        return act1.start - act2.start;
      };
  row.activities.sort(activitiyComparator);

  // Finally, assign graphics to subrows, increasing the number of subrows as
  // necessary so that the graphics do not overlap.
  const subRows = this.setTaskSubRows(row);

  // For constant row height, we subdivide the row's current height into the required
  // number of subrows. For constant subrow height, we expand the row to accommodate the
  // required number of subrows
  let subRowMargin = this.subRowPadding;
  if (this.constantRowHeight) {
    if (subRowMargin * (subRows.length - 1) >= subRowHeight) {
      subRowMargin = subRowHeight / (subRows.length - 1);
    }
    subRowHeight = (subRowHeight - (subRows.length - 1) * subRowMargin) / subRows.length;
  } else {
    rowHeight = topMargin + bottomMargin + subRows.length * subRowHeight + (subRows.length - 1) * subRowMargin;
    // Set the row height so that each subrow has the chart's global row
    // height.
    row.setRowHeight(Math.round(rowHeight));
  }

  // Set the vertical bounds of the activities in each subrow.
  let top = topMargin;
  let subRowTasks;
  let task;
  for (var i = 0, iTask; i < subRows.length; i++) {
    subRowTasks = subRows[i];
    for (iTask = 0; iTask < subRowTasks.length; iTask++) {
      task = subRowTasks[iTask];
      task.node.style.top = `${top}px`;
      task.node.style.height = `${subRowHeight}px`;
    }
    top += subRowHeight + subRowMargin;
  }
};

export default class ActivityLayout extends Gantt.components.ActivityLayout {
  constructor(config, proto, ctx) {
    super(config);
    Gantt.utils.mergeObjects(this, defaultOptions, config, proto);
    this.ctx = ctx;

    if (this.strategy) {
      if (typeof config.strategy === 'string') {
        this.getLayoutStrategy = () => this.strategy;
      } else if (typeof this.strategy === 'function') {
        this.getLayoutStrategy = () => this.strategy(this.ctx);
      }
    }
  }

  layout(row) {
    if (row.activities && row.activities.length) {
      const strategyKey = this.getLayoutStrategy();
      let vLayout;
      this.layoutHorizontally(row);
      if (strategyKey && (vLayout = STRATEGIES[strategyKey])) {
        vLayout.call(this, row);
      } else {
        let act;
        let elt;
        for (let iAct = 0; iAct < row.activities.length; iAct++) {
          act = row.activities[iAct];
          elt = act.node;
          if (elt) {
            elt.style.top = `${this.topMargin}px`;
            elt.style.height = `${row.height - this.topMargin - this.bottomMargin - 1}px`;
          }
        }
      }
    }
  }

  /**
   * @return {string}
   */
  static get STRATEGY_LOGISTIC() {
    return STRATEGY_LOGISTIC;
  }

  /**
   * @return {string}
   */
  static get STRATEGY_TILE() {
    return STRATEGY_TILE;
  }

  static get STRATEGIES() {
    return STRATEGIES;
  }

  allowVariableRowHeight() {
    const strategyKey = this.getLayoutStrategy();
    if (strategyKey && strategyKey === STRATEGY_TILE) {
      return !this.constantRowHeight;
    }
    return false;
  }

  layoutHorizontally(row) {
    let act;
    let elt;
    let left;
    const actCount = row.activities.length;
    for (let iAct = 0; iAct < actCount; iAct++) {
      act = row.activities[iAct];
      elt = act.node;
      if (elt) {
        left = act.left = row.getX(act.start);
        elt.style.left = `${left}px`;
        elt.style.width = `${(act.width = row.getX(act.end) - left + 1)}px`;
        if (act.width <= this.miniWidth && !Gantt.utils.hasClass(elt, MILESTONE)) {
          act.width = this.miniWidth;
          elt.style.width = `${act.width}px`;
          Gantt.utils.addClass(elt, MINI_ACTIVITY_CLASS);
        }
      }
    }
  }

  static sortTasksOnStart(row) {
    row.activities.sort(function(act1, act2) {
      return act1.start - act2.start;
    });
  }

  static computeSubRows(row) {
    const endTimes = [];
    let endTime;
    let iAct;
    let act;
    let e;
    let endTimesCount = 0;
    const actCount = (row.activities && row.activities.length) || 0;
    for (iAct = 0; iAct < actCount; ++iAct) {
      act = row.activities[iAct];
      if (act.node) {
        for (e = 0; e < endTimesCount; e++) {
          endTime = endTimes[e];
          if (act.start === endTime || act.start > endTime) {
            break;
          }
        }
        act.subRowIndex = e;
        if (e < endTimesCount) {
          endTimes[e] = act.end;
        } else {
          endTimes.push(act.end);
          endTimesCount++;
        }
      }
    }
    return endTimesCount;
  }

  // noinspection JSMethodCanBeStatic
  getLayoutStrategy() {
    return null;
  }

  // noinspection JSMethodCanBeStatic
  layoutVertically(row) {
    row.subRows = [];
  }

  /*                                  */
  /*      Tiling specific methods     */
  /*                                  */
  /**
   * Creates as many subrows as needed to accommodate the given activity graphics and
   * assigns the activity graphics to the subrows. The activity graphics are provided
   * with their view bounding boxes as an array of {@link GraphicBounds}. This allows
   * the tiling policy to take advantage of the precomputed activity bounding boxes when
   * computing graphic overlap and assigning activity graphics to subrows. The result of
   * this method is a list of subrows, where each subrow is a list of {@link
   * GraphicBounds} representing the activities assigned to the subrow. All activity
   * graphics provided as input to the tiling policy must be assigned to one and only
   * one subrow.
   *
   * @param graphics             The activity graphics to be tiled into subrows, as an
   *                             array of {@link GraphicBounds}. If <code>compareBoundingBoxes</code>
   *                             is <code>true</code> then the array will be sorted by
   *                             the x position of each activity graphic's bounding box.
   *                             If <code>compareBoundingBoxes</code> is
   *                             <code>false</code> then the array will be sorted by the
   *                             start time of each activity. Note, that the bounding
   *                             boxes are provided as input only. Modifying the
   *                             bounding box of a {@link GraphicBounds} will not affect
   *                             how an activity is positioned.
   * @param compareBoundingBoxes Indicates whether the tiling policy should compute
   *                             activity overlap by comparing the graphic bounding
   *                             boxes. If <code>false</code>, activity overlap should
   *                             be computed by comparing the activity time intervals.
   * @return The list of subrows, where each subrow is a list of {@link GraphicBounds}
   *         representing the activities assigned to the subrow.
   */
  setTaskSubRows(row) {
    const subRows = [];
    let act;
    let iSubRow;
    for (let iAct = 0, actCount = (row.activities && row.activities.length) || 0; iAct < actCount; ++iAct) {
      act = row.activities[iAct];
      if (act.node) {
        for (iSubRow = 0; iSubRow < subRows.length; iSubRow++) {
          if (this.addGraphicToSubRowIfFits(act, subRows[iSubRow])) {
            break;
          }
        }
        if (iSubRow === subRows.length) {
          subRows.push([act]);
        }
      }
    }
    return subRows;
  }

  /**
   * Adds the specified task to the specified subRow if it fits. If the
   * task is successfully added to the list of graphics for the subrow, this method
   * returns true. If the graphic does not fit into the subrow, this method returns
   * false. If the graphic does not fit into any of the existing subrows, the tiling
   * policy will create a new subrow for the graphic. Note, that a graphic must always
   * succeed in being added to an empty subrow.
   *
   * @param activity             The activity to add.
   * @param subRow               The subRow, represented as a list of activities.
   */
  addGraphicToSubRowIfFits(activity, subRow) {
    // Adding a graphic to an empty subrow must always succeed.
    if (!subRow.length) {
      subRow.push(activity);
    }
    // Otherwise, check whether the graphic fits at the end of the subRow.
    else {
      const lastRowTask = subRow[subRow.length - 1];
      if (this.compareBoundingBoxes) {
        if (activity.left < lastRowTask.left + lastRowTask.width) {
          return false;
        }
      } else if (activity.start < lastRowTask.end) {
        return false;
      }
      subRow.push(activity);
    }
    return true;
  }
}

Gantt.components.ActivityLayout.impl = ActivityLayout;
