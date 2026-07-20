const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const pkg = require('./package.json');

const nodeModules = [path.resolve(__dirname, 'node_modules'), path.resolve(__dirname, '../../node_modules')];

const commonAlias = {
  vis: 'vis/dist/vis.min.js',
};

const commonPlugins = [
  new webpack.DefinePlugin({
    NAME: JSON.stringify(pkg.name),
    VERSION: JSON.stringify(pkg.version),
    REPOSITORY: JSON.stringify((pkg.repository && pkg.repository.url) || pkg.repository),
  }),
];

const commonRules = (sourcemap) =>
  [
    sourcemap && {
      test: /\.[jt]sx?$/,
      use: ['source-map-loader'],
      enforce: 'pre',
    },
    {
      test: /\.[jt]sx?$/,
      exclude: /node_modules(?!\/.+\/src)|dist\//,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            [
              '@babel/preset-env',
              {
                modules: false,
                targets: { browsers: ['defaults'] },
              },
            ],
          ],
        },
      },
    },
    {
      test: /\.scss$/,
      use: [
        MiniCssExtractPlugin.loader,
        { loader: 'css-loader', options: { sourceMap: !!sourcemap } },
        {
          loader: 'postcss-loader',
          options: {
            postcssOptions: {
              plugins: [require('autoprefixer')],
            },
            sourceMap: !!sourcemap,
          },
        },
        {
          loader: 'sass-loader',
          options: {
            implementation: require('sass'),
            sourceMap: !!sourcemap,
            sassOptions: {
              includePaths: nodeModules,
            },
          },
        },
      ],
    },
    {
      test: /\.css$/,
      use: [
        MiniCssExtractPlugin.loader,
        { loader: 'css-loader', options: { sourceMap: !!sourcemap } },
        {
          loader: 'postcss-loader',
          options: {
            postcssOptions: {
              plugins: [require('autoprefixer')],
            },
            sourceMap: !!sourcemap,
          },
        },
      ],
    },
    {
      test: /\.(png|jpg|jpeg|gif|svg)$/,
      type: 'asset',
      parser: { dataUrlCondition: { maxSize: 10000 } },
      generator: { filename: 'images/[name]--[hash:6][ext]' },
    },
    {
      test: /\.(woff|woff2)$/,
      type: 'asset',
      parser: { dataUrlCondition: { maxSize: 10000 } },
      generator: { filename: 'fonts/[name]--[hash:6][ext]' },
    },
    {
      test: /\.(ttf|eot)$/,
      type: 'asset/resource',
      generator: { filename: 'fonts/[name]--[hash:6][ext]' },
    },
  ].filter(Boolean);

function createConfig({ input, outputSuffix, minimize, externals, sourcemap = false, analyze = false, format = 'umd' }) {
  const outputName = `${pkg.name}${outputSuffix}`;
  const plugins = [
    ...commonPlugins,
    new MiniCssExtractPlugin({
      filename: `${outputName}.css`,
      chunkFilename: `${pkg.name}-[name]${outputSuffix}.css`,
    }),
  ];

  if (analyze) {
    plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
        reportFilename: `bundle-report-${outputSuffix || 'default'}.html`,
      })
    );
  }

  const isEsm = format === 'esm';

  return {
    mode: 'production',
    entry: input,
    experiments: isEsm ? {
      outputModule: true,
    } : undefined,
    output: isEsm ? {
      path: path.resolve(__dirname, 'dist'),
      filename: `${outputName}.esm.js`,
      chunkFilename: `${pkg.name}-[name]${outputSuffix}.esm.js`,
      library: {
        type: 'module',
      },
      clean: false,
    } : {
      path: path.resolve(__dirname, 'dist'),
      filename: `${outputName}.js`,
      chunkFilename: `${pkg.name}-[name]${outputSuffix}.js`,
      library: {
        name: pkg.name,
        type: 'umd',
      },
      globalObject: 'this',
      clean: false,
    },
    devtool: sourcemap ? 'source-map' : false,
    externals,
    resolve: {
      alias: commonAlias,
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      modules: nodeModules,
    },
    optimization: {
      minimize,
      usedExports: true,
      sideEffects: false,
    },
    module: { rules: commonRules(sourcemap) },
    plugins,
  };
}

const baseExternals = {
  'vis-timeline': { root: 'vis', commonjs2: 'vis-timeline', commonjs: 'vis-timeline', amd: 'vis-timeline' },
  'vis-data': { root: 'vis', commonjs2: 'vis-data', commonjs: 'vis-data', amd: 'vis-data' },
  'moment': { root: 'moment', commonjs2: 'moment', commonjs: 'moment', amd: 'moment' },
};

const externalsFull = {
  ...baseExternals,
  'vis-timeline/peer': { root: 'vis', commonjs2: 'vis-timeline', commonjs: 'vis-timeline', amd: 'vis-timeline' },
};

const configs = {
  lib: createConfig({ input: './src/index', outputSuffix: '', minimize: false, externals: baseExternals, sourcemap: true }),
  'lib-min': createConfig({ input: './src/index', outputSuffix: '.min', minimize: true, externals: externalsFull, sourcemap: false, analyze: false }),
  esm: createConfig({ input: './src/index', outputSuffix: '', minimize: false, externals: ['vis-timeline', 'vis-data', 'moment', 'vis-timeline/peer'], sourcemap: true, format: 'esm' }),
};

module.exports = (env = {}) => (env.output ? configs[env.output] : Object.values(configs));
