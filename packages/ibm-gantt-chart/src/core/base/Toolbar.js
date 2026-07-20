import Gantt from '../core';
import Component from './Component';

export default class Toolbar extends Component {
  constructor(gantt, node, config) {
    super(gantt, config);
    this.node = node;
    this.setConfiguration(config, node);
  }

  setConfiguration(config, node) {
    this.config = config;
  }

  connect(gantt) {}

  ganttLoaded(gantt, rows) {}

  onInitialized() {}

  destroy() {}
}

Toolbar.createTitle = function createTitle(title) {
  const node = document.createElement('div');
  node.textContent = title;
  node.className = 'toolbar-title';
  return node;
};
