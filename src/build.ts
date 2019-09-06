import webpack from 'webpack';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { promisify } from 'util';
import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import { loadWebpackConfigs } from './webpack';
import { loadRoutes } from './routes';
import { ClientJSRegistry } from './client-js-registry';

const writeFile = promisify(fs.writeFile);
const mkdtemp = promisify(fs.mkdtemp);

const stripExtension = (filePath: string): string => {
  // TODO: Support other extensions.
  return filePath.replace(/\.js$/, '');
};

export const build = async () => {
  const cwd = process.cwd();

  const webpackConfigs = loadWebpackConfigs({ cwd });
  const distPath = webpackConfigs.htmlConfig.output.path;

  const pagesRoot = path.join(cwd, 'src', 'pages');
  const routes = await loadRoutes(pagesRoot);

  if (routes.length === 0) {
    throw new Error('no entry pages found');
  }

  const htmlEntries = routes.reduce<{ [key: string]: any }>((es, r) => {
    es[r.name] = path.join(pagesRoot, r.filePath);
    if (r.configPath != null) {
      const entryName = stripExtension(r.configPath);
      if (es[entryName] == null) {
        es[entryName] = path.join(pagesRoot, r.configPath);
      }
    }
    return es;
  }, {});

  await runWebpack({
    ...webpackConfigs.htmlConfig,
    entry: htmlEntries,
  });

  const htmlManifest = require(path.join(distPath, 'manifest.json'));

  const jsData: { name: string; jsPaths: string[] }[] = [];
  const renderResults = routes.map(route => {
    const render = (domTree: any) => {
      const jsRegistry = new ClientJSRegistry();
      const wrappedTree = jsRegistry.setupRegistration(domTree);
      const html = ReactDOMServer.renderToStaticMarkup(wrappedTree);
      jsData.push({ name: route.name, jsPaths: jsRegistry.getScriptSources()! });
      return new ResultHTML(route.name, html);
    };

    let routeConfig = null;
    if (route.configPath) {
      const fullConfigPath = path.join(distPath, route.configPath);
      routeConfig = require(fullConfigPath);
    }

    const outPath = path.join(distPath, route.filePath);
    const rootComponent = require(outPath).default;
    const domTree = React.createElement(rootComponent, null);
    return routeConfig ? routeConfig.renderHTML(domTree, render) : render(domTree);
  });

  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'calmly-'));

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
  const entries = jsResults.reduce<{ [key: string]: any }>((es, r) => {
    if (r.jsFilePath) {
      es[r.name] = r.jsFilePath;
    }
    return es;
  }, {});

  await runWebpack({
    entry: entries,
    ...webpackConfigs.jsConfig,
  });

  const jsManifest = require(path.join(distPath, 'manifest.json'));

  await Promise.all(
    renderResults.map(html => {
      const jsResult = jsResults.find(r => r.name === html.name())!;

      if (jsResult.jsFilePath == null) {
        html.replace('scriptTag', '');
      } else {
        const realPath = jsManifest[jsResult.jsName];
        if (realPath == null) {
          throw new Error(
            `could not find JS file path for ${jsResult.jsName}. Something goes wrong.`
          );
        }
        const scriptTag = `<script src="/${realPath}"></script>`;
        html.replace('scriptTag', scriptTag);
      }

      const cssName = `${html.name()}.css`;
      const cssRealPath = htmlManifest[cssName];
      if (cssRealPath == null) {
        html.replace('stylesheetTag', '');
      } else {
        html.replace('stylesheetTag', `<link rel="stylesheet" href="${cssRealPath}" />`);
      }

      return writeFile(path.join(distPath, html.fileName()), html.toString());
    })
  );
};

const runWebpack = (config: any) => {
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
  private readonly replacements: { key: string; value: string }[];
  constructor(private readonly _name: string, private readonly html: string) {
    this.replacements = [];
  }

  name() {
    return this._name;
  }

  fileName() {
    return `${this._name}.html`;
  }

  replace(key: string, value: string) {
    this.replacements.push({ key, value });
  }

  toString() {
    const html = this.replacements.reduce((s, r) => {
      return s.replace(`<style>#${r.key}{}</style>`, r.value);
    }, this.html);
    return html;
  }
}
