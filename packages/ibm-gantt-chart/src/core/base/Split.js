import Gantt from '../core';
import './split-pane.scss';

export default class Split {
  constructor(elt, config) {
    this.options = config;
    this.horiz =
      !this.options || this.options.horizontal === undefined || this.options.horizontal;
    const fixedFirst =
      !this.options || this.options.fixedFirst === undefined || this.options.fixedFirst;
    const hideFirst = config && config.hideFirst;
    const hideSecond = config && config.hideSecond;

    this.splitPaneElt = document.createElement('div');
    this.splitPaneElt.className = `split-pane docloud-splitpane ${
      this.horiz ? (fixedFirst ? 'fixed-left' : 'fixed-right') : fixedFirst ? 'fixed-top' : 'fixed-bottom'
    }`;

    this.leftComponent = document.createElement('div');
    this.leftComponent.className = `split-pane-component ${
      this.horiz ? 'left-pane split-pane-left' : 'top-pane split-pane-top'
    }`;
    this.splitPaneElt.appendChild(this.leftComponent);

    const divider = document.createElement('div');
    divider.className = `split-pane-divider ${this.horiz ? 'h-split-pane-divider' : 'v-split-pane-divider'}`;
    this.divider = divider;
    this.splitPaneElt.appendChild(divider);

    if (hideFirst || hideSecond) {
      divider.style.display = 'none';
    }

    this.rightComponent = document.createElement('div');
    this.rightComponent.className = `split-pane-component ${
      this.horiz ? 'right-pane split-pane-right' : 'bottom-pane split-pane-bottom'
    }`;
    this.splitPaneElt.appendChild(this.rightComponent);

    if (hideSecond) {
      this.leftComponent.style.position = 'relative';
      this.leftComponent.style[!this.horiz ? 'height' : 'width'] = '100%';
      this.rightComponent.style.display = 'none';
    } else if (hideFirst) {
      this.rightComponent.style.position = 'relative';
      this.rightComponent.style[!this.horiz ? 'height' : 'width'] = '100%';
      this.leftComponent.style.display = 'none';
    }

    elt.appendChild(this.splitPaneElt);

    // Initialize resize shim
    const resizeShim = document.createElement('div');
    resizeShim.className = 'split-pane-resize-shim';
    this.splitPaneElt.appendChild(resizeShim);

    // Setup divider inner element
    const dividerInner = document.createElement('div');
    dividerInner.className = 'split-pane-divider-inner';
    divider.appendChild(dividerInner);

    // Bind divider mouse events
    this.onDividerMouseDown = (e) => this.handleDividerMouseDown(e);
    divider.addEventListener('mousedown', this.onDividerMouseDown);
    divider.addEventListener('touchstart', this.onDividerMouseDown);

    // Window resize listener
    this.onWindowResize = () => {
      this.onresized();
    };
    window.addEventListener('resize', this.onWindowResize);
  }

  getLeftComponent() {
    return this.leftComponent;
  }

  getRightComponent() {
    return this.rightComponent;
  }

  leftComponentCreated() {
    const pos = (this.options && this.options.pos) || 200;
    if (pos >= 0) {
      this.setFirstComponentSize(pos);
    }
  }

  rightComponentCreated() {
    const pos = this.options && this.options.pos;
    if (pos < 0) {
      this.setLastComponentSize(-pos);
    }
  }

  setFirstComponentSize(value) {
    const components = this.getComponents();
    if (this.splitPaneElt.classList.contains('fixed-top')) {
      this.setTop(components, `${value}px`);
    } else if (this.splitPaneElt.classList.contains('fixed-bottom')) {
      value = components.splitPane.offsetHeight - components.divider.offsetHeight - value;
      this.setBottom(components, `${value}px`);
    } else if (this.splitPaneElt.classList.contains('horizontal-percent')) {
      value = components.splitPane.offsetHeight - components.divider.offsetHeight - value;
      this.setBottom(components, `${value}px`);
    } else if (this.splitPaneElt.classList.contains('fixed-left')) {
      this.setLeft(components, `${value}px`);
    } else if (this.splitPaneElt.classList.contains('fixed-right')) {
      value = components.splitPane.offsetWidth - components.divider.offsetWidth - value;
      this.setRight(components, `${value}px`);
    } else if (this.splitPaneElt.classList.contains('vertical-percent')) {
      value = components.splitPane.offsetWidth - components.divider.offsetWidth - value;
      this.setRight(components, `${value}px`);
    }
  }

  setLastComponentSize(value) {
    const components = this.getComponents();
    if (this.splitPaneElt.classList.contains('fixed-top')) {
      value = components.splitPane.offsetHeight - components.divider.offsetHeight - value;
      this.setTop(components, `${value}px`);
    } else if (this.splitPaneElt.classList.contains('fixed-bottom')) {
      this.setBottom(components, `${value}px`);
    } else if (this.splitPaneElt.classList.contains('horizontal-percent')) {
      this.setBottom(components, `${value}px`);
    } else if (this.splitPaneElt.classList.contains('fixed-left')) {
      value = components.splitPane.offsetWidth - components.divider.offsetWidth - value;
      this.setLeft(components, `${value}px`);
    } else if (this.splitPaneElt.classList.contains('fixed-right')) {
      this.setRight(components, `${value}px`);
    } else if (this.splitPaneElt.classList.contains('vertical-percent')) {
      this.setRight(components, `${value}px`);
    }
  }

  setLeftComponentVisible(visible) {
    const components = this.getComponents();
    components.divider.style.display = visible ? '' : 'none';
    components.first.style.display = visible ? '' : 'none';
  }

  setRightComponentVisible(visible) {
    const components = this.getComponents();
    const { first } = components;
    first.style.position = visible ? 'absolute' : 'relative';
    first.style[first.classList.contains('top-pane') ? 'height' : 'width'] = visible ? '' : '100%';
    components.divider.style.display = visible ? '' : 'none';
    components.last.style.display = visible ? '' : 'none';
  }

  getComponents() {
    return {
      splitPane: this.splitPaneElt,
      first: this.leftComponent,
      divider: this.divider,
      last: this.rightComponent,
    };
  }

  handleDividerMouseDown(event) {
    const resizeShim = this.splitPaneElt.querySelector('.split-pane-resize-shim');
    if (resizeShim) {
      resizeShim.style.display = 'block';
    }
    this.divider.classList.add('dragged');
    if (event.type.match(/^touch/)) {
      this.divider.classList.add('touch');
    }

    const startPageX = this.pageXof(event);
    const startPageY = this.pageYof(event);
    const components = this.getComponents();

    const moveHandler = (moveEvent) => {
      this.handleDividerMouseMove(moveEvent, startPageX, startPageY, components);
    };

    const upHandler = () => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
      document.removeEventListener('touchend', upHandler);

      this.divider.classList.remove('dragged', 'touch');
      if (resizeShim) {
        resizeShim.style.display = 'none';
      }
      this.onDividerDragEnd();
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('touchmove', moveHandler);
    document.addEventListener('mouseup', upHandler);
    document.addEventListener('touchend', upHandler);
  }

  handleDividerMouseMove(event, startPageX, startPageY, components) {
    event.preventDefault && event.preventDefault();

    if (this.splitPaneElt.classList.contains('fixed-top')) {
      const newTop = this.newTop(startPageY, components);
      this.setTop(components, `${newTop}px`);
    } else if (this.splitPaneElt.classList.contains('fixed-bottom')) {
      const newBottom = this.newBottom(startPageY, components);
      this.setBottom(components, `${newBottom}px`);
    } else if (this.splitPaneElt.classList.contains('fixed-left')) {
      const newLeft = this.newLeft(startPageX, components);
      this.setLeft(components, `${newLeft}px`);
    } else if (this.splitPaneElt.classList.contains('fixed-right')) {
      const newRight = this.newRight(startPageX, components);
      this.setRight(components, `${newRight}px`);
    }

    this.onresized();
  }

  newTop(startPageY, components) {
    const minHeight = this.minHeight(components.first);
    const maxFirstComponentHeight =
      components.splitPane.offsetHeight - this.minHeight(components.last) - components.divider.offsetHeight;
    const topOffset = components.divider.offsetTop - startPageY;
    const currentPageY = event.pageY || event.touches[0].pageY;
    return Math.min(Math.max(minHeight, topOffset + currentPageY), maxFirstComponentHeight);
  }

  newBottom(startPageY, components) {
    const minHeight = this.minHeight(components.last);
    const maxLastComponentHeight =
      components.splitPane.offsetHeight - this.minHeight(components.first) - components.divider.offsetHeight;
    const bottomOffset = components.last.offsetHeight + startPageY;
    const currentPageY = event.pageY || event.touches[0].pageY;
    return Math.min(Math.max(minHeight, bottomOffset - currentPageY), maxLastComponentHeight);
  }

  newLeft(startPageX, components) {
    const minWidth = this.minWidth(components.first);
    const maxFirstComponentWidth =
      components.splitPane.offsetWidth - this.minWidth(components.last) - components.divider.offsetWidth;
    const leftOffset = components.divider.offsetLeft - startPageX;
    const currentPageX = event.pageX || event.touches[0].pageX;
    return Math.min(Math.max(minWidth, leftOffset + currentPageX), maxFirstComponentWidth);
  }

  newRight(startPageX, components) {
    const minWidth = this.minWidth(components.last);
    const maxLastComponentWidth =
      components.splitPane.offsetWidth - this.minWidth(components.first) - components.divider.offsetWidth;
    const rightOffset = components.last.offsetWidth + startPageX;
    const currentPageX = event.pageX || event.touches[0].pageX;
    return Math.min(Math.max(minWidth, rightOffset - currentPageX), maxLastComponentWidth);
  }

  pageXof(event) {
    if (event.pageX !== undefined) {
      return event.pageX;
    }
    if (event.originalEvent && event.originalEvent.pageX !== undefined) {
      return event.originalEvent.pageX;
    }
    if (event.originalEvent && event.originalEvent.touches) {
      return event.originalEvent.touches[0].pageX;
    }
    if (event.touches) {
      return event.touches[0].pageX;
    }
    return 0;
  }

  pageYof(event) {
    if (event.pageY !== undefined) {
      return event.pageY;
    }
    if (event.originalEvent && event.originalEvent.pageY !== undefined) {
      return event.originalEvent.pageY;
    }
    if (event.originalEvent && event.originalEvent.touches) {
      return event.originalEvent.touches[0].pageY;
    }
    if (event.touches) {
      return event.touches[0].pageY;
    }
    return 0;
  }

  minHeight(element) {
    return Number.parseInt(window.getComputedStyle(element).minHeight, 10) || 0;
  }

  minWidth(element) {
    return Number.parseInt(window.getComputedStyle(element).minWidth, 10) || 0;
  }

  setTop(components, top) {
    components.first.style.height = top;
    components.divider.style.top = top;
    components.last.style.top = top;
  }

  setBottom(components, bottom) {
    components.first.style.bottom = bottom;
    components.divider.style.bottom = bottom;
    components.last.style.height = bottom;
  }

  setLeft(components, left) {
    components.first.style.width = left;
    components.divider.style.left = left;
    components.last.style.left = left;
  }

  setRight(components, right) {
    components.first.style.right = right;
    components.divider.style.left = right;
    components.last.style.width = right;
  }

  onresized() {}

  onDividerDragEnd() {}

  destroy() {
    if (this.onDividerMouseDown) {
      this.divider.removeEventListener('mousedown', this.onDividerMouseDown);
      this.divider.removeEventListener('touchstart', this.onDividerMouseDown);
    }
    if (this.onWindowResize) {
      window.removeEventListener('resize', this.onWindowResize);
    }
    if (this.splitPaneElt && this.splitPaneElt.parentNode) {
      this.splitPaneElt.parentNode.removeChild(this.splitPaneElt);
    }
  }
}
