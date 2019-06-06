/**
 * Copyright IBM Corp. 2019
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* import-sort-ignore */
import Gantt from './gantt';

// jQuery modules
import './jquery/jquery-core';
import './jquery/utils';
import './jquery/split';
import './jquery/timeline';
import './jquery/treetable';

// TODO should be defined in webpack, but there is a .default issue
if (typeof window !== 'undefined') {
  window.Gantt = Gantt;
}

Gantt.version = VERSION;
try {
  console.log(`[LOADED] ${NAME}@${VERSION} (jquery@${$().jquery}, datatables.net@${$().DataTable.version})`);
} catch (error) {
  // nothig to do
}

export default Gantt;
