const SIDE_COUNT = 2;
const CONNECTOR_COUNT = 4;

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

export default Node;
export { SIDE_COUNT, CONNECTOR_COUNT };
