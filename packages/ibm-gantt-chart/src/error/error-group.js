export default class ErrorGroup {
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
      removed.forEach((removedElt) => {
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
    return false;
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
