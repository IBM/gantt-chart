import Gantt from './core';

Gantt.plugins = {
  plugins: [],

  /**
   * Registers the list of specified plugins if not already registered.
   * @param {Array|Object} plugins plugin instance(s).
   */
  register(plugins) {
    for (let i = 0; i < arguments.length; i++) {
      if (this.plugins.indexOf(arguments[i]) === -1) {
        this.plugins.push(arguments[i]);
      }
    }
  },

  /**
   * Unregisters the specified plugin if registered.
   * @param {Array|Object} plugins plugin instance(s).
   */
  unregister(plugins) {
    for (var i = 0, index; i < arguments.length; i++) {
      if ((index = this.plugins.indexOf(arguments[i])) !== -1) {
        this.plugins.splice(index, 1);
      }
    }
  },

  /**
   * Remove all registered plugins.
   * @see #register
   */
  clear() {
    this.plugins = [];
  },

  /**
   * Returns the number of registered plugins.
   * @returns {Number}
   */
  count() {
    return this.plugins.length;
  },

  /**
   * Returns all registered plugin instances.
   * @returns {Array} array of plugins.
   */
  getAll() {
    return this.plugins;
  },

  /**
   * Calls the registermed plugins on the specified method, with the provided args. This
   * method immediately returns as soon as a plugin returns a value. The
   * returned value can be used, for instance, to interrupt the current action.
   * @param {String|Boolean} method boolean to indicate the plugin call order of the name of the plugin method to call.
   * @param {...Object} args list to apply to the method call.
   * @returns {Object} the value false if any of the plugins return false, otherwise returns true.
   */
  call(method, ...args) {
    let paramsStart;
    let reverse;
    if (typeof method !== 'string') {
      reverse = method;
      method = arguments[1];
      paramsStart = 2;
    } else {
      paramsStart = 1;
    }
    const params = Array.prototype.slice.call(arguments, paramsStart);
    for (
      let i = reverse ? this.plugins.length - 1 : 0,
        inc = reverse ? -1 : 1,
        end = reverse ? -1 : this.plugins.length,
        result;
      i !== end;
      i += inc
    ) {
      const plugin = this.plugins[i];
      if (typeof plugin[method] === 'function') {
        if ((result = plugin[method].apply(plugin, params)) !== undefined) {
          return result;
        }
      }
    }
  },
};

/**
 * Plugin extension methods.
 * @interface Gantt.PluginBase
 */
export default class Plugin {
  // Called at start of Gantt init
  beforeInit() {}

  // Called at end of Gantt init
  afterInit() {}

  // Called at start of update
  beforeUpdate() {}

  // Called at end of update
  afterUpdate() {}

  // Called at start of draw
  beforeDraw() {}

  // Called at end of draw
  afterDraw() {}

  // Called during destroy
  destroy() {}
}
