/**
 * Vitest-compatible test context wrapper.
 * Provides Mocha-style this context for tests written with Mocha/Karma.
 *
 * Usage:
 *   it('test name', wrapTest(function() {
 *     return this.createGantt(config);
 *   }));
 */

import type { GanttNamespace } from './gantt-namespace';
import type { GanttConfig } from './types';

interface GanttInstance {
  initialized?(): Promise<HTMLElement[]>;
  [key: string]: unknown;
}

interface TestContext {
  createGantt(config?: GanttConfig): Promise<GanttInstance>;
  timeout(ms: number): void;
  __testContainers?: HTMLElement[];
}

/**
 * Global test context instance
 */
let currentTestContext: TestContext | null = null;

/**
 * Wrap a Mocha-style test function to work with Vitest.
 * Provides this.createGantt and this.timeout.
 *
 * @param testFn - Test function expecting Mocha-style this context
 * @returns Function suitable for Vitest it()
 */
function getGanttConstructor(): GanttNamespace {
  const g = (globalThis as Record<string, unknown>).Gantt;
  if (!g || typeof g !== 'object') {
    throw new Error('Gantt library not initialized');
  }
  return g as GanttNamespace;
}

export function wrapTest(
  testFn: (this: TestContext) => void | Promise<void>
): () => Promise<void> {
  return async function wrappedTest() {
    const Gantt = getGanttConstructor();

    const context: TestContext = {
      createGantt(config?: GanttConfig) {
        const testContainer = document.createElement('div');
        testContainer.id = `test-gantt-${Date.now()}`;
        testContainer.style.width = '800px';
        testContainer.style.height = '600px';
        document.body.appendChild(testContainer);

        const gantt = new Gantt(testContainer, config);
        context.__testContainers = context.__testContainers || [];
        context.__testContainers.push(testContainer);

        return gantt.initialized?.() ? gantt.initialized() : Promise.resolve(gantt);
      },
      timeout: () => {
        // Vitest doesn't use Mocha timeouts
      },
    };

    currentTestContext = context;

    try {
      await testFn.call(context);
    } finally {
      // Cleanup test containers
      if (context.__testContainers) {
        context.__testContainers.forEach((el) => {
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          }
        });
      }
      currentTestContext = null;
    }
  };
}

/**
 * Get the current test context (for use in test utilities).
 */
export function getTestContext(): TestContext | null {
  return currentTestContext;
}
