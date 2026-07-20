import Gantt from '../core';

export default class Renderer {
  constructor(config, proto, paletteHandler) {
    if (proto) {
      Gantt.utils.mergeObjects(this, proto);
    }
    this.config = config;
    this.paletteHandler = paletteHandler;
    this.setConfiguration(config);
  }

  setConfiguration(config) {}
}
