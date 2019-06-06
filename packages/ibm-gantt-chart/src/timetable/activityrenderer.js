import Gantt from '../core/core';

import {
  DEFAULT_ACTIVITY_CLASSNAME,
  MILESTONE_CLASSNAME,
  PARENT_ACTIVITY_CLASSNAME,
  SELECT_CONTENT_CLASSNAME,
} from './css-classes';

const ActivityRendererPrototype = {
  createShape(activity) {
    const elt = document.createElement('div');
    const start = activity.start;
    const end = activity.end;
    if (end === start) {
      elt.className = MILESTONE_CLASSNAME;
      elt.style.border = 'none';
      elt.style.maxWidth = '0';

      const diamond = document.createElement('div');
      diamond.className = 'shape';
      diamond.style.position = 'absolute';
      diamond.style.top = '8px';
      diamond.style.left = '0';
      diamond.style.right = '0';
      diamond.style.bottom = '-8px';
      diamond.style.minWidth = '16px';
      diamond.style.maxHeight = '16px';
      diamond.style.background = 'inherit';
      elt.appendChild(diamond);
    } else if (activity.children && activity.children.length) {
      elt.className = PARENT_ACTIVITY_CLASSNAME;
      elt.style.display = 'block';
      elt.style.backgroundColor = 'transparent';
      const bar = document.createElement('div');
      bar.className = 'parent-activity-bar';
      bar.style.width = '100%';
      bar.style.height = '50%';
      elt.appendChild(bar);

      const triangleBar = document.createElement('div');
      const triangleWidth = 7;
      triangleBar.style.width = '100%';
      triangleBar.style.height = '50%';
      triangleBar.style.backgroundColor = 'transparent';

      const leftTriangle = document.createElement('div');
      leftTriangle.className = 'top-left-triangle activity-limit';
      leftTriangle.style.display = 'inline-block';
      leftTriangle.style.float = 'left';
      leftTriangle.style.width = '0';
      leftTriangle.style.height = '0';
      leftTriangle.style.borderTopStyle = 'solid';
      leftTriangle.style.borderTopWidth = `${triangleWidth}px`;
      leftTriangle.style.borderRightStyle = 'solid';
      leftTriangle.style.borderRightWidth = `${triangleWidth}px`;
      leftTriangle.style.borderRightColor = 'transparent';
      triangleBar.appendChild(leftTriangle);

      const rightTriangle = document.createElement('div');
      rightTriangle.className = 'top-right-triangle activity-limit';
      triangleBar.appendChild(rightTriangle);
      rightTriangle.style.display = 'inline-block';
      rightTriangle.style.float = 'right';
      rightTriangle.style.width = '0';
      rightTriangle.style.height = '0';
      rightTriangle.style.borderTopStyle = 'solid';
      rightTriangle.style.borderTopWidth = `${triangleWidth}px`;
      rightTriangle.style.borderLeftStyle = 'solid';
      rightTriangle.style.borderLeftWidth = `${triangleWidth}px`;
      rightTriangle.style.borderLeftColor = 'transparent';
      elt.appendChild(triangleBar);
    } else {
      elt.className = DEFAULT_ACTIVITY_CLASSNAME;
    }
    const selElt = document.createElement('div');
    selElt.className = SELECT_CONTENT_CLASSNAME;
    selElt.style.height = '100%';
    selElt.style.display = 'flex';
    selElt.style.justifyContent = 'space-between';
    selElt.style.alignItems = 'center';
    selElt.style.border = 'none';
    elt.appendChild(selElt);
    return elt;
  },

  drawRightContent(elt, icon, text, object) {
    const textCtnr = document.createElement('div');
    textCtnr.style.position = 'absolute';
    textCtnr.className = 'text-container right';
    textCtnr.style.left = '100%';
    textCtnr.style.top = '0';
    textCtnr.style.height = '100%';
    if (icon) {
      const img = document.createElement('img');
      img.className = 'image-content';
      img.src = icon;
      img.alt = '';
      textCtnr.appendChild(img);
    }
    elt.style.overflowX = 'visible';
    const t = document.createElement('span');
    t.className = 'text-content';
    t.innerHTML = text;
    textCtnr.appendChild(t);
    elt.appendChild(textCtnr);
    object.label = {
      getTextWidth() {
        return t.offsetWidth;
      },
      getTextHeight() {
        return t.offsetHeight;
      },
      move(left, dist) {
        Gantt.utils.toggleClass(textCtnr, 'left', left);
        textCtnr.style.marginLeft = 0; // Default one is for margin on text without links
        if (left) {
          textCtnr.style.left = `${-dist}px`;
          textCtnr.style.paddingLeft = 0;
        } else {
          textCtnr.style.left = '100%';
          textCtnr.style.paddingLeft = `${dist}px`;
        }
      },
    };
    return textCtnr;
  },

  getText(activity) {
    return activity.name;
  },

  getTooltipProperties(act) {
    const props = [
      Gantt.utils.getString('gantt.start'),
      new Date(act.start).format(),
      Gantt.utils.getString('gantt.end'),
      new Date(act.end).format(),
    ];
    if (act.id !== undefined) {
      props.push(Gantt.utils.getString('gantt.id'));
      props.push(act.id);
    }
    return props;
  },

  processConfiguration(selector, config) {
    this.defaultProcessConfiguration(selector, config);

    if (config.rowHeight) {
      this.addRowHeightConfiguration(selector, config.rowHeight);
    }

    if (config.generateRowDecorations) {
      this.addGenerateRowDecorations(selector, config.generateRowDecorations);
    }

    if (config.generateDecorations) {
      this.addGenerateDecorations(selector, config.generateDecorations);
    }
  },

  initialized(config) {
    const gantt = this.paletteHandler;
    this.defaultSetBackground = this.setBackground;
    this.drawDefaultContentSet = this.drawDefaultContent;
    this.ganttLoadListener = e => {
      if (gantt.isResourceGantt()) {
        this.drawDefaultContent = this.drawNoDisplayOverflowContent;
        this.setBackground = this.defaultSetBackground;
        this.drawDefaultContent = this.drawDefaultContentSet;
      } else {
        // TODO Don't put a setter in a get...
        this.setBackground = function(shapeElt, bg) {
          if (Gantt.utils.hasClass('parent-activity')) {
            shapeElt.querySelectorAll('.activity-limit').forEach(elt => {
              elt.style.borderColor = bg;
            });
            shapeElt.querySelector('parent-activity-bar').style.backgroundColor = bg;
          } else {
            this.drawDefaultContentSet(shapeElt, bg);
          }
        };
        this.drawDefaultContent = this.drawRightContent;
      }
    };
    gantt.on(Gantt.events.DATA_LOADED, this.ganttLoadListener);
  },

  destroy() {
    if (this.ganttLoadListener) {
      const gantt = this.paletteHandler;
      gantt.off(Gantt.events.DATA_LOADED, this.ganttLoadListener);
      this.ganttLoadListener = null;
    }
  },

  addRowHeightConfiguration(selector, config) {
    let rowHeight;
    if (typeof config === 'function') {
      rowHeight = config;
    } else if (typeof config === 'string') {
      const getter = Gantt.utils.propertyEvaluator(config);
      if (getter) {
        rowHeight = (object, ctx) => getter(object, ctx);
      }
    } else {
      rowHeight = () => config;
    }
    if (rowHeight) {
      const oldRowHeight = this.rowHeight;
      this.rowHeight = (object, ctx) => {
        if (!selector || selector(object)) {
          return rowHeight(object, ctx);
        }
        return oldRowHeight && oldRowHeight(object, ctx);
      };
    }
  },

  //
  // Decoration management
  //

  addGenerateRowDecorations(selector, config) {
    let generateRowDecorations;
    if (typeof config === 'function') {
      generateRowDecorations = config;
    } else if (typeof config === 'string') {
      const getter = Gantt.utils.propertyEvaluator(config);
      if (getter) {
        generateRowDecorations = (row, start, end, ctx) => getter(row, start, end, ctx);
      }
    } else {
      throw new Error('generateRowDecorations must be a function or an accessor to a row method');
    }
    if (generateRowDecorations) {
      const oldGenerateRowDecorations = this.generateRowDecorations;
      this.generateRowDecorations = (row, start, end, ctx) => {
        const decorations = (oldGenerateRowDecorations && oldGenerateRowDecorations(row, start, end, ctx)) || null;
        if (!selector || selector(row)) {
          const newDecos = generateRowDecorations(row, start, end, ctx);
          if (newDecos && newDecos.length) {
            return !decorations || !decorations.length ? newDecos : decorations.concat(newDecos);
          }
        }
        return decorations;
      };
    }
  },

  addGenerateDecorations(selector, config) {
    let generateDecorations;
    if (typeof config === 'function') {
      generateDecorations = config;
    } else {
      throw new Error('generateDecorations must be a function');
    }
    if (generateDecorations) {
      const oldGenerateDecorations = this.generateDecorations;
      this.generateDecorations = (start, end, ctx) => {
        const decorations = (oldGenerateDecorations && oldGenerateDecorations(start, end, ctx)) || null;
        if (!selector || selector(ctx)) {
          const newDecos = generateDecorations(start, end, ctx);
          if (newDecos && newDecos.length) {
            return !decorations || !decorations.length ? newDecos : decorations.concat(newDecos);
          }
        }
        return decorations;
      };
    }
  },
};

export default ActivityRendererPrototype;
