import $ from 'jquery';

import Gantt from '../../core/core';
import ColumnRendererPrototype from './columnrenderer';
import RowRendererPrototype from './rowrenderer';
import TreeTableController from './treetablecontroller';

import './datatables.scss';

const HIGHLIGHT_CLASS = 'highlight';
const SELECTION_CLASS = 'selected';
const FLAT_CLASS = 'tree-table-flat';

const NUMBER_COLUMN_NAME = 'rowNumbers';
const HIERARCHY_COLUMN_NAME = 'hierarchy';

const TREE_NODE_TYPE = 'tree-node';

const defaultDataTableOptions = {
  /* serverSide: true, */
  /*
     searching: false, */
  bInfo: false,
  paging: false,
  scrollY: '100%',
  scrollX: true,
  rowId: 'id',
};

function getDefaultTableColumns() {
  return [
    {
      name: NUMBER_COLUMN_NAME,
      data: null,
      title: '',
      render: (data, type, full, meta) => {
        const color = full.backgroundColor ? ` style="background-color: ${full.backgroundColor}` : '';
        return `<div class="row-number"${color}>${meta.row + 1}</div>`;
      },
      /* "width": "40px", */
      className: 'row-number-col',
      orderable: false,
      searchable: false,
    },
    {
      name: HIERARCHY_COLUMN_NAME,
      data: null,
      title: Gantt.utils.getString('gantt.name', 'Name'),
    },
  ];
}

const findColumn = (columns, name) => {
  for (let iCol = 0, count = columns ? columns.length : 0; iCol < count; iCol++) {
    if (columns[iCol].name === name) {
      return columns[iCol];
    }
  }
  return null;
};

export default class GanttDataTable extends Gantt.components.TreeTable {
  constructor(gantt, node, config) {
    super(gantt, node, config);
    this.gantt = gantt;
    const selectionHandler = this.gantt.selection;
    selectionHandler.on(Gantt.events.ROW_SELECTION_CLEARED, () => this.clearSelection());
    selectionHandler.on(Gantt.events.ROW_SELECTED, (e, sels) => this.selectRows(sels));
    selectionHandler.on(Gantt.events.ROW_UNSELECTED, (e, sels) => this.unselectRows(sels));
    selectionHandler.on(Gantt.events.ROW_SELECTION_CHANGED, (e, sels) => this.rowSelectionChanged(sels));
    this.setConfiguration(config);
  }

  setConfiguration(config) {
    this.config = config;

    if (this.$dataTable) {
      this.destroy();
    }

    const defaultConfig = Gantt.utils.mergeObjects({}, defaultDataTableOptions, {
      language: {
        emptyTable: Gantt.utils.getString('gantt.datatables.empty-table'),
      },
    });
    defaultConfig.columns = getDefaultTableColumns(); // Instead of doing a deep copy of the defaultDataTableOptions
    this.dataTableOptions = Gantt.utils.mergeObjects(defaultConfig, config && config.dataTables);

    let rowRenderer;
    if (config && config.rows && config.rows.renderer) {
      rowRenderer = new (Gantt.components.Renderer.impl || Gantt.components.Renderer)(
        config.rows.renderer,
        RowRendererPrototype,
        this.gantt
      );
    }
    if (config && config.columns && config.columns.length) {
      const defaultColumns = {};
      this.dataTableOptions.columns = this.dataTableOptions.columns.filter(col => {
        // Remove default columns if defined - maybe with a different order - in config.columns
        if (col.name) {
          defaultColumns[col.name] = col;
        }
        return !col.name || !findColumn(config.columns, col.name);
      });

      for (let iCol = 0, configCol, col; iCol < config.columns.length; iCol++) {
        configCol = config.columns[iCol];
        col = this.customizeDataColumn(
          (configCol.name && defaultColumns[configCol.name]) || {},
          configCol,
          rowRenderer
        );
        if (col) {
          this.dataTableOptions.columns.push(col);
        }
      }

      // if default columns not in the specified config.columns, add them back in the columns unless explicitely removed
      const removedCols = {};
      this.dataTableOptions.columns = this.dataTableOptions.columns.filter(col => {
        if (col.remove && col.name) {
          removedCols[col.name] = true;
          return false;
        }
        return true;
      });

      if (!findColumn(this.dataTableOptions.columns, HIERARCHY_COLUMN_NAME) && !removedCols[HIERARCHY_COLUMN_NAME]) {
        this.dataTableOptions.columns.splice(0, 0, findColumn(defaultColumns[HIERARCHY_COLUMN_NAME]));
      }
      if (!findColumn(this.dataTableOptions.columns, NUMBER_COLUMN_NAME) && !removedCols[NUMBER_COLUMN_NAME]) {
        this.dataTableOptions.columns.splice(0, 0, findColumn(defaultColumns[NUMBER_COLUMN_NAME]));
      }
    } else if (rowRenderer) {
      for (let iCol = 0, configCol; iCol < this.dataTableOptions.columns.length; iCol++) {
        configCol = this.dataTableOptions.columns[iCol];
        this.dataTableOptions.columns[iCol] = this.customizeDataColumn(configCol, {}, rowRenderer);
      }
    }

    if (config && config.sorting !== undefined && !config.sorting) {
      this.dataTableOptions.columns.bSort = false;
    } else if (!config || !config.initialSorting) {
      this.dataTableOptions.order = [];
    }

    this.controller = new TreeTableController();
    this.controller.rowsVisibilityChanged = (visible, rows, rowRef) => {
      this.gantt.startUpdating();
      this.triggerEvent(visible ? Gantt.events.ROWS_ADDED : Gantt.events.ROWS_REMOVED, rows, rowRef);
      this.gantt.updates.rowsChanged(visible ? Gantt.events.ROWS_ADDED : Gantt.events.ROWS_REMOVED, rows, rowRef);
      this.gantt.stopUpdating();
    };
    this.controller.customizeOptions(
      this.dataTableOptions,
      findColumn(this.dataTableOptions.columns, HIERARCHY_COLUMN_NAME),
      rowRenderer
    );

    this.dataTableOptions.rowId = 'id';

    const oldInitComplete = this.dataTableOptions.initComplete;
    this.dataTableOptions.initComplete = (oSettings, json) => {
      if (oldInitComplete) {
        oldInitComplete(oSettings, json);
      }
    };
    const oldDrawCallback = this.dataTableOptions.drawCallback;
    this._drawCallbacks = [];
    this.dataTableOptions.drawCallback = settings => {
      if (oldDrawCallback) {
        oldDrawCallback.call(this, settings);
      }
      for (let i = 0; i < this._drawCallbacks.length; i++) {
        this._drawCallbacks[i](settings);
      }
      this._drawCallbacks = [];
    };
    this.create();
  }

  customizeDataColumn(col, config, rowRenderer) {
    if (config.name) {
      col.name = config.name;
    }
    if (config.title) {
      col.title = config.title;
    }
    if (config.width) {
      col.width = config.width;
    }
    if (config.visible) {
      col.visible = config.visible;
    }
    if (config.className) {
      col.className = config.className;
    }
    if (config.remove) {
      // Not a dataTables field but pre-processed by this class
      col.remove = config.remove;
    }
    if (config.data || config.text) {
      const c = config.data || config.text;
      if (typeof c === 'function') {
        col.data = c;
      } else if (typeof c === 'string') {
        const getter = Gantt.utils.propertyEvaluator(c);
        if (getter) {
          col.data = function(object) {
            return getter(object);
          };
        }
      }
    }

    if (config.renderer || config.sortComparator || config.sortValue || config.filterValue || rowRenderer) {
      const colRenderer = config.renderer
        ? new (Gantt.components.Renderer.impl || Gantt.components.Renderer)(
            config.renderer,
            ColumnRendererPrototype,
            this.gantt
          )
        : null;
      if (config.sortValue || config.sortComparator || (colRenderer && colRenderer.getText)) {
        col.type = TREE_NODE_TYPE;
        let sortValue;
        if (config.sortValue) {
          if (Gantt.utils.isFunction(config.sortValue)) {
            sortValue = function(obj) {
              return config.sortValue.call(config, obj);
            };
          } else if (Gantt.utils.isString(config.sortValue)) {
            sortValue = Gantt.utils.propertyEvaluator(config.sortValue);
          } else {
            console.warn('sortValue column config should be a function or a string');
          }
        }
        if (!sortValue && !config.sortComparator && colRenderer && colRenderer.getText) {
          sortValue = function(obj) {
            return colRenderer.getText(obj);
          };
        }
        col.render = {};
        col.render.sort = (node, type, full) => {
          const obj = Object.create(full);
          if (sortValue) {
            obj.getSortValue = sortValue;
          }
          if (config.sortComparator) {
            obj.comparator = function(a, b) {
              return config.sortComparator.call(config, a, b);
            };
          }
          return obj;
        };
      } else {
        col.orderable = false;
      }
      if (config.filterValue) {
        if (!col.render) {
          col.render = {};
        }
        if (Gantt.utils.isFunction(config.filterValue)) {
          col.render.filter = function(node, type, full) {
            return config.filterValue.call(config, full);
          };
        } else if (Gantt.utils.isString(config.filterValue)) {
          const filterValue = Gantt.utils.propertyEvaluator(config.filterValue);
          col.render.filter = function(node, type, full) {
            return filterValue(full);
          };
        } else {
          console.warn('filterValue column config should be a function or a string');
        }
      }
      if (colRenderer) {
        if (!col.render) {
          col.render = {};
        }
        if (colRenderer && colRenderer.getText) {
          // Value used for sorting or filtering if not sort/filter config specified.
          col.render._ = function(node, type, full) {
            return colRenderer.getText(full);
          };
        }
        col.render.display = (node, type, full, meta) => {
          let result = '';
          let icon = colRenderer.getIcon && colRenderer.getIcon(node, meta);
          if (icon) {
            icon = Gantt.utils.isArray(icon) ? icon : [icon];
            for (let iIcon = 0; iIcon < icon.length; iIcon++) {
              result += `<img src='${icon[iIcon]}' alt='' class='text-icon'>`;
            }
          }
          const text = colRenderer.getText && colRenderer.getText(node, meta);
          if (text) {
            result += `<span>${text}</span>`;
          }
          return result;
        };
      }
      // https://datatables.net/reference/option/columns.createdCell
      const ctx = {};
      if (rowRenderer) {
        if (colRenderer) {
          col.createdCell = (cell, cellData, rowData) => {
            colRenderer.draw(rowData, cell, ctx);
          };
        } else {
          col.createdCell = (cell, cellData, rowData) => {
            rowRenderer.draw(rowData, cell, ctx);
          };
        }
      } else if (colRenderer) {
        col.createdCell = (cell, cellData, rowData) => {
          colRenderer.draw(rowData, cell, ctx);
        };
      }
    }
    if (!col.data) {
      col.data = null;
    }
    return col;
  }

  setRowFilter(filter) {
    this.filter = filter;
  }

  create() {}

  setRows(rows) {
    this.rows = rows;
    if (this.tableElt) {
      this.destroy();
    }

    this.tableElt = document.createElement('table');
    this.tableElt.className = Gantt.components.TreeTable.defaultClass;
    this.tableElt.setAttribute('aria-label', Gantt.utils.getString('gantt.columns'));
    this.tableElt.tabIndex = 0;
    this.tableElt.cellSpacing = 0;
    // this.tableElt.style.width = '100%';

    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    tr.tabIndex = 0;

    // Scan columns definitions
    const { columns } = this.dataTableOptions;
    for (let i = 0, th; i < columns.length; i++) {
      th = document.createElement('th');
      th.scope = 'col';
      th.innerHTML =
        (columns[i].key && Gantt.utils.getString(columns[i].key, columns[i].title)) ||
        columns[i].title ||
        columns[i].data ||
        `Col${i + 1}`;
      tr.appendChild(th);
    }
    thead.appendChild(tr);
    this.tableElt.appendChild(thead);

    this.node.appendChild(this.tableElt);

    let initResolver;
    const initPms = new Promise((resolver, reject) => {
      initResolver = resolver;
    });

    const $tableElt = $(this.tableElt);
    this.tableBody = null;
    if (this.headerHeight > 0) {
      this.headerHeight = -this.headerHeight;
    }
    this.$dataTable = $tableElt
      .on('init.dt', () => {
        this.tableInitialized();

        if (this.headerHeight < 0) {
          this.setHeaderHeight(-this.headerHeight);
        }
        this.triggerEvent(Gantt.events.TABLE_INIT);
        initResolver(rows);
        this.dataTableOptions.data = null;
      })
      .DataTable(Gantt.utils.mergeObjects({}, this.dataTableOptions, { data: rows }));
    this.$dataTable.on('draw.dt', () => {
      $(thead)
        .children('tr')
        .removeAttr('role'); // No role: https://www.w3.org/TR/html-aria/#tr
    });
    // https://datatables.net/examples/api/counter_columns.html
    const hasNumberColumn = findColumn(this.dataTableOptions.columns, NUMBER_COLUMN_NAME);
    this.$dataTable
      .on('order.dt search.dt', e => {
        if (hasNumberColumn) {
          this.$dataTable
            .column(`${NUMBER_COLUMN_NAME}:name`, { search: 'applied', order: 'applied' })
            .nodes()
            .each((cell, i) => {
              cell.innerHTML = i + 1;
            });
        }
      })
      .draw('full-hold');

    const allSettings = this.$dataTable.settings();
    for (let i = 0; i < allSettings.length; i++) {
      // Retrieve the GanttDataTable from the global search function
      allSettings[i].ganttDataTable = this;
    }
    const body = this.getScrollableBody(this.tableElt);
    this.controller.install(this.$dataTable, body);
    /* Impossilbe to use the code below as an alternative of re-creating the table for each setRows
            The code below does not set ids to tr rows and the workaround for doing that is too costly.
            this.$dataTable.rows.add(rows).draw();
            * */

    /*  Manage selection  */
    $(body).on('click', 'tr', e => {
      const tr = $(e.target).closest('tr');
      const row = tr && tr.length && this.getRow(tr[0]);
      if (row) {
        this.gantt.highlightRow(row, true, true);
        this.gantt.selection.processClick(e, row);
      }
    });
    $(body).on('mouseenter', 'tr', e => {
      const tr = $(e.target).closest('tr');
      const row = tr && tr.length && this.getRow(tr[0]);
      if (row) {
        this.gantt.highlightRow(row, true, true);
      }
    });
    $(body).on('mouseleave', 'tr', e => {
      const tr = $(e.target).closest('tr');
      const row = tr && tr.length && this.getRow(tr[0]);
      this.gantt.highlightRow(null, true, true);
    });
    return initPms;
  }

  tableInitialized() {
    $(this.node).toggleClass(FLAT_CLASS, this.gantt.isFlat());
    this.$scrollableBody = $(this.node).find('div.dataTables_scrollBody');
    this.scrollableBody = this.$scrollableBody[0];
    this.tableBody = this.$scrollableBody.find('TBODY')[0];

    this.scrollableBody.overflowX = 'scroll';
    this.scrollableBody.overflowY = 'hidden';
    this.scrollableBody.style.position = 'absolute';
    this.scrollableBody.style.right = 0;
    this.scrollableBody.style.left = 0;
    this.scrollableBody.style.bottom = 0;
    this.scrollableBody.style.width = null;
    this.scrollableBody.style.height = null;

    const $scrollableHead = $(this.node).find('div.dataTables_scrollHead THEAD');
    this.tableHeader = $scrollableHead[0];
    const table = this;
    $scrollableHead.find('th').click(function() {
      if (
        Gantt.utils.hasClass(this, 'sorting') ||
        Gantt.utils.hasClass(this, 'sorting_asc') ||
        Gantt.utils.hasClass(this, 'sorting_desc')
      ) {
        table.gantt.startUpdating();
        table.gantt.updates.rowsChanged(Gantt.events.ROWS_SORTED);
        table.gantt.updates.tableScrollYChanged(); // When sorting, datatable automatically restore scrolly position to 0
        table.triggerEvent(Gantt.events.ROWS_SORTED);
        table.gantt.stopUpdating();
      }
    });
  }

  onDraw(fct) {
    this._drawCallbacks.push(fct);
  }

  createUpdates(parent) {
    const updates = new (Gantt.components.GanttUpdates.impl || Gantt.components.GanttUpdates)(parent, {
      doApplyUpdates: () => {
        if (updates.isReload()) {
          this.$dataTable.draw();
        } else if (updates.containsRowChanges) {
          this.$dataTable.draw('full-hold');
        }
      },
    });
    return updates;
  }

  getScrollableBody() {
    return this.getTableBody();
  }

  setHeaderHeight(height) {
    if (this.tableHeader) {
      this.headerHeight = height;
      let scrollHeadHeight;
      if (!height) {
        scrollHeadHeight = $(this.tableHeader).height();
      } else {
        scrollHeadHeight = height;
        const tds = Gantt.utils.getChild(this.tableHeader, 'TR').childNodes;
        for (let i = 0, count = tds.length; i < count; ++i) {
          $(tds.item(i)).css({ height: `${height}px` });
        }
        this.tableHeader.parentNode.height = `${height}px`;
      }
      // Horrible hack to Datatable issue for fitting its parent div
      // https://datatables.net/forums/discussion/12187/datatable-fixed-height
      this.scrollableBody.style.top = `${scrollHeadHeight}px`;
      const panelHeight = $(this.node).height();
      this.$scrollableBody.height(panelHeight - scrollHeadHeight);
      // this.getScrollableBody().style.top = scrollHeadHeight + 'px';
    }
    // Table not initialized yet
    else {
      // Store it for when the table is initialized
      this.headerHeight = -height;
    }
  }

  getScrollableTable() {
    return this.scrollableBody;
  }

  getTableBody() {
    return this.tableBody;
  }

  getHeight() {
    return this.tableBody ? this.tableBody.offsetHeight : 0;
  }

  getRowCount() {
    return this.$dataTable.data().length;
  }

  createRowResult(tr, index) {
    const { id } = tr;
    const node = ((id || id === 0) && this.rows && this.rows.byIds[id]) || null;
    if (node) {
      node.tr = tr;
      if (index !== undefined) {
        node.index = index;
      }
    }
    return node;
  }

  getRow(param) {
    let id;
    let row;
    if (param && param.isGanttRow) {
      row = param;
      id = param.id;
    } else if (typeof param === 'string' || (param && param.id)) {
      id = param.id || param;
      row = this.rows && this.rows.byIds && id && this.rows.byIds[id];
    } else if (Gantt.utils.isInteger(param)) {
      row = this.rows && this.rows[param];
      id = row && row.id;
    }
    if (row && !row.tr && id) {
      row.tr = param.nodeType ? param : document.getElementById(id);
    }
    return row;
  }

  getRows(selector) {
    if (!selector) {
      // Return all rows
      return this.rows;
    }
    if (Gantt.utils.isArray(selector)) {
      return selector.map(row => this.getRow(row));
    }
    return this.getRow(selector);
  }

  getVisibleRows() {
    if (!this.$dataTable) return [];
    const trs = this.$dataTable.$('tr', { filter: 'applied' });
    const count = trs.length;
    const result = new Array(count);
    for (let i = 0, row; i < count; ++i) {
      row = trs[i];
      row = row.length ? row[0] : row;
      row = this.rows && this.rows.byIds[row.id];
      result[i] = row;
    }
    return result;
  }

  getRowAt(y, startingRow) {
    // TODO code below seems to be quicker but does not work as is as getBoundingClientRect().top does not
    // return the coordinate relative to the direct parent
    /* var rowHeight = this.getRowHeight();
         var rowNum = y / rowHeight;
         var row = this.getRowAtIndex(Math.floor(y / rowHeight));

         if (!row && !(row = this.nextRow(null))) {
         return null;
         }
         var rect = row.tr.getBoundingClientRect();
         if (y >= rect.top) {
         while (y >= rect.bottom) {
         row = this.nextRow(row);
         if (!row) {
         return null;
         }
         rect = row.tr.getBoundingClientRect()
         }
         }
         else {
         while (y < rect.top) {
         row = this.prevRow(row);
         if (!row) {
         return null;
         }
         rect = row.tr.getBoundingClientRect();
         }
         }
         return row; */
    // Alternative slower option, only using element.offsetHeight
    let tr;
    let index;
    if (startingRow && startingRow.getData() && (tr = startingRow.tr)) {
      index = startingRow.index;
      let top = this.getRowTop(startingRow);
      if (top <= y) {
        y -= top;
        while (tr && y > tr.offsetHeight) {
          y -= tr.offsetHeight;
          tr = tr.nextSibling;
          index++;
        }
      } else {
        do {
          tr = tr.previousSibling;
          --index;
        } while (tr && y < (top -= tr.offsetHeight));
      }
      if (tr && startingRow.tr === tr) {
        return startingRow;
      }
    } else {
      index = 0;
      const row = this.nextRow(null);
      tr = row && row.tr;
      while (tr && y >= tr.offsetHeight) {
        y -= tr.offsetHeight;
        tr = tr.nextSibling;
        ++index;
      }
    }
    return tr && this.createRowResult(tr, index);
  }

  // noinspection JSUnusedGlobalSymbols
  getRowAtIndex(index) {
    const body = this.getTableBody();
    if (body) {
      let tr = Gantt.utils.getChild(body, 'TR');
      const origIndex = index;
      while (index-- && tr) {
        tr = tr.nextSibling;
      }
      return (tr && this.createRowResult(tr, origIndex)) || null;
    }
    return null;
  }

  getRowTop(row) {
    return (
      ((row.tr || (row.tr = document.getElementById(row.id))) && row.tr.offsetTop - this.getTableBody().offsetTop) || 0
    );
  }

  nextRow(row) {
    if (!row) {
      const tr = this.getTableBody() && this.getTableBody().firstChild;
      return (tr && this.createRowResult(tr, 0)) || null;
    }
    const nextTr = row.tr.nextSibling;
    return (nextTr && this.createRowResult(nextTr, row.index + 1)) || null;
  }

  // noinspection JSUnusedGlobalSymbols
  prevRow(row) {
    if (!row) {
      const tr = this.getTableBody() && this.getTableBody().lastChild;
      return (tr && this.createRowResult(tr, this.getTableBody().childElementCount)) || null;
    }
    const prevTr = row.tr.previousSibling;
    return (prevTr && this.createRowResult(prevTr, row.index - 1)) || null;
  }

  setRowHeight(row, height) {
    if (!row.defaultHeight) {
      row.defaultHeight = row.tr.offsetHeight;
    }
    if (height !== row.defaultHeight) {
      $(row.tr)
        .css({ height: `${height}px` })
        .addClass('variable-row-height');
    } else {
      $(row.tr).css({ height: 'inherit' });
    }
  }

  getRowHeight(row, height) {
    // return $(row.tr).offsetHeight;
    if (!row.tr) row.tr = document.getElementById(row.id);
    const r = row.tr.getBoundingClientRect();
    return r.height;
    // return row.tr.getBoundingClientRect().height;
    // return $(row.tr || (row.tr = document.getElementById(row.id))).height();
  }

  deleteDrawCache() {
    if (this.rows) {
      for (let i = 0, count = this.rows.length; i < count; ++i) {
        delete this.rows[i].activityRow;
      }
    }
    this.$dataTable &&
      this.$dataTable
        .$('tr.variable-row-height')
        .css({ height: 'inherit' })
        .removeClass('variable-row-height');
  }

  expandParents(row) {
    row = this.getRow(row);
    if (row) {
      this.controller.expandParents(`${row.id}`); // In case row.id is a num
    }
  }

  getFirstVisibleRow() {
    const yTop = this.getScrollableTable().scrollTop;
    return this.getRowAt(yTop);
  }

  isRowVisible(param) {
    const row = this.getRow(param);
    if (this.isRowFiltered(row)) {
      return false;
    }
    let { parent } = row;
    while (parent) {
      if (this.controller.isCollapsedNode(parent.id)) {
        return false;
      }
      parent = parent.parent;
    }
    return true;
  }

  toggleCollapseRow(param, collapse) {
    const row = this.getRow(param);
    if (!row || this.isRowFiltered(row)) {
      return false;
    }
    if (collapse === undefined) {
      collapse = !this.controller.isCollapsedNode(row.id);
    }
    this.controller.collapseNode(row.id, collapse);
  }

  highlightRow(row, highlight, deselectAll) {
    const { utils } = Gantt;
    if (deselectAll) {
      const result = this.getTableBody().querySelectorAll(`tr.${HIGHLIGHT_CLASS}`);
      for (let i = 0; i < result.length; i++) {
        utils.removeClass(result[i], HIGHLIGHT_CLASS);
      }
    }
    if (row && row.tr) {
      utils.toggleClass(row.tr, HIGHLIGHT_CLASS, highlight === undefined || highlight);
    } else if (row) {
      $(this.getTableBody())
        .find(`#${row.id || row}`)
        .toggleClass(HIGHLIGHT_CLASS, highlight === undefined || highlight);
    }
  }

  draw(forceTableReload) {
    if (forceTableReload) {
      this.$dataTable.draw();
    } else {
      this.$dataTable.draw('full-hold');
    }
  }

  drawRows(rows) {
    // this.$dataTable.rows(rows.map(row => row.tr)).invalidate().draw();
    rows.forEach(element => {
      const data = this.$dataTable.row(element.tr).data();
      element.tr.style.backgroundColor = data.backgroundColor || '';
    });
    // this.$dataTable.row(0).invalidate().draw();
    // this.$dataTable.rows(rows.map(row => row.tr)).invalidate('dom').draw();
  }

  onResize() {
    if (this.$dataTable) this.$dataTable.draw('full-hold');
  }

  filterChanged() {
    if (this.$dataTable) this.$dataTable.draw('full-hold');
  }

  isRowFiltered(row) {
    return row.__filterMatched !== undefined && !row.__filterMatched;
  }

  setRowColor(row, color) {}

  destroy() {
    if (this.$dataTable) {
      this.$dataTable.destroy(); // https://datatables.net/reference/api/destroy()
      if (this.tableElt.parentNode === this.node) {
        this.node.removeChild(this.tableElt);
      }
      this.$dataTable = null;
      this.tableElt = null;
      this.tableBody = null;
      this.$scrollableBody = null;
      this.tableHeader = null;
    }
  }

  /*  Selection methods  */
  clearSelection() {
    if (this.$dataTable) {
      this.$dataTable.$(`tr.${SELECTION_CLASS}`).removeClass(SELECTION_CLASS);
    }
  }

  selectRows(rows) {
    for (let i = 0, tr; i < rows.length; i++) {
      tr = rows[i].tr || this.getRow(rows[i]).tr;
      if (tr) {
        Gantt.utils.addClass(tr, SELECTION_CLASS);
        /* const tds = tr.querySelectorAll('td');
                 for (let i = 0; i < tds.length; i++) {
                 Gantt.utils.addClass(tds[i], SELECTION_CLASS);
                 } */
      }
    }
  }

  unselectRows(rows) {
    for (let i = 0, tr; i < rows.length; i++) {
      tr = rows[i].tr || this.getRow(rows[i]).tr;
      if (tr) {
        Gantt.utils.removeClass(tr, SELECTION_CLASS);
      }
    }
  }

  rowSelectionChanged() {
    if (this.$dataTable) {
      this.$dataTable.draw('full-hold');
    }
  }
}

Gantt.components.TreeTable.defaultClass = 'gantt-tree-table display nowrap';

Gantt.components.TreeTable.impl = GanttDataTable;
