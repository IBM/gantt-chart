/**
 * Component factory - safe replacement for .impl || Base pattern
 *
 * Provides type-safe and refactor-friendly access to component implementations
 * Replaces: const ComponentClass = Gantt.components.Component.impl || Gantt.components.Component
 * With:     const ComponentClass = getComponent('Component', BaseComponent)
 *
 * Benefits:
 * - No runtime fallback logic (simpler to understand and debug)
 * - Centralized access control (easy to monitor component usage)
 * - Future support for lazy loading or plugin systems
 * - Clear API contract (no magic properties)
 */

import Gantt from './core';

/**
 * Get the component class, preferring .impl if available
 * @param {string} componentName - Component name (e.g., 'Button', 'GanttPanel')
 * @param {Function} BaseComponent - Default/base component class
 * @returns {Function} - The component class to instantiate
 */
export function getComponent(componentName, BaseComponent) {
  if (!componentName || typeof componentName !== 'string') {
    return BaseComponent;
  }

  const components = Gantt.components;
  if (!components || !components[componentName]) {
    return BaseComponent;
  }

  const component = components[componentName];
  if (component && typeof component.impl === 'function') {
    return component.impl;
  }

  return BaseComponent;
}

/**
 * Get multiple components at once
 * Useful for reducing repeated getComponent calls
 *
 * @example
 * const { Button, CheckBox, Input } = getComponents({
 *   Button: ButtonBase,
 *   CheckBox: CheckBoxBase,
 *   Input: InputBase
 * });
 */
export function getComponents(componentMap) {
  const result = {};
  for (const [name, BaseClass] of Object.entries(componentMap || {})) {
    result[name] = getComponent(name, BaseClass);
  }
  return result;
}

/**
 * Create an instance of a component, preferring .impl if available
 *
 * @example
 * const button = createComponent('Button', ButtonBase, gantt, config);
 */
export function createComponent(componentName, BaseComponent, ...args) {
  const ComponentClass = getComponent(componentName, BaseComponent);
  return new ComponentClass(...args);
}

/**
 * Check if a custom implementation exists for a component
 * Useful for conditional logic based on available implementations
 */
export function hasCustomImpl(componentName) {
  const components = Gantt.components;
  return components && components[componentName] && typeof components[componentName].impl === 'function';
}

export default {
  getComponent,
  getComponents,
  createComponent,
  hasCustomImpl,
};
