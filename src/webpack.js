const path = require('path');
const fs = require('fs');
const WebpackManifestPlugin = require('webpack-manifest-plugin');

const loadWebpackConfigs = ({ cwd }) => {
  const configPath = path.join(cwd, '.calmly', 'config.js');
  const defaultHTMLConfig = defaultHTMLWebpackConfig({ cwd });
  const defaultJSConfig = defaultClientJSWebpackConfig({ cwd });

  if (!fs.existsSync(configPath)) {
    return {
      htmlConfig: defaultHTMLConfig,
      jsConfig: defaultJSConfig,
    };
  }

  const userConfig = require(configPath);

  const htmlConfig = mergeHTMLConfig(defaultHTMLConfig, userConfig.webpackForHTML || {});
  const jsConfig = mergeClientJSConfig(
    defaultJSConfig,
    userConfig.webpackForClientJS || {},
    htmlConfig
  );
  return { htmlConfig, jsConfig };
};

const defaultHTMLWebpackConfig = ({ cwd }) => {
  const pkgJsonPath = path.join(cwd, 'package.json');
  let externals = ['calmly'];
  if (fs.existsSync(pkgJsonPath)) {
    const packageJson = require(path.join(cwd, 'package.json'));
    const deps = Object.keys(packageJson.dependencies);
    externals = [...externals, ...deps];
  }
  return {
    mode: process.env.NODE_ENV,
    output: {
      path: path.join(cwd, 'dist'),
      libraryTarget: 'commonjs2',
    },
    externals,
  };
};

const mergeHTMLConfig = (defaults, custom) => {
  if (custom.mode == null) {
    custom.mode = defaults.mode;
  }
  if (custom.entry) {
    if (
      Array.isArray(custom.entry) ||
      typeof custom.entry === 'function' ||
      typeof custom.entry === 'string'
    ) {
      throw new Error('[webpackForHTML]: entry must be object');
    }
  }

  if (custom.output) {
    if (custom.output.libraryTarget && custom.output.libraryTarget !== 'commonjs2') {
      throw new Error('[webpackForHTML]: output.libraryTarget must be "commonjs2"');
    }
    custom.output = { ...defaults.output, ...custom.output };
  } else {
    custom.output = defaults.output;
  }

  if (custom.externals) {
    if (Array.isArray(custom.externals)) {
      // TODO: Should make all dependencies external because
      // the bundled file is run on a server by Node.js.
      custom.externals.push(defaults.externals);
    } else {
      custom.externals = [custom.externals, defaults.externals];
    }
  } else {
    custom.externals = defaults.externals;
  }

  return custom;
};

const defaultClientJSWebpackConfig = ({ cwd }) => {
  return {
    mode: process.env.NODE_ENV,
    // entry must be set dynamically.
    output: {
      path: path.join(cwd, 'dist'),
    },
    plugins: [new WebpackManifestPlugin()],
  };
};

const mergeClientJSConfig = (defaults, custom, htmlConfig) => {
  if (custom.entry) {
    if (
      Array.isArray(custom.entry) ||
      typeof custom.entry === 'function' ||
      typeof custom.entry === 'string'
    ) {
      throw new Error('[webpackForClientJS]: entry must be object');
    }
  }

  if (custom.output) {
    if (custom.output.path !== htmlConfig.output.path) {
      throw new Error(
        '[webpackForClientJS]: output.path must be same with HTML webpack config'
      );
    }
  }

  // TODO: What if a user uses webpack-manifest-plugin already?
  custom.plugins = [...(custom.plugins || []), ...defaults.plugins];

  return custom;
};

module.exports = { loadWebpackConfigs };
