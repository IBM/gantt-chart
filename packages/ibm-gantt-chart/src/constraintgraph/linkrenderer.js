import Gantt from '../core/core';

const ID_DELIM = '_';
const CONSTRAINT_LINK_CLASS = 'constraint-link';
const CONSTRAINT_LINK_CTNR_CLASS = 'constraint-link-ctnr';
const STYLE_ARROW = 1;
const CONSTRAINT_ARROW = 'constraint-arrow';

class NodeLabelLayout {
  startLayout(act, ctx) {}

  getNodeToLabelSpacing(act, bbox, textWidth, ctx) {}
}

class DefaultNodeLabelLayout extends NodeLabelLayout {
  constructor(left) {
    super();
    this.left = left;
  }

  getNodeToLabelSpacing(act, bbox, textWidth, ctx) {
    return this.left ? -ctx.nodeToLinkPadding : ctx.nodeToLinkPadding;
  }
}

const LinkRendererPrototype = {
  drawLink(object, points, style, parentElt, ctx) {
    if (points.length < 2) return null;
    let lastX = points[0].x;
    let lastY = points[0].y;
    const nodes = [];
    const color = this.color ? this.color(object, ctx) : undefined;
    const css = this.getCSS && this.getCSS(object, ctx);
    const w = this.lineWidth && this.lineWidth(object, ctx);
    let i = 0;
    let line;
    let pt;
    let horiz;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      line = document.createElement('div');
      line.style.position = 'absolute';
      line.style.pointerEvents = 'auto';
      pt = points[++i];
      if (object && object.id) line.id = object.id + ID_DELIM + i;
      horiz = pt.y === lastY;
      line.className = `${CONSTRAINT_LINK_CLASS} ${horiz ? 'constraint-horiz-link' : 'constraint-vert-link'}`;

      if (this.linkOutlineWidth) {
        line.className = `${CONSTRAINT_LINK_CTNR_CLASS} ${horiz ? 'constraint-horiz-link' : 'constraint-vert-link'}`;
        if (horiz) {
          line.style.height = `${(w || 1) + this.linkOutlineWidth + this.linkOutlineWidth}px`;
          line.style.paddingTop = line.style.paddingBottom = `${this.linkOutlineWidth}px`;
          line.style.top = `${lastY - this.linkOutlineWidth}px`;
          line.style.left = `${Math.min(lastX, pt.x)}px`;
          line.style.width = `${Math.abs(lastX - pt.x) + (i && lastX > pt.x ? w || 1 : 0)}px`;
          if (css) line.className += ` ${css}`;

          const link = document.createElement('div');
          link.className = `${CONSTRAINT_LINK_CLASS} constraint-horiz-link`;
          if (w) link.style.height = `${w}px`;
          link.style.width = '100%';
          line.appendChild(link);
        } else {
          line.style.width = `${(w || 1) + this.linkOutlineWidth + this.linkOutlineWidth}px`;
          line.style.paddingLeft = line.style.paddingRight = `${this.linkOutlineWidth}px`;
          line.style.left = `${lastX - this.linkOutlineWidth}px`;
          line.style.top = `${Math.min(lastY, pt.y)}px`;
          line.style.height = `${Math.abs(lastY - pt.y)}px`;
          if (css) line.className += ` ${css}`;

          const link = document.createElement('div');
          link.className = `${CONSTRAINT_LINK_CLASS} constraint-vert-link`;
          if (w) link.style.width = `${w}px`;
          link.style.height = '100%';
          line.appendChild(link);
        }
      } else if (horiz) {
        if (w) line.style.height = `${w}px`;
        line.style.top = `${lastY}px`;
        line.style.left = `${Math.min(lastX, pt.x)}px`;
        line.style.width = `${Math.abs(lastX - pt.x) + (i && lastX > pt.x ? w || 1 : 0)}px`;
        if (css) line.className += ` ${css}`;
      } else {
        if (w) line.style.width = `${w}px`;
        line.style.left = `${lastX}px`;
        line.style.top = `${Math.min(lastY, pt.y)}px`;
        line.style.height = `${Math.abs(lastY - pt.y)}px`;
        if (css) line.className += ` ${css}`;
      }
      nodes.push(line);
      parentElt.appendChild(line);
      if (i === points.length - 1) {
        if (style === STYLE_ARROW) {
          if (horiz) {
            const arrowWidth = this.arrowWidth(object, ctx);
            const arrowHeight = this.arrowHeight(object, ctx);
            if (lastX < pt.x) {
              line = this.drawRightArrow(pt.x, lastY, arrowWidth, arrowHeight, color);
            } else {
              line = this.drawLeftArrow(pt.x, lastY, arrowWidth, arrowHeight, color);
            }
            line.style.pointerEvents = 'auto';
            if (css) line.className += ` ${css}`;
            if (object && object.id) line.id = `${object.id + ID_DELIM}arrow`;
            nodes.push(line);
            parentElt.appendChild(line);
          }
        }
        return nodes;
      }

      lastX = pt.x;
      lastY = pt.y;
    }
  },

  drawLeftArrow(x, y, arrowWidth, arrowHeight, color) {
    const node = document.createElement('div');
    node.style.position = 'absolute';
    node.className = `${CONSTRAINT_ARROW} constraint-left-arrow`;
    node.style.left = `${x}px`;
    node.style.top = `${y - (arrowHeight - 1)}px`;
    node.style.width = '0';
    node.style.height = '0';
    node.style.borderTop = `${arrowHeight}px solid transparent`;
    node.style.borderBottom = `${arrowHeight}px solid transparent`;
    node.style.borderRightWidth = `${arrowWidth}px`;
    node.style.borderRightStyle = 'solid';
    if (color) node.style.borderRightColor = color;
    return node;
  },

  drawRightArrow(x, y, arrowWidth, arrowHeight, color) {
    const node = document.createElement('div');
    node.style.position = 'absolute';
    node.className = `${CONSTRAINT_ARROW} constraint-right-arrow`;
    node.style.left = `${x - arrowWidth}px`;
    node.style.top = `${y - (arrowHeight - 1)}px`;
    node.style.width = '0';
    node.style.height = '0';
    node.style.borderTop = `${arrowHeight}px solid transparent`;
    node.style.borderBottom = `${arrowHeight}px solid transparent`;
    node.style.borderLeftWidth = `${arrowWidth}px`;
    node.style.borderLeftStyle = 'solid';
    if (color) node.style.borderLeftColor = color;
    return node;
  },

  arrowWidth() {
    return 5;
  },

  arrowHeight() {
    return 5;
  },

  getTooltipProperties(cons, ctx) {
    const getName = function(act) {
      return act.name || act.id;
    };
    const props = [
      Gantt.utils.getString('gantt.constraintChart.from'),
      getName(cons.from),
      Gantt.utils.getString('gantt.constraintChart.to'),
      getName(cons.to),
      Gantt.utils.getString('gantt.constraintChart.type'),
    ];
    let type;
    if (cons.type === Gantt.constraintTypes.START_TO_START)
      type = Gantt.utils.getString('gantt.constraintChart.start.start');
    else if (cons.type === Gantt.constraintTypes.START_TO_END)
      type = Gantt.utils.getString('gantt.constraintChart.start.end');
    else if (cons.type === Gantt.constraintTypes.END_TO_END)
      type = Gantt.utils.getString('gantt.constraintChart.end.end');
    else type = Gantt.utils.getString('gantt.constraintChart.end.start');
    props.push(type);
    return props;
  },

  processConfiguration(selector, config) {
    this.defaultProcessConfiguration(selector, config);

    if (config.lineWidth) {
      this.addLineWidthConfiguration(selector, config.lineWidth);
    }

    if (config.arrowWidth) {
      this.addArrowConfiguration(selector, config.arrowWidth, 'arrowWidth');
    }

    if (config.arrowHeight) {
      this.addArrowConfiguration(selector, config.arrowWidth, 'arrowHeight');
    }

    if (config.nodeLabelLayout) {
      this.addNodeLabelLayoutConfiguration(selector, config.nodeLabelLayout);
    }
  },

  setColor(elt, color) {
    elt.style.color = color;
  },

  destroy() {},

  addLineWidthConfiguration(selector, config) {
    let lineWidth;
    if (typeof config === 'function') {
      lineWidth = config;
    } else if (typeof config === 'string') {
      const getter = Gantt.utils.propertyEvaluator(config);
      if (getter) {
        lineWidth = (object, ctx) => getter(object, ctx);
      }
    } else {
      lineWidth = () => config;
    }
    if (lineWidth) {
      const oldLineWidth = this.lineWidth;
      this.lineWidth = (object, ctx) => {
        if (!selector || selector(object, ctx)) {
          return lineWidth(object, ctx);
        }
        return oldLineWidth && oldLineWidth(object, ctx);
      };
    }
  },

  addArrowConfiguration(selector, config, field) {
    let arrowSize;
    if (typeof config === 'function') {
      arrowSize = config;
    } else if (typeof config === 'string') {
      const getter = Gantt.utils.propertyEvaluator(config);
      if (getter) {
        arrowSize = (object, ctx) => getter(object, ctx);
      }
    } else {
      arrowSize = () => config;
    }
    if (arrowSize) {
      const oldArrowSize = this[field];
      this[field] = (object, ctx) => {
        if (!selector || selector(object, ctx)) {
          return arrowSize(object, ctx);
        }
        return oldArrowSize && oldArrowSize(object, ctx);
      };
    }
  },

  addNodeLabelLayoutConfiguration(selector, config) {
    let labelLayout;
    if (typeof config === 'string') {
      if (config === 'left' || config === 'LEFT') {
        labelLayout = new DefaultNodeLabelLayout(true);
      } else if (config === 'right' || config === 'RIGHT') {
        labelLayout = new DefaultNodeLabelLayout(false);
      }
    } else if (Gantt.utils.isFunction(config)) {
      labelLayout = new NodeLabelLayout();
      labelLayout.getNodeToLabelSpacing = config;
    } else {
      labelLayout = config;
    }
    if (labelLayout) {
      const oldGetLabelLayout = this.getLabelLayout;
      this.getLabelLayout = (object, ctx) => {
        if (!selector || selector(object, ctx)) {
          return labelLayout;
        }
        return oldGetLabelLayout && oldGetLabelLayout(object, ctx);
      };
    }
  },
};

export { LinkRendererPrototype, ID_DELIM, CONSTRAINT_LINK_CLASS, CONSTRAINT_LINK_CTNR_CLASS, CONSTRAINT_ARROW };
