function installDummyTable(Gantt) {
  const ROW_ID_PREFIX = 'row_';

  if (Gantt.components.TreeTable.impl.toString().indexOf('DummyTreeTable') > -1) {
    return;
  }
  function DummyTreeTable(gantt, node, options) {
    Gantt.components.TreeTable.call(this, gantt, node, options);
    const tableElt = document.createElement('table');
    tableElt.style.height = '100%';
    tableElt.style.width = '100%';
    tableElt.style.position = 'relative';
    tableElt.style.borderSpacing = '0';
    const header = (this.headerElt = document.createElement('thead'));
    header.style.background = 'lightgrey';
    header.style.padding = '0';
    header.style.margin = '0';
    header.style.backgroundColor = '#4CAF50';
    header.style.color = 'white';
    const tr = document.createElement('tr');
    this.ths = [];
    const td = document.createElement('th');
    td.appendChild(document.createTextNode('Name'));
    tr.appendChild(td);
    this.ths.push(td);
    tr.appendChild(td);
    header.appendChild(tr);
    tableElt.appendChild(header);

    this.scrollableTable = document.createElement('div');
    this.scrollableTable.className = 'scrollable-table-body';
    this.scrollableTable.style.overflowX = 'scroll';
    this.scrollableTable.style.overflowY = 'hidden';
    this.scrollableTable.style.position = 'absolute';
    this.scrollableTable.style.left = 0;
    this.scrollableTable.style.right = 0;
    this.scrollableTable.style.bottom = 0;
    this.body = document.createElement('tbody');
    this.body.style.display = 'block';
    this.body.style.position = 'relative';

    this.scrollableTable.appendChild(this.body);
    tableElt.appendChild(this.scrollableTable);
    node.appendChild(tableElt);
    this.tableElt = tableElt;

    this.collapsedRows = [];
  }

  DummyTreeTable.prototype = Object.create(Gantt.components.TreeTable.prototype);
  DummyTreeTable.prototype.constructor = DummyTreeTable;

  DummyTreeTable.prototype.getHeight = function() {
    return this.body.offsetHeight;
  };
  DummyTreeTable.prototype.setHeaderHeight = function(height) {
    this.ths.forEach(function(th) {
      th.style.height = `${height}px`;
    });
    this.scrollableTable.style.top = `${height}px`;
  };

  DummyTreeTable.prototype.setRows = function(rows) {
    const parent = this.body.parentNode;
    this.rowsByIds = rows.byIds;
    parent.removeChild(this.body);
    this.body.innerHTML = ''; // Empty the table rows
    this.trByIds = {};
    let tr;
    let td;
    for (var i = 0, len = rows.length, row, inc; i < len; ++i) {
      row = rows[i];
      tr = document.createElement('tr');
      row.tr = tr;
      tr.setAttribute('id', ROW_ID_PREFIX + row.id);
      tr.style.display = 'block';
      this.trByIds[row.id] = tr;
      if (i % 2) {
        tr.style.background = '#f2f2f2';
      }
      td = document.createElement('td');
      td.style.verticalAlign = 'middle';
      td.style.display = 'block';
      td.style.padding = '4px 0';
      inc = document.createElement('div');
      inc.style.display = 'inline-block';
      inc.style.width = `${(row.getAncestorsCount() + 1) * 16}px`;
      inc.style.height = '16px';
      if (row.children && row.children.length) {
        inc.style.background = `url("/assets/images/${
          this.collapsedRows.indexOf(row.id) >= 0 ? 'collapsed.png' : 'expanded.png'
        }") no-repeat right center`;
      }
      td.appendChild(inc);
      td.appendChild(document.createTextNode(row.name || row.id));
      tr.appendChild(td);
      this.body.appendChild(tr);
    }
    parent.appendChild(this.body);
  };

  DummyTreeTable.prototype.getScrollableTable = function() {
    return this.scrollableTable;
  };

  DummyTreeTable.prototype.getTableBody = function() {
    return this.body;
  };

  DummyTreeTable.prototype.getRowAt = function(y) {
    if (!this.body.hasChildNodes()) {
      return null;
    }
    const children = this.body.childNodes;
    const count = children.length;
    const avHeight = this.body.firstChild.offsetHeight;
    // Try to get the right element
    let n = Math.floor(y / avHeight);
    if (n >= count) n = count - 1;
    let tr = children[n];
    while (tr) {
      const top = this.getRowTop(tr);
      if (top > y) {
        tr = tr.previousSibling;
        --n;
      } else if (top + tr.offsetHeight < y) {
        tr = tr.nextSibling;
        ++n;
      } else {
        return this.getRowFromTR(tr, n);
      }
    }
  };

  DummyTreeTable.prototype.getRowFromTR = function(tr, n) {
    if (tr && tr.id) {
      const id = tr.id.substring(ROW_ID_PREFIX.length);
      // eslint-disable-next-line react/no-this-in-sfc
      const row = this.rowsByIds[id];
      if (row && n !== undefined) {
        row.index = n;
      }
      return row;
    }
    return null;
  };

  DummyTreeTable.prototype.nextRow = function(row) {
    if (!row) {
      return null;
    }
    return this.getRowFromTR(row.tr.nextSibling, row.index + 1);
  };

  DummyTreeTable.prototype.getRow = function(id) {
    return this.rowsByIds[id];
  };

  DummyTreeTable.prototype.getRowTop = function(row) {
    const tr = row.tr || row;
    return tr.offsetTop; // We ensure the tbody has a position relative so that it is the offsetparent of child rows.
  };

  DummyTreeTable.prototype.getRowHeight = function(row, height) {
    // return $(row.tr).offsetHeight;
    return Gantt.utils.getHeight(row.tr);
  };

  Gantt.components.TreeTable.origImpl = Gantt.components.TreeTable.impl;
  Gantt.components.TreeTable.impl = DummyTreeTable;
}

function uninstallDummyTable(Gantt) {
  if (Gantt.components.TreeTable.origImpl) {
    Gantt.components.TreeTable.impl = Gantt.components.TreeTable.origImpl;
    Gantt.components.TreeTable.origImpl = null;
  }
}
