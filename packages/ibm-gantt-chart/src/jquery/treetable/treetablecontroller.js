/* eslint-disable */
import './treetablecontroller.scss';

let DATATABLE_FILTER_INSTALLED = false;
const TREE_NODE_TYPE = 'tree-node';

export default class TreeTableController {
  constructor() {
    this.collapsedNodes = {};
  }

  getHierarchyColumn(columns) {
    // Safe enough for now to consider the first column is the one controlling the table hierarchy
    return (columns && columns.length && columns[0]) || null;
  }

  customizeOptions(options, hCol, rowRenderer) {
    if (hCol || (hCol = this.getHierarchyColumn(options.columns))) {
      // Without this column, not hierarchy can be managed, this tree table controller remains inactive
      if (!hCol.render) {
        hCol.render = {};
      }
      const oldRender = hCol.render.display;
      const oldData = hCol.data;
      const self = this;
      hCol.render.display = function(node, type, full, meta) {
        var content =
          (oldRender && oldRender.call(this, (oldData && node[oldData]) || node, type, full, meta)) || node.name;
        var parent = node.parent;
        var prefix = '';
        while (parent) {
          prefix += '<div class="tree-node-spacing"></div>';
          parent = parent.parent;
        }
        prefix +=
          '<div class="tree-node-handle">' +
          (node.children && node.children.length
            ? '<i style="width: 16px;" class="fa fa-caret-right fa-lg collapsed"></i><i style="16px;" class="fa fa-caret-down fa-lg expanded"></i>'
            : '') +
          '</div>';
        if (node.color) {
          prefix += '<div class="tree-node-color" style="background-color="' + node.color + '"></div>';
        }
        return prefix + content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
      };
      hCol.render.filter = function(node, type, full, meta) {
        return node ? node.name : '';
      };
      hCol.className = (hCol.className && hCol.className + ' hierarchy-control') || 'hierarchy-control';
      hCol.type = TREE_NODE_TYPE;

      const oldCreatedRow = options.createdRow;
      options.createdRow = (row, node, index) => {
        row.tabIndex = "0";
        const parentRow = node.children && node.children.length;
        if (rowRenderer) {
          rowRenderer.draw(node, row, node);
        }
        let classname = parentRow
          ? (this.collapsedNodes[node.id] && 'parent-row collapsed') || 'parent-row'
          : 'leaf-row';
        if (node.hidden) {
          classname = classname + ' hidden';
        }
        $(row).addClass(classname);
        if (oldCreatedRow) {
          oldCreatedRow.call(this, row, node, index);
        }
      };
    }
  }

  getData(id) {
    const row = this.$dataTable.row(id);
    let node;
    return (row && (node = row.data()) && node.getData()) || null;
  }

  reset() {
    this.collapsedNodes = {};
  }

  getRow(data) {
    if (typeof data === 'string') {
      // object ID
      return this.$dataTable.row('#' + data);
    }
    return data;
  }

  isCollapsedNode(node) {
    if (typeof node === 'string') {
      return this.collapsedNodes[node];
    }
    const row = this.getRow(node);
    node = row && row.data();
    return node && node.children && this.collapsedNodes[node.id];
  }

  collapseNode(node, collapse) {
    var row = this.getRow(node);
    node = row && row.data();
    if (node && node.children && node.children.length) {
      var visible = !collapse;
      if (!collapse) {
        delete this.collapsedNodes[node.id];
        $(row.node()).removeClass('collapsed');
      } else {
        this.collapsedNodes[node.id] = true;
        $(row.node()).addClass('collapsed');
      }
      var rowsModified = [];
      for (var i = 0; i < node.children.length; i++) {
        this.setRowVisible(node.children[i], visible, rowsModified);
      }
      this.rowsVisibilityChanged(!collapse, rowsModified, node.id);
    }
  }

  rowsVisibilityChanged(visible, rows, rowRef) {}

  setRowVisible(row, visible, rowsModified) {
    var tr = row.tr || this.$dataTable.row('#' + row.id).node();
    if (tr) {
      $(tr).toggleClass('hidden', !visible);
      if (visible) {
        delete row.hidden;
      } else {
        row.hidden = true;
      }
      if (rowsModified) {
        rowsModified.push(row.id);
      }
      if (row.children && !this.collapsedNodes[row.id]) {
        for (let i = 0, count = row.children.length; i < count; ++i) {
          this.setRowVisible(row.children[i], visible, rowsModified);
        }
      }
    }
  }

  expandParents(row) {
    row = this.getRow(row); // row is Datatable row
    let node = row && row.data(); // node is Gantt row.
    if (node) {
      let parent = node.parent,
        topCollapsed;
      while (parent) {
        if (this.collapsedNodes[parent.id]) {
          // Change the collapse state of all collapsed ancestor except for the top most collapsed ancestor
          // which will be processed with the call to collapseNode().
          if (topCollapsed) {
            delete this.collapsedNodes[topCollapsed.id];
          }
          topCollapsed = parent;
        }
        parent = parent.parent;
      }
      if (topCollapsed) {
        // Expand the top most collapsed ancestor
        this.collapseNode(topCollapsed.id, false);
      }
    }
  }

  install($dataTable, bodyElt) {
    this.$dataTable = $dataTable;
    $(bodyElt).on('click', 'td.hierarchy-control .tree-node-handle', e => {
      const tr = $(e.target).closest('tr');
      if (tr && tr.length) {
        var row = $dataTable.row(tr);

        this.collapseNode(row, !this.isCollapsedNode(row));
      }
    });

    if (!DATATABLE_FILTER_INSTALLED) {
      DATATABLE_FILTER_INSTALLED = true;
      $.fn.dataTable.ext.search.push(function(settings, aData, dataIndex, node) {
        var dataTable;
        if ((dataTable = settings.ganttDataTable)) {
          // Be sure this global search applies only to GanttDataTables
          if (!dataTable.filter.isEmpty()) {
            node.__filterMatched = dataTable.filter.accept(node, aData, dataIndex);
          }
        }
        return true;
      });
      $.fn.dataTable.ext.search.push(function(settings, data, dataIndex, node) {
        if (settings.ganttDataTable) {
          // Be sure this global search applies only to GanttDataTables
          if (node.hidden) {
            return false;
          }
          if (!settings.ganttDataTable.filter.isEmpty()) {
            // If a search is in place, a collapsed or not matching node cam be made visible if at least one child matches the search
            const processVisibilityFromChildren = vNode => {
              if (vNode && vNode.children) {
                for (var iChild = 0, count = vNode.children.length, child; iChild < count; iChild++) {
                  child = vNode.children[iChild];
                  if (child.__filterMatched || processVisibilityFromChildren(child)) {
                    vNode.__filterMatched = true;
                    return true;
                  }
                }
              }
              return false;
            };

            return node.__filterMatched || processVisibilityFromChildren(node);
          }
          return true;
        }
        return true;
      });

      const makeComparisonFct = function(m) {
        function comp(a, b, comparator) {
          a = a.getSortValue ? a.getSortValue(a) : comparator ? a : a.name;
          b = b.getSortValue ? b.getSortValue(b) : comparator ? b : b.name;
          return comparator ? comparator(a, b) * m : a < b ? -m : a > b ? m : 0;
        }
        return (a, b) => {
          const comparator = a.comparator; // If comparator specified in user config, we are sure it is provided with a or b. But a.parent or b.parent won't have it has they are not constructed from the sort render callback
          if (a.parent === b.parent) {
            return comp(a, b, comparator);
          }
          // Look for common ancestor
          let aParent = a.parent,
            lastParent = a,
            bParent;
          while (aParent) {
            // Has b aParent has an ancestor?
            bParent = b;
            while (bParent) {
              if (bParent.parent === aParent) {
                return comp(lastParent, bParent, comparator);
              }
              bParent = bParent.parent;
            }
            lastParent = aParent;
            aParent = aParent.parent;
          }
          // Compare top ancestor for both nodes
          for (bParent = b; bParent.parent; ) {
            bParent = bParent.parent;
          }
          return comp(lastParent, bParent, comparator);
        };
      };

      $.fn.dataTable.ext.type.order[TREE_NODE_TYPE + '-asc'] = makeComparisonFct(1);
      $.fn.dataTable.ext.type.order[TREE_NODE_TYPE + '-desc'] = makeComparisonFct(-1);
    }
  }
}
