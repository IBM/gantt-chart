import Gantt from '../core/core';

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
      s += `(${this.ar.map((cons) => cons.from.consNode.toString()).join(',')})`;
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

export default Link;
