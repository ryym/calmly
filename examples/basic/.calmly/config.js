const path = require('path');

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
    ],
  },
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
