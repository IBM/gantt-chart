/**
 * Copyright IBM Corp. 2019
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* import-sort-ignore */
import Gantt from './gantt';

// Expose Gantt to global scope
if (typeof window !== 'undefined') {
  window.Gantt = Gantt;
}
if (typeof globalThis !== 'undefined') {
  globalThis.Gantt = Gantt;
}

// Handle webpack DefinePlugin variables - they may come from globalThis in test environments
let ver = typeof globalThis !== 'undefined' && globalThis.VERSION ? globalThis.VERSION : 'dev';
let name = typeof globalThis !== 'undefined' && globalThis.NAME ? globalThis.NAME : 'ibm-gantt-chart';

Gantt.version = ver;

export default Gantt;
