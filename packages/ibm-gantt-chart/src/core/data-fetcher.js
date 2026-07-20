import Gantt from './core';

/** @typedef {import('./types').DataFetchConfig} DataFetchConfig */
/** @typedef {import('./types').Activity} Activity */
/** @typedef {import('./types').Resource} Resource */

//
// DataFetcher
//
/**
 * Utility class for accessing remote or local data
 * @param {DataFetchConfig|DataFetchConfig[]|(Activity|Resource)[]} config Configuration for accessing data.
 * @param {string[]} [privateFields] list of fields to not take into account when parsing the configuration.
 * @param {object} [settings] the settings object to provide contextual info to user's callbacks.
 * @constructor
 */
class DataFetcher {
  /**
   * Constructs a new data fetcher associated with specified context and parameterized with the provided
   * options.
   * @param {DataFetchConfig|DataFetchConfig[]|(Activity|Resource)[]} config parameters describing the access to data.
   * @param {string[]} [privateFields] list of fields to not take into account when parsing the configuration.
   * @param {object} [settings] the settings object to provide contextual info to user's callbacks.
   */
  constructor(config, privateFields, settings) {
    const createEntry = (name, cfg) => {
      const ctx = config.context || config;
      const postProcess = (data) => {
        let p = (data && data.then && data) || Promise.resolve(data);
        if (config.success) {
          p = p.then((data) => config.success.call(ctx, data, settings));
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
        this[name] = () => postProcess(Gantt.utils.ajax(cfg.url, ajaxConfig));
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
            this[name] = (model) => {
              model = model || (fct ? ctx() : ctx);
              if (model && model.then) {
                // Check if promise. See https://promisesaplus.com/#point-53
                return model.then((res) => postProcess(propEval(res)));
              }
              return postProcess(propEval(model));
            };
          } else if (Gantt.utils.isFunction(data)) {
            const fct = typeof ctx === 'function';
            this[name] = (model) => {
              model = model || (fct ? ctx() : ctx);
              if (model && model.then) {
                // Check if promise. See https://promisesaplus.com/#point-53
                return model.then((res) => postProcess(data.call(ctx, model)));
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
    } else if (config && typeof config === 'object') {
      const defConfig = { context: settings };
      const entryConfigs = [];
      let useDefault;
      const knownProps = ['data', 'url', 'success', 'context', 'ajaxConfig'];

      for (let i = 0, prop, keys = Object.keys(config); i < keys.length; i++) {
        prop = keys[i];
        // Type-safe property access with validation
        if (knownProps.includes(prop)) {
          const propValue = config[prop];
          if (propValue !== undefined) {
            defConfig[prop] = propValue;
            useDefault = true;
          }
        } else if (!privateFields || privateFields.indexOf(prop) < 0) {
          entryConfigs.push(prop);
          const configValue = config[prop];
          if (configValue !== undefined) {
            entryConfigs.push(configValue);
          }
        }
      }

      for (let i = 0, prop; i < entryConfigs.length;) {
        prop = entryConfigs[i++];
        const entryValue = entryConfigs[i++];
        createEntry(
          prop,
          (useDefault && Gantt.utils.mergeObjects({}, defConfig, entryValue)) || entryValue,
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

export default DataFetcher;
