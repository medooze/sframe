const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: {
    'lib': './index.js',
    'app': './example/e2ee.js',
  },
  devServer: {
    static: path.join(__dirname, 'example'),
    compress: true,
    port: 9000,
    open: true,
  },
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
  output: {
    path: path.resolve(__dirname, 'example/dist/'),
  },
  devtool: 'source-map',
};
