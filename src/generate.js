const webpack = require('webpack');
const WebpackManifestPlugin = require('webpack-manifest-plugin');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { promisify } = require('util');

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { CalmlyContext } = require('./react');

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdtemp = promisify(fs.mkdtemp);

const PLACEHOLDER_JS_PATH = '---js---';

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

  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'calmly-'));

  const results = await Promise.all(
    Object.keys(pages).map(async name => {
      const domTree = pages[name]({ scriptUrl: PLACEHOLDER_JS_PATH });

      const ctxState = { paths: [] };
      const wrappedTree = React.createElement(
        CalmlyContext.Provider,
        { value: ctxState },
        domTree
      );
      const html = ReactDOMServer.renderToStaticMarkup(wrappedTree);

      if (ctxState.paths.length === 0) {
        return { name, html };
      }

      let js = '';
      ctxState.paths.forEach((originalPath, i) => {
        js += `import _${i} from '${path.join(cwd, originalPath)}';`;
      });
      js += '\n';
      ctxState.paths.forEach((_path, i) => {
        js += `_${i}();`;
      });

      const jsFilePath = path.join(tmpDir, `${name}.js`);
      await writeFile(jsFilePath, js);

      return { name, html, jsFilePath, jsName: `${name}.js` };
    })
  );

  const entries = results.reduce((es, r) => {
    if (r.jsFilePath) {
      es[r.name] = r.jsFilePath;
    }
    return es;
  }, {});

  await runWebpack({
    mode: 'development',
    entry: entries,
    output: {
      path: distPath,
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: ['babel-loader'],
        },
      ],
    },
    plugins: [new WebpackManifestPlugin()],
  });

  const manifestJson = await readFile(path.join(distPath, 'manifest.json'), {
    encoding: 'utf8',
  });
  const manifest = JSON.parse(manifestJson);

  await Promise.all(
    results.map(r => {
      const realPath = manifest[r.jsName];
      const html = r.html.replace(PLACEHOLDER_JS_PATH, `/${realPath}`);
      return writeFile(path.join(distPath, `${r.name}.html`), html);
    })
  );
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
