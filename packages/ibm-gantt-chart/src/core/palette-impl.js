import Gantt from './core';

/** @typedef {import('./types').PaletteConfig} PaletteConfig */

class Palette extends Gantt.components.Palette {
  /**
   * @param {PaletteConfig} config
   */
  constructor(config) {
    super(config);
    /** @type {string[][] | null} */
    this.colorSet = null;
    this.setConfiguration(config);
  }

  /**
   * @param {PaletteConfig} config
   */
  setConfiguration(config) {
    let maxColorsSize = -1;
    const addColorSet = (col, size) => {
      if (!Array.isArray(col) || !this.colorSet) return;
      if (col.length >= maxColorsSize) {
        this.colorSet[size] = col;
        maxColorsSize = col.length;
      } else {
        const insert = size - 1;
        for (let idx = insert; idx >= 0 && this.colorSet[idx].length < col.length; idx--) {
          this.colorSet[idx + 1] = this.colorSet[idx];
        }
        this.colorSet[insert === -1 ? 0 : insert] = col;
      }
    };

    const getColorsFromSet = (count) => {
      if (!this.colorSet) return null;
      for (let index = 0, setCount = this.colorSet.length; index < setCount; ++index) {
        if (this.colorSet[index] && this.colorSet[index].length >= count) {
          return this.colorSet[index];
        }
      }
      return (this.colorSet.length && this.colorSet[this.colorSet.length - 1]) || null;
    };

    if (Gantt.utils.isArray(config)) {
      const count = config.length;
      if (count) {
        const firstElem = config[0];
        if (Gantt.utils.isArray(firstElem)) {
          // If defining a set of color collections
          this.colorSet = new Array(count);
          // Sort color collections in this.colorSet from the lowest number of colors to the greatest.
          // Algo is optimized for case when receiving ordered array of color collections.
          for (let i = 0; i < count; i++) {
            const colorArray = config[i];
            if (Array.isArray(colorArray)) {
              addColorSet(colorArray, i);
            }
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
    } else if (config && typeof config === 'object') {
      const keys = Object.keys(config);
      const keyCount = keys.length;
      let size = 0;
      this.colorSet = new Array(keyCount);
      for (let i = 0; i < keyCount; ++i) {
        const key = keys[i];
        const val = config[key];
        if (Gantt.utils.isArray(val)) {
          addColorSet(val, size++);
        }
      }
      if (!size || size !== keyCount) {
        Gantt.log.error(`Unknown palette configuration: ${JSON.stringify(config)}`);
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

export default Palette;
