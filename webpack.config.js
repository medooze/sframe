const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: './index.js',
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
    path: path.resolve(__dirname, 'dist_github'),
    library: 'sframe',
    libraryTarget: 'umd',
  },
};
