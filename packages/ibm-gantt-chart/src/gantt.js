/**
 * Copyright IBM Corp. 2019
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* import-sort-ignore */
import './core/plugins';
import './core/selection';
import './core/renderer';
import './model';
import './panel';
import './timetable';
import './loadchart';

// import P from 'es6-promise/dist/es6-promise.min';

export default from './core/core';

// if (typeof Promise === 'undefined' /* && Promise.toString().indexOf("[native code]") !== -1 */) {
//   console.log('Use of es6-promise');
//   P.polyfill();
// }
