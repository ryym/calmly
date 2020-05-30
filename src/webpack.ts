import * as path from 'path';
import * as fs from 'fs';

const WebpackManifestPlugin: any = require('webpack-manifest-plugin');

export interface CalmlyConfig {
  readonly htmlConfig: any;
  readonly jsConfig: any;
}

export const loadWebpackConfigs = ({ cwd }: { cwd: string }): CalmlyConfig => {
  const configPath = path.join(cwd, '.calmly', 'config.js');
  const defaultHTMLConfig = defaultHTMLWebpackConfig(cwd);
  const defaultJSConfig = defaultClientJSWebpackConfig(cwd);

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

const defaultHTMLWebpackConfig = (cwd: string) => {
  const pkgJsonPath = path.join(cwd, 'package.json');
  let externals = ['calmly'];
  if (fs.existsSync(pkgJsonPath)) {
    const packageJson = require(path.join(cwd, 'package.json'));
    const deps = Object.keys(packageJson.dependencies);
    externals = [...externals, ...deps];
  }
  return {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    output: {
      path: path.join(cwd, 'dist'),
      libraryTarget: 'commonjs2',
    },
    externals,
    plugins: [new WebpackManifestPlugin()],
  };
};

const mergeHTMLConfig = (defaults: any, custom: any) => {
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

  custom.plugins = [...(custom.plugins || []), ...defaults.plugins];

  return custom;
};

const defaultClientJSWebpackConfig = (cwd: string) => {
  return {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    // entry must be set dynamically.
    output: {
      path: path.join(cwd, 'dist'),
    },
    plugins: [new WebpackManifestPlugin()],
  };
};

const mergeClientJSConfig = (defaults: any, custom: any, htmlConfig: any) => {
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
