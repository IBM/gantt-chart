/* eslint-disable import/no-extraneous-dependencies */
const configure = require('gda-scripts/config/webpack.configure');
const common = require('./webpack.common.js');
const pkg = require('./package.json');

module.exports = configure(pkg, {
  ...common,
  mode: 'production',
  // library: 'Gantt', // TODO Gantt.default instead :-(
  sourcemap: true,
  minimize: false,
});
