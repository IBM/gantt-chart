import Gantt from '../core';
import Component from './Component';

/** @typedef {import('../types').ButtonConfig} ButtonConfig */
/** @typedef {import('../types').ClickHandler} ClickHandler */
/** @typedef {import('../types').GanttInstance} GanttInstance */

export default class Button extends Component {
  /**
   * @param {GanttInstance} gantt
   * @param {ButtonConfig} config
   */
  constructor(gantt, config) {
    super(gantt, config);
    /** @type {ClickHandler[]} */
    this.callbacks = [];
    this.setConfiguration(config);
  }

  /**
   * @param {ButtonConfig} config
   * @returns {HTMLElement}
   */
  setConfiguration(config) {
    const btn = document.createElement('div');
    if (config.id) {
      btn.id = config.id;
    }
    btn.className = `toolbar-button g-hoverable g-selectable${config.classes ? ' ' + config.classes : ''}`;
    if (config.icon) {
      const img = document.createElement('img');
      img.src = config.icon;
      img.alt = '';
      btn.appendChild(img);
    }
    if (config.fontIcon) {
      const fontIcon = document.createElement('i');
      fontIcon.className = config.fontIcon + (config.text ? ' fa-fw' : '');
      btn.appendChild(fontIcon);
    }
    if (config.svg) {
      Gantt.utils.appendSVG(btn, config.svg);
    }
    if (config.text) {
      btn.appendChild(document.createTextNode(config.text));
    }
    this.node = btn;
    this.node.onclick = (e) => {
      this.clicked(e);
      this.callbacks.forEach((cb) => {
        if (typeof cb === 'function') {
          cb({ gantt: this.gantt, event: e });
        }
      });
    };
    if (config.onclick) {
      this.onclick(config.onclick);
    }
    return btn;
  }

  /**
   * @param {ClickHandler} callback
   */
  onclick(callback) {
    this.callbacks.push(callback);
  }

  clicked(e) {}

  setId(id) {
    this.node.id = id;
  }

  update() {}

  setSelected(selected) {
    Gantt.utils.toggleClass(this.node, 'selected', selected);
  }
}
