const webpack = require('webpack');
const WebpackManifestPlugin = require('webpack-manifest-plugin');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { promisify } = require('util');

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { CalmlyContext } = require('./react-context');

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdtemp = promisify(fs.mkdtemp);

const build = async () => {
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

  const { pages, renderHTML } = require(distPath);

  if (pages == null) {
    throw new Error('pages does not be exported');
  }

  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'calmly-'));

  const jsData = [];
  const renderResults = Object.keys(pages).map(name => {
    const domTree = pages[name]();
    const render = domTree => {
      const ctxState = { paths: [] };
      const wrappedTree = React.createElement(
        CalmlyContext.Provider,
        { value: ctxState },
        domTree
      );
      const html = ReactDOMServer.renderToStaticMarkup(wrappedTree);
      jsData.push({ name, jsPaths: ctxState.paths });

      return new ResultHTML(name, html);
    };

    return renderHTML ? renderHTML(domTree, render) : render(domTree);
  });

  const jsResults = await Promise.all(
    jsData.map(async r => {
      let jsFilePath = null;

      if (r.jsPaths.length > 0) {
        let js = '';
        r.jsPaths.forEach((originalPath, i) => {
          js += `import _${i} from '${path.join(cwd, originalPath)}';`;
        });
        js += '\n';
        r.jsPaths.forEach((_path, i) => {
          js += `_${i}();`;
        });

        jsFilePath = path.join(tmpDir, `${r.name}.js`);
        await writeFile(jsFilePath, js);
      }

      return { name: r.name, jsFilePath, jsName: `${r.name}.js` };
    })
  );

  // TODO: Handle the case there are no client side JS.
  // (If entries is empty webpack throws an error)
  const entries = jsResults.reduce((es, r) => {
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
    renderResults.map(html => {
      const jsResult = jsResults.find(r => r.name === html.name());

      if (jsResult.jsFilePath == null) {
        html.replace('scriptTag', '');
      } else {
        const realPath = manifest[jsResult.jsName];
        if (realPath == null) {
          throw new Error(
            `could not find JS file path for ${jsName}. Something goes wrong.`
          );
        }
        const scriptTag = `<script src="/${realPath}"></script>`;
        html.replace('scriptTag', scriptTag);
      }

      return writeFile(path.join(distPath, html.fileName()), html.toString());
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

class ResultHTML {
  constructor(name, html) {
    this._name = name;
    this._html = html;
    this._replacements = [];
  }

  name() {
    return this._name;
  }

  fileName() {
    return `${this._name}.html`;
  }

  replace(key, value) {
    this._replacements.push({ key, value });
  }

  toString() {
    const html = this._replacements.reduce((s, r) => {
      return s.replace(`<style>#${r.key}{}</style>`, r.value);
    }, this._html);
    return html;
  }
}
module.exports = { build };
