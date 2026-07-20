import Gantt from './core';
import { getComponent } from './component-factory';

const AUTOMATIC_COLOR = 'automatic';
const TEXT_OVERFLOW_ELLIPSIS = 'ellipsis';
const TEXT_OVERFLOW_NO_DISPLAY = 'noDisplay';
const TEXT_OVERFLOW_CUT = 'cut';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Represents the main object being rendered */
interface RenderObject {
  [key: string]: string | number | boolean | null | undefined | RenderObject | RenderObject[];
}

/** Represents the rendering context passed through rendering functions */
interface RenderContext {
  [key: string]: string | number | boolean | null | undefined | RenderContext | RenderContext[];
}

/** Function that selects objects based on render context */
type SelectorFunction = (object: RenderObject, ctx: RenderContext) => boolean;

/** CSS class string getter */
type CSSGetterFunction = (object: RenderObject, ctx: RenderContext) => string | undefined;

/** Text or icon string getter */
type StringGetterFunction = (object: RenderObject, ctx: RenderContext) => string | undefined;

/** Color string getter with optional background parameter */
type ColorGetterFunction = (object: RenderObject, ctx: RenderContext, bg?: string) => string;

/** Tooltip properties getter */
type TooltipPropertiesFunction = (object: RenderObject, ctx: RenderContext) => (string | number | boolean)[];

/** Generic processor function - kept for backward compatibility in palette/color flows */
type ProcessorFunction = (object: RenderObject, ctx: RenderContext, ext?: string | RenderObject | RenderObject[]) => string | RenderObject | RenderObject[] | null | undefined;

/** Configuration for CSS classes */
interface CSSClassConfig {
  property?: string;
  prefix?: string;
  suffix?: string;
}

/** Palette definition */
interface PaletteDefinition {
  [key: string]: string | number | boolean | PaletteDefinition;
}

/** Configuration for palette-based color rendering */
interface PaletteConfig {
  palette?: string | PaletteDefinition;
  getValue: string | ((obj: RenderObject, ctx: RenderContext) => string | number | boolean);
  values?: (string | number | boolean)[] | (() => (string | number | boolean)[]);
}

/** Configuration for color styling */
interface ColorConfig {
  getValue?: string | ((obj: RenderObject, ctx: RenderContext) => string | number | boolean);
  values?: (string | number | boolean)[];
  palette?: string | PaletteConfig;
}

/** Configuration for selector-based rendering */
interface SelectorConfig {
  property: string;
  value: string;
}

/** Draw configuration */
interface DrawConfig {
  draw: (object: RenderObject, elt: HTMLElement, ctx: RenderContext) => HTMLElement | null;
}

/** Draw content configuration */
interface DrawContentConfig {
  drawContent: (elt: HTMLElement, icon: string, text: string, object: RenderObject, ctx: RenderContext) => void;
}

/** Renderer configuration */
interface RendererConfiguration {
  selector?: SelectorFunction | SelectorConfig;
  classes?: string | string[] | CSSClassConfig;
  css?: string | string[] | CSSClassConfig;
  text?: string | ((object: RenderObject, ctx: RenderContext) => string);
  icon?: string | ((object: RenderObject, ctx: RenderContext) => string);
  filter?: string | ((object: RenderObject, ctx: RenderContext, search: string) => boolean);
  tooltip?: (object: RenderObject, ctx: RenderContext) => void;
  tooltipProperties?: (object: RenderObject, ctx: RenderContext) => (string | number | boolean)[];
  background?: string | ((object: RenderObject, ctx: RenderContext) => string) | ColorConfig;
  color?: string | ((object: RenderObject, ctx: RenderContext, bg: string) => string) | ColorConfig;
  textOverflow?: string;
  draw?: DrawConfig;
  drawContent?: DrawContentConfig;
  createShape?: (object: RenderObject, parentElt: HTMLElement, ctx: RenderContext) => HTMLElement;
}

/** Palette handler interface */
interface PaletteHandler {
  getPalette(name?: string): { getColors(count: number): string[] } | null;
}

/** Palette renderer configuration */
interface PaletteRendererState {
  paletteHandler: PaletteHandler;
  colors: string[] | null;
  values: (string | number | boolean)[];
  value: (obj: RenderObject, ctx: RenderContext) => string | number | boolean;
  getColor: (obj: RenderObject, ctx: RenderContext) => string | null;
  getValues?: (obj: RenderObject, ctx: RenderContext) => (string | number | boolean)[];
  makeColors: (obj: RenderObject, ctx: RenderContext) => string[];
}

function createSelectorFunction(
  selector: SelectorFunction | null | undefined,
  fct: ProcessorFunction | null | undefined,
  oldFct?: ProcessorFunction | null | undefined,
  fctCtx?: unknown
): ProcessorFunction | false | null | undefined {
  return (
    fct &&
    function selectAndApply(object: RenderObject, ctx: RenderContext, ext?: unknown): unknown {
      if (!selector || selector(object, ctx)) {
        return fctCtx ? fct.call(fctCtx, object, ctx, ext) : fct(object, ctx, ext);
      }
      return (oldFct && oldFct(object, ctx, ext)) || undefined;
    }
  );
}

export default class Renderer extends Gantt.components.Renderer {
  cssGetters?: CSSGetterFunction[];
  getCSS?: (object: RenderObject, ctx: RenderContext) => string;
  getText?: StringGetterFunction;
  getIcon?: StringGetterFunction;
  background?: ColorGetterFunction;
  color?: ColorGetterFunction;
  colors?: string[];
  textColors?: string[];
  drawDefaultContent?: (elt: HTMLElement, icon: string | undefined, text: string | undefined, object: RenderObject, ctx: RenderContext) => void;
  getTooltipProperties?: TooltipPropertiesFunction;
  getTooltip?: (parentNode: HTMLElement, obj: RenderObject, ctx: RenderContext) => void;

  constructor(config: RendererConfiguration | RendererConfiguration[], proto: Record<string, unknown> | null, paletteHandler: PaletteHandler) {
    super(config, proto, paletteHandler);
  }

  draw(object: RenderObject, parentElt: HTMLElement | null, ctx: RenderContext): HTMLElement | null {
    const shapeElt = (this.createShape && this.createShape(object, parentElt || document.createElement('div'), ctx)) || null;
    if (this.getCSS) {
      const css = this.getCSS(object, ctx);
      if (css) {
        this.setCSS(shapeElt || parentElt || document.createElement('div'), css);
      }
    }
    if ((this.getText || this.getIcon) && this.drawContent) {
      const text = this.getText && this.getText(object, ctx);
      const icon = this.getIcon && this.getIcon(object, ctx);
      const drawTarget = shapeElt || parentElt;
      if (drawTarget) {
        this.drawContent(drawTarget, icon || '', text || '', object, ctx);
      }
    }
    let bg: string | undefined;
    if (this.background) {
      bg = this.background(object, ctx);
      if (bg) {
        this.setBackground(shapeElt, bg);
      }
    }
    if (this.color) {
      const color = this.color(object, ctx, bg);
      if (color) {
        this.setColor(shapeElt, color);
      }
    }
    if (parentElt && shapeElt !== parentElt) {
      parentElt.appendChild(shapeElt || document.createElement('div'));
    }
    return shapeElt;
  }

  setBackground(shapeElt: HTMLElement | null, bg: string): void {
    if (shapeElt) {
      shapeElt.style.backgroundColor = bg;
    }
  }

  setColor(shapeElt: HTMLElement | null, c: string): void {
    if (shapeElt) {
      shapeElt.style.color = c;
    }
  }

  setCSS(elt: HTMLElement, classname: string): void {
    if (classname) {
      elt.className = (elt.className && `${elt.className} ${classname}`) || classname;
    }
  }

  createShape(object: RenderObject, parentElt: HTMLElement, ctx: RenderContext): HTMLElement | null {
    return null;
  }

  drawContent(elt: HTMLElement, icon: string | undefined, text: string | undefined, object: RenderObject, ctx: RenderContext): void {
    if (this.drawDefaultContent) {
      this.drawDefaultContent(elt, icon, text, object, ctx);
    }
  }

  drawNoDisplayOverflowContent(elt: HTMLElement, icon: string | undefined, text: string | undefined, object: RenderObject, ctx: RenderContext): void {
    const ctnt = document.createElement('div');
    ctnt.className = 'content';
    ctnt.style.overflow = 'hidden';
    ctnt.style.display = 'flex'; // Cannot used as issue with FF https://github.ibm.com/IBMDecisionOptimization/dd-gantt-component/issues/14
    ctnt.style.justifyContent = 'center';
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
    t.textContent = text;
    t.style.display = 'flex';
    t.style.alignItems = 'center';
    t.style.whiteSpace = 'nowrap';
    t.style.height = '100%';
    t.style.textAlign = 'center';
    ctnt.appendChild(t);
    elt.appendChild(ctnt);
  }

  drawCutContent(elt: HTMLElement, icon: string | undefined, text: string | undefined, object: RenderObject, ctx: RenderContext): HTMLElement {
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
    t.textContent = text || '';
    elt.appendChild(t);
    return t;
  }

  drawEllipsisContent(elt: HTMLElement, icon: string | undefined, text: string | undefined, object: RenderObject, ctx: RenderContext): HTMLElement {
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
    t.textContent = text || '';
    elt.appendChild(t);
    return t;
  }

  drawOverflowVisibleContent(elt: HTMLElement, icon: string | undefined, text: string | undefined, object: RenderObject, ctx: RenderContext): HTMLElement {
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
    t.style.overflow = 'visible';
    t.textContent = text || '';
    elt.appendChild(t);
    return t;
  }

  filter = (object: RenderObject, row: RenderContext, search: string): boolean => {
    if (this.getText && search) {
      const text = this.getText(object, row);
      return Boolean(text && Gantt.utils.stringMatches(text, search));
    }
    return false;
  };

  createCSSGetter(selector: SelectorFunction | null | undefined, classOptions: string | CSSClassConfig | ProcessorFunction, ctx: RendererConfiguration | null): CSSGetterFunction | false | null {
    if (typeof classOptions === 'function') {
      // Function is given the object to render in parameter and returns a set of CSS classes
      return createSelectorFunction(selector, classOptions as CSSGetterFunction, undefined, ctx) as CSSGetterFunction | false | null;
    }
    if (typeof classOptions === 'string') {
      if (classOptions[0] === '@') {
        // The string represents the accessor to the object property providing the CSS class
        return createSelectorFunction(selector, Gantt.utils.propertyEvaluator(classOptions.substring(1)) as CSSGetterFunction) as CSSGetterFunction | false | null;
      }

      return createSelectorFunction(selector, (): string => classOptions) as CSSGetterFunction | false | null;
    }
    // Else the config is a descriptive object of the CSS setter
    const config = classOptions as CSSClassConfig;
    if (!config.property) {
      Gantt.log.warn('Missing "property" field in class setter description:', classOptions);
      return null;
    }

    const propGetter = Gantt.utils.propertyEvaluator(config.property);
    return createSelectorFunction(selector, (obj: RenderObject): string | undefined => {
      let prop = propGetter.call(obj, obj) as string | undefined;
      if (prop) {
        if (config.prefix) {
          prop = config.prefix + prop;
        }
        if (config.suffix) {
          prop = config.suffix + prop;
        }
      }
      return prop;
    }) as CSSGetterFunction | false | null;
  }

  addCSSConfiguration(selector: SelectorFunction | null | undefined, classes: string | string[] | CSSClassConfig, ctx: RendererConfiguration): void {
    let i: number;
    let getter: CSSGetterFunction | false | null;
    const classesArray: (string | CSSClassConfig)[] = Array.isArray(classes) ? classes : [classes];
    for (i = 0; i < classesArray.length; i++) {
      getter = this.createCSSGetter(selector, classesArray[i], ctx);
      if (getter) {
        if (this.cssGetters) {
          this.cssGetters.push(getter);
        } else {
          this.cssGetters = [getter];
          this.getCSS = (object: RenderObject, ctx: RenderContext): string => {
            let cssClasses = '';
            for (let i = 0; i < this.cssGetters!.length; i++) {
              const cssToAdd = this.cssGetters![i](object, ctx);
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

  addFilterConfiguration(selector: SelectorFunction | null | undefined, config: string | ((object: RenderObject, ctx: RenderContext, search: string) => boolean), ctx: RendererConfiguration): void {
    let filter: ((object: RenderObject, ctx: RenderContext, search: string) => boolean) | undefined;
    if (typeof config === 'function') {
      filter = (...params: [RenderObject, RenderContext, string]) => config.apply(ctx, params);
    } else if (typeof config === 'string') {
      const getter = Gantt.utils.propertyEvaluator(config);
      if (getter) {
        filter = (object: RenderObject, ctx: RenderContext, search: string): boolean => {
          if (search) {
            const value = getter(object);
            return Boolean(value && Gantt.utils.stringMatches(value as string, search));
          }
          return true;
        };
      }
    } else {
      Gantt.log.warn('Cannot process filter config. Must be a string or a function.', config);
    }
    if (filter) {
      const oldFilter = this.filter;
      this.filter = (object: RenderObject, ctx: RenderContext, search: string): boolean => {
        if (!oldFilter.call(this, object, ctx, search)) {
          return false;
        }
        if (!selector || selector(object, ctx)) {
          if (!filter(object, ctx, search)) {
            return false;
          }
        }
        return true;
      };
    }
  }

  addTooltipPropertiesConfiguration(selector: SelectorFunction | null | undefined, config: (object: RenderObject, ctx: RenderContext) => (string | number | boolean)[], ctx: RendererConfiguration): void {
    let tooltipPropsGetter: TooltipPropertiesFunction | undefined;
    if (typeof config === 'function') {
      tooltipPropsGetter = config;
    } else {
      Gantt.log.warn('Cannot process tooltip properties config. Must be a function.', config);
    }
    if (tooltipPropsGetter) {
      if (selector) {
        const result = createSelectorFunction(
          selector,
          tooltipPropsGetter as ProcessorFunction,
          this.getTooltipProperties as ProcessorFunction,
          ctx
        );
        if (result) {
          this.getTooltipProperties = result as TooltipPropertiesFunction;
        }
      } else {
        this.getTooltipProperties = tooltipPropsGetter;
      }
    }
  }

  addTooltipConfiguration(selector: SelectorFunction | null | undefined, config: (object: RenderObject, ctx: RenderContext) => void, ctx: RendererConfiguration): void {
    let tooltipGetter: ProcessorFunction | undefined;
    if (typeof config === 'function') {
      tooltipGetter = (...params: [RenderObject, RenderContext]) => {
        config.apply(ctx, params);
        return undefined;
      };
    } else {
      Gantt.log.warn('Cannot process tooltip config. Must be a function.', config);
    }
    if (tooltipGetter) {
      if (selector) {
        const result = createSelectorFunction(selector, tooltipGetter, this.getTooltip, ctx);
        if (result) {
          this.getTooltip = result;
        }
      } else {
        this.getTooltip = tooltipGetter;
      }
    }
  }

  addTextConfiguration(selector: SelectorFunction | null | undefined, config: string | ((object: RenderObject, ctx: RenderContext) => string), ctx: RendererConfiguration): void {
    let textGetter: StringGetterFunction | undefined;
    if (typeof config === 'function') {
      textGetter = (...params: [RenderObject, RenderContext]) => config.apply(ctx, params);
    } else if (typeof config === 'string') {
      textGetter = Gantt.utils.propertyEvaluator(config) as StringGetterFunction;
    } else {
      Gantt.log.warn('Cannot process text config. Must be a string or a function.', config);
    }
    if (textGetter) {
      if (selector) {
        const result = createSelectorFunction(selector, textGetter, this.getText, ctx);
        if (result) {
          this.getText = result as StringGetterFunction;
        }
      } else {
        this.getText = textGetter;
      }
    }
  }

  addIconConfiguration(selector: SelectorFunction | null | undefined, config: string | ((object: RenderObject, ctx: RenderContext) => string), ctx: RendererConfiguration): void {
    let iconGetter: StringGetterFunction | undefined;
    if (typeof config === 'function') {
      iconGetter = (...params: [RenderObject, RenderContext]) => config.apply(ctx, params);
    } else if (typeof config === 'string') {
      iconGetter = Gantt.utils.propertyEvaluator(config) as StringGetterFunction;
    } else {
      Gantt.log.warn('Cannot process icon config. Must be a string or a function.', config);
    }
    if (iconGetter) {
      if (selector) {
        const result = createSelectorFunction(selector, iconGetter, this.getIcon, ctx);
        if (result) {
          this.getIcon = result as StringGetterFunction;
        }
      } else {
        this.getIcon = iconGetter;
      }
    }
  }

  addDrawConfiguration(selector: SelectorFunction | null | undefined, config: DrawConfig): void {
    if (selector) {
      const oldDraw = this.draw;
      this.draw = (object: RenderObject, elt: HTMLElement | null, ctx: RenderContext): HTMLElement | null => {
        if (selector(object, ctx)) {
          return config.draw(object, elt || document.createElement('div'), ctx);
        }
        return oldDraw.call(this, object, elt, ctx);
      };
    } else {
      this.draw = (object: RenderObject, elt: HTMLElement | null, ctx: RenderContext): HTMLElement | null => {
        return config.draw(object, elt || document.createElement('div'), ctx);
      };
    }
  }

  addDrawContentConfiguration(selector: SelectorFunction | null | undefined, config: DrawContentConfig): void {
    if (selector) {
      const oldDrawContent = this.drawContent;
      this.drawContent = (elt: HTMLElement, icon: string | undefined, text: string | undefined, object: RenderObject, ctx: RenderContext): void => {
        if (selector(object, ctx)) {
          config.drawContent(elt, icon || '', text || '', object, ctx);
        } else if (oldDrawContent) {
          oldDrawContent.call(this, elt, icon, text, object, ctx);
        }
      };
    } else {
      this.drawContent = (elt: HTMLElement, icon: string | undefined, text: string | undefined, object: RenderObject, ctx: RenderContext): void => {
        config.drawContent(elt, icon || '', text || '', object, ctx);
      };
    }
  }

  addTextOverflowConfiguration(selector: SelectorFunction | null | undefined, config: string): void {
    let drawDefaultContent: ((elt: HTMLElement, icon: string | undefined, text: string | undefined, object: RenderObject, ctx: RenderContext) => void) | undefined;
    if (config === TEXT_OVERFLOW_ELLIPSIS) {
      drawDefaultContent = this.drawEllipsisContent;
    } else if (config === TEXT_OVERFLOW_NO_DISPLAY) {
      drawDefaultContent = this.drawNoDisplayOverflowContent;
    } else if (config === TEXT_OVERFLOW_CUT) {
      drawDefaultContent = this.drawCutContent;
    }
    if (selector && drawDefaultContent) {
      const oldDrawDefaultContent = this.drawDefaultContent;
      this.drawDefaultContent = function selectedDrawDefaultContent(elt: HTMLElement, icon: string | undefined, text: string | undefined, object: RenderObject, ctx: RenderContext): void {
        if (selector(object, ctx)) {
          drawDefaultContent.call(this, elt, icon, text, object, ctx);
        } else if (oldDrawDefaultContent) {
          oldDrawDefaultContent.call(this, elt, icon, text, object, ctx);
        }
      };
    } else if (drawDefaultContent) {
      this.drawDefaultContent = drawDefaultContent;
    }
  }

  hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  getTextColorFromBackgroundColor(hexColor: string): string {
    const rgb = this.hexToRgb(hexColor);
    if (!rgb) return 'black';
    // http://www.w3.org/TR/AERT#color-contrast
    const o = Math.round((rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000);
    return o > 125 ? '#383633' : 'white';
  }

  addColorConfiguration(selector: SelectorFunction | null | undefined, config: string | ((object: RenderObject, ctx: RenderContext, bg?: string) => string) | ColorConfig, property: string, ctx: RendererConfiguration): void {
    let colorGetter: ProcessorFunction | undefined;
    if (typeof config === 'function') {
      colorGetter = (...params: [RenderObject, RenderContext, string | undefined]) => config.apply(ctx, params);
    } else if (typeof config === 'string') {
      if (property === 'color' && AUTOMATIC_COLOR === config) {
        colorGetter = (obj: RenderObject, ctx: RenderContext, bg?: string | RenderObject | RenderObject[]): string => {
          if (typeof bg !== 'string') return 'black';
          const index = this.colors ? this.colors.indexOf(bg) : -1;
          if (index < 0) {
            let textColor: string;
            try {
              textColor = this.getTextColorFromBackgroundColor(bg);
            } catch (err) {
              Gantt.log.error(`Invalid color format ${bg}`, err);
              textColor = 'black';
            }
            if (!this.colors) {
              this.colors = [bg];
              this.textColors = [textColor];
            } else {
              this.colors.push(bg);
              if (this.textColors) {
                this.textColors.push(textColor);
              }
            }
            return textColor;
          }
          return this.textColors?.[index] || 'black';
        };
      } else {
        colorGetter = Gantt.utils.propertyEvaluator(config);
      }
    } else {
      // Object describing how to get a color from a palette
      const paletteConfig = config.palette;
      const paletteRenderer: Partial<PaletteRendererState> = {
        paletteHandler: this.paletteHandler,
        colors: null,
        values: [],
        value: Gantt.utils.propertyEvaluator(config.getValue),
        getColor: (obj: RenderObject, ctx: RenderContext): string | null => {
          const value = (paletteRenderer.value as ProcessorFunction)(obj, ctx);
          const colors = paletteRenderer.colors || paletteRenderer.makeColors?.(obj, ctx); // makeColors leads to the creation of values
          let index = paletteRenderer.values!.indexOf(value);
          if (index < 0) {
            index = paletteRenderer.values!.length;
            paletteRenderer.values!.push(value);
          }
          return index < 0 ? null : (colors?.[index % colors.length] || null);
        },
        getValues:
          config.values &&
          ((Gantt.utils.isFunction(config.values) && config.values) ||
            ((): (string | number | boolean)[] => config.values as (string | number | boolean)[])),
        makeColors: (obj: RenderObject, ctx: RenderContext): string[] => {
          let palette: { getColors(count: number): string[] } | null = null;
          if (paletteConfig) {
            if (Gantt.utils.isString(paletteConfig)) {
              palette = paletteRenderer.paletteHandler!.getPalette(paletteConfig) || null;
            } else {
              const PaletteClass = getComponent('Palette', Gantt.components.Palette);
              palette = new PaletteClass(paletteConfig);
            }
          } else {
            palette = paletteRenderer.paletteHandler!.getPalette() || null;
          }
          if (!palette && !paletteRenderer.colors) {
            Gantt.log.error(`No palette found for ${paletteConfig}`);
            palette = Gantt.defaultPalettes[Gantt.defaultPaletteName] || null;
          }
          paletteRenderer.values = ((paletteRenderer.getValues as ProcessorFunction) && (paletteRenderer.getValues as ProcessorFunction)(obj, ctx)) || [];
          paletteRenderer.colors = palette?.getColors(paletteRenderer.values.length || -1) || []; // -1 for the max number of colors handled by the palette.
          return paletteRenderer.colors;
        },
      };
      colorGetter = (obj: RenderObject, ctx: RenderContext): string => {
        const result = paletteRenderer.getColor?.(obj, ctx);
        return result || '#000000';
      };
    }
    if (colorGetter) {
      if (selector) {
        const result = createSelectorFunction(selector, colorGetter, (this as Record<string, ProcessorFunction>)[property]);
        if (result) {
          (this as Record<string, ProcessorFunction>)[property] = result;
        }
      } else {
        (this as Record<string, ProcessorFunction>)[property] = colorGetter;
      }
    }
  }

  addConfiguration(config: RendererConfiguration): void {
    let selector: SelectorFunction | undefined;
    if (config.selector) {
      if (typeof config.selector === 'function') {
        selector = (...params: [RenderObject, RenderContext]) => config.selector(params[0], params[1]);
      } else if (typeof config.selector !== 'object' || !config.selector.property || !config.selector.value) {
        Gantt.log.warn(
          'Renderer selector must be a function or an object with "property" and "value" fields.',
          config.selector
        );
      } else {
        const selectorConfig = config.selector as SelectorConfig;
        const prop = Gantt.utils.propertyEvaluator(selectorConfig.property);
        const values = selectorConfig.value.split(',');
        selector = (object: RenderObject): boolean => {
          const value = prop(object);
          return Boolean(value && values.includes(String(value)));
        };
      }
    }

    this.processConfiguration(selector, config);
  }

  processConfiguration(selector: SelectorFunction | undefined, config: RendererConfiguration): void {
    this.defaultProcessConfiguration(selector, config);
  }

  defaultProcessConfiguration(selector: SelectorFunction | undefined, config: RendererConfiguration): void {
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
      Gantt.log.warn('config.createShape: Not implemented');
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

  setConfiguration(config: RendererConfiguration | RendererConfiguration[] | null): void {
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

  initialized(config: RendererConfiguration | RendererConfiguration[] | null): void {}

  getTooltipProperties = (obj: RenderObject, ctx: RenderContext): (string | number | boolean)[] => {
    return [];
  };

  getTooltip = (parentNode: HTMLElement, obj: RenderObject, ctx: RenderContext): void => {
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
    for (let iProp = 0, count = props.length; iProp < count;) {
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
