import $ from 'jquery';

import Gantt from '../../core/core';

/* ONO: Gantt malfunctions with latter versions of this plugin! */
(function(Gantt, $) {
  const methods = {};

  methods.init = function() {
    const $splitPanes = this;
    $splitPanes.each(setMinHeightAndMinWidth);
    $splitPanes.append('<div class="split-pane-resize-shim">');
    $splitPanes.children('.split-pane-divider').html('<div class="split-pane-divider-inner"></div>');
    $splitPanes.children('.split-pane-divider').on('touchstart mousedown', mousedownHandler);
    setTimeout(() => {
      // Doing this later because of an issue with Chrome (v23.0.1271.64) returning split-pane width = 0
      // and triggering multiple resize events when page is being opened from an <a target="_blank"> .
      $splitPanes.each(function() {
        $(this).on('_splitpaneparentresize', createParentresizeHandler($(this)));
      });
      $(window).trigger('resize');
    }, 100);
  };

  methods.firstComponentSize = function(value) {
    this.each(function() {
      const $splitPane = $(this);
      const components = getComponents($splitPane);
      if ($splitPane.is('.fixed-top')) {
        fixedTopHandler(components, components.divider.offsetTop)({ pageY: value });
      } else if ($splitPane.is('.fixed-bottom')) {
        value = components.splitPane.offsetHeight - components.divider.offsetHeight - value;
        fixedBottomHandler(components, -components.last.offsetHeight)({ pageY: -value });
      } else if ($splitPane.is('.horizontal-percent')) {
        value = components.splitPane.offsetHeight - components.divider.offsetHeight - value;
        horizontalPercentHandler(components, -components.last.offsetHeight)({ pageY: -value });
      } else if ($splitPane.is('.fixed-left')) {
        fixedLeftHandler(components, components.divider.offsetLeft)({ pageX: value });
      } else if ($splitPane.is('.fixed-right')) {
        value = components.splitPane.offsetWidth - components.divider.offsetWidth - value;
        fixedRightHandler(components, -components.last.offsetWidth)({ pageX: -value });
      } else if ($splitPane.is('.vertical-percent')) {
        value = components.splitPane.offsetWidth - components.divider.offsetWidth - value;
        verticalPercentHandler(components, -components.last.offsetWidth)({ pageX: -value });
      }
    });
  };

  methods.lastComponentSize = function(value) {
    this.each(function() {
      const $splitPane = $(this);
      const components = getComponents($splitPane);
      if ($splitPane.is('.fixed-top')) {
        value = components.splitPane.offsetHeight - components.divider.offsetHeight - value;
        fixedTopHandler(components, components.divider.offsetTop)({ pageY: value });
      } else if ($splitPane.is('.fixed-bottom')) {
        fixedBottomHandler(components, -components.last.offsetHeight)({ pageY: -value });
      } else if ($splitPane.is('.horizontal-percent')) {
        horizontalPercentHandler(components, -components.last.offsetHeight)({ pageY: -value });
      } else if ($splitPane.is('.fixed-left')) {
        value = components.splitPane.offsetWidth - components.divider.offsetWidth - value;
        fixedLeftHandler(components, components.divider.offsetLeft)({ pageX: value });
      } else if ($splitPane.is('.fixed-right')) {
        fixedRightHandler(components, -components.last.offsetWidth)({ pageX: -value });
      } else if ($splitPane.is('.vertical-percent')) {
        verticalPercentHandler(components, -components.last.offsetWidth)({ pageX: -value });
      }
    });
  };

  methods.setLeftComponentVisible = function(visible) {
    this.each(function() {
      const $splitPane = $(this);
      const components = getComponents($splitPane);

      components.divider.style.display = visible ? '' : 'none';
      components.first.style.display = visible ? '' : 'none';
    });
  };

  methods.setRightComponentVisible = function(visible) {
    this.each(function() {
      const $splitPane = $(this);
      const components = getComponents($splitPane);

      const { first } = components;
      first.style.position = visible ? 'absolute' : 'relative';
      first.style[$(first).hasClass('top-pane') ? 'height' : 'width'] = visible ? '' : '100%';
      components.divider.style.display = visible ? '' : 'none';
      components.last.style.display = visible ? '' : 'none';
    });
  };

  $.fn.splitPane = function(method) {
    if (!method) {
      method = 'init';
    }
    methods[method].apply(this, $.grep(arguments, (it, i) => i > 0));
  };

  const SPLITPANERESIZE_HANDLER = '_splitpaneparentresizeHandler';

  /**
   * A special event that will "capture" a resize event from the parent split-pane or window.
   * The event will NOT propagate to grandchildren.
   */
  $.event.special._splitpaneparentresize = {
    setup(data, namespaces) {
      const element = this;
      const parent =
        $(this)
          .parent()
          .closest('.split-pane')[0] || window;
      $(this).data(SPLITPANERESIZE_HANDLER, function(event) {
        const target = event.target === document ? window : event.target;
        if (target === parent) {
          event.type = '_splitpaneparentresize';
          $.event.dispatch.apply(element, arguments);
        } else {
          event.stopPropagation();
        }
      });
      $(parent).on('resize', $(this).data(SPLITPANERESIZE_HANDLER));
    },
    teardown(namespaces) {
      const parent =
        $(this)
          .parent()
          .closest('.split-pane')[0] || window;
      $(parent).off('resize', $(this).data(SPLITPANERESIZE_HANDLER));
      $(this).removeData(SPLITPANERESIZE_HANDLER);
    },
  };

  function setMinHeightAndMinWidth() {
    const $splitPane = $(this);
    const components = getComponents($splitPane);
    if ($splitPane.is('.fixed-top, .fixed-bottom, .horizontal-percent')) {
      $splitPane.css(
        'min-height',
        `${minHeight(components.first) + minHeight(components.last) + $(components.divider).height()}px`
      );
    } else {
      $splitPane.css(
        'min-width',
        `${minWidth(components.first) + minWidth(components.last) + $(components.divider).width()}px`
      );
    }
  }

  function mousedownHandler(event) {
    const $divider = $(this);
    const $splitPane = $divider.parent();
    const $resizeShim = $divider.siblings('.split-pane-resize-shim');
    $resizeShim.show();
    $divider.addClass('dragged');
    if (event.type.match(/^touch/)) {
      $divider.addClass('touch');
    }
    const moveEventHandler = createMousemove($splitPane, pageXof(event), pageYof(event));
    $(document).on('touchmove mousemove', moveEventHandler);
    $(document).one('touchend mouseup', event => {
      $(document).off('touchmove mousemove', moveEventHandler);
      $divider.removeClass('dragged touch');
      $resizeShim.hide();
      $splitPane.trigger('dividerdragend', [getComponentsSizes($splitPane)]);
    });
    $splitPane.trigger('dividerdragstart', [getComponentsSizes($splitPane)]);
  }

  function getComponentsSizes($splitPane) {
    const property = $splitPane.is('.fixed-top, .fixed-bottom, .horizontal-percent') ? 'height' : 'width';
    return {
      firstComponentSize: $splitPane.find('.split-pane-component:first')[property](),
      lastComponentSize: $splitPane.find('.split-pane-component:last')[property](),
    };
  }

  function createParentresizeHandler($splitPane) {
    const components = getComponents($splitPane);
    if ($splitPane.is('.fixed-top')) {
      return function(event) {
        const lastComponentMinHeight = minHeight(components.last);
        const maxfirstComponentHeight =
          components.splitPane.offsetHeight - lastComponentMinHeight - components.divider.offsetHeight;
        if (components.first.offsetHeight > maxfirstComponentHeight) {
          setTop(components, `${maxfirstComponentHeight}px`);
        }
        $splitPane.resize();
      };
    }
    if ($splitPane.is('.fixed-bottom')) {
      return function(event) {
        const firstComponentMinHeight = minHeight(components.first);
        const maxLastComponentHeight =
          components.splitPane.offsetHeight - firstComponentMinHeight - components.divider.offsetHeight;
        if (components.last.offsetHeight > maxLastComponentHeight) {
          setBottom(components, `${maxLastComponentHeight}px`);
        }
        $splitPane.resize();
      };
    }
    if ($splitPane.is('.horizontal-percent')) {
      return function(event) {
        const lastComponentMinHeight = minHeight(components.last);
        const firstComponentMinHeight = minHeight(components.first);
        const maxLastComponentHeight =
          components.splitPane.offsetHeight - firstComponentMinHeight - components.divider.offsetHeight;
        if (components.last.offsetHeight > maxLastComponentHeight) {
          setBottom(components, `${(maxLastComponentHeight / components.splitPane.offsetHeight) * 100}%`);
        } else if (
          components.splitPane.offsetHeight - components.first.offsetHeight - components.divider.offsetHeight <
          lastComponentMinHeight
        ) {
          setBottom(components, `${(lastComponentMinHeight / components.splitPane.offsetHeight) * 100}%`);
        }
        $splitPane.resize();
      };
    }
    if ($splitPane.is('.fixed-left')) {
      return function(event) {
        const lastComponentMinWidth = minWidth(components.last);
        const maxFirstComponentWidth =
          components.splitPane.offsetWidth - lastComponentMinWidth - components.divider.offsetWidth;
        if (components.first.offsetWidth > maxFirstComponentWidth) {
          setLeft(components, `${maxFirstComponentWidth}px`);
        }
        $splitPane.resize();
      };
    }
    if ($splitPane.is('.fixed-right')) {
      return function(event) {
        const firstComponentMinWidth = minWidth(components.first);
        const maxLastComponentWidth =
          components.splitPane.offsetWidth - firstComponentMinWidth - components.divider.offsetWidth;
        if (components.last.offsetWidth > maxLastComponentWidth) {
          setRight(components, `${maxLastComponentWidth}px`);
        }
        $splitPane.resize();
      };
    }
    if ($splitPane.is('.vertical-percent')) {
      return function(event) {
        const lastComponentMinWidth = minWidth(components.last);
        const firstComponentMinWidth = minWidth(components.first);
        const maxLastComponentWidth =
          components.splitPane.offsetWidth - firstComponentMinWidth - components.divider.offsetWidth;
        if (components.last.offsetWidth > maxLastComponentWidth) {
          setRight(components, `${(maxLastComponentWidth / components.splitPane.offsetWidth) * 100}%`);
        } else if (
          components.splitPane.offsetWidth - components.first.offsetWidth - components.divider.offsetWidth <
          lastComponentMinWidth
        ) {
          setRight(components, `${(lastComponentMinWidth / components.splitPane.offsetWidth) * 100}%`);
        }
        $splitPane.resize();
      };
    }
  }

  function createMousemove($splitPane, pageX, pageY) {
    const components = getComponents($splitPane);
    if ($splitPane.is('.fixed-top')) {
      return fixedTopHandler(components, pageY);
    }
    if ($splitPane.is('.fixed-bottom')) {
      return fixedBottomHandler(components, pageY);
    }
    if ($splitPane.is('.horizontal-percent')) {
      return horizontalPercentHandler(components, pageY);
    }
    if ($splitPane.is('.fixed-left')) {
      return fixedLeftHandler(components, pageX);
    }
    if ($splitPane.is('.fixed-right')) {
      return fixedRightHandler(components, pageX);
    }
    if ($splitPane.is('.vertical-percent')) {
      return verticalPercentHandler(components, pageX);
    }
  }

  function fixedTopHandler(components, pageY) {
    const firstComponentMinHeight = minHeight(components.first);
    const maxFirstComponentHeight =
      components.splitPane.offsetHeight - minHeight(components.last) - components.divider.offsetHeight;
    const topOffset = components.divider.offsetTop - pageY;
    return function(event) {
      const top = newTop(firstComponentMinHeight, maxFirstComponentHeight, topOffset + pageYof(event));
      setTop(components, `${top}px`);
      $(components.splitPane).resize();
    };
  }

  function fixedBottomHandler(components, pageY) {
    const lastComponentMinHeight = minHeight(components.last);
    const maxLastComponentHeight =
      components.splitPane.offsetHeight - minHeight(components.first) - components.divider.offsetHeight;
    const bottomOffset = components.last.offsetHeight + pageY;
    return function(event) {
      event.preventDefault && event.preventDefault();
      const bottom = Math.min(Math.max(lastComponentMinHeight, bottomOffset - pageYof(event)), maxLastComponentHeight);
      setBottom(components, `${bottom}px`);
      $(components.splitPane).resize();
    };
  }

  function horizontalPercentHandler(components, pageY) {
    const splitPaneHeight = components.splitPane.offsetHeight;
    const lastComponentMinHeight = minHeight(components.last);
    const maxLastComponentHeight = splitPaneHeight - minHeight(components.first) - components.divider.offsetHeight;
    const bottomOffset = components.last.offsetHeight + pageY;
    return function(event) {
      event.preventDefault && event.preventDefault();
      const bottom = Math.min(Math.max(lastComponentMinHeight, bottomOffset - pageYof(event)), maxLastComponentHeight);
      setBottom(components, `${(bottom / splitPaneHeight) * 100}%`);
      $(components.splitPane).resize();
    };
  }

  function fixedLeftHandler(components, pageX) {
    const firstComponentMinWidth = minWidth(components.first);
    const maxFirstComponentWidth =
      components.splitPane.offsetWidth - minWidth(components.last) - components.divider.offsetWidth;
    const leftOffset = components.divider.offsetLeft - pageX;
    return function(event) {
      event.preventDefault && event.preventDefault();
      const left = newLeft(firstComponentMinWidth, maxFirstComponentWidth, leftOffset + pageXof(event));
      setLeft(components, `${left}px`);
      $(components.splitPane).resize();
    };
  }

  function fixedRightHandler(components, pageX) {
    const lastComponentMinWidth = minWidth(components.last);
    const maxLastComponentWidth =
      components.splitPane.offsetWidth - minWidth(components.first) - components.divider.offsetWidth;
    const rightOffset = components.last.offsetWidth + pageX;
    return function(event) {
      event.preventDefault && event.preventDefault();
      const right = Math.min(Math.max(lastComponentMinWidth, rightOffset - pageXof(event)), maxLastComponentWidth);
      setRight(components, `${right}px`);
      $(components.splitPane).resize();
    };
  }

  function verticalPercentHandler(components, pageX) {
    const splitPaneWidth = components.splitPane.offsetWidth;
    const lastComponentMinWidth = minWidth(components.last);
    const maxLastComponentWidth = splitPaneWidth - minWidth(components.first) - components.divider.offsetWidth;
    const rightOffset = components.last.offsetWidth + pageX;
    return function(event) {
      event.preventDefault && event.preventDefault();
      const right = Math.min(Math.max(lastComponentMinWidth, rightOffset - pageXof(event)), maxLastComponentWidth);
      setRight(components, `${(right / splitPaneWidth) * 100}%`);
      $(components.splitPane).resize();
    };
  }

  function getComponents($splitPane) {
    return {
      splitPane: $splitPane[0],
      first: $splitPane.children('.split-pane-component:first')[0],
      divider: $splitPane.children('.split-pane-divider')[0],
      last: $splitPane.children('.split-pane-component:last')[0],
    };
  }

  function pageXof(event) {
    if (event.pageX !== undefined) {
      return event.pageX;
    }
    if (event.originalEvent.pageX !== undefined) {
      return event.originalEvent.pageX;
    }
    if (event.originalEvent.touches) {
      return event.originalEvent.touches[0].pageX;
    }
  }

  function pageYof(event) {
    if (event.pageY !== undefined) {
      return event.pageY;
    }
    if (event.originalEvent.pageY !== undefined) {
      return event.originalEvent.pageY;
    }
    if (event.originalEvent.touches) {
      return event.originalEvent.touches[0].pageY;
    }
  }

  function minHeight(element) {
    return Number.parseInt($(element).css('min-height'), 10) || 0;
  }

  function minWidth(element) {
    return Number.parseInt($(element).css('min-width'), 10) || 0;
  }

  function newTop(firstComponentMinHeight, maxFirstComponentHeight, value) {
    return Math.min(Math.max(firstComponentMinHeight, value), maxFirstComponentHeight);
  }

  function newLeft(firstComponentMinWidth, maxFirstComponentWidth, value) {
    return Math.min(Math.max(firstComponentMinWidth, value), maxFirstComponentWidth);
  }
  function setTop(components, top) {
    components.first.style.height = top;
    components.divider.style.top = top;
    components.last.style.top = top;
  }

  function setBottom(components, bottom) {
    components.first.style.bottom = bottom;
    components.divider.style.bottom = bottom;
    components.last.style.height = bottom;
  }

  function setLeft(components, left) {
    components.first.style.width = left;
    components.divider.style.left = left;
    components.last.style.left = left;
  }

  function setRight(components, right) {
    components.first.style.right = right;
    components.divider.style.left = right;
    components.last.style.width = right;
  }

  class Split {
    constructor(elt, options) {
      this.options = options;
      this.horiz = !this.options || this.options.horizontal === undefined || this.options.horizontal;
      const fixedFirst = !this.options || this.options.fixedFirst === undefined || this.options.fixedFirst;
      const hideFirst = options && options.hideFirst;
      const hideSecond = options && options.hideSecond;
      this.splitPaneElt = document.createElement('div');
      this.splitPaneElt.className = `split-pane docloud-splitpane ${
        this.horiz ? (fixedFirst ? 'fixed-left' : 'fixed-right') : fixedFirst ? 'fixed-top' : 'fixed-bottom'
      }`;

      this.leftComponent = document.createElement('div');
      this.leftComponent.className = `split-pane-component ${
        this.horiz ? 'left-pane split-pane-left' : 'top-pane split-pane-top'
      }`;
      this.splitPaneElt.appendChild(this.leftComponent);

      const divider = document.createElement('div');
      divider.className = `split-pane-divider ${this.horiz ? 'h-split-pane-divider' : 'v-split-pane-divider'}`;
      this.splitPaneElt.appendChild(divider);
      if (hideFirst || hideSecond) {
        divider.style.display = 'none';
      }

      this.rightComponent = document.createElement('div');
      this.rightComponent.className = `split-pane-component ${
        this.horiz ? 'right-pane split-pane-right' : 'bottom-pane split-pane-bottom'
      }`;
      this.splitPaneElt.appendChild(this.rightComponent);

      if (hideSecond) {
        this.leftComponent.style.position = 'relative';
        this.leftComponent.style[!this.horiz ? 'height' : 'width'] = '100%';
        this.rightComponent.style.display = 'none';
      } else if (hideFirst) {
        this.rightComponent.style.position = 'relative';
        this.rightComponent.style[!this.horiz ? 'height' : 'width'] = '100%';
        this.leftComponent.style.display = 'none';
      }

      elt.appendChild(this.splitPaneElt);
      this.$splitPaneElt = $(this.splitPaneElt).splitPane();

      $(this.splitPaneElt).on('resize', e => {
        this.onresized();
      });
      $(this.splitPaneElt).on('dividerdragend', e => {
        this.onDividerDragEnd();
      });
    }

    getLeftComponent() {
      return this.leftComponent;
    }

    getRightComponent() {
      return this.rightComponent;
    }

    leftComponentCreated() {
      const pos = (this.options && this.options.pos) || 200;
      if (pos >= 0) {
        $(this.splitPaneElt).splitPane('firstComponentSize', pos);
      }
    }

    rightComponentCreated() {
      const pos = this.options && this.options.pos;
      if (pos < 0) {
        $(this.splitPaneElt).splitPane('lastComponentSize', -pos);
      }
    }

    onresized() {}

    onDividerDragEnd() {}

    setLeftComponentVisible(visible) {
      $(this.splitPaneElt).splitPane('setLeftComponentVisible', visible);
    }

    setRightComponentVisible(visible) {
      $(this.splitPaneElt).splitPane('setRightComponentVisible', visible);
    }
  }

  Gantt.components.Split.impl = Split;
})(Gantt, $);
