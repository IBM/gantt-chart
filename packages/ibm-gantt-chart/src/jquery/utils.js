import $ from 'jquery';

import Gantt from '../core/core';

Gantt.utils = $.extend({}, Gantt.utils, {
  closest(elt, selector) {
    const res = $(elt).closest(selector);
    return (res && res.length && res[0]) || null;
  },

  mergeObjects() {
    const args = [];
    for (let i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    return $.extend.apply($, args);
  },

  // Triggers security issues
  // https://github.ibm.com/IBMDecisionOptimization/dd-gantt-component/issues/21
  // html(node, htmlText) {
  //     $(node).html(htmlText);
  // },

  offsetParent(elt) {
    const $parent = $(elt).offsetParent();
    return ($parent.length && $parent[0]) || null;
  },

  ajax(url, params) {
    const $params = {
      url: url || params.url,
      dataType: (params && params.dataType) || 'json',
    };
    if (params && params.method) {
      $params.method = params.method;
    }
    if (params && params.params) {
      $params.data = params.params;
    }
    if (params && params.customizeRequest) {
      $params.beforeSend = params.customizeRequest;
    }
    const { settings } = params;
    if (params && params.success) {
      return $.ajax($params).then(function(data, statusText, req) {
        if (params.settings) {
          params.settings.statusText = statusText;
          params.settings.request = req;
        }
        if (params.context) {
          return params.success.call(params.context, data, params.settings);
        }
        return params.success(data, params.settings);
      });
    }
    return $.ajax($params);
  },

  getHeight(elt) {
    return $(elt).height();
  },
});
