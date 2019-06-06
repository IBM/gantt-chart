import Gantt from './core';

const defaultConfig = {
  keySpeed: 10,
  showMoveOnInvalid: true,
  dragActivationThresoldWidth: 5,
  dragActivationThresoldHeight: 5,
};

export default class DragDropHandler {
  constructor(container, config) {
    Gantt.utils.mergeObjects(this, defaultConfig, config);

    this.container = container;

    this.initialMouseX = undefined;
    this.initialMouseY = undefined;
    this.startX = undefined;
    this.startY = undefined;
    this.dXKeys = undefined;
    this.dYKeys = undefined;
    this.draggedObject = undefined;
    this.clickedObject = undefined;
    this.handlers = [];
    this.methodsToHitch = [];
    this.hitchedMethods = [];
  }

  addHandler(handler) {
    this.handlers.push(handler);
  }

  // noinspection JSUnusedGlobalSymbols
  removeHandler(handler) {
    const index = this.handlers.indexOf(handler);
    if (index > -1) {
      this.handlers.splice(index, 1);
      return true;
    }
    return false;
  }

  attach(element) {
    element.onmousedown = e => this.startDragMouse(e);
  }

  startDragMouse(e) {
    const evt = e || window.event;
    if (evt.button === 2) {
      // Right button, we cancel the drag if any
      if (this.draggedObject) {
        this.cancel(evt);
      }
    } else if (!evt.button) {
      this.initialMouseX = evt.clientX;
      this.initialMouseY = evt.clientY;
      evt.target.blur();
      this.connectDragStarter(evt);
      return false;
    }
  }

  connectDragStarter(evt) {
    // Drag will be triggered only if the mouse moves more than options.dragActivationThresoldWidth / options.dragActivationThresoldHeight
    this.initOffsetX = evt.offsetX;
    this.initOffsetY = evt.offsetY;
    this.clickedObject = evt.target;
    this.dXKeys = this.dYKeys = 0;
    this.addEventListener(document, 'mousemove', this.checkStartDrag);
    this.addEventListener(document, 'mouseup', this.cancelDragStarter);
    this.addEventListener(document, 'keydown', this.dragStarterKeys);
    this.addEventListener(document, 'keypress', this.dragStartSwitchKeyEvents);
  }

  checkStartDrag(e) {
    const evt = e || window.event;
    const dX = evt.clientX - this.initialMouseX;
    const dY = evt.clientY - this.initialMouseY;
    if (Math.abs(dX) >= this.dragActivationThresoldWidth || Math.abs(dY) >= this.dragActivationThresoldHeight) {
      this.cancelDragStarter();
      if (this.startDrag()) {
        this.move(dX, dY);
      }
    }
  }

  dragStartSwitchKeyEvents() {
    // for Opera and Safari 1.3
    this.removeEventListener(document, 'keydown', this.dragStarterKeys);
    this.removeEventListener(document, 'keypress', this.switchKeyEvents);
    this.addEventListener(document, 'keypress', this.dragStarterKeys);
  }

  dragStarterKeys(e) {
    const evt = e || window.event;
    const key = evt.keyCode;
    switch (key) {
      case 37: // left
      case 63234:
        this.dXKeys -= this.keySpeed;
        break;
      case 38: // up
      case 63232:
        this.dYKeys -= this.keySpeed;
        break;
      case 39: // right
      case 63235:
        this.dXKeys += this.keySpeed;
        break;
      case 40: // down
      case 63233:
        this.dYKeys += this.keySpeed;
        break;
      case 13: // enter
      case 27: // escape
        if (evt.preventDefault) evt.preventDefault();
        this.cancelDragStarter(evt);
        return false;
      default:
        return true;
    }
    if (evt.preventDefault) evt.preventDefault();
    this.cancelDragStarter(); // Any movement key pressed triggers the start of the drag
    if (this.startDrag()) {
      this.move(this.dXKeys, this.dYKeys);
    }
    return false;
  }

  cancelDragStarter() {
    this.removeEventListener(document, 'mousemove', this.checkStartDrag);
    this.removeEventListener(document, 'mouseup', this.cancelDragStarter);
    this.removeEventListener(document, 'keypress', this.dragStarterKeys);
    this.removeEventListener(document, 'keypress', this.dragStartSwitchKeyEvents);
    this.removeEventListener(document, 'keydown', this.dragStarterKeys);
  }

  startDrag() {
    const obj = this.startMove(this.clickedObject, this.initOffsetX, this.initOffsetY);
    if (!obj) {
      return false;
    }
    if (this.draggedObject) {
      this.releaseElement();
    }
    this.addEventListener(document, 'mousemove', this.dragMouse);
    this.addEventListener(document, 'mouseup', this.dropped);
    this.addEventListener(document, 'keydown', this.dragKeys);
    this.addEventListener(document, 'keypress', this.switchKeyEvents);
    this.startX = obj.offsetLeft;
    this.startY = obj.offsetTop;
    this.initLeft = obj.style.left;
    this.initTop = obj.style.top;
    this.initParentNode = obj.parentNode;
    this.draggedObject = obj;
    this.invalid = false;
    obj.className += ' dragged';
    return true;
  }

  callHandlers(meth, evt) {
    let result;
    let i;
    let handler;
    for (i = 0; i < this.handlers.length; i++) {
      handler = this.handlers[i];
      if (handler[meth]) {
        result = handler[meth](evt);
        if (result !== undefined && !result) {
          return false;
        }
      }
    }
    return result;
  }

  startMove(obj, offsetX, offsetY) {
    const result = this.callHandlers('startMove', obj, offsetX, offsetY);
    return result === undefined ? obj : result;
  }

  dragMouse(e) {
    const evt = e || window.event;
    const dX = evt.clientX - this.initialMouseX;
    const dY = evt.clientY - this.initialMouseY;
    this.move(dX, dY);
    return false;
  }

  move(dx, dy) {
    let i;
    let handler;
    let result;
    const pos = {
      dx,
      dy,
      x: this.startX + dx,
      y: this.startY + dy,
    };
    // Check if move valid
    this.invalid = false;
    for (i = 0; i < this.handlers.length; i++) {
      handler = this.handlers[i];
      if (handler.move) {
        result = handler.move(pos);
        if (result !== undefined && !result) {
          this.invalid = true;
        }
      }
    }
    if (this.invalid && !this.showMoveOnInvalid) {
      return false;
    }
    this.moved(dx, dy);
    if (pos.x !== undefined) {
      this.draggedObject.style.left = `${pos.x}px`;
    }
    if (pos.y !== undefined) {
      this.draggedObject.style.top = `${pos.y}px`;
    }
    return true;
  }

  dragKeys(e) {
    const evt = e || window.event;
    const key = evt.keyCode;
    switch (key) {
      case 37: // left
      case 63234:
        this.dXKeys -= this.keySpeed;
        break;
      case 38: // up
      case 63232:
        this.dYKeys -= this.keySpeed;
        break;
      case 39: // right
      case 63235:
        this.dXKeys += this.keySpeed;
        break;
      case 40: // down
      case 63233:
        this.dYKeys += this.keySpeed;
        break;
      case 13: // enter
      case 27: // escape
        this.cancel(evt);
        return false;
      default:
        return true;
    }
    this.move(this.dXKeys, this.dYKeys);
    if (evt.preventDefault) evt.preventDefault();
    return false;
  }

  addEventListener(elt, event, method, capturing) {
    const index = this.methodsToHitch.indexOf(method);
    let hitched = index >= 0 ? this.hitchedMethods[index] : null;
    if (index < 0) {
      this.methodsToHitch.push(method);
      this.hitchedMethods.push((hitched = e => method.call(this, e)));
    } else {
      hitched = this.hitchedMethods[index];
    }
    if (capturing) {
      Gantt.utils.addEventListener(elt, event, hitched, true);
    } else {
      Gantt.utils.addEventListener(elt, event, hitched);
    }
  }

  removeEventListener(elt, event, method) {
    const index = this.methodsToHitch.indexOf(method);
    if (index >= 0) {
      Gantt.utils.removeEventListener(elt, event, this.hitchedMethods[index]);
    }
  }

  switchKeyEvents() {
    // for Opera and Safari 1.3
    this.removeEventListener(document, 'keydown', this.dragKeys);
    this.removeEventListener(document, 'keypress', this.switchKeyEvents);
    this.addEventListener(document, 'keypress', this.dragKeys);
  }

  // noinspection JSUnusedLocalSymbols
  moved(dx, dy) {
    this.callHandlers('moved');
  }

  stopDrag() {
    this.callHandlers('stopMove');
  }

  cancel(evt) {
    this.restoreInitPosition();
    this.callHandlers('cancel');
    this.releaseElement(evt);
  }

  restoreInitPosition() {
    if (this.draggedObject) {
      if (this.callHandlers('restoreInitPosition') !== false) {
        this.draggedObject.style.left = this.initLeft;
        this.draggedObject.style.top = this.initTop;
        if (this.initParentNode !== this.draggedObject.parentNode) {
          this.initParentNode.appendChild(this.draggedObject);
        }
      }
    }
  }

  dropped(e) {
    const evt = e || window.event;
    if (!evt.button && this.draggedObject) {
      // Drag and drop may have been cancelled through a right click or pressing the Esc key
      const dX = evt.clientX - this.initialMouseX;
      const dY = evt.clientY - this.initialMouseY;
      this.move(dX, dY, true);
      this.applyMove();
      this.releaseElement(evt);
    }
  }

  applyMove() {
    this.callHandlers('applyMove');
  }

  releaseElement(evt) {
    this.stopDrag(evt);
    this.removeEventListener(document, 'mousemove', this.dragMouse);
    this.removeEventListener(document, 'mouseup', this.dropped);
    this.removeEventListener(document, 'keypress', this.dragKeys);
    this.removeEventListener(document, 'keypress', this.switchKeyEvents);
    this.removeEventListener(document, 'keydown', this.dragKeys);
    Gantt.utils.removeClass(this.draggedObject, 'dragged');
    this.draggedObject = null;
  }
}
