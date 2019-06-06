/* eslint-disable import/no-extraneous-dependencies */
const webpack = require('webpack');

module.exports = {
  webpack: {
    resolve: {
      alias: {
        jquery: 'jquery/dist/jquery.js',
        'datatables.net': 'datatables.net/js/jquery.dataTables.js',
        'datatables.net-dt$': 'datatables.net-dt',
        vis: 'vis/dist/vis.min.js',
      },
    },
    plugins: [
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        'window.$': 'jquery', // angular 1
        'window.jQuery': 'jquery', // angular 1
      }),
    ],
  },
  styling: {
    fonts: {
      name: 'fonts/[name].[ext]',
    },
  },
  browserslist: ['defaults'], // TODO don't support 'agressive' browserslist from gda-scripts
  babel: {
    helpers: true,
  },
};
