import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import Gantt from 'ibm-gantt-chart';

import 'ibm-gantt-chart/dist/ibm-gantt-chart.css';

import './GanttChart.scss';

// The core library does not inject its own styles (no style-loader in the
// dist bundle) — consumers get them through this import.

function normalizeClass(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.filter(Boolean).join(' ');
  return Object.entries(value)
    .filter(([, active]) => active)
    .map(([name]) => name)
    .join(' ');
}

function normalizeStyle(value) {
  if (!value) return undefined;
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  // Convert a CSS string into a React style object, e.g.
  // "height: 600px; border: 1px solid #ccc" -> { height: '600px', border: '1px solid #ccc' }
  return value.split(';').reduce((acc, declaration) => {
    const [key, val] = declaration.split(':');
    if (key && val !== undefined) {
      const camelKey = key.trim().replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = val.trim();
    }
    return acc;
  }, {});
}

function createGantt(node, config) {
  try {
    const instance = new Gantt(node, config);
    return instance;
  } catch (err) {
    console.error('Failed to initialize Gantt chart:', err);
    throw err;
  }
}

function destroyGantt(instance, onDestroy) {
  try {
    if (instance && typeof instance.destroy === 'function') {
      instance.destroy();
    }
  } catch (err) {
    console.error('Error destroying Gantt chart:', err);
  }
  onDestroy?.();
}

const GanttChart = React.forwardRef(
  ({ config, className, style, onLoad, onUpdate, onDestroy, ...rest }, forwardedRef) => {
    const innerRef = useRef(null);
    const ganttRef = useRef(undefined);
    const [error, setError] = useState(null);
    const isFirstRunRef = useRef(true);

    // Single effect: tracks only `config`. The core has no hot-update API, so
    // on config change we destroy and recreate, same as the legacy wrapper.
    useEffect(() => {
      const node = innerRef.current;
      if (!node) return undefined;

      setError(null);
      let instance;
      try {
        instance = createGantt(node, config);
        ganttRef.current = instance;
        if (isFirstRunRef.current) {
          isFirstRunRef.current = false;
          onLoad?.();
        } else {
          onUpdate?.(config);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        return undefined;
      }

      return () => {
        destroyGantt(instance, onDestroy);
        ganttRef.current = undefined;
      };
      // Intentionally not depending on callbacks — they are event handlers, not
      // reactive inputs. Depending on them would recreate the chart constantly.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config]);

    const normalizedClass = normalizeClass(className);
    const normalizedStyle = normalizeStyle(style);

    return (
      <div
        ref={(node) => {
          innerRef.current = node;
          if (typeof forwardedRef === 'function') {
            forwardedRef(node);
          } else if (forwardedRef) {
            forwardedRef.current = node;
          }
        }}
        className={normalizedClass ? `ibm-gantt-chart-react ${normalizedClass}` : 'ibm-gantt-chart-react'}
        style={normalizedStyle}
        data-testid={rest['data-testid']}
      >
        {error && (
          <div className="ibm-gantt-chart-react__error">
            <p>Failed to load Gantt chart: {error}</p>
          </div>
        )}
      </div>
    );
  }
);

GanttChart.propTypes = {
  config: PropTypes.shape({}).isRequired,
  className: PropTypes.oneOfType([PropTypes.string, PropTypes.array, PropTypes.object]),
  style: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onLoad: PropTypes.func,
  onUpdate: PropTypes.func,
  onDestroy: PropTypes.func,
};

GanttChart.defaultProps = {
  className: undefined,
  style: undefined,
  onLoad: undefined,
  onUpdate: undefined,
  onDestroy: undefined,
};

export default GanttChart;
