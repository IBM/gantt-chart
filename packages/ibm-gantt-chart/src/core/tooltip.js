import Gantt from './core';

import './tooltip.scss';

const ARROW_STYLE = 'gantt-tooltip-arrow';
const BOTTOM_ARROW_STYLE = 'bottom-arrow';
const TOP_ARROW_STYLE = 'top-arrow';

class Tooltip extends Gantt.components.Tooltip {
  constructor(options) {
    super(options);
    this._tooltip = document.createElement('div');
    this._tooltip.className = 'gantt-tooltip';
    this._tooltip.style.position = 'fixed';
    this._tooltip.style.visibility = 'hidden';

    // Cannot have the arrow defined in CSS as the arrow position on the tooltip varies.
    this._tooltipArrow = document.createElement('div');
    this._tooltipArrow.style.position = 'absolute';
    this._tooltipArrow.style.width = '0';
    this._tooltipArrow.style.height = '0';
    this._arrowHeight = 5;
    this._tooltip.appendChild(this._tooltipArrow);
    document.body.appendChild(this._tooltip);

    Gantt.utils.addEventListener(
      this._tooltip,
      'mouseenter',
      evt => {
        if (this._hideTimer !== undefined) {
          clearTimeout(this._hideTimer);
          this._hideTimer = null;
          this._hidingElt = null;
        }
      },
      true
    ); // Capturing!
    Gantt.utils.addEventListener(
      this._tooltip,
      'mouseleave',
      evt => {
        if (evt.target === this._tooltip) {
          this.hideTooltip(300);
        }
      },
      true
    ); // Capturing!*/
  }

  showTooltip(elt, ctx, cb) {
    if (elt === this._tooltipElt) return;
    if (this._hideTimer !== undefined) {
      clearTimeout(this._hideTimer);
      delete this._hideTimer;
      const hidingElt = this._hidingElt;
      this._hidingElt = null;
      if (hidingElt === elt) {
        return;
      }
    }
    // tooltip associated with same data is already showing.
    if (this._showTimer !== undefined) {
      if (this._tooltipElt === elt) {
        // tooltip associated with same data is about to show, do nothing
        return;
      }
      clearTimeout(this._showTimer);
      delete this._showTimer;
      this._tooltipElt = null;
    }
    this._tooltip.innerHTML = '';
    if (arguments.length === 2) {
      cb = ctx;
      ctx = null;
    }
    cb(this._tooltip);
    this._tooltip.style.visibility = 'hidden';
    this._tooltip.style.left = this._tooltip.style.top = 0; // If tooltip is a the right/bottom of the page, its processed sized can be cut, before display
    this._tooltip.style.maxHeight = 'none';
    const tooltipHeight = this._tooltip.offsetHeight + this._arrowHeight;

    const eltScreenPt = Gantt.utils.getScreenPoint(elt);

    // Process the limit bounds in which to display the tooltip
    let limits;
    if (ctx && ctx.limitElt) {
      const bounds = ctx.limitElt.getBoundingClientRect();
      const scrollLeft = Gantt.utils.getWindowScrollLeft();
      const scrollTop = Gantt.utils.getWindowScrollTop();
      limits = {
        x: Math.max(bounds.left + scrollLeft + (bounds.left < 0 ? bounds.lef : 0), 0),
        y: Math.max(bounds.top + scrollTop + (bounds.left < 0 ? bounds.lef : 0), 0),
      };
      // limits = Gantt.utils.getScreenPoint(ctx.limitElt);
      limits.width =
        Math.min(document.documentElement.clientWidth, bounds.right + scrollLeft) - Math.max(bounds.left, 0);
      limits.height =
        Math.min(document.documentElement.clientHeight, bounds.bottom + scrollTop) - Math.max(bounds.top, 0);
    } else {
      limits = { x: 0, y: 0, width: document.body.offsetWidth, height: document.body.offsetHeight };
    }

    // Display the tooltip at the top or the bottom of the specified element?
    // Prefer top
    let topAvailHeight;
    let bottomAvailHeight;
    let arrowStyle;
    let arrowPos;
    if (eltScreenPt.y - tooltipHeight >= limits.y) {
      eltScreenPt.y -= tooltipHeight;
      this._tooltip.style.maxHeight = 'none';
      arrowStyle = BOTTOM_ARROW_STYLE;
    }
    // Otherwise, if displaying the tooltip at the bottom works, go for it
    else if (eltScreenPt.y + tooltipHeight + elt.offsetHeight <= limits.y + limits.height) {
      eltScreenPt.y += elt.offsetHeight + this._arrowHeight;
      this._tooltip.style.maxHeight = 'none';
      arrowStyle = TOP_ARROW_STYLE;
    }
    // Otherwise, display on top if more space available on top
    else if (
      (topAvailHeight = eltScreenPt.y - limits.y) >
      (bottomAvailHeight = limits.y + limits.height - eltScreenPt.y - elt.offsetHeight)
    ) {
      eltScreenPt.y = limits.y;
      this._tooltip.style.maxHeight = `${topAvailHeight - this._arrowHeight}px`;
      arrowStyle = BOTTOM_ARROW_STYLE;
    }
    // Display at the bottom
    else {
      eltScreenPt.y += elt.offsetHeight + this._arrowHeight;
      this._tooltip.style.maxHeight = `${bottomAvailHeight - this._arrowHeight}px`;
      arrowStyle = TOP_ARROW_STYLE;
    }

    // Adjust horizontal position
    function adjustHorizontally(x, limitLeft, limitRight) {
      return Math.max(Math.min(x, limitRight), limitLeft);
    }
    const arrowMargin = 10; // Arrow cannot start at the left or right border of the tooltip because of the round border of the tooltip. Suggesting 10px as the minimum space from the tooltip border
    arrowPos = eltScreenPt.x + elt.offsetWidth / 2; // Ideal x screen position of the arrow
    if (limits.width <= this._tooltip.offsetWidth) {
      eltScreenPt.x = limits.x;
      this._tooltip.style.maxWidth = `${limits.width}px`;
    } else {
      eltScreenPt.x = adjustHorizontally(
        eltScreenPt.x + elt.offsetWidth / 2 - this._tooltip.offsetWidth / 2,
        limits.x,
        limits.x + limits.width - this._tooltip.offsetWidth
      );
      this._tooltip.style.maxWidth = 'none';
    }
    arrowPos = adjustHorizontally(arrowPos - eltScreenPt.x, arrowMargin, this._tooltip.offsetWidth - arrowMargin);
    this.setArrowPosition(arrowStyle, arrowPos);
    this._tooltip.appendChild(this._tooltipArrow); // Previously removed with innerHTML = '';
    this._tooltip.style.top = `${eltScreenPt.y}px`;
    this._tooltip.style.left = `${eltScreenPt.x}px`;
    this._tooltipElt = elt;
    if (ctx && ctx.showDelay) {
      this._showTimer = setTimeout(() => {
        delete this._showTimer;
        this._tooltip.style.visibility = 'visible';
      }, ctx.showDelay);
    } else {
      this._tooltip.style.visibility = 'visible';
    }
  }

  setArrowPosition(style, pos) {
    this._tooltipArrow.className = `${ARROW_STYLE} ${style}`;
    if (style === TOP_ARROW_STYLE) {
      // this._tooltipArrow.style.top = 0;
      this._tooltipArrow.style.left = `${pos}px`;
    } else if (style === BOTTOM_ARROW_STYLE) {
      // this._tooltipArrow.style.top = '100%';
      this._tooltipArrow.style.left = `${pos}px`;
    }
  }

  hideTooltip(millis, cb) {
    if (this._showTimer !== undefined) {
      clearTimeout(this._showTimer);
      this._tooltipElt = null;
      delete this._showTimer;
      // If about to show a tooltip, no tooltip to hide.
      return;
    }
    // If no tooltip shown, nothing to hide
    if (!this._tooltipElt) return;
    if (millis) {
      if (this._hideTimer) {
        return;
      }
      this._hideCB = cb;
      this._hidingElt = this._tooltipElt;
      this._hideTimer = setTimeout(() => {
        this._hideTimer = null;
        this._hidingElt = null;
        this._tooltipElt = null;
        if (this._hideCB) {
          this._hideCB();
        }
        this._hideCB = null;
        this._tooltip.style.display = 'none';
      }, millis);
    } else {
      if (cb) {
        cb();
      }
      this._tooltipElt = null;
      this._tooltip.style.display = 'none';
    }
  }

  installTooltip(config) {
    const TOOLTIP_FADING_TIME = 1000;
    const TOOLTIP_SHOWING_DELAY = 800;

    Gantt.utils.addEventListener(
      config.container,
      'mouseenter',
      evt => {
        // console.log('Enter ' + printElement(evt.target) + ', relatedTarget: ' + (evt.relatedTarget && printElement(evt.relatedTarget) || 'none'));
        const tooltipNode = config.getTooltipElement(evt.target);
        if (tooltipNode) {
          const tooltipData = config.getTooltipData && config.getTooltipData(tooltipNode);
          if (config.enteringTooltipElement && config.enteringTooltipElement(tooltipNode, tooltipData) === false) {
            // During a drag n drop for example.
            return;
          }
          const ctx = {
            limitElt: (config.getTooltipDisplayContainer && config.getTooltipDisplayContainer()) || document.body,
            showDelay: TOOLTIP_SHOWING_DELAY,
          };
          // console.log('   show tooltip: ' + tooltipNode);
          this.showTooltip(tooltipNode, ctx, parent => {
            config.renderTooltip(tooltipNode, tooltipData, parent);
          });
        } else {
          this.hideTooltip(TOOLTIP_FADING_TIME);
        }
      },
      true
    );
    Gantt.utils.addEventListener(
      config.container,
      'mouseleave',
      evt => {
        // console.log('Leave ' + printElement(evt.target) + ', relatedTarget: ' + (evt.relatedTarget && printElement(evt.relatedTarget) || 'none'));
        const tooltipNode = config.getTooltipElement(evt.target);
        if (tooltipNode) {
          if (this._tooltipElt === tooltipNode) {
            const tooltipData = config.getTooltipData && config.getTooltipData(tooltipNode);
            if (config.leavingTooltipElement && config.leavingTooltipElement(tooltipNode, tooltipData) === false) {
              // To leave displayed the tooltip after leaving the element we show the tooltip for.
              return;
            }
            if (evt.relatedTarget && config.getTooltipElement(evt.relatedTarget) === tooltipNode) {
              // If the element the mouse is moving in is still in the tooltip node, do nothing.
              return;
            }
          }
          // Otherwise hide the tooltip
          this.hideTooltip(TOOLTIP_FADING_TIME);
        }
      },
      true
    );
  }
}

Gantt.components.Tooltip.impl = Tooltip;

function printElement(elt) {
  return (
    elt.tagName +
    (elt.id ? `#${elt.id}` : '') +
    (elt.className && elt.className.replace ? `.${elt.className.replace(/ /g, '.')}` : '')
  );
}
