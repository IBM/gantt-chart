const path = require('path');
const webpack = require('webpack');

const pkg = require('../package.json');

const nodeModules = [path.resolve(__dirname, '../node_modules'), path.resolve(__dirname, '../../node_modules')];

module.exports = {
  stories: ['../src/docs/**/*.stories.js', '../src/examples/**/*.stories.js'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-links', '@storybook/addon-storysource'],
  staticDirs: ['../data'],
  framework: {
    name: '@storybook/html-webpack5',
    options: {},
  },
  webpackFinal: async config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      jquery: 'jquery',
      'datatables.net': 'datatables.net/js/jquery.dataTables.js',
      'datatables.net-dt$': 'datatables.net-dt',
      vis: 'vis/dist/vis.min.js',
    };

    config.resolve.modules = [...(config.resolve.modules || []), ...nodeModules];
    config.resolve.mainFields = ['source', 'module', 'main'];

    config.plugins.push(
      new webpack.DefinePlugin({
        NAME: JSON.stringify(pkg.name),
        VERSION: JSON.stringify(pkg.version),
        REPOSITORY: JSON.stringify((pkg.repository && pkg.repository.url) || pkg.repository),
      })
    );

    config.plugins.push(
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        'window.$': 'jquery',
        'window.jQuery': 'jquery',
      })
    );

    const jsRule = config.module.rules.find(rule => rule.test && rule.test.toString().includes('js'));
    if (jsRule) {
      jsRule.exclude = /node_modules(?!\/.+\/src)|dist\//;
    }

    config.module.rules.push({
      test: /\.scss$/,
      use: [
        'style-loader',
        { loader: 'css-loader', options: { sourceMap: true } },
        {
          loader: 'postcss-loader',
          options: {
            postcssOptions: { plugins: [require('autoprefixer')] },
            sourceMap: true,
          },
        },
        {
          loader: 'sass-loader',
          options: {
            implementation: require('sass'),
            sourceMap: true,
            sassOptions: { includePaths: nodeModules },
          },
        },
      ],
    });

    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/source',
    });

    return config;
  },
};
