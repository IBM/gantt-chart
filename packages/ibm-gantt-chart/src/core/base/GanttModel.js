import Gantt from '../core';
import Component from './Component';

export default class GanttModel extends Component {
  constructor(gantt, config) {
    super(gantt, config);
    if (config) {
      this.setConfiguration(config);
    }
  }

  setConfiguration(config) {}
}
