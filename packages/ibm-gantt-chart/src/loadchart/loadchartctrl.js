import Gantt from '../core/core';

export default class LoadResourceChartCtrl {
  constructor(gantt, visible, config) {
    this.gantt = gantt;
    this.visible = visible;
    this.loadCharts = [];

    const selectionHandler = gantt.selection;
    const ctlr = this;
    selectionHandler.on(Gantt.events.ROW_SELECTION_CHANGED, (e, sels) => {
      // Selections array is sorted from the last selected object to the first.
      // To keep the same colors associated with the resources when changing
      // the selection (Ctrl + Click),
      // we need to reverse this order so that the first selected object remains always
      // at the same array index.
      ctlr.setResources(sels.concat([]).reverse());
    });
    selectionHandler.on(Gantt.events.ROW_UNSELECTED, (e, sels) => this.unselectRows(sels, this.visible));
    selectionHandler.on(Gantt.events.ROW_SELECTION_CLEARED, (e, sels) => this.unselectRows(sels, this.visible));

    this.layoutSynch = this.gantt.synchLayout({
      timeTableBoundsChanged(bounds) {
        ctlr.loadCharts.forEach(loadChart =>
          loadChart.setTimeLineBounds(ctlr.layoutSynch.convertBounds(bounds, loadChart.getTimeLineNode))
        );
      },
      timeWindowChanged(start, end) {
        ctlr.timeWindowChanged(start, end);
      },
      timeLineSizeChanged(width) {
        ctlr.loadCharts.forEach(loadChart => loadChart.setTimeLineWidth(width));
      },
      timeLineInitialized() {},
      timeLineScrolled(x) {
        ctlr.loadCharts.forEach(loadChart => loadChart.setTimeLineScrollLeft(x));
      },
    });
    this.setConfiguration(config);
  }

  setConfiguration(config) {
    const RendererClass = Gantt.components.Renderer.impl || Gantt.components.Renderer;
    this.resourceRenderer = new RendererClass(
      Gantt.utils.mergeObjects(
        {
          background: {
            getValue: res => this.resources.indexOf(res),
          },
        },
        config && config.renderer
      ),
      {},
      this.gantt
    );
  }

  getRowBackground(row) {
    return row.backgroundColor;
  }

  addLoadResourceChart(loadChart) {
    this.loadCharts.push(loadChart);
    loadChart.setResourceRenderer(this.resourceRenderer);
  }

  addChildResources(resources, a) {
    for (let i = 0, res; i < resources.length; i++) {
      res = resources[i];
      a.push(res);
      if (res.children) {
        this.addChildResources(res.children, a);
      }
    }
    return a;
  }

  setVisible(visible) {
    if (this.visible !== visible) {
      this.visible = visible;
      this.loadCharts.forEach(loadChart => loadChart.setVisible(visible));
      if (this.visible) {
        if (this.savedTimeW) {
          const { start, end } = this.savedTimeW;
          delete this.savedTimeW;
          this.setTimeWindow(start, end, () => {
            if (this.resources && this.resources.length) {
              this.setResources(this.resources); // Forces a row redraw
            }
          });
        } else if (this.resources && this.resources.length) {
          this.setResources(this.resources); // Forces a row redraw
        }
        if (this.savedScrollLeft) {
          const left = this.savedScrollLeft;
          delete this.savedScrollLeft;
          this.setScrollLeft(left);
        }
      } else if (this.resources && this.resources.length) {
        this.unselectRows(this.resources, true);
      }
    }
  }

  isVisible() {
    return this.visible;
  }

  timeWindowChanged(start, end) {
    if (!this.visible) {
      this.savedTimeW = { start, end };
    } else {
      this.setTimeWindow(start, end);
    }
  }

  setTimeWindow(start, end, onInit) {
    this.loadCharts.forEach(loadChart => loadChart.setTimeWindow(start, end, onInit));
  }

  timeTableXScrolled(left) {
    if (!this.visible) {
      this.savedScrollLeft = left;
    } else this.setScrollLeft(left);
  }

  setScrollLeft(left) {
    this.loadCharts.forEach(loadChart => loadChart.setScrollLeft(left));
  }

  setResources(resources) {
    const allRes = this.addChildResources(resources, []);
    this.resources = allRes;
    if (this.visible) {
      for (let i = 0, count = allRes.length, res; i < count; i++) {
        res = allRes[i];
        res.backgroundColor = this.visible && this.resourceRenderer.background(res);
      }
      this.gantt.drawRows(this.resources);
      this.loadCharts.forEach(loadChart => {
        loadChart.setResources(allRes);
        loadChart.draw();
      });
    }
  }

  unselectRows(rows, redraw) {
    const all = [];
    const unselectDeep = ar => {
      ar.forEach(row => {
        all.push(row);
        row.backgroundColor = undefined;
        if (row.children) {
          unselectDeep(row.children);
        }
      });
    };
    unselectDeep(rows);
    if (redraw) {
      this.gantt.drawRows(all);
    }
  }

  destroy() {
    if (this.layoutSynch) {
      this.layoutSynch.disconnect();
      this.layoutSynch = null;
    }
  }
}
