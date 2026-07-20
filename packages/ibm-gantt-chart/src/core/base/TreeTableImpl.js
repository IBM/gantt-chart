import TreeTable from './TreeTable';
import Gantt from '../core';

const ROW_ID_PREFIX = 'row_';

export default class TreeTableImpl extends TreeTable {
  constructor(gantt, node, config) {
    super(gantt, node, config);
    this.gantt = gantt;
    this.rowsByIds = {};
    this.rows = [];
    this.collapsedRows = [];
    this.rowFilter = null;
    this.setConfiguration(config);
    const syncSelection = () => this.syncSelectionClasses();
    gantt.selection.on(Gantt.events.ROW_SELECTED, syncSelection);
    gantt.selection.on(Gantt.events.ROW_UNSELECTED, syncSelection);
    gantt.selection.on(Gantt.events.ROW_SELECTION_CLEARED, syncSelection);
    gantt.selection.on(Gantt.events.ROW_SELECTION_CHANGED, syncSelection);
  }

  setConfiguration(config) {
    this.config = config;
  }

  setRows(rows) {
    this.rows = rows;
    this.rowsByIds = (rows && rows.byIds) || {};

    // Clear existing table
    while (this.node.firstChild) {
      this.node.removeChild(this.node.firstChild);
    }

    // Create table element
    const tableElt = document.createElement('table');
    tableElt.className = 'gantt-tree-table dataTables_scrollHead';
    tableElt.style.width = '100%';
    tableElt.style.height = '100%';

    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const columns = [{ title: 'Name', renderer: { text: 'name' } }, ...(this.config?.columns || [])];
    columns.forEach((column) => {
      const th = document.createElement('th');
      th.textContent = column.title || '';
      th.style.padding = '10px';
      th.style.backgroundColor = '#4CAF50';
      th.style.color = 'white';
      if (column.sortComparator) {
        th.addEventListener('click', () => this.sortRows(column));
      }
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    tableElt.appendChild(thead);

    // Create body
    this.tableBody = document.createElement('tbody');
    this.tableBody.className = 'dataTables_scrollBody';
    this.tableBody.style.display = 'block';
    this.tableBody.style.overflowY = 'auto';
    this.tableBody.style.overflowX = 'auto';
    this.tableBody.style.position = 'absolute';
    this.tableBody.style.left = '0';
    this.tableBody.style.right = '0';
    this.tableBody.style.bottom = '0';
    this.tableBody.style.top = '40px';

    // Add rows
    if (rows && rows.length) {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        row.index = i;
        const tr = document.createElement('tr');
        tr.id = row.id;
        tr.style.display = 'block';
        tr.style.padding = '5px';
        tr.style.height = `${this.config?.rowHeight || 32}px`;
        if (i % 2) {
          tr.style.backgroundColor = '#f2f2f2';
        }

        columns.forEach((column, columnIndex) => {
          const td = document.createElement('td');
          td.style.verticalAlign = 'middle';
          if (columnIndex === 0) {
            const indent = document.createElement('div');
            indent.className = 'hierarchy-control';
            indent.style.display = 'inline-block';
            indent.style.width = `${(row.getAncestorsCount ? row.getAncestorsCount() + 1 : 1) * 16}px`;
            td.appendChild(indent);
          }
          const field = column.renderer?.text || 'name';
          const value = typeof field === 'function' ? field(row) : row[field];
          td.appendChild(document.createTextNode(value ?? ''));
          tr.appendChild(td);
        });
        row.tr = tr;
        this.tableBody.appendChild(tr);
      }
    }

    tableElt.appendChild(this.tableBody);
    this.node.appendChild(tableElt);

    // Setup click handlers
    const self = this;
    this.tableBody.addEventListener('click', (e) => {
      const tr = e.target.closest('tr');
      if (tr) {
        const row = self.getRow(tr.id);
        if (row) {
          if (self.gantt.selectionHandler) {
            self.gantt.selectionHandler.processClick(e, row);
          }
        }
      }
    });
  }

  getRow(param) {
    if (typeof param === 'string' && param.startsWith(ROW_ID_PREFIX)) {
      const id = param.substring(ROW_ID_PREFIX.length);
      return this.rowsByIds[id];
    }
    if (param && param.id) {
      return this.rowsByIds[param.id];
    }
    if (typeof param === 'string') {
      return this.rowsByIds[param];
    }
    return this.rows && this.rows[param];
  }

  getRowCount() {
    return this.rows ? this.rows.length : 0;
  }

  getTableBody() {
    return this.tableBody;
  }

  getScrollableTable() {
    return this.tableBody;
  }

  getScrollableBody() {
    return this.tableBody;
  }

  getRows() {
    return this.rows || [];
  }

  getVisibleRows() {
    return (this.rows || []).filter((row) => !this.isRowFiltered(row) && !this.isRowCollapsed(row));
  }

  getFirstVisibleRow() {
    const visibleRows = this.getVisibleRows();
    const top = this.tableBody?.scrollTop || 0;
    return visibleRows[Math.min(Math.floor(top / this.getDefaultRowHeight()), visibleRows.length - 1)] || null;
  }

  getHeight() {
    return this.getVisibleRows().length * this.getDefaultRowHeight();
  }

  nextRow(row) {
    const rows = this.getVisibleRows();
    return rows[rows.indexOf(row) + 1] || null;
  }

  prevRow(row) {
    const rows = this.getVisibleRows();
    return rows[rows.indexOf(row) - 1] || null;
  }

  getRowAt(y) {
    const rows = this.getVisibleRows();
    return rows[Math.max(0, Math.floor(y / this.getDefaultRowHeight()))] || null;
  }

  getRowTop(row) {
    if (!row || !this.tableBody) return 0;
    const index = this.getVisibleRows().indexOf(row);
    const rowHeight = this.getDefaultRowHeight();
    return (index + 1) * rowHeight <= this.getViewportHeight() ? 0 : index * rowHeight;
  }

  draw() {
    // No-op for basic implementation
  }

  drawRows() {
    // No-op for basic implementation
  }

  deleteDrawCache() {
    // No-op for basic implementation
  }

  isRowVisible(param) {
    const row = this.getRow(param);
    return !!row && !this.isRowFiltered(row) && !this.isRowCollapsed(row);
  }

  filterChanged() {
    (this.rows || []).forEach((row) => {
      if (!row.tr) return;
      const hiddenByCollapse = this.isRowCollapsed(row);
      if (hiddenByCollapse) {
        row.tr.remove();
      } else {
        row.tr.style.display = this.isRowFiltered(row) ? 'none' : 'block';
        this.tableBody.appendChild(row.tr);
      }
    });
  }

  setRowFilter(filter) {
    this.rowFilter = filter;
  }

  isRowFiltered(row) {
    if (!row || !this.rowFilter || this.rowFilter.isEmpty()) return false;
    const accepts = (candidate) =>
      this.rowFilter.accept(candidate, [candidate.name ?? '', candidate.id ?? ''], this.rows.indexOf(candidate));
    if (accepts(row)) return false;
    return !(this.rows || []).some((candidate) => {
      let parent = candidate.parent;
      while (parent) {
        if (parent === row || parent.id === row.id) return accepts(candidate);
        parent = parent.parent;
      }
      return false;
    });
  }

  toggleCollapseRow(row, collapse) {
    if (!row) return;
    const index = this.collapsedRows.indexOf(row.id);
    const shouldCollapse = collapse === undefined ? index < 0 : collapse;
    if (shouldCollapse && index < 0) this.collapsedRows.push(row.id);
    if (!shouldCollapse && index >= 0) this.collapsedRows.splice(index, 1);
    this.filterChanged();
  }

  setHeaderHeight(height) {
    if (this.tableBody && height) {
      this.tableBody.style.top = `${height}px`;
    }
  }

  highlightRow(row, highlight) {
    if (row && row.tr) {
      if (highlight) {
        row.tr.classList.add('selected');
      } else {
        row.tr.classList.remove('selected');
      }
    }
  }

  syncSelectionClasses() {
    (this.rows || []).forEach((row) => row.tr?.classList.toggle('selected', !!row.selected));
  }

  expandParents(row) {
    let parent = this.getParent(row);
    while (parent) {
      const index = this.collapsedRows.indexOf(parent.id);
      if (index >= 0) this.collapsedRows.splice(index, 1);
      parent = this.getParent(parent);
    }
    this.filterChanged();
  }

  getDefaultRowHeight() {
    const row = this.tableBody?.firstElementChild;
    return row?.offsetHeight || 32;
  }

  getRowHeight(row) {
    return (
      Number.parseFloat(row?.tr?.style.height) ||
      row?.tr?.offsetHeight ||
      this.config?.rowHeight ||
      this.getDefaultRowHeight()
    );
  }

  setRowHeight(row, height) {
    if (row?.tr) row.tr.style.height = `${height}px`;
  }

  getViewportHeight() {
    let element = this.node;
    while (element) {
      const height = Number.parseFloat(element.style?.height);
      if (height > 100) return height;
      element = element.parentElement;
    }
    return 320;
  }

  getParent(row) {
    if (!row?.parent) return null;
    return typeof row.parent === 'object' ? row.parent : this.rowsByIds[row.parent];
  }

  isRowCollapsed(row) {
    let parent = this.getParent(row);
    while (parent) {
      if (this.collapsedRows.includes(parent.id)) return true;
      parent = this.getParent(parent);
    }
    return false;
  }

  sortRows(column) {
    const direction = column.__sortDirection === 'asc' ? 'desc' : 'asc';
    column.__sortDirection = direction;
    const comparator = column.sortComparator;
    const ordered = [];
    const appendFamily = (parent) => {
      const children = (this.rows || []).filter((row) => row.parent === parent || row.parent?.id === parent?.id);
      children.sort((a, b) => (direction === 'asc' ? comparator(a, b) : comparator(b, a)));
      children.forEach((child) => {
        ordered.push(child);
        appendFamily(child);
      });
    };
    const roots = (this.rows || []).filter((row) => !row.parent);
    roots.forEach((root) => {
      ordered.push(root);
      appendFamily(root);
    });
    if (ordered.length !== this.rows.length) return;
    this.rows = Object.assign(ordered, { byIds: this.rowsByIds });
    ordered.forEach((row, index) => {
      row.index = index;
      this.tableBody.appendChild(row.tr);
    });
    this.gantt.drawTimeTable?.(true);
  }

  destroy() {
    if (this.tableBody && this.tableBody.parentNode) {
      this.tableBody.parentNode.removeChild(this.tableBody);
    }
    while (this.node.firstChild) {
      this.node.removeChild(this.node.firstChild);
    }
  }
}
