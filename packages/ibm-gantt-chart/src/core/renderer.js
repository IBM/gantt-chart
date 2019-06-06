import Gantt from './core';

const AUTOMATIC_COLOR = 'automatic';
const TEXT_OVERFLOW_ELLIPSIS = 'ellipsis';
const TEXT_OVERFLOW_NO_DISPLAY = 'noDisplay';
const TEXT_OVERFLOW_CUT = 'cut';

function createSelectorFunction(selector, fct, oldFct, fctCtx) {
  return (
    fct &&
    function(object, ctx, ext) {
      if (!selector || selector(object, ctx)) {
        return fctCtx ? fct.call(fctCtx, object, ctx, ext) : fct(object, ctx, ext);
      }
      return (oldFct && oldFct(object, ctx, ext)) || undefined;
    }
  );
}

export default class Renderer extends Gantt.components.Renderer {
  constructor(config, proto, paletteHandler) {
    super(config, proto, paletteHandler);
  }

  draw(object, parentElt, ctx) {
    const shapeElt = (this.createShape && this.createShape(object, parentElt, ctx)) || null;
    if (this.getCSS) {
      const css = this.getCSS(object, ctx);
      if (css) {
        this.setCSS(shapeElt || parentElt, css);
      }
    }
    if ((this.getText || this.getIcon) && this.drawContent) {
      const text = this.getText && this.getText(object, ctx);
      const icon = this.getIcon && this.getIcon(object, ctx);
      this.drawContent(shapeElt || parentElt, icon, text, object, ctx);
    }
    let bg;
    if (this.background) {
      bg = this.background(object, ctx);
      if (bg) {
        this.setBackground(shapeElt, bg);
      }
    }
    if (this.color) {
      this.setColor(shapeElt, this.color(object, ctx, bg));
    }
    if (parentElt && shapeElt !== parentElt) {
      parentElt.appendChild(shapeElt);
    }
    return shapeElt;
  }

  setBackground(shapeElt, bg) {
    shapeElt.style.backgroundColor = bg;
  }

  setColor(shapeElt, c) {
    shapeElt.style.color = c;
  }

  setCSS(elt, classname) {
    if (classname) {
      elt.className = (elt.className && `${elt.className} ${classname}`) || classname;
    }
  }

  // noinspection JSUnusedLocalSymbols
  createShape(object, parentElt, ctx) {
    return null;
  }

  // noinspection JSUnusedLocalSymbols
  drawContent(elt, icon, text, object, ctx) {
    this.drawDefaultContent(elt, icon, text, object, ctx);
  }

  drawNoDisplayOverflowContent(elt, icon, text, object, ctx) {
    const ctnt = document.createElement('div');
    ctnt.className = 'content';
    ctnt.style.overflow = 'hidden';
    ctnt.style.display = 'flex'; // Cannot used as issue with FF https://github.ibm.com/IBMDecisionOptimization/dd-gantt-component/issues/14
    /* ctnt.style.alignItems = 'center'; */ ctnt.style.justifyContent = 'center';
    ctnt.style.left = '0';
    ctnt.style.top = '0';
    ctnt.style.bottom = '0';
    ctnt.style.right = '0';
    ctnt.style.position = 'absolute';
    ctnt.style.flexWrap = 'wrap';

    if (icon) {
      const img = document.createElement('img');
      img.className = 'image-content';
      img.src = icon;
      img.alt = '';
      img.style.float = 'left';
      ctnt.appendChild(img);
    }

    const separator = document.createElement('div');
    separator.style.width = '1px';
    separator.style.display = 'inline-block';
    separator.style.height = '100%';
    ctnt.appendChild(separator);

    const t = document.createElement('div');
    t.className = 'text-content';
    t.innerHTML = text;
    t.style.display = 'flex';
    t.style.alignItems = 'center';
    t.style.whiteSpace = 'nowrap';
    t.style.height = '100%';
    t.style.textAlign = 'center';
    ctnt.appendChild(t);
    elt.appendChild(ctnt);
  }

  drawCutContent(elt, icon, text, object, ctx) {
    if (icon) {
      const img = document.createElement('img');
      img.className = 'image-content';
      img.src = icon;
      img.alt = '';
      elt.appendChild(img);
    }
    elt.style.overflow = 'hidden';
    const t = document.createElement('div');
    t.className = 'text-content';
    t.innerHTML = text;
    elt.appendChild(t);
    return t;
  }

  drawEllipsisContent(elt, icon, text, object, ctx) {
    if (icon) {
      const img = document.createElement('img');
      img.className = 'image-content';
      img.src = icon;
      img.alt = '';
      elt.appendChild(img);
    }
    const t = document.createElement('div');
    t.className = 'text-content';
    t.style.textOverflow = 'ellipsis';
    t.style.overflow = 'hidden';
    t.innerHTML = text;
    elt.appendChild(t);
    return t;
  }

  drawOverflowVisibleContent(elt, icon, text, object, ctx) {
    if (icon) {
      const img = document.createElement('img');
      img.className = 'image-content';
      img.src = icon;
      img.alt = '';
      img.style.float = 'left';
      elt.appendChild(img);
    }
    const t = document.createElement('div');
    t.className = 'text-content';
    t.overflow = 'visible';
    t.innerHTML = text;
    elt.appendChild(t);
    return t;
  }

  filter(object, row, search) {
    if (this.getText && search) {
      const text = this.getText(object, row);
      return text && Gantt.utils.stringMatches(text, search);
    }
    return false;
  }

  createCSSGetter(selector, classOptions, ctx) {
    if (typeof classOptions === 'function') {
      // Function is given the object to render in parameter and returns a set of CSS classes
      return createSelectorFunction(selector, classOptions, null, ctx);
    }
    if (typeof classOptions === 'string') {
      if (classOptions[0] === '@') {
        // The string represents the accessor to the object property providing the CSS class
        return createSelectorFunction(selector, Gantt.utils.propertyEvaluator(classOptions.substring(1)));
      }

      return createSelectorFunction(selector, () => classOptions);
    }
    // Else the config is a descriptive object of the CSS setter
    if (!classOptions.property) {
      console.warn('Missing "property" field in class setter description:');
      console.warn(classOptions);
      return null;
    }

    const propGetter = Gantt.utils.propertyEvaluator(classOptions.property);
    return createSelectorFunction(selector, obj => {
      let prop = propGetter.call(obj, obj);
      if (prop) {
        if (classOptions.prefix) {
          prop = classOptions.prefix + prop;
        }
        if (classOptions.suffix) {
          prop = classOptions.suffix + prop;
        }
      }
      return prop;
    });
  }

  addCSSConfiguration(selector, classes, ctx) {
    let i;
    let getter;
    if (!Gantt.utils.isArray(classes)) {
      classes = [classes];
    }
    for (i = 0; i < classes.length; i++) {
      getter = this.createCSSGetter(selector, classes[i], ctx);
      if (getter) {
        if (this.cssGetters) {
          this.cssGetters.push(getter);
        } else {
          this.cssGetters = [getter];
          this.getCSS = function(object, ctx) {
            let cssClasses = '';
            let cssToAdd;
            for (let i = 0; i < this.cssGetters.length; i++) {
              cssToAdd = this.cssGetters[i](object, ctx);
              if (cssToAdd) {
                cssClasses = (cssClasses && `${cssClasses} ${cssToAdd}`) || cssToAdd;
              }
            }
            return cssClasses;
          };
        }
      }
    }
  }

  addFilterConfiguration(selector, config, ctx) {
    let filter;
    if (typeof config === 'function') {
      filter = (...params) => config.apply(ctx, params);
    } else if (typeof config === 'string') {
      const getter = Gantt.utils.propertyEvaluator(config);
      if (getter) {
        filter = function(object, ctx, search) {
          if (search) {
            const value = getter(object, ctx);
            return value && Gantt.utils.stringMatches(value, search);
          }
          return true;
        };
      }
    } else {
      console.warn('Cannot process filter config. Must be a string or a function.');
      console.warn(config);
    }
    if (filter) {
      const oldFilter = this.filter;
      this.filter = function(object, ctx, search) {
        if (!oldFilter(object, ctx, search)) {
          return false;
        }
        if (!selector || selector(object)) {
          if (!filter(object, ctx, search)) {
            return false;
          }
        }
        return true;
      };
    }
  }

  addTooltipPropertiesConfiguration(selector, config, ctx) {
    let tooltipPropsGetter;
    if (typeof config === 'function') {
      tooltipPropsGetter = config;
    } else {
      console.warn('Cannot process tooltip properties config. Must be a a function.');
      console.warn(config);
    }
    if (tooltipPropsGetter) {
      if (selector) {
        this.getTooltipProperties = createSelectorFunction(
          selector,
          tooltipPropsGetter,
          this.getTooltipProperties,
          ctx
        );
      } else this.getTooltipProperties = tooltipPropsGetter;
    }
  }

  addTooltipConfiguration(selector, config, ctx) {
    let tooltipGetter;
    if (typeof config === 'function') {
      tooltipGetter = (...params) => config.apply(ctx, params);
    } else {
      console.warn('Cannot process tooltip config. Must be a function.');
      console.warn(config);
    }
    if (tooltipGetter) {
      if (selector) {
        this.getTooltip = createSelectorFunction(selector, tooltipGetter, this.getTooltip);
      } else this.getTooltip = tooltipGetter;
    }
  }

  addTextConfiguration(selector, config, ctx) {
    let textGetter;
    if (typeof config === 'function') {
      textGetter = (...params) => config.apply(ctx, params);
    } else if (typeof config === 'string') {
      textGetter = Gantt.utils.propertyEvaluator(config);
    } else {
      console.warn('Cannot process text config. Must be a string or a function.');
      console.warn(config);
    }
    if (textGetter) {
      if (selector) {
        this.getText = createSelectorFunction(selector, textGetter, this.getText);
      } else this.getText = textGetter;
    }
  }

  addIconConfiguration(selector, config, ctx) {
    let iconGetter;
    if (typeof config === 'function') {
      iconGetter = (...params) => config.apply(ctx, params);
    } else if (typeof config === 'string') {
      iconGetter = Gantt.utils.propertyEvaluator(config);
    } else {
      console.warn('Cannot process icon config. Must be a string or a function.');
      console.warn(config);
    }
    if (iconGetter) {
      if (selector) {
        this.getIcon = createSelectorFunction(selector, iconGetter, this.getIcon);
      } else this.getIcon = iconGetter;
    }
  }

  addDrawConfiguration(selector, config) {
    if (selector) {
      const oldDraw = this.draw;
      this.draw = function(object, elt, ctx) {
        if (selector(object, ctx)) {
          config.draw(object, elt, ctx);
        } else {
          oldDraw(object, elt, ctx);
        }
      };
    } else {
      this.draw = function(object, elt, ctx) {
        config.draw(object, elt, ctx);
      };
    }
  }

  addDrawContentConfiguration(selector, config) {
    if (selector) {
      const oldDrawContent = this.drawContent;
      this.drawContent = function(elt, text, object, ctx) {
        if (selector(object, ctx)) {
          config.drawContent(elt, text, object, ctx);
        } else {
          oldDrawContent(elt, text, object, ctx);
        }
      };
    } else {
      this.drawContent = function(elt, text, object, ctx) {
        config.drawContent(elt, text, object, ctx);
      };
    }
  }

  addTextOverflowConfiguration(selector, config) {
    let drawDefaultContent;
    if (config === TEXT_OVERFLOW_ELLIPSIS) {
      drawDefaultContent = this.drawEllipsisContent;
    } else if (config === TEXT_OVERFLOW_NO_DISPLAY) {
      drawDefaultContent = this.drawNoDisplayOverflowContent;
    } else if (config === TEXT_OVERFLOW_CUT) {
      drawDefaultContent = this.drawCutContent;
    }
    if (selector) {
      const oldDrawDefaultContent = this.drawDefaultContent;
      this.drawDefaultContent = function(elt, text, object, ctx) {
        if (selector(object, ctx)) {
          drawDefaultContent.call(this, elt, text, object, ctx);
        } else {
          oldDrawDefaultContent.call(this, elt, text, object, ctx);
        }
      };
    } else {
      this.drawDefaultContent = drawDefaultContent;
    }
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  getTextColorFromBackgroundColor(hexColor) {
    const rgb = this.hexToRgb(hexColor);
    // http://www.w3.org/TR/AERT#color-contrast
    const o = Math.round((rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000);
    return o > 125 ? '#383633' : 'white';
  }

  addColorConfiguration(selector, config, property, ctx) {
    let colorGetter;
    if (typeof config === 'function') {
      colorGetter = (...params) => config.apply(ctx, params);
    } else if (typeof config === 'string') {
      if (property === 'color' && AUTOMATIC_COLOR === config) {
        colorGetter = (obj, ctx, bg) => {
          const index = (this.colors && this.colors.indexOf(bg)) || -1;
          if (index < 0) {
            let textColor;
            try {
              textColor = this.getTextColorFromBackgroundColor(bg);
            } catch (err) {
              console.error(`Invalid color format ${bg}`);
              console.error(err);
              textColor = 'black';
            }
            if (!this.colors) {
              this.colors = [bg];
              this.textColors = [textColor];
            } else {
              this.colors.push(bg);
              this.textColors.push(textColor);
            }
            return textColor;
          }
          return this.textColors[index];
        };
      } else {
        colorGetter = Gantt.utils.propertyEvaluator(config);
      }
    } else {
      // Object describing how to get a color from a palette
      const paletteConfig = config.palette;
      const paletteRenderer = {
        paletteHandler: this.paletteHandler,
        colors: null,
        value: Gantt.utils.propertyEvaluator(config.getValue),
        getColor(obj, ctx) {
          const value = this.value(obj, ctx);
          const colors = this.colors || this.makeColors(obj, ctx); // makeColors leads to the creation of this.values
          let index = this.values.indexOf(value);
          if (index < 0) {
            index = this.values.length;
            this.values.push(value);
          }
          return index < 0 ? null : colors[index % colors.length];
        },
        getValues:
          config.values &&
          ((Gantt.utils.isFunction(config.values) && config.values) ||
            function() {
              return config.values;
            }),
        makeColors(obj, ctx) {
          let palette;
          if (paletteConfig) {
            if (Gantt.utils.isString(paletteConfig)) {
              palette = this.paletteHandler.getPalette(paletteConfig);
            } else {
              palette = new (Gantt.components.Palette.impl || Gantt.components.Palette)(paletteConfig);
            }
          } else {
            palette = this.paletteHandler.getPalette();
          }
          if (!palette && !this.colors) {
            console.error(`No palette found for ${paletteConfig}`);
            palette = Gantt.defaultPalettes[Gantt.defaultPaletteName];
          }
          this.values = (this.getValues && this.getValues(obj, ctx)) || [];
          this.colors = palette && palette.getColors(this.values.length || -1); // -1 for the max number of colors handled by the palette.
          return this.colors;
        },
      };
      colorGetter = (obj, ctx) => paletteRenderer.getColor(obj, ctx);
    }
    if (colorGetter) {
      if (selector) {
        this[property] = createSelectorFunction(selector, colorGetter, this[property]);
      } else this[property] = colorGetter;
    }
  }

  addConfiguration(config) {
    let selector;
    if (config.selector) {
      if (typeof config.selector === 'function') {
        selector = (...params) => config.selector(...params);
      } else if (typeof config.selector !== 'object' || !config.selector.property || !config.selector.value) {
        console.warn('Renderer selector must be a function or an object with "property" and "value" fields.');
        console.warn(config.selector);
      } else {
        const prop = Gantt.utils.propertyEvaluator(this.config.selector.property);
        const values = this.config.selector.value.split(',');
        selector = function(object) {
          const value = prop(object);
          return value && values.indexOf(value) >= 0;
        };
      }
    }

    this.processConfiguration(selector, config);
  }

  processConfiguration(selector, config) {
    this.defaultProcessConfiguration(selector, config);
  }

  defaultProcessConfiguration(selector, config) {
    if (config.classes || config.css) {
      this.addCSSConfiguration(selector, config.classes || config.css, config);
    }

    if (config.text) {
      this.addTextConfiguration(selector, config.text, config);
    }
    if (config.icon) {
      this.addIconConfiguration(selector, config.icon, config);
    }

    if (config.filter) {
      this.addFilterConfiguration(selector, config.filter, config);
    }

    if (config.tooltip) {
      this.addTooltipConfiguration(selector, config.tooltip, config);
    }

    if (config.tooltipProperties) {
      this.addTooltipPropertiesConfiguration(selector, config.tooltipProperties, config);
    }

    if (config.createShape) {
      console.warn('config.createShape: Not implemented');
    }

    if (config.drawContent) {
      this.addDrawContentConfiguration(selector, config);
    }

    if (config.textOverflow) {
      this.addTextOverflowConfiguration(selector, config.textOverflow);
    }

    if (config.background) {
      this.addColorConfiguration(selector, config.background, 'background', config);
    }

    if (config.color) {
      this.addColorConfiguration(selector, config.color, 'color', config);
    }

    if (config.draw) {
      this.addDrawConfiguration(selector, config);
    }
  }

  setConfiguration(config) {
    this.drawDefaultContent = this.drawNoDisplayOverflowContent;

    if (Array.isArray(config)) {
      for (let i = 0; i < config.length; i++) {
        this.addConfiguration(config[i]);
      }
    } else if (config) {
      this.addConfiguration(config);
    }
    this.initialized(config);
  }

  initialized(config) {}

  // noinspection JSUnusedLocalSymbols
  getTooltipProperties(obj, ctx) {
    return [];
  }

  getTooltip(parentNode, obj, ctx) {
    parentNode.style.display = 'flex';
    parentNode.style.flexDirection = 'column';
    /* const tooltipContent = document.createElement('div');
        tooltipContent.className = 'gantt-tooltip-content';
        tooltipContent.style.display = 'flex';
        tooltipContent.style.flexFlow = 'column'; */
    if (this.getText) {
      const title = document.createElement('h2');
      title.appendChild(document.createTextNode(this.getText(obj, ctx)));
      title.style.display = 'block';
      title.style.flex = '0 0 auto';
      parentNode.appendChild(title);
    }
    const props = this.getTooltipProperties(obj, ctx);
    const tableCtnr = document.createElement('div');
    tableCtnr.style.overflow = 'auto';
    tableCtnr.style.display = 'block';
    tableCtnr.style.flexShrink = '1';
    tableCtnr.style.flexGrow = '1';
    const table = document.createElement('table');
    const body = document.createElement('tbody');
    let tr;
    let td;
    for (let iProp = 0, count = props.length; iProp < count; ) {
      tr = document.createElement('tr');
      td = document.createElement('td');
      td.className = 'tooltip-key';
      td.appendChild(document.createTextNode(props[iProp++]));
      tr.appendChild(td);

      td = document.createElement('td');
      td.className = 'tooltip-table-separator';
      tr.appendChild(td);

      td = document.createElement('td');
      td.className = 'tooltip-value';
      td.appendChild(document.createTextNode(props[iProp++]));
      tr.appendChild(td);
      body.appendChild(tr);
    }
    table.appendChild(body);
    tableCtnr.appendChild(table);
    parentNode.appendChild(tableCtnr);
    // tooltipContent.appendChild(tableCtnr);
    // parentNode.appendChild(tooltipContent);
  }
}

Gantt.components.Renderer.impl = Renderer;
