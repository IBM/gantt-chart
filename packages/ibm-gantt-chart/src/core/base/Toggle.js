import Gantt from '../core';
import { getComponent } from '../component-factory';
import Component from './Component';

export default class Toggle extends Component {
  constructor(gantt, config) {
    super(gantt, config);
    this.setConfiguration(config);
  }

  setConfiguration(config) {
    this.callbacks = [];
    const ctnr = (this._node = document.createElement('div'));
    this._isSel = config.isSelected && config.isSelected(this.gantt);
    this.btnUnselected = new (getComponent('Button', Gantt.components.Button))(this.gantt, config.unselected);
    this.btnSelected = new (getComponent('Button', Gantt.components.Button))(this.gantt, config.selected);
    ctnr.appendChild(this._isSel ? this.btnSelected.node : this.btnUnselected.node);
    if (config.id) {
      ctnr.id = id;
    }
    const onclick = (e) => {
      this._isSel = !this._isSel;
      this.updateButtons(this._isSel);
      this.callbacks.forEach((c) => {
        c(this._isSel, { gantt: this.gantt, event: e });
      });
    };
    this.btnUnselected.node.onclick = this.btnSelected.node.onclick = onclick;
    if (config.onclick) {
      this.onclick(config.onclick);
    }
    return ctnr;
  }

  isSelected() {
    return this._isSel;
  }

  setSelected(selected) {
    this._isSel = selected;
    this.updateButtons(selected);
  }

  get node() {
    return this._node;
  }

  set node(node) {
    this._node = node;
  }

  onclick(callback) {
    this.callbacks.push(callback);
  }

  update() {
    this.updateButtons(this.config.isSelected ? (this._isSel = this.config.isSelected(this.gantt)) : this._isSel);
  }

  updateButtons(isSel) {
    if (this.btnSelected.node.parentNode) {
      if (!isSel) this._node.replaceChild(this.btnUnselected.node, this.btnSelected.node);
    } else if (this.btnUnselected.node.parentNode) {
      this._node.replaceChild(this.btnSelected.node, this.btnUnselected.node);
    }
  }
}

Toggle.defaultClass = null;
