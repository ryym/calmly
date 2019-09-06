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

  const pages = routes.map(route => {
    const render = (domTree: any) => {
      const jsRegistry = new ClientJSRegistry();
      const wrappedTree = jsRegistry.setupRegistration(domTree);
      const html = ReactDOMServer.renderToStaticMarkup(wrappedTree);
      const jsPaths = jsRegistry.getScriptFilePaths()!;
      return new Page(route.name, jsPaths, html);
    };

    let routeConfig: RouteConfig | null = null;
    if (route.configPath) {
      const fullConfigPath = path.join(distPath, route.configPath);
      routeConfig = require(fullConfigPath);
    }

    const outPath = path.join(distPath, route.filePath);
    const rootComponent = require(outPath).default;
    const domTree = React.createElement(rootComponent, null);
    return routeConfig ? routeConfig.renderHTML(domTree, render) : render(domTree);
  });

  const clientJSEntryFiles = await writeClientJSEntryFiles(pages, cwd);

  // TODO: Handle the case there are no client side JS.
  // (If entries is empty webpack throws an error)
  const entries = clientJSEntryFiles.reduce<{ [key: string]: string }>((es, r) => {
    es[r.name] = r.filePath;
    return es;
  }, {});

  await runWebpack({
    entry: entries,
    ...webpackConfigs.jsConfig,
  });

  const jsManifest = require(path.join(distPath, 'manifest.json'));

  await Promise.all(
    pages.map(page => {
      const clientJSEntry = clientJSEntryFiles.find(r => r.name === page.name);

      if (clientJSEntry == null) {
        page.replace('scriptTag', '');
      } else {
        const realPath = jsManifest[clientJSEntry.jsName];
        if (realPath == null) {
          throw new Error(
            `could not find JS file path for ${clientJSEntry.jsName}. Something goes wrong.`
          );
        }
        const scriptTag = `<script src="/${realPath}"></script>`;
        page.replace('scriptTag', scriptTag);
      }

      const cssName = `${page.name}.css`;
      const cssRealPath = htmlManifest[cssName];
      if (cssRealPath == null) {
        page.replace('stylesheetTag', '');
      } else {
        page.replace('stylesheetTag', `<link rel="stylesheet" href="${cssRealPath}" />`);
      }

      return writeFile(path.join(distPath, page.fileName()), page.toHTML());
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

class Page {
  private readonly replacements: { key: string; value: string }[];

  constructor(
    readonly name: string,
    readonly clientJsPaths: string[],
    private readonly html: string
  ) {
    this.replacements = [];
  }

  fileName() {
    return `${this.name}.html`;
  }

  replace(key: string, value: string) {
    this.replacements.push({ key, value });
  }

  toHTML() {
    const html = this.replacements.reduce((s, r) => {
      return s.replace(`<style>#${r.key}{}</style>`, r.value);
    }, this.html);
    return html;
  }
}

export interface RouteConfig {
  renderHTML(domTree: any, render: (domTree: any) => Page): Page;
}

const writeClientJSEntryFiles = async (
  pages: Page[],
  cwd: string
): Promise<ClientJSEntryFile[]> => {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'calmly-'));
  const jsPages = pages.filter(p => p.clientJsPaths.length > 0);

  return await Promise.all(
    jsPages.map(async r => {
      const jsPaths = r.clientJsPaths;
      let js = '';
      jsPaths.forEach((originalPath, i) => {
        js += `import _${i} from '${path.join(cwd, originalPath)}';`;
      });
      js += '\n';
      jsPaths.forEach((_path, i) => {
        js += `_${i}();`;
      });

      const filePath = path.join(tmpDir, `${r.name}.js`);
      await writeFile(filePath, js);
      return { name: r.name, jsName: `${r.name}.js`, filePath };
    })
  );
};

interface ClientJSEntryFile {
  readonly name: string;
  readonly jsName: string;
  readonly filePath: string;
}
