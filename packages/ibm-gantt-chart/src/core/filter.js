import Gantt from './core';

class Filter {
  constructor(options) {
    this.filters = [];
    this.filterKeys = [];
    if (options) {
      if (Array.isArray(options)) {
        for (let i = 0; i < options.length; i++) {
          this.addFilter(options[i]);
        }
      } else {
        this.addFilter(options);
      }
    }
  }

  addFilter(filter) {
    const filterKey = filter;
    filter = this.createFilter(filter);
    if (filter) {
      this.filters.push(filter);
      this.filterKeys.push(filterKey);
    }
    return filter;
  }

  addOrFilters() {
    const params = new Array(arguments.length);
    for (let i = 0; i < arguments.length; i++) {
      params[i] = arguments[i];
    }
    const filter = this.createFilterSet(params, true);
    if (filter) {
      this.filters.push(filter);
      this.filterKeys.push(filter);
    }
    return filter;
  }

  addAndFilters() {
    const params = new Array(arguments.length);
    for (let i = 0; i < arguments.length; i++) {
      params[i] = arguments[i];
    }
    const filter = this.createFilterSet(params, false);
    if (filter) {
      this.filters.push(filter);
      this.filterKeys.push(filter);
    }
    return filter;
  }

  static get DEFAULT_FILTER_SET_MODE_OR() {
    return false;
  }

  createFilterSet() {
    if (!arguments.length) {
      return null;
    }
    let paramList;
    let orFilter;
    let i;
    let filter;
    if (Array.isArray(arguments[0])) {
      paramList = arguments[0];
      orFilter = arguments.length > 1 ? arguments[1] : this.DEFAULT_FILTER_SET_MODE_OR;
    } else {
      let copyLength;
      orFilter = arguments[arguments.length - 1];
      if (typeof orFilter !== 'boolean') {
        orFilter = this.DEFAULT_FILTER_SET_MODE_OR;
        copyLength = arguments.length;
      } else {
        copyLength = arguments.length - 1;
      }
      paramList = new Array(copyLength);
      for (i = 0; i < copyLength; i++) {
        paramList[i] = arguments[i];
      }
    }
    const filterList = [];
    for (i = 0; i < paramList.length; i++) {
      filter = this.createFilter(paramList[i]);
      if (filter) {
        filterList.push(filter);
      }
    }
    if (filterList.length) {
      filter = orFilter
        ? function(args) {
            for (let f = 0; f < filterList.length; f++) {
              if (filterList[f](args)) {
                return true;
              }
            }
            return false;
          }
        : function(args) {
            for (let f = 0; f < filterList.length; f++) {
              if (!filterList[f](args)) {
                return false;
              }
            }
          };
      return filter;
    }
    return null;
  }

  removeFilter(filter) {
    let index = this.filters.indexOf(filter);
    if (index < 0) {
      index = this.filterKeys.indexOf(filter);
    }
    if (index > -1) {
      this.filters.splice(index, 1);
      this.filterKeys.splice(index, 1);
      return true;
    }
    return false;
  }

  createFilter(filter) {
    if (filter !== undefined) {
      const self = this;
      if (typeof filter === 'string') {
        return (
          (filter &&
            function() {
              const params = arguments[0];
              params.push(filter);
              const result = self.acceptString.apply(self, params);
              params.pop();
              return result;
            }) ||
          function() {
            return true;
          }
        );
      }
      if (typeof filter === 'function') {
        return function() {
          return filter.apply(self, arguments[0]);
        };
      }
      if (filter[this.getObjectFilterMethodName()]) {
        // Filter is an object with the appropriate filter method
        const fct = filter[this.getObjectFilterMethodName()];
        return function() {
          return fct.apply(filter, arguments[0]);
        };
      }
      if (filter.or) {
        return this.createFilterSet(filter.or, true);
      }
      if (filter.and) {
        return this.createFilterSet(filter.and, false);
      }

      console.log('Cannot process filter:');
      console.log(filter);
    } else {
      console.log('Null filter specified');
    }
    return null;
  }

  accept() {
    const params = [];
    let i;
    for (i = 0; i < arguments.length; i++) {
      params.push(arguments[i]);
    }

    for (i = 0; i < this.filters.length; i++) {
      if (!this.filters[i].call(this, params)) {
        return false;
      }
    }
    return true;
  }

  setFilter(filter) {
    this.filters = [];
    this.filterKeys = [];
    const params = [];
    let i;
    for (i = 0; i < arguments.length; i++) {
      params.push(arguments[i]);
    }
    this.addFilter.apply(this, params);
  }

  stringMatches(string, pattern) {
    return string.indexOf(pattern) > -1;
  }

  acceptString(object, str) {}

  getObjectFilterMethodName() {
    return 'accept';
  }

  isEmpty() {
    return this.filters.length === 0;
  }
}

Gantt.components.Filter.impl = Filter;

export default Filter;
