import Gantt from '../core';
import Component from './Component';

export default class ErrorHandler extends Component {
  constructor(config) {
    super(null, config);
    this.config = config;
  }

  addError(err) {}

  hasErrors() {
    return false;
  }

  clear() {}

  showError(err) {}

  getErrors() {
    return [];
  }

  createErrorNode(err) {
    const node = document.createElement('div');
    node.className = 'gantt_error';
    return node;
  }

  removeGroup(node) {}
}
