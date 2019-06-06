import Gantt from '../core/core';

const LOCKED = Number.MAX_VALUE;

const STYLE_ARROW = 1;
const LEFT = 0;
const RIGHT = 1;
const SIDE_COUNT = 2;

const CONNECTOR_COUNT = 4;
const INCOMINGS = new Array(4);
INCOMINGS[Gantt.constraintTypes.START_TO_START] = 0;
INCOMINGS[Gantt.constraintTypes.START_TO_END] = 2;
INCOMINGS[Gantt.constraintTypes.END_TO_START] = 0;
INCOMINGS[Gantt.constraintTypes.END_TO_END] = 2;

const OUTGINGS = new Array(4);
OUTGINGS[Gantt.constraintTypes.START_TO_START] = 1;
OUTGINGS[Gantt.constraintTypes.START_TO_END] = 1;
OUTGINGS[Gantt.constraintTypes.END_TO_START] = 3;
OUTGINGS[Gantt.constraintTypes.END_TO_END] = 3;

class Link {
  constructor(cons) {
    this.ar = [cons];
    if (cons.from.consNode.index < cons.to.consNode.index) {
      this.topNode = cons.from.consNode;
      this.bottomNode = cons.to.consNode;
    } else {
      this.topNode = cons.to.consNode;
      this.bottomNode = cons.from.consNode;
    }
  }

  addConstraint(cons) {
    this.ar.push(cons);
    const rowIndex = cons.from.consNode.index;
    if (rowIndex < this.topNode.index) {
      this.topNode = cons.from.consNode;
    } else if (rowIndex > this.bottomNode.index) {
      this.bottomNode = cons.from.consNode;
    }
  }

  topIndex() {
    return this.topNode.index;
  }

  bottomIndex() {
    return this.bottomNode.index;
  }

  toNode() {
    return this.ar[0].to.consNode;
  }

  switchSides() {
    const { type } = this.ar[0];
    return type === Gantt.constraintTypes.END_TO_START || type === Gantt.constraintTypes.START_TO_END;
  }

  isDisplayed() {
    for (let i = 0; i < this.ar.length; i++) {
      if (!this.ar[i].nodes) {
        return false;
      }
    }
    return true;
  }

  toString() {
    let s = 'Link[';
    if (this.ar.length > 1) {
      s += `(${this.ar
        .map(function(cons) {
          return cons.from.consNode.toString();
        })
        .join(',')})`;
    } else s += this.ar[0].from.consNode.toString();
    s += ' -> ';
    s += this.ar[0].to.consNode.toString();
    return `${s}]`;
  }

  resetLayout() {
    this.x = undefined;
    for (let i = 0; i < this.ar.length; i++) {
      this.ar[i].nodes = undefined;
    }
  }
}

function compareLinks(l1, l2) {
  let i1 = l1.topIndex();
  let i2 = l2.topIndex();
  if (i1 < i2) return 1;
  if (i1 > i2) return -1;
  i1 = l1.bottomIndex();
  i2 = l2.bottomIndex();
  return i1 < i2 ? 1 : i1 > i2 ? -1 : 0;
}

class Node {
  constructor(act, index) {
    this.act = act;
    this.index = index;
    this.links = [[], []];
    this.layoutLinks = 0;
    this.linksDisplayed = 0;
    this.bbox = null;
    this.incomingLinks = new Array(4);
    this.connectors = new Array(CONNECTOR_COUNT);
    this.nodeLabelLayout = false;
    for (let i = 0; i < CONNECTOR_COUNT; i++) {
      this.connectors[i] = 0;
    }
  }

  addLink(link, side) {
    const ar = this.links[side];
    for (let i = 0, count = ar.length, thisLink; i < count; i++) {
      thisLink = ar[i];
      if (compareLinks(ar[i], link) >= 0) {
        ar.splice(i, 0, link);
        return;
      }
    }
    ar.push(link);
  }

  getLinks(side) {
    return this.links[side];
  }

  getIncomingLink(type) {
    return this.incomingLinks[type];
  }

  setIncomingLink(type, link) {
    this.incomingLinks[type] = link;
  }

  incConnectionCount(type) {
    this.connectors[type]++;
  }

  setBBox(bbox) {
    this.bbox = bbox;
  }

  hasLinks() {
    for (let side = 0; side < SIDE_COUNT; side++) {
      if (this.links[side].length) return true;
    }
    return false;
  }

  clearLinks() {
    this.links = [[], []];
    this.connectors = new Array(CONNECTOR_COUNT);
    this.bbox = null;
  }

  resetLayout() {
    for (let side = 0; side < SIDE_COUNT; ++side) {
      for (let iLink = 0, ar = this.links[side], link; iLink < ar.length; iLink++) {
        if ((link = ar[iLink]).toNode() === this) {
          ar[iLink].resetLayout();
        }
      }
    }
    this.nodeLabelLayout = false;
  }

  topRight() {
    let n = this;
    while (n.next) {
      n = n.next;
    }
    return n;
  }

  toString() {
    return this.act.name || this.act.id;
  }
}

const defaultLayoutOptions = {
  horizLinkToNodeDist: 11,
  horizSwitchSideLinkToNodeDist: 8,
  horizLinkToLinkDist: 10,
  switchSideLinkVertMargin: 1, // Vertical space between the To node row and the link crossing over the node
};

export default class ConstraintLayout extends Gantt.components.ConstraintLayout {
  constructor(gantt, config) {
    super(gantt, config);
  }

  setConfiguration(config) {
    Gantt.utils.mergeObjects(this, defaultLayoutOptions, config);
  }

  startInitialize() {
    this.nodes = [];
  }

  addNode(act, index) {
    const node = new Node(act, index);
    node.next = this.nodes[index];
    this.nodes[index] = node;
    return node;
  }

  addConstraint(from, to, cons) {
    const { type } = cons;
    const side = Gantt.constraintTypes.isFromStart(cons.type) ? LEFT : RIGHT;
    let link = to.getIncomingLink(INCOMINGS[type]);
    let i;
    from.incConnectionCount(OUTGINGS[type]);
    to.incConnectionCount(INCOMINGS[type]);
    if (link) {
      const beforeTop = link.topIndex();
      const beforeBottom = link.bottomIndex();
      link.addConstraint(cons);
      for (i = link.topIndex(); i < beforeTop; i++) {
        this.nodes[i].addLink(link, side);
      }
      for (i = beforeBottom + 1; i <= link.bottomIndex(); i++) {
        this.nodes[i].addLink(link, side);
      }
    } else {
      to.setIncomingLink(INCOMINGS[type], (link = new Link(cons)));
      for (i = link.topIndex(); i <= link.bottomIndex(); i++) {
        this.nodes[i].addLink(link, side);
      }
    }
  }

  stopInitialize() {}

  layoutRowNodeLinks(rowIndex, renderer, ctx) {
    this.reinteringPath = null;
    for (let consNode = this.nodes[rowIndex]; consNode; consNode = consNode.next) {
      this.layoutOneSideNodeLinks(consNode, LEFT);
      this.layoutOneSideNodeLinks(consNode, RIGHT);
      this.layoutNodeLabel(consNode, renderer, ctx);
    }
  }

  processConnectors(consNode, bbox) {
    if (!consNode.links[LEFT].length && !consNode.links[RIGHT].length) return;
    const parentAct = consNode.act.children && consNode.act.children.length;
    const h = parentAct ? bbox.height / 2 : bbox.height;

    for (let side = 0, connectIndex = 0, incoming, outgoing; side < SIDE_COUNT; side++, connectIndex += 2) {
      incoming = consNode.connectors[connectIndex];
      outgoing = consNode.connectors[connectIndex + 1];
      if (incoming || outgoing) {
        if (incoming) {
          consNode.connectors[connectIndex] = bbox.y + bbox.top + h / (outgoing ? 3 : 2);
        }
        if (outgoing) {
          consNode.connectors[connectIndex + 1] = bbox.y + bbox.top + h - h / (incoming ? 3 : 2);
        }
      }
    }
  }

  layoutOneSideNodeLinks(consNode, side, beforeLink) {
    if (!consNode.bbox) {
      consNode.setBBox(this.getNodeRect(consNode.act, consNode.index));
      this.processConnectors(consNode, consNode.bbox);
    }
    const left = side === LEFT;
    const nodeLimit =
      consNode.bbox.x + (left ? -this.horizLinkToNodeDist : consNode.bbox.width + this.horizLinkToNodeDist);
    let limit = nodeLimit;
    for (
      let i = 0,
        links = consNode.getLinks(side),
        lastIndex = beforeLink ? links.indexOf(beforeLink) : links.length,
        link;
      i < lastIndex;
      i++
    ) {
      link = links[i];
      if (link.x === undefined) {
        link.x = LOCKED;
        let x = nodeLimit;
        let skipIndex;
        if (link.switchSides()) {
          // If node switch sides (goes from start to end or end to start), we don't need to layout the
          // 'to' node as its bounds are not taken into account into the current layout processing which
          // layouts the other side.
          const toNode = link.toNode();
          skipIndex = toNode.index;
          // However, it is still necessary to calc the 'to' node bounds for the link when it is to
          // be the drawn, in case the 'to' node is outside the layout processing row range.
          if (!toNode.bbox) {
            toNode.setBBox(this.getNodeRect(toNode.act, toNode.index));
            this.processConnectors(toNode, toNode.bbox);
          }
        }
        for (let index = link.topIndex(), last = link.bottomIndex(), value; index <= last; index++) {
          if (index !== consNode.index && index !== skipIndex) {
            value = this.layoutOneSideNodeLinks(this.nodes[index], side, link);
            if (this.reinteringPath) {
              this.reinteringPath = `${this.nodes[index].toString()} -> ${link.toString()} -> ${this.reinteringPath}`;
              if (!beforeLink) {
                throw new Error(
                  `Re-entering layout on ${left ? 'left side of ' : 'right side of '}${this.reinteringPath}`
                );
              }
              return left ? Number.MAX_VALUE : Number.MIN_VALUE;
            }

            x = left ? Math.min(x, value) : Math.max(x, value);
          }
        }
        link.x = x;
        consNode.layoutLinks++;
      } else if (link.x === LOCKED) {
        // Re-entering on a same node, we are looping
        this.reinteringPath = `${consNode.toString()} -> ${link.toString()}`;
        return left ? Number.MAX_VALUE : Number.MIN_VALUE;
      }
      limit = left
        ? Math.min(limit, link.x - this.horizLinkToLinkDist)
        : Math.max(limit, link.x + this.horizLinkToLinkDist);
    }
    return limit;
  }

  layoutNodeLabel(consNode, renderer, ctx) {
    const { label } = consNode.act;
    if (!label) return;

    const labelLayout = renderer.getLabelLayout && renderer.getLabelLayout(consNode.act, ctx);
    if (labelLayout) {
      const labelW = label.getTextWidth();

      const iterLinks = side => {
        const limit = consNode.bbox.x + (side === LEFT ? 0 : consNode.bbox.width);
        const links = consNode.links[side];
        let lastX = limit;
        let x;
        let i = 0;
        let link;
        for (; i < links.length; i++) {
          link = links[i];
          if (link.toNode() === consNode && link.switchSides()) continue; // Switching side links are either on top or at the bottom of the row in the label area, cannot go over labels
          x = link.x; // Link margin not taken into account, compensated with applied padding
          if (labelLayout.nextLink(consNode.act, side === LEFT, link.x, lastX, limit, ctx)) break;
          lastX = x;
        }
        return Math.abs(
          lastX + (side === LEFT ? -1 : 1) * (i ? this.horizLinkToLinkDist : this.horizLinkToNodeDist) - limit
        );
      };

      labelLayout.startLayout(consNode.act, labelW, ctx);
      if (consNode.hasLinks() && labelLayout.nextLink) {
        iterLinks(RIGHT);
        iterLinks(LEFT);
      }

      const spacing = labelLayout.getNodeToLabelSpacing(consNode.act, consNode.bbox, labelW, ctx);
      if (spacing < 0) {
        label.move(true, -spacing + labelW);
      } else {
        label.move(false, spacing);
      }
    }
  }

  drawLink(link, parentElt, renderer, ctx) {
    let cons = link.ar[0];
    const toNode = cons.to.consNode;

    // If the link starts from one side (left/right) of the node and comes to the node on the otherside.
    const startLeft = Gantt.constraintTypes.isFromStart(cons.type);
    const endLeft = Gantt.constraintTypes.isToStart(cons.type);
    const points = new Array(startLeft !== endLeft ? 6 : 4);

    link.nodes = null;
    for (let i = 0, count = link.ar.length, fromNode, x, y, iPoint; i < count; i++) {
      cons = link.ar[i];
      iPoint = 0;
      fromNode = cons.from.consNode;
      points[iPoint++] = {
        x: startLeft ? fromNode.bbox.x : fromNode.bbox.x + fromNode.bbox.width,
        y: (y = fromNode.connectors[OUTGINGS[cons.type]]),
      };
      points[iPoint++] = {
        x: link.x,
        y,
      };
      if (startLeft !== endLeft) {
        y =
          fromNode.index < toNode.index
            ? toNode.bbox.y + this.switchSideLinkVertMargin
            : toNode.bbox.y + toNode.bbox.rowHeight - this.switchSideLinkVertMargin;
        points[iPoint++] = {
          x: link.x,
          y,
        };
        x = endLeft
          ? toNode.bbox.x - this.horizSwitchSideLinkToNodeDist
          : toNode.bbox.x + toNode.bbox.width + this.horizSwitchSideLinkToNodeDist;
        points[iPoint++] = {
          x,
          y,
        };
        points[iPoint++] = {
          x,
          y: (y = toNode.connectors[INCOMINGS[cons.type]]),
        };
      } else {
        points[iPoint++] = {
          x: link.x,
          y: (y = toNode.connectors[INCOMINGS[cons.type]]),
        };
      }
      points[iPoint++] = {
        x: endLeft ? toNode.bbox.x : toNode.bbox.x + toNode.bbox.width,
        y,
      };
      cons.nodes = renderer.drawLink(cons, points, STYLE_ARROW, parentElt, ctx);
    }
  }

  drawRowLinks(rowIndex, parentElt, renderer, ctx) {
    let side;
    let links;
    let i;
    let count;
    for (let consNode = this.nodes[rowIndex]; consNode; consNode = consNode.next) {
      if (consNode.linksDisplayed === consNode.links.length) continue;
      for (side = 0; side < SIDE_COUNT; side++) {
        links = consNode.getLinks(side);
        for (i = 0, count = links.length; i < count; ++i) {
          if (!links[i].isDisplayed()) {
            consNode.linksDisplayed++;
            this.drawLink(links[i], parentElt, renderer, ctx);
          }
        }
      }
    }
  }

  clearLinks() {
    for (let i = 0, count = this.nodes ? this.nodes.length : 0; i < count; i++) {
      for (let node = this.nodes[i]; node; node = node.next) {
        node.clearLinks();
      }
    }
  }

  resetLayout() {
    for (let i = 0, count = this.nodes ? this.nodes.length : 0; i < count; i++) {
      for (let node = this.nodes[i]; node; node = node.next) {
        node.resetLayout();
      }
    }
  }

  destroy() {
    if (this.nodes) {
      for (let i = 0, count = this.nodes.length; i < count; i++) {
        if (this.nodes[i].act) {
          this.nodes[i].act.consNode = null;
        }
      }
      this.nodes = null;
    }
  }
}

Gantt.components.ConstraintLayout.impl = ConstraintLayout;
