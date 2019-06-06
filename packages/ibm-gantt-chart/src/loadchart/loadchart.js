import vis from 'vis';

import Gantt from '../core/core';

import { Block, RESOURCE_LOAD_CLASS } from './block';

import './loadchart.scss';

const CHART_TOP_MARGIN = 8;

function ResNode(resource, activity, load, maxLoad) {
  this.resource = resource;
  this.activity = activity;
  this.load = load;
  this.maxLoad = maxLoad;
}

ResNode.prototype.toString = function() {
  return this.resource.name + ' - ' + this.activity.name;
};

class LoadResourceChart extends Gantt.components.LoadResourceChart {
  setConfiguration(config) {
    if (config.classes) {
      Gantt.utils.addClass(this.node, config.classes);
    }

    this.header = document.createElement('div');
    this.header.className = 'load-resource-chart-header';
    if (config.header) {
      let headerContent;
      if (Gantt.utils.isFunction(config.header)) {
        headerContent = config.header(this.header);
      } else if (Gantt.utils.isDomElement(config.header)) {
        headerContent = config.header;
      } else {
        headerContent = document.createElement('h3');
        headerContent.appendChild(document.createTextNode(config.header));
      }
      if (headerContent) {
        this.header.appendChild(headerContent);
      }
    }
    this.node.appendChild(this.header);
    this.body = document.createElement('div');
    this.body.className = 'load-resource-chart-body';
    this.body.style.position = 'relative';
    if (config.height) {
      if (Gantt.utils.isFunction(config.height)) {
        this.body.style.height = config.height() + 'px';
      } else if (Gantt.utils.isString(config.height)) {
        this.body.style.height = config.height;
      } else {
        this.body.style.height = config.height + 'px';
      }
    } else {
      this.body.style.height = '100%';
    }
    this.node.appendChild(this.body);

    this.leftPanel = document.createElement('div');
    this.leftPanel.className = 'load-resource-chart-left';
    this.leftPanel.style.position = 'absolute';
    this.leftPanel.style.left = '0';
    this.leftPanel.style.top = '0';
    this.leftPanel.style.bottom = '0';
    this.legendPanel = document.createElement('div');
    this.legendPanel.className = 'legend-panel empty-legend';
    this.legendPanel.style.position = 'absolute';
    this.legendPanel.style.bottom = '0';
    this.legendPanel.style.overflowY = 'auto';
    this.leftPanel.appendChild(this.legendPanel);

    // Create Y-Axis panel
    this.yAxisPanel = document.createElement('div');
    this.yAxisPanel.className = 'y-axis-ctnr';
    this.yAxisPanel.style.position = 'absolute';
    this.yAxisPanel.style.right = 0;
    this.yAxisPanel.style.top = '0';
    this.yAxis = document.createElement('div');
    this.yAxis.className =
      'y-axis' + (config && config.yAxis && config.yAxis.className ? ' ' + config.yAxis.className : '');
    this.yAxis.style.position = 'absolute';
    this.yAxis.style.overflow = 'visible';
    this.yAxis.style.right = 0;
    this.yAxis.style.top = '0';
    this.yAxisPanel.appendChild(this.yAxis);
    this.leftPanel.appendChild(this.yAxisPanel);

    this.body.appendChild(this.leftPanel);

    this.timeLineScrollerElt = document.createElement('div');
    this.timeLineScrollerElt.className = 'load-resource-chart-scroller';
    this.timeLineScrollerElt.style.position = 'absolute';
    this.timeLineScrollerElt.style.top = '0';
    this.timeLineScrollerElt.style.bottom = '0';
    this.timeLineScrollerElt.style.right = '0';
    this.timeLineScrollerElt.style.overflow = 'hidden';
    this.body.appendChild(this.timeLineScrollerElt);

    this.noSelectionElt = document.createElement('div');
    this.noSelectionElt.className = 'no-selection';
    this.noSelectionElt.style.position = 'absolute';
    this.noSelectionElt.style.left = '0';
    this.noSelectionElt.style.top = '0';
    this.noSelectionElt.style.bottom = '0';
    this.noSelectionElt.style.right = '0';
    this.noSelectionElt.style.overflow = 'hidden';
    this.noSelectionElt.style.display = 'flex';
    this.noSelectionElt.style.alignItems = 'center';
    this.noSelectionElt.style.justifyContent = 'center';
    this.noSelectionElt.style.zIndex = '1';
    const noSelMsg = document.createElement('div');
    noSelMsg.className = 'no-selection-message';
    noSelMsg.appendChild(document.createTextNode(Gantt.utils.getString('gantt.loadResourceChart.noSelection.title')));
    this.noSelectionElt.appendChild(noSelMsg);
    this.body.appendChild(this.noSelectionElt);

    function createGetter(config) {
      if (Gantt.utils.isFunction(config)) {
        return config;
      }
      if (Gantt.utils.isString(config)) {
        return Gantt.utils.propertyEvaluator(config);
      }
      return function() {
        return config;
      };
    }

    this.resourceMaxLoad = config.maxLoad && createGetter(config.maxLoad);
    this.resourceActivityLoad =
      (config.load && createGetter(config.load)) ||
      function() {
        return 1;
      };

    const loadChart = this;
    const RendererClass = Gantt.components.Renderer.impl || Gantt.components.Renderer;
    this.chartRenderer = new RendererClass(
      {},
      {
        background(res) {
          return loadChart.resourceRenderer.background(res);
        },
        getTooltipProperties(info) {
          const props = ['Resource', info.resourceName, 'Activity', info.activityName, 'Load', info.resourceLoad];
          if (info.resourceMaxLoad) {
            props.push('Maximum load', info.resourceMaxLoad);
          }
          return props;
        },
      },
      this.gantt
    );

    this.initTooltips();
  }

  setVisible(visible) {}

  setTimeLineBounds(bounds) {
    this.timeLineScrollerElt.style.left = bounds.x + 'px';
    this.timeLineScrollerElt.style.width = bounds.width + 'px';
    this.leftPanel.style.width = bounds.x + 'px';

    if (this.timeLineElt) {
      this.updatePlottingArea();
      this.drawCharts();
    }
  }

  setTimeLineWidth(w) {
    if (this.timeLineElt) {
      this.timeLineElt.style.width = w + 'px';
    }
  }

  setTimeLineScrollLeft(left) {
    this.timeLineScrollerElt.scrollLeft = left;
  }

  getTimeLineNode() {
    return this.timeLineScrollerElt;
  }

  setTimeWindow(start, end, onInit) {
    if (this.timeLineElt) {
      this.timeLineScrollerElt.removeChild(this.timeLineElt);
    }
    this.timeLineElt = document.createElement('div');
    this.timeLineElt.style.width = this.gantt.timeLine.getWidth() + 'px';
    this.timeLineElt.style.height = '100%';

    try {
      // See https://github.com/almende/vis/issues/24 for time zone hack
      this.visTimeline = new vis.Timeline(
        this.timeLineElt,
        {},
        {
          // 'millisecond', 'second', 'minute', 'hour', 'weekday', 'day', 'month', 'year'
          orientation: { axis: 'bottom', item: 'bottom' },
          height: '100%',
          start: this.gantt.timeLine.scrollableHorizon.start,
          end: this.gantt.timeLine.scrollableHorizon.end,
        }
      );
      this.visTimeline.range.body.emitter.off('mousewheel');
      const fireReady = () => {
        this.visTimeline.off('changed', fireReady);
        this.timeScaleElt = this.timeLineElt.getElementsByClassName('vis-panel vis-bottom')[0];
        const style = window.getComputedStyle(this.timeScaleElt);
        let bottom = style.bottom;
        bottom = bottom ? Number.parseInt(bottom, 10) : 0;
        if (Number.isNaN(bottom)) {
          bottom = 0;
        }
        let topBorder = style.borderTopWidth;
        topBorder = topBorder ? Number.parseInt(topBorder, 10) : 0;
        this.timeScaleHeight = $(this.timeScaleElt).outerHeight() + bottom - topBorder; // visjs set a -2px bottom
        this.updatePlottingArea();
        this.triggerEvent(Gantt.events.TIME_LINE_INIT);
        if (onInit) {
          onInit();
        }
      };
      this.visTimeline.on('changed', fireReady);
    } catch (e) {
      console.error(e);
      throw e;
    }
    this.timeLineScrollerElt.appendChild(this.timeLineElt);
  }

  setScrollLeft(left) {
    this.getScroller().scrollLeft = left;
  }

  setResources(resources) {
    this.resources = resources;
  }

  setResourceRenderer(resRenderer) {
    this.resourceRenderer = resRenderer;
  }

  destroy() {}

  draw() {
    if (this.visTimeline) {
      this.noSelectionElt.style.display = this.resources && this.resources.length ? 'none' : 'flex';
      this.updateLegend();
      this.drawCharts();
    }
  }

  unselectRows(rows) {
    rows.forEach(row => (row.backgroundColor = undefined));
  }

  drawCharts() {
    const firstBlock = new Block(0, 0);
    let maxLoad;
    let load;
    (this.resources || []).forEach(res => {
      (res.activities || []).forEach(act => {
        load = this.resourceActivityLoad(res, act);
        maxLoad = this.resourceMaxLoad && this.resourceMaxLoad(res, act);
        firstBlock.insert(act.start, act.end, new ResNode(res, act, load, maxLoad));
      });
    });
    const max = firstBlock.computeMax(this.resourceMaxLoad && this.resources.length === 1);
    this.setYAxisMax(max);
    const items = [];
    let item;
    const ctx = {
      max,
      useMaxLoad: this.resourceMaxLoad && this.resources.length === 1,
      chartRenderer: this.chartRenderer,
      plotAreaHeight: this.plotAreaHeight - CHART_TOP_MARGIN,
      yRatio: this.yRatio,
    };
    for (let block = firstBlock.next; block; block = block.next) {
      item = block.createVisItem(ctx);
      if (item) {
        items.push(item);
      }
    }
    this.visTimeline.setItems(items);
  }

  updateLegend() {
    if (this.legend) {
      this.legendPanel.removeChild(this.legend);
    }
    const hasRes = this.resources && this.resources.length;
    Gantt.utils.toggleClass(this.legendPanel, 'empty-legend', !hasRes);
    this.legendPanel.style.overflowY = 'auto';
    if (this.resources) {
      this.legend = document.createElement('ul');
      this.legend.className = 'legend';
      let li;
      let colorBox;
      let name;
      let res;
      for (let i = 0, count = this.resources.length; i < count; i++) {
        res = this.resources[i];
        li = document.createElement('li');
        li.className = 'legend-item';
        li.style.display = 'table';
        colorBox = document.createElement('div');
        colorBox.className = 'legend-item-color';
        colorBox.style.display = 'table-cell';
        colorBox.style.verticalAlign = 'middle';
        colorBox.style.backgroundColor = res.backgroundColor;
        li.appendChild(colorBox);

        name = document.createElement('div');
        name.className = 'legend-item-name';
        name.style.display = 'table-cell';
        name.style.verticalAlign = 'middle';
        name.innerHTML = res.name;
        li.appendChild(name);
        this.legend.appendChild(li);
      }
      this.legendPanel.appendChild(this.legend);
    }
  }

  setYAxisMax(max) {
    let tickCount;
    let tickUnit;
    this.yAxis.innerHTML = '';

    if (!max) return;
    // Calc the best tick units
    function closest10Factor(n) {
      let f = 10;
      while (n > f) {
        f *= 10;
      }
      return f;
    }

    const MAX_TICK_COUNT = 5;
    if (max <= MAX_TICK_COUNT) {
      tickUnit = 1;
      tickCount = max;
    } else {
      // Due to the small height of the axis, we can draw a maximum of 5 axis labels
      // Determine the best unit to use for a number of labels from 2 to 5
      max = closest10Factor(max);
      tickCount = MAX_TICK_COUNT;
      tickUnit = Math.round(max / tickCount);
    }
    const totalHeight = this.plotAreaHeight - CHART_TOP_MARGIN;
    this.yRatio = Math.round(totalHeight / max);

    // Create the Y Axis labels
    for (let iTick = 0, v = 0, h = tickUnit * this.yRatio; iTick <= tickCount; iTick++, v += tickUnit) {
      // <= MAX_TICK_COUNT because first tick is zero
      const label = this.createLabelledTick('' + v, h);
      label.style.top = this.plotAreaHeight - v * this.yRatio - h / 2 - 2 + 'px'; // -2 for the height of the tick border
      label.style.right = '0';
      this.yAxis.appendChild(label);
    }
  }

  createLabelledTick(label, height) {
    const labelDiv = document.createElement('div');
    labelDiv.className = 'y-axis-label';
    labelDiv.style.position = 'absolute';
    labelDiv.style.height = height + 'px';
    labelDiv.style.lineHeight = height + 'px';
    labelDiv.style.textAlign = 'center';
    labelDiv.style.whiteSpace = 'nowrap';
    labelDiv.appendChild(document.createTextNode(label));
    const tick = document.createElement('div');
    tick.style.display = 'inline-block';
    tick.style.position = 'absolute';
    tick.style.top = height / 2 + 'px';
    tick.style.right = '0';
    tick.className = 'y-axis-tick';
    labelDiv.appendChild(tick);
    return labelDiv;
  }

  updatePlottingArea() {
    // Cannot use native offsetHeight as it is rounding dimensions
    // See warning at https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetHeight
    this.setPlottingAreaHeight($(this.body).outerHeight() - this.timeScaleHeight);
  }

  setPlottingAreaHeight(h) {
    this.yAxis.style.height = h + 'px';
    this.plotAreaHeight = h;
  }

  getScroller() {
    return this.timeLineScrollerElt;
  }

  //
  // Tooltips
  //
  initTooltips() {
    const isResourceLoadNode = elt => Gantt.utils.hasClass(elt, RESOURCE_LOAD_CLASS);
    const getResourceLoadNode = elt => {
      for (; elt && elt !== this.body; elt = elt.parentNode) {
        if (isResourceLoadNode(elt)) {
          return elt;
        }
      }
      return null;
    };
    const getResource = id => id && this.gantt.table.getRow(id);
    const gantt = this.gantt;
    const loadchart = this;
    this.gantt.tooltip.installTooltip({
      // The container that contains elements to display tooltip for.
      container: this.body,
      // The container inside which bounds the tooltip can be displayed
      getTooltipDisplayContainer() {
        return gantt.getBody();
      },
      // Returns an element in the node hierarchy for which a tooltip can be displayed
      getTooltipElement(node) {
        return getResourceLoadNode(node);
      },
      getTooltipData(node) {
        return {
          resourceName: node.dataset.resName,
          resourceLoad: node.dataset.resLoad,
          resourceMaxLoad: node.dataset.resMaxLoad,
          activityName: node.dataset.actName,
        };
      },
      renderTooltip(
        node /* The element returned by getTooltipElement */,
        info /* data returned by getTooltipData for the specified tooltipElt */,
        tooltipCtnr /* The container of the tooltip to fill with info. */
      ) {
        if (info) {
          loadchart.chartRenderer.getTooltip(tooltipCtnr, info);
        }
      },
    });
  }
}

Gantt.components.LoadResourceChart.impl = LoadResourceChart;

export default LoadResourceChart;
