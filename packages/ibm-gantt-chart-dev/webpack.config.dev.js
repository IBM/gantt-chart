/* eslint-disable import/no-extraneous-dependencies */
const { readdirSync, statSync } = require('fs');
const { join } = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');

const configure = require('gda-scripts/config/webpack.configure');
const common = require('ibm-gantt-chart/webpack.common.js');
const pkg = require('./package.json');

// find all subdirectories examples
const getDirectories = p => readdirSync(p).filter(f => statSync(join(p, f)).isDirectory());
const dirs = getDirectories('./src');
const input = {
  index: './src/index.js',
};
dirs.forEach(dir => (input[dir] = `./src/${dir}/${dir}.js`));

// generate links for each examples for main page
const bodyHtmlSnippet = `
<h3>${pkg.name}@${pkg.version}</h3>
<ul>
${dirs
  .map(
    dir => `
  <a href="${dir}.html">${dir}</a>
`
  )
  .join('\n')}
</ul>
  `;

const { webpack = {}, styling = {}, html = {}, ...base } = common;

module.exports = configure(pkg, {
  // 'print-config': true,
  ...base,
  mode: 'development',
  input,
  outputName: '[name]',
  webpack: {
    ...webpack,
    resolve: {
      ...(webpack.resolve || {}),
      mainFields: ['source'], // use source instead of compiled library
    },
    plugins: [
      ...(webpack.plugins || []),
      ...dirs.map(
        dir =>
          new HtmlWebpackPlugin({
            title: `${dir}`,
            filename: `${dir}.html`,
            template: `./src/${dir}/${dir}.html`,
            chunks: [`${dir}`],
          })
      ),
    ],
    copy: [
      ...(webpack.copy || []),
      {
        from: '../ibm-gantt-chart/data',
        to: 'data/',
      },
      {
        from: '../../node_modules/jquery/dist',
        to: 'jquery/',
      },
      {
        from: '../../node_modules/datatables.net',
        to: 'datatables.net/',
      },
      {
        from: '../../node_modules/datatables.net-dt',
        to: 'datatables.net-dt/',
      },
      {
        from: '../../node_modules/vis/dist',
        to: 'vis/',
      },
    ],
  },
  styling: {
    ...styling,
  },
  html: {
    ...html,
    excludeChunks: dirs.map(dir => `${dir}.js`), // TODO does not work with html-webpack-template
    bodyHtmlSnippet,
  },
});
