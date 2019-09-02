const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { promisify } = require('util');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { CalmlyContext } = require('./react-context');
const { loadWebpackConfigs } = require('./webpack');
const { loadPageConfigs } = require('./pages');

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdtemp = promisify(fs.mkdtemp);

const build = async () => {
  const cwd = process.cwd();

  const webpackConfigs = loadWebpackConfigs({ cwd });
  const distPath = webpackConfigs.htmlConfig.output.path;

  const pagesRoot = path.join(cwd, 'src', 'pages');
  const pages = await loadPageConfigs(pagesRoot);

  if (pages.length === 0) {
    throw new Error('no entry pages found');
  }

  const htmlEntries = pages.reduce((es, p) => {
    es[p.name] = path.join(pagesRoot, p.relativePath);
    return es;
  }, {});

  await runWebpack({
    ...webpackConfigs.htmlConfig,
    entry: htmlEntries,
  });

  // TODO: Load from 'pages.js'.
  const renderHTML = null;

  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'calmly-'));

  const jsData = [];
  const renderResults = pages.map(page => {
    const outPath = path.join(distPath, page.relativePath);
    const domTree = require(outPath).default();
    const render = domTree => {
      const ctxState = { paths: [] };
      const wrappedTree = React.createElement(
        CalmlyContext.Provider,
        { value: ctxState },
        domTree
      );
      const html = ReactDOMServer.renderToStaticMarkup(wrappedTree);
      jsData.push({ name: page.name, jsPaths: ctxState.paths });

      return new ResultHTML(page.name, html);
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
    entry: entries,
    ...webpackConfigs.jsConfig,
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
            `could not find JS file path for ${jsResult.jsName}. Something goes wrong.`
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
