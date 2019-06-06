import Gantt from '../core/core';

import './error.scss';

const defaults = {
  listClass: 'error-list fit-parent-content',
  maxErrors: 5,
  bodyClass: 'error-body clearfix',
  titleClass: 'error-title',
  barClass: 'error-bar',
  descClass: 'error-desc',
  detailsBtnClass: 'error-details-btn',
  removeBtnClass: 'remove-error-btn',
  errorExpandedDefault: true,
  fadingOutDuration: 600,
};

class ErrorGroup {
  constructor(node) {
    this.node = node;
    this.errs = [];
    this.errNodes = [];
    this.errorList = null;
  }

  addError(err, node, maxErrors) {
    if (maxErrors && maxErrors > 0 && this.errs.length >= maxErrors) {
      this.errs.splice(0, this.errs.length - maxErrors + 1);
      const removed = this.errNodes.splice(0, this.errNodes.length - maxErrors + 1);
      removed.forEach(removedElt => {
        this.errorList.removeChild(removedElt);
      });
    }
    this.errs.push(err);
    this.errNodes.push(node);
    this.errorList.appendChild(node);
    return node;
  }

  removeError(err) {
    for (let i = 0; i < this.errs.length; i++) {
      if (this.errs[i] === err || this.errNodes[i] === err) {
        this.errs.splice(i, 1);
        const nodes = this.errNodes.splice(i, 1);
        if (nodes.length) {
          this.errorList.removeChild(nodes[0]);
        }
        return true;
      }
    }
  }

  clear() {
    if (this.errorList && this.errorList.parentNode === this.node) {
      this.node.removeChild(this.errorList);
    }
    this.errs = [];
    this.errNodes = [];
    this.errorList = null;
  }

  updateErrorList() {
    if (this.errorList) {
      if (this.errs.length) {
        this.errorList.style.display = '';
        if (!this.errorList.parentNode) {
          this.beforeSettingErrorList(this.node);
          this.node.appendChild(this.errorList);
        }
      } else {
        this.errorList.style.display = 'none';
      }
    }
  }

  beforeSettingErrorList(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  hasErrors() {
    return !!this.errs.length;
  }
}

function ensureErrorGroup(node, errorGroups) {
  for (let i = 0; i < errorGroups.length; i++) {
    if (errorGroups[i].node === node) {
      return errorGroups[i];
    }
  }
  const errorGroup = new ErrorGroup(node);
  errorGroups.push(errorGroup);
  return errorGroup;
}

export default class ErrorHandler extends Gantt.components.ErrorHandler {
  constructor(node, config) {
    super(Gantt.utils.mergeObjects({}, defaults, config));
    this.node = node;
    this.lockCount = 0;
    this.errorGroups = [];
  }

  // noinspection JSUnusedGlobalSymbols
  addError(err, msg, node) {
    if (!this.lockCount) {
      const errDetails = this.convertError(err, msg);
      const errNode = errDetails && this.createErrorNode(err, errDetails);
      if (errNode) {
        const errorGroup = ensureErrorGroup(node || this.node, this.errorGroups);
        if (!errorGroup.errorList) {
          errorGroup.errorList = this.createErrorList();
        }
        errorGroup.addError(err, errNode, this.config.maxErrors);
        errorGroup.updateErrorList();
        return errNode;
      }
    }
  }

  lock() {
    this.lockCount++;
  }

  // noinspection JSUnusedGlobalSymbols
  unlock() {
    --this.lockCount;
  }

  getErrors() {
    let result = [];
    for (let iGroup = 0, count = this.errorGroups.length; iGroup < count; ++iGroup) {
      result = result.concat(this.errorGroups[iGroup].errs);
    }
    return result;
  }

  hasErrors() {
    for (let iGroup = 0, count = this.errorGroups.length; iGroup < count; ++iGroup) {
      if (this.errorGroups[iGroup].hasErrors()) {
        return true;
      }
    }
    return false;
  }

  createErrorList() {
    const lst = document.createElement('ul');
    lst.className = 'error-list';
    return lst;
  }

  createErrorNode(err, errDetails) {
    const node = document.createElement('li');
    node.className = (this.config.errorExpandedDefault && 'error-component error-expanded') || 'error-component';

    const errorContent = document.createElement('div');
    errorContent.className = 'error-content clearfix';

    const textContent = document.createElement('div');
    const divTitle = document.createElement('span');
    divTitle.innerHTML = errDetails.title;
    divTitle.className = 'error-title';
    divTitle.onclick = evt => this._toggleErrorDisplay(node);
    textContent.appendChild(divTitle);

    const divErrorBar = document.createElement('div');
    divErrorBar.className = 'error-bar';

    if (errDetails.desc) {
      const divDesc = document.createElement('div');
      divDesc.className = 'error-desc';
      divDesc.innerHTML = errDetails.desc;
      textContent.appendChild(divDesc);

      const detailsBtn = document.createElement('span');
      detailsBtn.tabIndex = 0;
      detailsBtn.className = 'error-details-btn';
      detailsBtn.innerHTML = Gantt.utils.getString('gantt.error.details');
      detailsBtn.onclick = evt => this._toggleErrorDisplay(node);
      divErrorBar.appendChild(detailsBtn);
    }

    // Remove error button
    const removeErrorBtn = document.createElement('span');
    removeErrorBtn.className = 'remove-error-btn';
    removeErrorBtn.tabIndex = 0;
    removeErrorBtn.onclick = evt => this.removeError(err);
    divErrorBar.appendChild(removeErrorBtn);

    errorContent.appendChild(divErrorBar);

    errorContent.appendChild(textContent); // Error the text div after the bar so that the bar remains top aligned with its container
    node.appendChild(errorContent);

    return node;
  }

  convertError(err, msg) {
    const c = this.config && this.config.convertError && this.config.convertError(err, msg);
    if (c) {
      return c;
    }
    if (Gantt.utils.isString(err)) {
      return {
        title: err,
      };
    }
    let title = err.message || err.status || err.statusCode;
    if (msg) {
      title = Gantt.utils.formatString('gantt.error.title.fmt', { msg, title });
    }
    let desc = err.desc || err.description || err.stack;
    if (desc) {
      desc = desc.replace(/(?:\r\n|\r|\n)/g, '<br />');
    }
    return {
      title,
      desc,
    };
  }

  _toggleErrorDisplay(errorNode) {
    Gantt.utils.toggleClass(errorNode, 'error-expanded');
  }

  removeError(err) {
    for (let iGroup = 0, count = this.errorGroups.length; iGroup < count; iGroup++) {
      if (this.errorGroups[iGroup].removeError(err)) {
        this.errorGroups[iGroup].updateErrorList();
        return true;
      }
    }
    return false;
  }

  removeGroup(node) {
    for (let iGroup = 0, count = this.errorGroups.length; iGroup < count; iGroup++) {
      if (this.errorGroups[iGroup].node === node) {
        this.errorGroups[iGroup].clear();
        this.errorGroups.splice(iGroup, 1);
        return true;
      }
    }
    return false;
  }
}

Gantt.components.ErrorHandler.impl = ErrorHandler;
