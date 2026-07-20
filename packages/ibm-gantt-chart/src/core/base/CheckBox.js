import Gantt from '../core';
import Component from './Component';

export default class CheckBox extends Component {
  constructor(gantt, config) {
    super(gantt, config);
    this.setConfiguration(config);
  }

  setConfiguration(config) {
    const ctnr = (this.node = document.createElement('div'));
    ctnr.style.whiteSpace = 'nowrap';
    const input = (this.inputNode = document.createElement('input'));
    input.setAttribute('type', 'checkbox');
    input.setAttribute('value', 'None');
    input.className = 'g-selectable g-hoverable';
    if (config.id) {
      input.id = id;
    }
    if (config.classes) {
      ctnr.className = config.classes;
    }
    ctnr.appendChild(input);
    const label = document.createElement('label');
    if (config.id) {
      label.setAttribute('for', config.id);
    }
    if (config.icon) {
      const img = document.createElement('img');
      img.src = config.icon;
      img.alt = '';
      label.appendChild(img);
    }
    if (config.svg) {
      Gantt.utils.appendSVG(label, config.svg);
    }
    if (config.text) {
      label.appendChild(document.createTextNode(config.text));
    }
    if (config.onclick) {
      this.onclick(config.onclick);
    }
    ctnr.appendChild(label);
    return ctnr;
  }

  setChecked(checked) {
    this.inputNode.checked = checked;
  }

  onclick(callback) {
    this.inputNode.onclick = (e) => {
      callback(this.inputNode.checked, { gantt: this.gantt, event: e });
    };
  }

  update() {}

  setId(id) {
    this.inputNode.id = id;
  }
}

CheckBox.defaultClass = null;
