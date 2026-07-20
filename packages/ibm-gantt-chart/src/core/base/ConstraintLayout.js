import Gantt from '../core';
import Component from './Component';

export default class ConstraintLayout extends Component {
  constructor(gantt, config) {
    super(gantt, null, config);
    this.setConfiguration(config);
  }

  setConfiguration(config) {}

  startInitialize() {}

  addNode(node) {}

  addConstraint(nodeFrom, nodeTo, cons) {}

  stopInitialize() {}

  forEachLink(node, cb) {}

  layoutNode(node) {}

  layoutRowNodeLinks(rowIndex) {}

  drawRowLinks(rowIndex, parentElt, renderer, ctx) {}
}
