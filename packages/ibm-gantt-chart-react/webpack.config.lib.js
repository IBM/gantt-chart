/* eslint-disable import/no-extraneous-dependencies */
const configure = require('gda-scripts/config/webpack.configure');
const pkg = require('./package.json');

module.exports = configure(pkg, {
  mode: 'production',
  sourcemap: true,
  minimize: false,
  babel: {
    helpers: true,
  },
  monitor: false,
});
