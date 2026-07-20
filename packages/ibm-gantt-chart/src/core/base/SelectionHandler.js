import Gantt from '../core';
import Component from './Component';

export default class SelectionHandler extends Component {
  constructor(config, proto) {
    super(null, config);
    this.selections = [];
    this.selectionType = null;
    if (proto) {
      Gantt.utils.mergeObjects(this, proto);
    }
    this.setConfiguration(config);
  }

  setConfiguration(config) {}

  getObjectType(obj) {}

  select(obj, clear, notActive) {}

  clearSelection() {
    this.selections = [];
  }

  isSelected(obj) {
    return this.selections.indexOf(obj) >= 0;
  }

  processClick(e, obj) {}

  destroy() {
    this.selections = [];
  }
}
