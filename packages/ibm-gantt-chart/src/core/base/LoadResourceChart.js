import Gantt from '../core';
import Component from './Component';

export default class LoadResourceChart extends Component {
  constructor(gantt, node, config) {
    super(gantt, node, config);
    this.node = node;
    this.setConfiguration(config);
  }

  setConfiguration(config) {}

  setVisible(visible) {}

  setScrollLeft(left) {}
}
