import Gantt from '../core';
import { getComponent } from '../component-factory';
import Component from './Component';

export default class ButtonGroup extends Component {
  constructor(gantt, config) {
    super(gantt, config);
    this.selected = null;
    this.callbacks = [];
    this.setConfiguration(config);
  }

  setConfiguration(config) {
    const node = (this.node = document.createElement('div'));
    if (config.classes) {
      node.className = config.classes;
    }
    this.buttons = [];
    Gantt.utils.addClass(node, 'button-group');
    node.style.display = 'flex';
    node.style.flexDirection = 'row';
    node.style.alignItems = 'center';

    const self = this;
    function installBtnClicked(button) {
      button.clicked = () => {
        self.setSelected(button);
      };
    }

    this.value = null;
    const cfgBtns = config.buttons;
    for (let i = 0; i < cfgBtns.length; ++i) {
      const btn = new (getComponent('Button', Gantt.components.Button))(this.gantt, cfgBtns[i]);
      this.buttons.push(btn);
      installBtnClicked(btn);
      if (cfgBtns[i].selected) {
        this.selected = btn;
        btn.setSelected(true);
        this.value = btn.value;
      }
      btn.value = cfgBtns[i].value;
      node.appendChild(btn.node);
    }
    if (config.onchange) {
      this.onchange(config.onchange);
    }
    if (config.value !== undefined) {
      this.setValue(config.value);
    }
    return node;
  }

  setValue(value, noNotify) {
    for (let i = 0; i < this.buttons.length; i++) {
      if (this.buttons[i].value === value) {
        this.setSelected(this.buttons[i], noNotify);
        break;
      }
    }
  }

  getValue() {
    return this.value;
  }

  setSelected(btn, noNotify) {
    if (this.selected !== btn) {
      if (this.selected) {
        this.selected.setSelected(false);
      }
      this.selected = btn;
      if (btn) {
        this.value = btn.value;
        btn.setSelected(true);
      } else {
        this.value = null;
      }
      if (!noNotify) {
        this.callbacks.forEach((cb) => {
          cb(this.value);
        });
      }
    }
  }

  onchange(userCallback) {
    this.callbacks.push(userCallback);
  }

  setId(id) {
    this.inputNode.id = id;
  }
}
