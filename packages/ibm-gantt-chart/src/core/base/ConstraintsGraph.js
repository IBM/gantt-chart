import Gantt from '../core';
import Component from './Component';

export default class ConstraintsGraph extends Component {
  constructor(gantt, node, config) {
    super(gantt, node, config);
    this.node = node;
    this.setConfiguration(config);
  }

  setConfiguration(config) {}

  setConstraints(cts) {}

  setNode(node) {}
}
