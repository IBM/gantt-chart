import Gantt from '../core/core';

import {
  CONSTRAINT_ARROW,
  CONSTRAINT_LINK_CLASS,
  CONSTRAINT_LINK_CTNR_CLASS,
  ID_DELIM,
  LinkRendererPrototype,
} from './linkrenderer';

import './constraintlayout';

const defaultOptions = {
  linkOutlineWidth: 2,
};

const TOOLTIP_FADING_TIME = 1000;
const TOOLTIP_SHOWING_DELAY = 800;

const SELECTION_CLASS = 'selected';

export default class ConstraintsGraph extends Gantt.components.ConstraintsGraph {
  constructor(gantt, node, config) {
    super(gantt, node, Gantt.utils.mergeObjects({}, defaultOptions, config));
  }

  setConfiguration(config) {
    this.destroy();

    this.create();
    this.ready = Promise.resolve([]);

    if (config.layout && Gantt.utils.isFunction(config.layout)) {
      this.layout = new config.layout(this.gantt);
    } else {
      const LayoutClass = Gantt.components.ConstraintLayout.impl || Gantt.components.ConstraintLayout;
      this.layout = new LayoutClass(this.gantt, config.layout);
    }

    const LinkRendererClass = Gantt.components.Renderer.impl || Gantt.components.Renderer;
    this.linkRenderer = new LinkRendererClass(config.renderer, LinkRendererPrototype, this.gantt);
    if (config.linkOutlineWidth) {
      this.linkRenderer.linkOutlineWidth = config.linkOutlineWidth;
    }
    // Ugly way for managing the exception of this view having several DOM nodes in its life
    const node = this.node;
    this.node = null;
    this.setNode(node);

    const selectionHandler = this.gantt.selection;
    selectionHandler.on(Gantt.events.CONSTRAINT_SELECTION_CLEARED, (e, sels) => this.clearConstraintSelection(sels));
    selectionHandler.on(Gantt.events.CONSTRAINT_SELECTED, (e, sels) => this.selectConstraints(sels));
    selectionHandler.on(Gantt.events.CONSTRAINT_UNSELECTED, (e, sels) => this.unselectConstraints(sels));
  }

  setNode(node) {
    if (this.node) {
      this.gantt.errorHandler.removeGroup(this.node);
      if (this.tooltipEnter) {
        Gantt.utils.removeEventListener(this.node, 'mouseenter', this.tooltipEnter);
        Gantt.utils.removeEventListener(this.node, 'mouseleave', this.tooltipLeave);
        Gantt.utils.removeEventListener(this.node, 'click', this.clickHandler);
      }
      this.node.innerHTML = '';
    }
    this.node = node;
    if (node) {
      if (!this.tooltipEnter) {
        this.tooltipEnter = evt => {
          const ctNode = this.getConstraintNode(evt.target);
          if (ctNode && (!this.gantt.timeTable.isDragAndDropping || !this.gantt.timeTable.isDragAndDropping())) {
            this.showTooltip(ctNode);
          }
        };
        this.tooltipLeave = evt => {
          const ctNode = this.getConstraintNode(evt.target);
          if (ctNode && this.tooltipElt === node) {
            this.hideTooltip(TOOLTIP_FADING_TIME);
          }
        };
        this.clickHandler = e => this.processClick(e);
      }
      Gantt.utils.addEventListener(this.node, 'mouseenter', this.tooltipEnter, true);
      Gantt.utils.addEventListener(this.node, 'mouseleave', this.tooltipLeave, true);
      Gantt.utils.addEventListener(this.node, 'click', this.clickHandler, true);
    }
  }

  create() {
    if (this.config && this.config.classes) {
      Gantt.utils.addClass(this.config.classes);
    }
  }

  setConstraints(cts) {
    this.cts = cts;
    if (cts && cts.length) {
      this.ready = new Promise(resolve => {
        setTimeout(() => {
          this.processConstraints(cts);
          resolve();
        }, 0);
      });
    } else {
      this.ready = Promise.resolve([]);
    }
  }

  processConstraints(cts) {
    const table = this.gantt.table;
    const activityFilter = this.gantt.timeTable.getActivityFilter();
    let row;
    let count;
    let acts;
    let act;
    let i;
    this.layout.startInitialize();
    try {
      for (row = table.getFirstVisibleRow(); row; row = table.nextRow(row)) {
        acts = row.activities;
        count = acts && acts.length;
        if (count) {
          for (i = 0; i < count; ++i) {
            act = acts[i];
            act = !activityFilter || activityFilter.accept(act, row) ? act : null;
            if (act) {
              act.consNode = this.layout.addNode(act, row.index);
            }
          }
        }
      }

      let from;
      let to;
      let cons;
      for (i = 0, count = cts.length; i < count; ++i) {
        cons = cts[i];
        cons.nodes = null; // Remove nodes from previous display
        from = cons.from.consNode;
        to = cons.to.consNode;
        if (from && to) {
          this.layout.addConstraint(from, to, cons);
        }
      }
    } catch (e) {
      this.addError(e, 'Error processing constraints');
      this.layout.stopInitialize();
      throw e;
    }

    this.layout.stopInitialize();
  }

  addError(e, msg) {
    if (!this.errorNode) {
      this.errorNode = document.createElement('div');
      this.errorNode.style.opacity = '0.80';
      this.gantt.timeTablePanel.appendChild(this.errorNode);
    }
    this.gantt.errorHandler.addError(e, msg, this.errorNode);
  }

  destroy() {
    if (this.layout && this.layout.destroy) {
      this.layout.destroy();
    }
    this.layout = null;
    if (this.node && this.tooltipEnter) {
      Gantt.utils.removeEventListener(this.node, 'mouseenter', this.tooltipEnter);
      Gantt.utils.removeEventListener(this.node, 'mouseleave', this.tooltipLeave);
      this.tooltipEnter = this.tooltipLeave = null;
    }
  }

  clearCache() {
    if (this.cts) {
      for (let i = 0, count = this.cts.length; i < count; ++i) {
        this.cts[i].fromNode = null;
        this.cts[i].toNode = null;
      }
    }
  }

  clear() {
    this.node.innerHTML = '';
    this.clearCache();
  }

  clearLinks() {
    this.layout.clearLinks();
  }

  resetLayout() {
    this.layout.resetLayout();
  }

  draw(rows, drawCB) {
    if (!rows.length) return this.ready;
    return this.ready.then(() => {
      const table = this.gantt.table;
      let firstRowIndex = rows[0].row.index;
      let lastRowIndex = rows[rows.length - 1].row.index;

      function getNodeRect(act, index) {
        let row;
        let y;
        if (index < firstRowIndex) {
          row = rows[0].row;
          y = rows[0].y;
          while (index < firstRowIndex) {
            row = table.prevRow(row);
            drawCB(row);
            y -= row.activityRow.height;
            rows.splice(0, 0, {
              y,
              row,
              height: row.activityRow.height,
              index: --firstRowIndex,
            });
          }
        } else if (index > lastRowIndex) {
          row = rows[lastRowIndex];
          y = row.y + row.height;
          row = row.row;
          while (index > lastRowIndex) {
            row = table.nextRow(row);
            drawCB(row);
            rows.push({
              y,
              row,
              height: row.activityRow.height,
              index: ++lastRowIndex,
            });
            y += row.activityRow.height;
          }
        }
        row = rows[index - firstRowIndex];
        return act.node
          ? {
              x: act.left,
              y: row.y,
              top: Number.parseInt(act.node.style.top, 10),
              width: act.node.offsetWidth,
              height: act.node.offsetHeight,
              rowHeight: row.height,
            }
          : {
              x: 0,
              y: row.y,
              top: 0,
              width: 0,
              height: 0,
              rowHeight: row.height,
            };
      }

      this.layout.getNodeRect = getNodeRect;
      const ctx = {
        gantt: this.gantt,
        nodeToLinkPadding: this.layout.horizLinkToNodeDist,
        linkToLinkPadding: this.layout.horizLinkToLinkDist,
      };

      let i;
      let rowIndex;
      const count = rows.length;

      try {
        for (i = 0, rowIndex = firstRowIndex; i < count; i++, rowIndex++) {
          this.layout.layoutRowNodeLinks(rowIndex, this.linkRenderer, ctx);
        }
      } catch (e) {
        this.addError(e);
      }

      try {
        const fragment = document.createDocumentFragment();
        for (i = 0, rowIndex = firstRowIndex; i < count; i++, rowIndex++) {
          this.layout.drawRowLinks(rowIndex, fragment, this.linkRenderer, ctx);
        }

        this.node.appendChild(fragment);
      } catch (e) {
        this.addError(e, 'Error drawing constraints');
      }
    });
  }

  getConstraint(node) {
    let id = node.id;
    let lastIndex = id.indexOf(ID_DELIM);
    let index;
    if (lastIndex >= 0) {
      while ((index = id.indexOf(ID_DELIM, lastIndex + 1)) > 0) {
        lastIndex = index;
      }
      id = id.substring(0, lastIndex);
    }
    let cons;
    if (this.cts.byIds && (cons = this.cts.byIds[id])) {
      return cons;
    }
    return null;
  }

  getConstraintNode(elt) {
    let node = null;
    for (; elt && elt !== this.node; elt = elt.parentNode) {
      if (Gantt.utils.hasClass(elt, CONSTRAINT_LINK_CTNR_CLASS) || Gantt.utils.hasClass(elt, CONSTRAINT_ARROW))
        return elt;
      if (Gantt.utils.hasClass(elt, CONSTRAINT_LINK_CLASS)) node = elt;
    }
    return node;
  }

  /*                 */
  /*     Tooltips    */
  /*                 */
  showTooltip(consNode) {
    let cons;
    if (consNode && consNode !== this.tooltipElt && (cons = this.getConstraint(consNode))) {
      this.tooltipElt = consNode;
      const ctx = {
        limitElt: this.gantt.getBody(),
        showDelay: TOOLTIP_SHOWING_DELAY,
      };
      this.gantt.tooltip.showTooltip(consNode, ctx, parent => {
        const tooltipCtx = { gantt: this.gantt };
        this.linkRenderer.getTooltip(parent, cons, tooltipCtx);
      });
    }
  }

  hideTooltip(fadingTime) {
    this.tooltipElt = null;
    this.gantt.tooltip.hideTooltip(fadingTime);
  }

  /**
   * Selection management
   */
  processClick(e) {
    this.hideTooltip();
    const consNode = this.getConstraintNode(e.target);
    let cons;
    if (consNode && (cons = this.getConstraint(consNode))) {
      this.gantt.selection.processClick(e, cons);
    }
  }

  // noinspection JSMethodCanBeStatic
  clearConstraintSelection(sels) {
    for (let i = 0, nodes, count = sels.length, sel; i < count; ++i) {
      sel = sels[i];
      if ((nodes = sel.nodes)) {
        for (let j = 0, nodesCount = nodes.length; j < nodesCount; j++) {
          Gantt.utils.removeClass(nodes[j], SELECTION_CLASS);
        }
      }
    }
  }

  // noinspection JSMethodCanBeStatic
  selectConstraints(sels) {
    for (let i = 0, nodes; i < sels.length; i++) {
      if ((nodes = sels[i].nodes)) {
        for (let j = 0, count = nodes.length; j < count; j++) {
          Gantt.utils.addClass(nodes[j], SELECTION_CLASS);
        }
      }
    }
  }

  // noinspection JSMethodCanBeStatic
  unselectConstraints(sels) {
    for (let i = 0, nodes; i < sels.length; i++) {
      if ((nodes = sels[i].nodes)) {
        for (let j = 0, count = nodes.length; j < count; j++) {
          Gantt.utils.removeClass(nodes[j], SELECTION_CLASS);
        }
      }
    }
  }
}

Gantt.components.ConstraintsGraph.impl = ConstraintsGraph;
