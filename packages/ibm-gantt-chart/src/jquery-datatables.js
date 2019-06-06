/**
 * Copyright IBM Corp. 2019
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

// initialization of jquery and datatables.net for standalone version

const $ = require('jquery');

// console.log(`[LOADED] jquery@${$().jquery}`);

if (typeof window !== 'undefined') {
  window.jQuery = $;
  window.$ = $;
}

// eslint-disable-next-line import/no-webpack-loader-syntax,import/no-unresolved
const datatables = require('imports-loader?define=>false!datatables.net');

// https://github.com/aurelia/skeleton-navigation/issues/473
datatables(window, $);
// console.log(`[LOADED] datatables.net@${$().DataTable.version}`);
