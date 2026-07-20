import Gantt from '../core';
import Component from './Component';

/** @typedef {import('../types').InputConfig} InputConfig */
/** @typedef {import('../types').ChangeHandler} ChangeHandler */
/** @typedef {import('../types').GanttInstance} GanttInstance */

export default class Input extends Component {
  /**
   * @param {GanttInstance} gantt
   * @param {InputConfig} config
   */
  constructor(gantt, config) {
    super(gantt, config);
    this.setConfiguration(config);
  }

  /**
   * @param {InputConfig} config
   * @returns {HTMLElement}
   */
  setConfiguration(config) {
    const node = (this.node = document.createElement('div'));
    if (Input.defaultClass) {
      node.className = Input.defaultClass;
    }
    if (config.classes) {
      Gantt.utils.addClass(node, config.classes);
    }
    node.style.display = 'flex';
    node.style.flexDirection = 'row';
    node.style.alignItems = 'center';

    if (config.text || config.icon || config.fontIcon || config.type === 'search') {
      const labelNode = document.createElement('div');
      labelNode.className = 'label';
      labelNode.style.display = 'inline-block';
      if (config.icon) {
        const img = document.createElement('img');
        img.src = config.icon;
        img.alt = '';
        labelNode.appendChild(img);
      }
      if (config.fontIcon) {
        const fontIcon = document.createElement('i');
        fontIcon.className = config.fontIcon + (config.text ? ' fa-fw' : '');
        fontIcon.setAttribute('aria-disabled', true);
        labelNode.appendChild(fontIcon);
      } else if (config.type === 'search') {
        const fontIcon = document.createElement('i');
        fontIcon.setAttribute('aria-disabled', true);
        fontIcon.className = `fa fa-search fa-lg${config.text ? ' fa-fw' : ''}`;
        labelNode.appendChild(fontIcon);
      }
      if (config.text) {
        labelNode.appendChild(document.createTextNode(config.text));
      }
      node.appendChild(labelNode);
    }
    const input = (this.inputNode = document.createElement('input'));
    node.appendChild(input);

    const deleteBtn = document.createElement('div');
    deleteBtn.className = 'delete-button';
    deleteBtn.display = 'inline-block';
    const deleteIcon = document.createElement('i');
    deleteIcon.className = 'fa fa-times fa-lg';
    deleteBtn.appendChild(deleteIcon);
    node.appendChild(deleteBtn);
    deleteBtn.onclick = () => {
      input.value = '';
      if ('createEvent' in document) {
        const evt = document.createEvent('HTMLEvents');
        evt.initEvent('change', false, true);
        input.dispatchEvent(evt);
      } else {
        input.fireEvent('onchange');
      }
    };

    if (config.onchange) {
      this.onchange(config.onchange);
    }
    return node;
  }

  setText(value) {
    if (this.inputNode) {
      this.inputNode.value = value;
    }
  }

  /**
   * @param {ChangeHandler<string>} userCallback
   */
  onchange(userCallback) {
    const callback = (e) => {
      if (this.inputNode && typeof userCallback === 'function') {
        userCallback(this.inputNode.value, { gantt: this.gantt, event: e });
      }
    };
    if (this.inputNode) {
      this.inputNode.onchange = callback;
      this.inputNode.onkeyup = callback;
    }
  }

  setId(id) {
    if (this.inputNode) {
      this.inputNode.id = id;
    }
  }
}

Input.defaultClass = 'input-box';
