/* eslint-disable import/no-extraneous-dependencies */
const configure = require('gda-scripts/config/webpack.configure');
const common = require('./webpack.common.js');
const pkg = require('./package.json');

const { webpack = {}, ...base } = common;

module.exports = configure(pkg, {
  ...base,
  mode: 'production',
  input: './src/index-jquery',
  outputSuffix: '-jquery',
  // library: 'Gantt', // TODO Gantt.default instead :-(
  sourcemap: true,
  minimize: false,
  webpack: {
    ...webpack,
    externals: {
      ...(webpack.externals || {}),
      'datatables.net': 'datatables.net',
      'datatables.net-dt': 'datatables.net-dt',
      jquery: 'jQuery',
      vis: 'vis',
    },
  },
});
