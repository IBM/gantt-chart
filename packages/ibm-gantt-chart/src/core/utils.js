import Gantt from './core';

const GanttStrings = {
  'Gantt.MoveActivity': 'Move "{name}"',
  'Gantt.ChangeActivityRow': 'Change "{name}" of row',
  'timeLine.changeRowItem.fmt':
    '<div class="dragg-item-content"><h2 class="dragg-title">{title}</h2><table>' +
    '<tr><td class="dragg-item-property">From row</td><td class="table-separator"></td><td class="dragg-item-value">{start}</td></tr>' +
    '<tr><td class="dragg-item-property">At date</td><td class="table-separator"></td><td class="dragg-item-value">{startRow}</td></tr>' +
    '<tr><td class="dragg-item-property">To row</td><td class="table-separator"></td><td class="dragg-item-value">{current}</td></tr>' +
    '<tr><td class="dragg-item-property">At date</td><td class="table-separator"></td><td class="dragg-item-value">{currentRow}</td></tr>' +
    '</table></div>',
  'timeLine.newTimeItem.fmt':
    '<div class="dragg-item-content"><h2 class="dragg-title {draggStatusClass}">{title}</h2><table>' +
    '<tr><td class="dragg-item-property">From</td><td class="table-separator"></td><td class="dragg-item-value">{start}</td></tr>' +
    '<tr><td class="dragg-item-property">To</td><td class="table-separator"></td><td class="dragg-item-value">{current}</td></tr>' +
    '</table></div>',
  'gantt.loading': 'Loading',
  'gantt.error.details': 'Details',
  'gantt.error.title.fmt': '{msg} : {title}',
  'gantt.toolbar.mini.text': 'Mini',
  'gantt.toolbar.minimize.text': 'Compact',
  'gantt.toolbar.normal.text': 'Normal',
  'gantt.toolbar.mini.tooltip': 'Change row height',
  'gantt.toolbar.fit.tooltip': 'Fit',
  'gantt.toolbar.refresh.text': 'Refresh',
  'gantt.toolbar.refresh.tooltip': 'Refresh',
  'gantt.toolbar.zoomIn.tooltip': 'Zoom In',
  'gantt.toolbar.zoomOut.tooltip': 'Zoom Out',
  'gantt.loadResourceChart.load.title': 'Load',
  'gantt.loadResourceChart.show.tooltip': 'Show Load chart',
  'gantt.loadResourceChart.hide.tooltip': 'Hide Load chart',
  'gantt.loadResourceChart.noSelection.title': 'Select one or more resources to display in the load chart',
  'gantt.constraintChart.from': 'From',
  'gantt.constraintChart.to': 'To',
  'gantt.constraintChart.type': 'Type',
  'gantt.constraintChart.start.start': 'Start to Start',
  'gantt.constraintChart.start.end': 'End to Start',
  'gantt.constraintChart.end.end': 'End to End',
  'gantt.constraintChart.end.start': 'End to Start',
  'gantt.name': 'Name',
  'gantt.id': 'Id',
  'gantt.start': 'Start',
  'gantt.end': 'End',
  'gantt.datatables.empty-table': 'No data available in table',
  'gantt.error.no-time-window-defined': 'No time window defined',
  'gantt.columns': 'columns',
};

let intl = {
  formatMessage: (m, v) => {
    let message = GanttStrings[m.id] || m.defaultMessage || m.id;
    if (v) {
      Object.entries(v).forEach(([key, value]) => {
        message = message.replace(`{${key}}`, value);
      });
    }
    return message;
  },
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger
Number.isInteger =
  Number.isInteger ||
  function(value) {
    return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
  };

Gantt.utils = {
  defaultDateFormat: 'mmm d, hh:MM:ss TT',

  createDateParser(format) {
    let i = 0;
    const fmt = {};
    const year = 'year';
    const month = 'month';
    const day = 'day';
    const hour = 'hour';
    const min = 'min';
    const secs = 'secs';
    const millis = 'millis';
    const convertor = {
      yyyy: year,
      yy: year,
      y: year,
      M: month,
      MM: month,
      MMMM: month,
      d: day,
      dd: day,
      H: hour,
      HH: hour,
      m: min,
      mm: min,
      s: secs,
      ss: secs,
      S: millis,
      SS: millis,
      SSS: millis,
    };
    format.replace(/(yyyy|yy|y|MMMM|MM|M|dd|d|HH|H|mm|m|ss|s|SSS|SS|S)/g, function(part) {
      fmt[convertor[part]] = i++;
    });
    return function(s) {
      if (!s) return 0;
      const parts = s.match(/(\d+)/g);
      return new Date(
        parts[fmt[year]],
        parts[fmt[month]] - 1,
        parts[fmt[day]],
        parts[fmt[hour]],
        parts[fmt[min]],
        parts[fmt[secs]]
      ).getTime();
    };
  },

  closest(elt, selector) {},

  mergeObjects(target) {
    if (!target) {
      target = {};
    }
    for (let i = 1, obj, prop; i < arguments.length; i++) {
      if ((obj = arguments[i])) {
        for (let j = 0, keys = Object.keys(obj); j < keys.length; j++) {
          prop = keys[j];
          target[prop] = obj[prop];
        }
      }
    }
    return target;
  },

  getChild(elt, tagname) {
    tagname = tagname ? tagname.toUpperCase() : null;
    for (let i = 0; i < elt.childNodes.length; i++) {
      if (!tagname || elt.childNodes[i].tagName.toUpperCase() === tagname) {
        return elt.childNodes[i];
      }
    }
    return null;
  },
  isArray(obj) {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
    if (!Array.isArray) {
      Array.isArray = function(arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
      };
    }
    return Array.isArray(obj);
  },
  isString(obj) {
    return typeof obj === 'string' || obj instanceof String;
  },
  isFunction(obj) {
    return typeof obj === 'function';
  },
  isDomElement(obj) {
    return obj.nodeType > 0;
    /* return (
        typeof HTMLElement === "object"
            ? o instanceof HTMLElement :  o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
    ) */
  },
  hasClass(el, className) {
    if (el.classList) {
      return el.classList.contains(className);
    }
    if (el.className && el.className.match) {
      // Classname strings for SVG elements don't have some string methods including replace or match
      return !!el.className.match(new RegExp(`(\\s|^)${className}(\\s|$)`));
    }
    return false;
  },

  addClass(el, className) {
    if (el.classList) {
      el.classList.add(className);
    } else if (!this.hasClass(el, className)) {
      if (el.className) {
        el.className += ` ${className}`;
      } else {
        el.className = className;
      }
    }
  },
  removeClass(el, className) {
    if (el.classList) {
      el.classList.remove(className);
    } else if (this.hasClass(el, className)) {
      const reg = new RegExp(`(\\s|^)${className}(\\s|$)`);
      el.className = el.className.replace(reg, ' ');
    }
  },
  toggleClass(el, classname, set) {
    if (set === undefined) {
      if (this.hasClass(el, classname)) {
        this.removeClass(el, classname);
      } else {
        this.addClass(el, classname);
      }
    } else if (set) {
      this.addClass(el, classname);
    } else {
      this.removeClass(el, classname);
    }
  },
  html(node, htmlText) {
    throw new Error('Gantt.utils.html not supported');
  },
  walkToAncestor(parent, elt, cb, param) {
    function makeArrayMatcher(array) {
      return function(obj) {
        for (let i = 0; i < array.length; i++) {
          if (obj === array[i]) {
            return true;
          }
        }
        return false;
      };
    }
    const matcher =
      typeof parent === 'function'
        ? parent
        : this.isArray(parent)
        ? makeArrayMatcher(parent)
        : function(obj) {
            return parent === obj;
          };
    for (var p = elt, parentNode; (p && p !== document) || matcher(p); ) {
      if (matcher(p)) {
        return (param === undefined && p) || param;
      }
      parentNode = p.parentNode;
      if (parentNode === document && !matcher(document)) {
        return;
      }
      if (cb) {
        const result = cb(parentNode, p, param);
        if (result !== undefined) {
          param = result;
        }
      }
      p = parentNode;
    }
  },

  getWindowScrollLeft() {
    let t;
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect for this browser safe implementation of scrollLeft
    return (((t = document.documentElement) || (t = document.body.parentNode)) && typeof t.scrollLeft === 'number'
      ? t
      : document.body
    ).scrollLeft;
  },

  getWindowScrollTop() {
    let t;
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect for this browser safe implementation of scrollTop
    return (((t = document.documentElement) || (t = document.body.parentNode)) && typeof t.scrollTop === 'number'
      ? t
      : document.body
    ).scrollTop;
  },

  getScreenPoint(elt, pt) {
    const bounds = elt.getBoundingClientRect();
    return {
      x: bounds.left + this.getWindowScrollLeft() + (pt ? pt.x : 0),
      y: bounds.top + this.getWindowScrollTop() + (pt ? pt.y : 0),
    };
  },

  getHeight(elt) {
    // In firefox, actual row heights can be non-integers, which results in elt.offsetHeight (integer)
    // being different from the actual display size, as the rounding done in the browser display and the one returned
    // from offsetHeight can different. A table row of height 32.5 is displayed with 32px and have its offsetHeight
    // returning 33...
    return elt.offsetHeight;
  },

  offsetParent(elt) {
    return elt.parentNode; // Should be the closest ancestor with positioned style (fixed, relative or absolute)
  },

  ajax(url, params) {},
  propertyEvaluator(path) {
    if (this.isFunction(path)) {
      return path;
    }
    const ar = path.split('.');
    if (ar.length > 1) {
      return function(obj) {
        for (let i = 0; obj && i < ar.length; i++) {
          obj = obj[ar[i]];
        }
        return obj;
      };
    }
    if (ar.length === 1) {
      return function(obj) {
        return obj[path];
      };
    }
    return function(obj) {
      return obj;
    };
  },
  stringMatches(s, search) {
    if (s && search) {
      const tmp = '' + s;
      return tmp.toLocaleLowerCase().indexOf(search.toLowerCase()) > -1;
    }
    return false;
  },
  getIntl() {
    return intl;
  },
  setIntl(nintl) {
    intl = nintl;
  },
  getString(key, defaultValue) {
    // return GanttStrings[key] || defaultValue || key;
    return this.getIntl().formatMessage({ id: key, defaultMessage: defaultValue });
  },
  formatString(tpl, obj) {
    // tpl = this.getString(tpl, tpl);
    // return tpl.replace(/\{(\w+)\}/g, (_, key) => obj[key]);
    return this.getIntl().formatMessage({ id: tpl, defaultMessage: obj}, obj);
  },
  addEventListener(target, evt, cb, capture) {
    if (target.addEventListener) {
      target.addEventListener(evt, cb, capture);
    } else if (target.attachEvent) {
      target.attachEvent(`on${evt}`, cb);
    }
  },
  removeEventListener(target, evt, cb) {
    if (target.removeEventListener) {
      target.removeEventListener(evt, cb, false);
    } else if (target.detachEvent) {
      target.detachEvent(`on${evt}`, cb);
    }
  },

  implements(clazz) {
    for (let i = 1, count = arguments.length; i < count; i++) {
      const toImplement = arguments[i];
      for (const key in toImplement) {
        if (toImplement.hasOwnProperty(key)) {
          clazz[key] = toImplement[key];
        }
      }
    }
    return clazz;
  },

  detectIE() {
    // https://codepen.io/gapcode/pen/vEJNZN
    const ua = window.navigator.userAgent;

    // Test values; Uncomment to check result …

    // IE 10
    // ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';

    // IE 11
    // ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';

    // Edge 12 (Spartan)
    // ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36 Edge/12.0';

    // Edge 13
    // ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586';

    const msie = ua.indexOf('MSIE ');
    if (msie > 0) {
      // IE 10 or older => return version number
      return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    const trident = ua.indexOf('Trident/');
    if (trident > 0) {
      // IE 11 => return version number
      const rv = ua.indexOf('rv:');
      return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    const edge = ua.indexOf('Edge/');
    if (edge > 0) {
      // Edge (IE 12+) => return version number
      return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }

    // other browser
    return false;
  },
};

Gantt.utils.isInteger = Number.isInteger;

Gantt.utils.appendSVG = function(elt, cfg) {
  const svgElt = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  // svgElt.setAttribute("viewBox", "0 0 " + config.svg.width + " " + config.svg.height);
  svgElt.setAttribute('viewBox', cfg.viewBox);
  svgElt.style.x = '0';
  svgElt.style.y = '0';
  svgElt.style.width = `${cfg.width}px`;
  svgElt.style.height = `${cfg.height}px`;
  // Overrides the transformY(4px) from analytics CSS
  svgElt.style.webkitTransform = 'none';
  svgElt.style.transform = 'none';
  if (cfg.margin) {
    svgElt.style.margin = cfg.margin;
  } else {
    svgElt.style.margin = '0';
  }
  const paths = (Array.isArray(cfg.paths) && cfg.paths) || [cfg.paths];
  paths.forEach(p => {
    const pathElt = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElt.setAttribute('d', p);
    svgElt.appendChild(pathElt);
  });
  elt.appendChild(svgElt);
};

//
// DataFetcher
//
/**
 * Utility class for accessing remote or local data
 * @
 * @param config Configuration for accessing data.
 * @constructor
 */
class DataFetcher {
  /**
   * Constructs a new data fetcher associated with specified context and parameterized with the provided
   * options.
   * @param config parameters describing the access to data.
   * @param privateFields (Array) list of fields to not take into account when parsing the configuration.
   * @param settings the settings object to provide contextual info to user's callbacks.
   */
  constructor(config, privateFields, settings) {
    const createEntry = (name, cfg) => {
      const ctx = config.context || config;
      const postProcess = data => {
        let p = (data && data.then && data) || Promise.resolve(data);
        if (config.success) {
          p = p.then(data => config.success.call(ctx, data, settings));
        }
        return p;
      };
      if (Gantt.utils.isFunction(cfg)) {
        this[name] = (...params) => {
          try {
            return cfg.apply(settings, params);
          } catch (err) {
            return Promise.reject(err);
          }
        };
      } else if (config.url) {
        // make the ajax call
        const ajaxConfig = Gantt.utils.mergeObjects({ success: cfg.success, settings }, cfg.ajaxConfig);
        this[name] = () => Gantt.utils.ajax(cfg.url, ajaxConfig);
      } else if (Gantt.utils.isArray(config)) {
        this[name] = () => Promise.resolve(config);
      } else {
        const { data } = config;
        if (data) {
          if (Gantt.utils.isString(data)) {
            if (!ctx) {
              throw `No context defined for data fetcher ${name}`;
            }
            const propEval = Gantt.utils.propertyEvaluator(data);
            const fct = typeof ctx === 'function';
            this[name] = model => {
              model = model || (fct ? ctx() : ctx);
              if (model && model.then) {
                // Check if promise. See https://promisesaplus.com/#point-53
                return model.then(res => postProcess(propEval(res)));
              }
              return postProcess(propEval(model));
            };
          } else if (Gantt.utils.isFunction(data)) {
            const fct = typeof ctx === 'function';
            this[name] = model => {
              model = model || (fct ? ctx() : ctx);
              if (model && model.then) {
                // Check if promise. See https://promisesaplus.com/#point-53
                return model.then(res => postProcess(data.call(ctx, model)));
              }
              try {
                return postProcess(data.call(ctx, model));
              } catch (err) {
                return Promise.reject(err);
              }
            };
          } else {
            this[name] = () => postProcess(data);
          }
        } else {
          throw `Data definition for ${JSON.stringify(
            config
          )} for '${name}' does not define ajax parameters nor static data`;
        }
      }
    };

    if (Gantt.utils.isFunction(config)) {
      createEntry('get', config, {});
    } else if (Gantt.utils.isArray(config)) {
      createEntry('get', config, {});
    } else {
      const defConfig = { context: settings };
      const entryConfigs = [];
      let useDefault;
      for (let i = 0, prop, keys = Object.keys(config); i < keys.length; i++) {
        prop = keys[i];
        if (prop === 'data' || prop === 'url' || prop === 'success' || prop === 'context' || prop === 'ajaxConfig') {
          defConfig[prop] = config[prop];
          useDefault = true;
        } else if (!privateFields || privateFields.indexOf(prop) < 0) {
          entryConfigs.push(prop);
          entryConfigs.push(config[prop]);
        }
      }

      for (let i = 0, prop; i < entryConfigs.length; ) {
        prop = entryConfigs[i++];
        createEntry(
          prop,
          (useDefault && Gantt.utils.mergeObjects({}, defConfig, entryConfigs[i++])) || entryConfigs[i++],
          defConfig
        );
      }
      if (!entryConfigs.length && useDefault) {
        createEntry('get', defConfig);
      }
    }
  }
}

Gantt.components.DataFetcher.impl = DataFetcher;

//
// Tooltip
//

// See https://developer.mozilla.org/en-US/docs/Web/Events/wheel
let prefix = '';
let _addEventListener;

// detect event model
if (window.addEventListener) {
  _addEventListener = 'addEventListener';
} else {
  _addEventListener = 'attachEvent';
  prefix = 'on';
}

// detect available wheel event
// noinspection JSUnresolvedVariable
const support =
  'onwheel' in document.createElement('div')
    ? 'wheel' // Modern browsers support "wheel"
    : document.onmousewheel !== undefined
    ? 'mousewheel' // Webkit and IE support at least "mousewheel"
    : 'DOMMouseScroll'; // let's assume that remaining browsers are older Firefox

window.addWheelListener = function(elem, callback, useCapture) {
  _addWheelListener(elem, support, callback, useCapture);

  // handle MozMousePixelScroll in older Firefox
  if (support === 'DOMMouseScroll') {
    _addWheelListener(elem, 'MozMousePixelScroll', callback, useCapture);
  }
};

function _addWheelListener(elem, eventName, callback, useCapture) {
  elem[_addEventListener](
    prefix + eventName,
    support === 'wheel'
      ? callback
      : originalEvent => {
          !originalEvent && (originalEvent = window.event);

          // create a normalized event object
          const event = {
            // keep a ref to the original event object
            originalEvent,
            target: originalEvent.target || originalEvent.srcElement,
            type: 'wheel',
            deltaMode: originalEvent.type === 'MozMousePixelScroll' ? 0 : 1,
            deltaX: 0,
            deltaY: 0,
            deltaZ: 0,
            altKey: originalEvent.altKey,
            ctrlKey: originalEvent.ctrlKey,
            shiftKey: originalEvent.shiftKey,

            preventDefault() {
              originalEvent.preventDefault ? originalEvent.preventDefault() : (originalEvent.returnValue = false);
            },
          };

          // calculate deltaY (and deltaX) according to the event
          if (support === 'mousewheel') {
            event.deltaY = (-1 / 40) * originalEvent.wheelDelta;
            // Webkit also support wheelDeltaX
            // noinspection JSUnresolvedVariable
            originalEvent.wheelDeltaX && (event.deltaX = (-1 / 40) * originalEvent.wheelDeltaX);
          } else {
            event.deltaY = originalEvent.detail;
          }

          // it's time to fire the callback
          return callback(event);
        },
    useCapture || false
  );
}

/*                                                                                      */
/*                                                                                      */
/*                                  Date formatting                                     */
/*                                                                                      */
/*                                                                                      */
var dateFormat = (function() {
  const token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g;
  const timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;
  const timezoneClip = /[^-+\dA-Z]/g;
  const pad = function(val, len) {
    val = String(val);
    len = len || 2;
    while (val.length < len) val = `0${val}`;
    return val;
  };

  // Regexes and supporting functions are cached through closure
  return function(date, mask, utc) {
    const dF = dateFormat;

    // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
    if (arguments.length === 1 && Object.prototype.toString.call(date) === '[object String]' && !/\d/.test(date)) {
      mask = date;
      date = undefined;
    }

    // Passing date through Date applies Date.parse, if necessary
    date = date ? new Date(date) : new Date();
    if (Number.isNaN(date)) throw SyntaxError('invalid date');

    mask = String(dF.masks[mask] || mask || dF.masks.default);

    // Allow setting the utc argument via the mask
    if (mask.slice(0, 4) === 'UTC:') {
      mask = mask.slice(4);
      utc = true;
    }

    const _ = utc ? 'getUTC' : 'get';
    const d = date[`${_}Date`]();
    const D = date[`${_}Day`]();
    const m = date[`${_}Month`]();
    const y = date[`${_}FullYear`]();
    const H = date[`${_}Hours`]();
    const M = date[`${_}Minutes`]();
    const s = date[`${_}Seconds`]();
    const L = date[`${_}Milliseconds`]();
    const o = utc ? 0 : date.getTimezoneOffset();
    const flags = {
      d,
      dd: pad(d),
      ddd: dF.i18n.dayNames[D],
      dddd: dF.i18n.dayNames[D + 7],
      m: m + 1,
      mm: pad(m + 1),
      mmm: dF.i18n.monthNames[m],
      mmmm: dF.i18n.monthNames[m + 12],
      yy: String(y).slice(2),
      yyyy: y,
      h: H % 12 || 12,
      hh: pad(H % 12 || 12),
      H,
      HH: pad(H),
      M,
      MM: pad(M),
      s,
      ss: pad(s),
      l: pad(L, 3),
      L: pad(L > 99 ? Math.round(L / 10) : L),
      t: H < 12 ? 'a' : 'p',
      tt: H < 12 ? 'am' : 'pm',
      T: H < 12 ? 'A' : 'P',
      TT: H < 12 ? 'AM' : 'PM',
      Z: utc ? 'UTC' : (String(date).match(timezone) || ['']).pop().replace(timezoneClip, ''),
      o: (o > 0 ? '-' : '+') + pad(Math.floor(Math.abs(o) / 60) * 100 + (Math.abs(o) % 60), 4),
      S: ['th', 'st', 'nd', 'rd'][d % 10 > 3 ? 0 : (((d % 100) - (d % 10) !== 10) * d) % 10],
    };

    return mask.replace(token, function($0) {
      return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
    });
  };
})();

// Some common format strings
dateFormat.masks = {
  default: 'ddd mmm dd yyyy HH:MM:ss',
  shortDate: 'm/d/yy',
  mediumDate: 'mmm d, yyyy',
  longDate: 'mmmm d, yyyy',
  fullDate: 'dddd, mmmm d, yyyy',
  shortTime: 'h:MM TT',
  mediumTime: 'h:MM:ss TT',
  longTime: 'h:MM:ss TT Z',
  isoDate: 'yyyy-mm-dd',
  isoTime: 'HH:MM:ss',
  isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
  isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'",
};

// Internationalization strings
dateFormat.i18n = {
  dayNames: [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ],
  monthNames: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
};

// For convenience...
Date.prototype.format = function(mask, utc) {
  return dateFormat(this, mask || Gantt.utils.defaultDateFormat, utc);
};

//
// Palette
//

class Palette extends Gantt.components.Palette {
  constructor(config) {
    super(config);
    this.colorSet = null;
    this.setConfiguration(config);
  }

  setConfiguration(config) {
    let maxColorsSize = -1;
    const addColorSet = (col, size) => {
      if (col.length >= maxColorsSize) {
        this.colorSet[size] = col;
        maxColorsSize = col.length;
      } else {
        const insert = size - 1;
        while (insert >= 0 && this.colorSet[insert].length < col.length) {
          this.colorSet[i] = this.colorSet[i - 1];
        }
        this.colorSet[insert === -1 ? 0 : insert] = col;
      }
    };

    const getColorsFromSet = count => {
      for (let index = 0, setCount = this.colorSet.length; index < setCount; ++index) {
        if (this.colorSet[index].length >= count) {
          return this.colorSet[index];
        }
      }
      return (this.colorSet.length && this.colorSet[this.colorSet.length - 1]) || null;
    };

    if (Gantt.utils.isArray(config)) {
      const count = config.length;
      if (count) {
        if (Gantt.utils.isArray(config[0])) {
          // If defining a set of color collections
          this.colorSet = new Array(count);
          // Sort color collections in this.colorSet from the lowest number of colors to the greatest.
          // Algo is optimized for case when receiving ordered array of color collections.
          for (let i = 0; i < count; i++) {
            addColorSet(config[i], i);
          }
          this._getColors = getColorsFromSet;
        } else {
          this.colors = config;
          this._getColors = () => this.colors;
        }
      } else {
        this._getColors = () => null;
      }
    } else if (Gantt.utils.isFunction(config)) {
      this._getColors = config;
    } else {
      const keys = Object.keys(config);
      const keyCount = keys.length;
      let size = 0;
      this.colorSet = new Array(keyCount);
      for (let i = 0, val; i < keyCount; ++i) {
        if (Gantt.utils.isArray((val = config[keys[i]]))) {
          addColorSet(val, size++);
        }
      }
      if (!size || size !== keyCount) {
        console.error(`Unkown palette configuration ${config}`);
        console.log(config);
        this._getColors = () => null;
        this.colorSet = null;
      } else {
        this._getColors = getColorsFromSet;
      }
    }
  }

  getColors(count) {
    function makeResult(ar) {
      const arLen = ar.length;
      if (count < 0 || arLen === count) return ar;
      if (arLen > count) return ar.slice(0, count);
      // Extremely bad temporary solution when number of required colors exceeds palette's size
      const result = new Array(count);
      for (let i = 0; i < count; ++i) {
        result[i] = ar[i % arLen];
      }
      return result;
    }
    const colors = this._getColors(count);
    return colors && makeResult(colors);
  }
}

Gantt.components.Palette.impl = Palette;

Gantt.defaultPaletteName = 'qualitative20';
Gantt.defaultPalettes[Gantt.defaultPaletteName] = new Palette([
  // IBM colors. See http://www.ibm.com/design/language/framework/visual/color/
  // '#5AA8F8', '#FFA573', '#8CD211', '#EFC100', '#AF6EE8', '#FDE876', '#FF5050', '#00B29E', '#152935', '#4178BC', '#562F72', '#C8F08F', '#FF7832', '#FDD600'
  // '#325C80', '#2D660A', '#4178BE', '#4B8401', '#5596E6', '#5AA701', '#5AAAFA', '#8CD211', '#7CC7FF', '#B4E051', '#C0E6FF', '#C8F08F', '#1D3649', '#0A3C02'
  // '#6EB400', '#FF7832', '#BA8FF7', '#F0F2F4'
  // '#9655D2', '#FF71D2', '#D92780', '#FF7D85', '#FCFAFA'
  /* '#C0E6FF', '#7CC7FF', '#5AAAFA', '#5596E6', '#4178BE', '#325C80' */ // blue palette
  /* "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a" // Brewer palette */
  // https://releases.fr.eurolabs.ibm.com/display/OS/Design+for+GANTT+CHART
  '#41D6C3',
  '#8CD211',
  '#5AAAFA',
  '#BA8FF7',
  '#00AE9A',
  '#5AA600',
  '#4178BE',
  '#9855D4',
  '#EFC100',
  '#FF7832',
  '#E71D32',
  '#325C80',
  '#AC8C00',
  '#D74108',
  '#AD1625',
  '#1D3649',
  '#FF71D4',
  '#DB2780',
  '#9D9393',
  '#645A5A',
]);

Gantt.components.GanttPanel.prototype.utils = Gantt.utils;
