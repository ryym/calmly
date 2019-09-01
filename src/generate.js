const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const ReactDOMServer = require('react-dom/server');

const generate = async () => {
  const cwd = process.cwd();
  const distPath = path.join(cwd, 'dist');

  await runWebpack({
    mode: 'development',
    entry: path.join(cwd, 'src'),
    output: {
      path: distPath,
      libraryTarget: 'commonjs2',
      filename: 'index.js',
    },
    externals: 'calmly',
    module: {
      rules: [
        {
          test: /\.js$/,
          use: ['babel-loader'],
        },
      ],
    },
  });

  const { pages } = require(distPath);

  if (pages == null) {
    throw new Error('pages does not be exported');
  }

  const writeFile = promisify(fs.writeFile);
  const promises = Object.keys(pages).map(name => {
    const domTree = pages[name]();
    const html = ReactDOMServer.renderToStaticMarkup(domTree);

    return writeFile(path.join(distPath, `${name}.html`), html);
  });

  await Promise.all(promises);
};

const runWebpack = config => {
  return new Promise((resolve, reject) => {
    const compiler = webpack(config);
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      } else if (stats.hasErrors() || stats.hasWarnings()) {
        console.error(stats.toString({ chunks: false, colors: true }));
        reject(new Error('build error'));
      } else {
        resolve(stats);
      }
    });
  });
};

module.exports = { generate };
