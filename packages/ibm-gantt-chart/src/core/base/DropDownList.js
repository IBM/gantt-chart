import Gantt from '../core';
import Component from './Component';

export default class DropDownList extends Component {
  constructor(gantt, config) {
    super(gantt, config);
    this.setConfiguration(config);
  }

  setConfiguration(config) {
    const node = (this.node = document.createElement('div'));
    const defaultClass = DropDownList.defaultClass;
    if (defaultClass) {
      node.className = defaultClass;
    }
    if (config.classes) {
      Gantt.utils.addClass(node, config.classes);
    }
    if (config.text || config.icon || config.fontIcon) {
      const labelNode = document.createElement('div');
      labelNode.className = 'label';
      if (config.icon) {
        const img = document.createElement('img');
        img.src = config.icon;
        img.alt = '';
        labelNode.appendChild(img);
      }
      if (config.fontIcon) {
        const fontIcon = document.createElement('i');
        fontIcon.className = config.fontIcon + (config.text ? ' fa-fw' : '');
        labelNode.appendChild(fontIcon);
      }
      if (config.text) {
        labelNode.appendChild(document.createTextNode(config.text));
      }
      node.appendChild(labelNode);
    }
    const select = (this.selectNode = document.createElement('select'));
    select.className = 'g-hoverable';
    for (let i = 0, count = config.options.length, opt, optNode; i < count; i++) {
      opt = config.options[i];
      optNode = document.createElement('option');
      optNode.text = opt.text;
      optNode.value = opt.value;
      select.appendChild(optNode);
    }
    node.appendChild(select);
    if (config.onchange) {
      this.onchange(config.onchange);
    }
    return node;
  }

  select(value) {
    this.selectNode.value = value;
  }

  onchange(callback) {
    this.selectNode.onchange = (e) => {
      callback(this.selectNode.value, { gantt: this.gantt, event: e });
    };
  }

  update() {}

  setId(id) {
    this.selectNode.id = id;
  }
}

DropDownList.defaultClass = 'dropdown-list';
