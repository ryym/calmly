import webpack from 'webpack';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { promisify } from 'util';
import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import { loadWebpackConfigs } from './webpack';
import { loadRoutes, Route } from './routes';
import { ClientJSRegistry } from './client-js-registry';
import { PH_SCRIPT_TAG, PH_STYLESHEET_TAG } from './placeholder';

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

  const routesRoot = path.join(cwd, 'src', 'pages');
  const routes = await loadRoutes(routesRoot);

  if (routes.length === 0) {
    throw new Error('no entry pages found');
  }

  const pageManifest = await buildPageEntries(routesRoot, routes, {
    webpack: webpackConfigs.htmlConfig,
    distPath,
  });

  const pages = routes.map(route => renderPage(route, distPath));

  const clientJSEntryFiles = await writeClientJSEntryFiles(pages, cwd);
  const jsManifest = await buildClientJSEntries(clientJSEntryFiles, {
    webpack: webpackConfigs.jsConfig,
    distPath,
  });

  await Promise.all(
    pages.map(page => {
      const clientJSEntry = clientJSEntryFiles.find(r => r.name === page.name);

      // Replace script tag placeholders.
      if (clientJSEntry == null) {
        page.replace(PH_SCRIPT_TAG, '');
      } else {
        const realPath = jsManifest[clientJSEntry.jsName];
        const scriptTag = `<script src="/${realPath}"></script>`;
        page.replace(PH_SCRIPT_TAG, scriptTag);
      }

      // Replace stylesheet tag placeholders.
      const cssName = `${page.name}.css`;
      const cssRealPath = pageManifest[cssName];
      page.replace(
        PH_STYLESHEET_TAG,
        cssRealPath == null ? '' : `<link rel="stylesheet" href="${cssRealPath}" />`
      );

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

interface BuildConfig {
  readonly distPath: string;
  readonly webpack: object;
}

type WebpackManifest = {
  readonly [path: string]: string;
};

const buildPageEntries = async (
  routesRoot: string,
  routes: Route[],
  config: BuildConfig
): Promise<WebpackManifest> => {
  const htmlEntries = routes.reduce<{ [key: string]: any }>((es, r) => {
    es[r.name] = path.join(routesRoot, r.filePath);
    if (r.configPath != null) {
      const entryName = stripExtension(r.configPath);
      if (es[entryName] == null) {
        es[entryName] = path.join(routesRoot, r.configPath);
      }
    }
    return es;
  }, {});

  await runWebpack({ ...config.webpack, entry: htmlEntries });
  return require(path.join(config.distPath, 'manifest.json'));
};

const buildClientJSEntries = async (
  clientJSEntryFiles: ClientJSEntryFile[],
  config: BuildConfig
): Promise<WebpackManifest> => {
  if (clientJSEntryFiles.length === 0) {
    return {};
  }

  const entries = clientJSEntryFiles.reduce<{ [key: string]: string }>((es, r) => {
    es[r.name] = r.filePath;
    return es;
  }, {});
  await runWebpack({ ...config.webpack, entry: entries });
  return require(path.join(config.distPath, 'manifest.json'));
};

const renderPage = (route: Route, distPath: string): Page => {
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
};
