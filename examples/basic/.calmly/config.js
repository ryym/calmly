const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const distDir = path.resolve(__dirname, '..', 'dist');

const mode = process.env.NODE_ENV || 'development';

const webpackForHTML = {
  mode,

  output: {
    path: distDir,
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['babel-loader'],
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(jpg|png)$/,
        use: [
          {
            loader: 'file-loader',
            options: { publicPath: '/' },
          },
        ],
      },
    ],
  },

  plugins: [new MiniCssExtractPlugin()],
};

const webpackForClientJS = {
  mode,

  output: {
    path: distDir,
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['babel-loader'],
      },
    ],
  },
};

module.exports = {
  webpackForHTML,
  webpackForClientJS,
};
