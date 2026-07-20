const path = require('path');
const webpack = require('webpack');
const { readdirSync, statSync } = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const pkg = require('./package.json');

const nodeModules = [path.resolve(__dirname, 'node_modules'), path.resolve(__dirname, '../../node_modules')];

const getDirectories = (p) => readdirSync(p).filter((f) => statSync(path.join(p, f)).isDirectory());
const dirs = getDirectories('./src');

const input = { index: './src/index.js' };
dirs.forEach((dir) => {
  input[dir] = `./src/${dir}/${dir}.js`;
});

const bodyHtml = `
<h3>${pkg.name}@${pkg.version}</h3>
<ul>
${dirs.map((dir) => `  <li><a href="${dir}.html">${dir}</a></li>`).join('\n')}
</ul>
`;

const commonAlias = {
  jquery: 'jquery/dist/jquery.js',
  'datatables.net': 'datatables.net/js/jquery.dataTables.js',
  'datatables.net-dt$': 'datatables.net-dt',
  vis: 'vis/dist/vis.min.js',
};

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: input,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  resolve: {
    alias: commonAlias,
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    modules: nodeModules,
    mainFields: ['source', 'module', 'main'],
  },
  module: {
    rules: [
      {
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
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          { loader: 'css-loader', options: { sourceMap: true } },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: { plugins: [require('autoprefixer')] },
              sourceMap: true,
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
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      NAME: JSON.stringify(pkg.name),
      VERSION: JSON.stringify(pkg.version),
      REPOSITORY: JSON.stringify((pkg.repository && pkg.repository.url) || pkg.repository),
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.$': 'jquery',
      'window.jQuery': 'jquery',
    }),
    new MiniCssExtractPlugin({ filename: '[name].css' }),
    new HtmlWebpackPlugin({
      title: pkg.name,
      filename: 'index.html',
      chunks: ['index'],
      templateContent: () => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${pkg.name}</title>
  </head>
  <body>
    ${bodyHtml}
  </body>
</html>`,
    }),
    ...dirs.map(
      (dir) =>
        new HtmlWebpackPlugin({
          title: dir,
          filename: `${dir}.html`,
          template: `./src/${dir}/${dir}.html`,
          chunks: [dir],
        })
    ),
    new CopyPlugin({
      patterns: [{ from: '../ibm-gantt-chart/data', to: 'data' }],
    }),
  ],
  devServer: {
    host: 'localhost',
    port: 8080,
    server: { type: 'https' },
    hot: true,
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
  },
};
