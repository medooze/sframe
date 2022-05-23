const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    'app': './example/e2ee.js',
  },
  devServer: {
    static: path.join(__dirname, 'example'),
    compress: true,
    port: 9000,
    open: true,
  },
  watchOptions: {
    poll: true,
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /Worker\.(c|m)?js$/i,
        loader: 'worker-loader',
        options: {
          inline: 'no-fallback',
          esModule: true,
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'example/index.html'
    })
  ],
  output: {
    path: path.resolve(__dirname, 'example/dist/'),
    publicPath: '/',
    filename: 'app.js',
  },
  devtool: 'source-map',
};
