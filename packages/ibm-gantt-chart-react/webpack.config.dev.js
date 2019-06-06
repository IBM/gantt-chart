/* eslint-disable import/no-extraneous-dependencies */
const configure = require('gda-scripts/config/webpack.configure');
const common = require('ibm-gantt-chart/webpack.common.js');
const pkg = require('./package.json');

const { webpack = {}, ...base } = common;

module.exports = configure(pkg, {
  // 'print-config': true,
  ...base,
  mode: 'development',
  input: './src/App.jsx',
  webpack: {
    ...webpack,
    resolve: {
      ...(webpack.resolve || {}),
      mainFields: ['source'], // use source instead of compiled library
    },
  },
});
