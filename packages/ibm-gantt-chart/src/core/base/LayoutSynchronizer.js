import Gantt from '../core';
import Component from './Component';

export default class LayoutSynchronizer extends Component {
  constructor(config, proto) {
    super(null, config);
    if (proto) {
      Gantt.utils.mergeObjects(this, proto || config);
    }
    this.setConfiguration(config);
  }

  setConfiguration(config) {}

  connect(gantt) {}

  disconnect() {}

  destroy() {
    this.disconnect();
  }
}
