/* eslint-disable */
'use strict';

import Gantt from '../core/core';

import './toolbar.scss';

var idCount = 1;

function makeId(prefix) {
  return prefix + idCount++;
}

var checkClass;
function Checkbox(gantt, config) {
  if (!checkClass) {
    checkClass = Gantt.components.CheckBox.impl || Gantt.components.CheckBox;
  }
  return new checkClass(gantt, config);
}

var buttonClass;
function Button(gantt, config) {
  if (!buttonClass) {
    buttonClass = Gantt.components.Button.impl || Gantt.components.Button;
  }
  return new buttonClass(gantt, config);
}

var selectClass;
function Select(gantt, config) {
  if (!selectClass) {
    selectClass = Gantt.components.DropDownList.impl || Gantt.components.DropDownList;
  }
  return new selectClass(gantt, config);
}

var toggleClass;
function Toggle(gantt, config) {
  if (!toggleClass) {
    toggleClass = Gantt.components.Toggle.impl || Gantt.components.Toggle;
  }
  return new toggleClass(gantt, config);
}

const ToolbarComponents = {
  title: {
    node: function(parentElt, gantt) {
      const node = Gantt.components.Toolbar.createTitle(gantt.getTitle());
      gantt.on(Gantt.events.TITLE_CHANGED, (event, title) => {
        node.innerHTML = title;
      });
      return node;
    },

    justifyLeft: true,
  },
  separator: {
    node: function(parentElt) {
      const sep = document.createElement('div');
      sep.className = 'separator';
      return sep;
    },
  },
  whitespace: {
    node: function(parentElt) {
      const sep = document.createElement('div');
      sep.className = 'white-space';
      return sep;
    },
  },

  search: {
    component(gantt) {
      return new (Gantt.components.Input.impl || Gantt.components.Input)(gantt, {
        type: 'search',
        onchange: function(text) {
          gantt.search(text, true, true);
        },
      });
    },
  },
  mini: {
    component(gantt) {
      return new Toggle(gantt, {
        unselected: {
          /*text : Gantt.utils.getString('gantt.toolbar.minimize.text'),*/
          tooltip: Gantt.utils.getString('gantt.toolbar.mini.tooltip'),
          /*fontIcon : "fa fa-compress fa-lg"*/
          svg: {
            width: 20,
            height: 20,
            viewBox: '0 0 16 16',
            margin: '-6px 0 0 0 ',
            paths: ['M4 5h16v2H4zM4 9h16v2H4zM4 13h16v2H4zM4 17h16v2H4z'],
          },
        },
        selected: {
          /*fontIcon : "fa fa-expand fa-lg",*/
          /*text : Gantt.utils.getString('gantt.toolbar.normal.text'),*/
          tooltip: Gantt.utils.getString('gantt.toolbar.mini.tooltip'),
          svg: {
            width: 20,
            height: 20,
            viewBox: '0 0 24 24',
            margin: '-6px 0 0 0 ',
            paths: ['M4 5h16v2H4zM4 9h16v2H4zM4 13h16v2H4zM4 17h16v2H4z'],
          },
        },
        isSelected: function() {
          const ganttNode = gantt.getPanelNode();
          return Gantt.utils.hasClass(ganttNode, 'mini');
        },

        onclick: function() {
          const ganttNode = gantt.getPanelNode();
          Gantt.utils.toggleClass(ganttNode, 'mini');
          gantt.draw();
        },
      });
    },

    update(gantt, rows, comp) {
      const ganttNode = gantt.getPanelNode();
      comp.setChecked(Gantt.utils.hasClass(ganttNode, 'mini'));
    },
    /*    template : "<div class='rounded-check' style='white-space: nowrap;'> \
                        <input type='checkbox' value='None' name='check' id='{id}'/> \
                        <label for='{id}'>{label}</label> \
                     </div>",*/
  },

  fitToContent: {
    component(gantt) {
      return Button(gantt, {
        /*fontIcon : 'fa fa-arrows fa-lg',*/
        // Edited with http://editor.method.ac/
        svg: {
          width: 20,
          height: 20,
          viewBox: '0 0 24 24',
          paths: [
            'm9,3c3.309,0 6,2.691 6,6s-2.691,6 -6,6s-6,-2.691 -6,-6s2.691,-6 6,-6m0,-2a8,8 0 1 0 0,16a8,8 0 0 0 0,-16zm6,17l3,-3l5,5l-3,3l-5,-5z',
            'm5.067202,10.936161l1.794565,-1.677985l-1.794565,-1.677997l1.025685,-0.958955l2.820467,2.636953l-2.820467,2.637771',
            'm13.211615,7.601521l-1.74349,1.712784l1.74349,1.712783l-0.996386,0.979422l-2.739875,-2.692204l2.739875,-2.69241',
          ],
        },
        tooltip: Gantt.utils.getString('gantt.toolbar.fit.tooltip'),
        onclick: function() {
          gantt.fitToContent();
        },
      });
    },
  },

  refresh: {
    component(gantt) {
      return Button(gantt, {
        fontIcon: 'fa fa-refresh fa-lg',
        /*svg : {
                    width: 24,
                    height: 40,
                    margin: '-6px 2px 0 0',
                    viewBox : "0 0 24 24",
                    paths: ["M2 13.987c0-4.97 4.032-8.994 9-8.994h7l-2.5-2.506L17 1l5 4.987-5 5-1.5-1.5 2.5-2.5h-6.864c-3.867 0-7.136 3.133-7.136 7S7.146 21 11.013 21a7.034 7.034 0 0 0 5.185-2.29l1.478 1.348A9.067 9.067 0 0 1 11 23c-4.97 0-9-4.043-9-9.013z"]
                },*/
        text: Gantt.utils.getString('gantt.toolbar.refresh.text'),
        tooltip: Gantt.utils.getString('gantt.toolbar.fit.tooltip'),
        onclick: function() {
          gantt.draw();
        },
      });
    },
  },

  zoomIn: {
    component(gantt) {
      return Button(gantt, {
        /*classes: 'zoom-in',*/
        /*fontIcon : 'fa fa-search-plus fa-lg',*/
        svg: {
          width: 20,
          height: 20,
          viewBox: '0 0 24 24',
          paths: [
            'M9 1a8 8 0 1 0 0 16A8 8 0 0 0 9 1zm0 14c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6zM15 18l3-3 5 5-3 3z',
            'M10 5H8v3H5v2h3v3h2v-3h3V8h-3z',
          ],
        },
        tooltip: Gantt.utils.getString('gantt.toolbar.zoomIn.tooltip'),
        onclick: function() {
          gantt.zoomIn();
        },
      });
    },
  },

  zoomOut: {
    component(gantt) {
      return Button(gantt, {
        /*classes: 'zoom-out',*/
        /*fontIcon : 'fa fa-search-minus fa-lg',*/
        svg: {
          width: 20,
          height: 20,
          /*margin: '-2px 0 0 0',*/
          viewBox: '0 0 24 24',
          paths: [
            'M9 3c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6m0-2a8 8 0 1 0 0 16A8 8 0 0 0 9 1zM14.999 18l3-3 5 5-3 3z',
            'M9 3c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6m0-2a8 8 0 1 0 0 16A8 8 0 0 0 9 1z',
            'M5 8h8v2H5z',
          ],
        },
        tooltip: Gantt.utils.getString('gantt.toolbar.zoomOut.tooltip'),
        onclick: function() {
          gantt.zoomOut();
        },
      });
    },
  },

  toggleLoadChart: {
    component(gantt) {
      return new Toggle(gantt, {
        unselected: {
          classes: 'toggle-load-chart',
          fontIcon: 'fa fa-bar-chart fa-lg',
          tooltip: Gantt.utils.getString('gantt.loadResourceChart.show.tooltip'),
        },
        selected: {
          classes: 'toggle-load-chart selected',
          fontIcon: 'fa fa-bar-chart fa-lg',
          tooltip: Gantt.utils.getString('gantt.loadResourceChart.hide.tooltip'),
        },
        isSelected: function() {
          return gantt.isLoadChartVisible();
        },

        onclick: function() {
          gantt.toggleLoadChartVisible();
        },
      });
    },
  },
};

class Toolbar extends Gantt.components.Toolbar {
  constructor(gantt, node, config) {
    super(gantt, node, config);
  }

  setConfiguration(config, toolbarNode) {
    this.components = [];
    let leftBar = null;

    function append(comp, handler) {
      if (handler.justifyLeft) {
        if (!leftBar) {
          leftBar = document.createElement('div');
          leftBar.style.display = 'flex';
          leftBar.style.flexDirection = 'row';
          leftBar.style.alignItems = 'center';
          leftBar.style.marginRight = 'auto';
          leftBar.className = 'left-toolbar-body';
          toolbarNode.appendChild(leftBar);
        }
        leftBar.appendChild(comp.node);
      } else {
        toolbarNode.appendChild(comp.node);
      }
    }
    for (let i = 0, count = config.length, cfgNode, handler, node, comp; i < count; i++) {
      cfgNode = config[i];
      if (Gantt.utils.isString(cfgNode)) {
        handler = ToolbarComponents[cfgNode];
      } else {
        handler = cfgNode;
      }

      if (!handler.node) {
        if (handler.component) {
          comp = handler.component(this.gantt, toolbarNode);
          if (comp.node && !comp.node.parentNode) {
            append(comp, handler);
          }
        } else if (handler.template) {
          comp = {
            id:
              handler.id !== undefined
                ? Gantt.utils.isFunction(handler.id)
                  ? handler.id(handler)
                  : handler.id
                : makeId(Gantt.utils.isString(cfgNode) ? cfgNode : 'toolbarComp'),
          };
          comp.node = document.createElement('div');
          let tpl = Gantt.utils.formatString(handler.template, comp);
          Gantt.utils.html(comp.node, tpl);
          append(comp, handler);
        } else if (handler.type) {
          if (handler.type === 'button') {
            comp = Button(this.gantt, handler);
          } else if (handler.type === 'checkbox') {
            comp = Checkbox(this.gantt, handler);
          } else if (handler.type === 'select') {
            comp = Select(this.gantt, handler);
          } else if (handler.type === 'buttonGroup') {
            comp = new (Gantt.components.ButtonGroup.impl || Gantt.components.ButtonGroup)(this.gantt, handler);
          } else if (handler.type === 'separator') {
            handler = ToolbarComponents.separator;
            comp = {};
            comp.node = handler.node(toolbarNode, this.gantt, comp);
          } else {
            throw new Error('Unknown toolbar component type: ' + config.type);
          }
          if (comp.node && !comp.node.parentNode) {
            append(comp, handler);
          }
        } else {
          throw new Error('a node property must be specified in a toolbar element: ' + cfgNode);
        }
      } else if (Gantt.utils.isString(handler.node)) {
        comp = { id: handler.node, node: document.getElementById(handler.node) };
      } else if (Gantt.utils.isFunction(handler.node)) {
        comp = {};
        comp.node = handler.node(toolbarNode, this.gantt, comp);
        append(comp, handler);
      } else {
        throw new Error(
          'The node property of a toolbar element must be either a string ID or a function creating a Dom element'
        );
      }

      if (handler.id) {
        comp.setId(handler.id);
      }

      if (handler.connect) {
        handler.connect(comp.node, comp);
      }
      if (handler.update) {
        comp.update = (gantt, rows) => {
          handler.update(gantt, rows, comp);
        };
      }
      if (cfgNode.id) comp.id = cfgNode.id;
      this.components.push(comp);
    }
    this.initTooltip();
  }

  onInitialized() {
    this.components.forEach(c => {
      if (c.onInitialized) {
        c.onInitialized();
      }
    });
  }

  initTooltip() {
    const tooltbar = this;
    function getTooltipNode(elt) {
      for (; elt && elt !== tooltbar.node; elt = elt.parentNode) {
        // Can be called with an elt outside the toolbar
        if (elt.dataset && elt.dataset.tooltip) {
          return elt;
        }
      }
    }
    this.gantt.tooltip.installTooltip({
      // The container that contains elements to display tooltip for.
      container: this.node,
      // The container inside which bounds the tooltip can be displayed
      getTooltipDisplayContainer() {
        return tooltbar.gantt.getBody();
      },
      // Returns an element in the node hierarchy for which a tooltip can be displayed
      getTooltipElement(node) {
        return getTooltipNode(node);
      },
      renderTooltip(
        tooltipNode /* The element returned by getTooltipElement */,
        act /* data returned by getTooltipData for the specified tooltipElt */,
        tooltipCtnr /* The container of the tooltip to fill with info. */
      ) {
        tooltipCtnr.appendChild(document.createTextNode(tooltipNode.dataset.tooltip));
      },
    });
  }

  connect(gantt) {}

  ganttLoaded(gantt, rows) {
    for (let i = 0, count = this.components.length, comp; i < count; ++i) {
      comp = this.components[i];
      if (comp.update) {
        comp.update(gantt, rows);
      }
    }
  }

  destroy() {}
}

Gantt.components.Toolbar.impl = Toolbar;

/*                    */
/* Toolbar components */
/*                    */

class FlatCheckbox extends Gantt.components.CheckBox {
  constructor(gantt, config) {
    super(gantt, config);
  }

  setConfiguration(config) {
    const btn = document.createElement('div');
    if (config.id) {
      btn.id = config.id;
    }
    btn.className = 'button g-hoverable g-selectable' + (config.classes ? ' ' + config.classes : '');
    if (config.icon) {
      const img = document.createElement('img');
      img.src = config.icon;
      img.alt = '';
      btn.appendChild(img);
    }
    if (config.fontIcon) {
      const fontIcon = document.createElement('i');
      fontIcon.className = config.fontIcon + (config.text ? ' fa-fw' : '');
      btn.appendChild(fontIcon);
    }
    if (config.text) {
      btn.appendChild(document.createTextNode(config.text));
    }
    this.node = btn;
    btn.onclick = e => {
      Gantt.utils.toggleClass(btn, 'selected');
      if (config.onclick) {
        config.onclick(this.gantt);
      }
    };
    return btn;
  }
}

Gantt.components.CheckBox.impl = FlatCheckbox;
