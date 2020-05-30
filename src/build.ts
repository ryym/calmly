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
import { PageGroup, PageTemplate } from './page-group';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const mkdtemp = promisify(fs.mkdtemp);
const removeFile = promisify(fs.unlink);

const stripExtension = (filePath: string): string => {
  // TODO: Support other extensions.
  return filePath.replace(/\.js$/, '');
};

export interface BuildOptions {
  readonly cwd?: string;
}

export const build = async (opts: BuildOptions = {}) => {
  const cwd = opts.cwd || process.cwd();

  if (!path.isAbsolute(cwd)) {
    // This is because we need to 'require()' the config file using the cwd.
    throw new Error('cwd must be absolute path');
  }

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

  const pageGroups = await Promise.all(routes.map((route) => renderPages(route, distPath)));

  const clientJSEntryFiles = await writeClientJSEntryFiles(pageGroups, cwd);
  const jsManifest = await buildClientJSEntries(clientJSEntryFiles, {
    webpack: webpackConfigs.jsConfig,
    distPath,
  });

  await Promise.all(
    pageGroups.map(async (pg) => {
      const clientJSEntry = clientJSEntryFiles.find((r) => r.pageName === pg.name);

      // Replace script tag placeholders.
      if (clientJSEntry == null) {
        pg.replace(PH_SCRIPT_TAG, '');
      } else {
        const realPath = jsManifest[clientJSEntry.jsName];
        const scriptTag = `<script src="/${realPath}"></script>`;
        pg.replace(PH_SCRIPT_TAG, scriptTag);
      }

      // Replace stylesheet tag placeholders.
      const cssName = `${pg.name}.css`;
      const cssRealPath = pageManifest[cssName];
      pg.replace(
        PH_STYLESHEET_TAG,
        cssRealPath == null ? '' : `<link rel="stylesheet" href="${cssRealPath}" />`
      );

      await Promise.all(
        pg.renderPages().map(async (page) => {
          if (page.name.endsWith('index')) {
            await writeFile(path.join(distPath, `${page.name}.html`), page.html);
          } else {
            const pageDirPath = path.join(distPath, page.name);
            if (!fs.existsSync(pageDirPath)) {
              await mkdir(pageDirPath);
            }
            await writeFile(path.join(distPath, page.name, 'index.html'), page.html);
          }
        })
      );
    })
  );

  await removeComponentFiles(distPath, routes);
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

interface RouteConfig {
  renderHTML(domTree: any, render: (domTree: any) => PageTemplate): PageTemplate;
}

const writeClientJSEntryFiles = async (
  pageGroups: PageGroup[],
  cwd: string
): Promise<ClientJSEntryFile[]> => {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'calmly-'));
  const jsPageGroups = pageGroups.filter((p) => p.clientJsPaths.length > 0);

  return await Promise.all(
    jsPageGroups.map(async (pg) => {
      const jsPaths = pg.clientJsPaths;
      let js = '';
      jsPaths.forEach((originalPath, i) => {
        js += `import _${i} from '${path.join(cwd, originalPath)}';`;
      });
      js += '\n';
      jsPaths.forEach((_path, i) => {
        js += `_${i}();`;
      });

      const entryName = `${pg.name}.client`;
      const jsName = `${pg.name}.client.js`;
      const filePath = path.join(tmpDir, jsName);
      await writeFile(filePath, js);
      return { pageName: pg.name, entryName, jsName, filePath };
    })
  );
};

interface ClientJSEntryFile {
  readonly pageName: string;
  readonly entryName: string;
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
    es[r.entryName] = r.filePath;
    return es;
  }, {});
  await runWebpack({ ...config.webpack, entry: entries });
  return require(path.join(config.distPath, 'js.manifest.json'));
};

const renderPages = async (route: Route, distPath: string): Promise<PageGroup> => {
  const render = (domTree: any) => {
    const jsRegistry = new ClientJSRegistry();
    const wrappedTree = jsRegistry.setupRegistration(domTree);
    const html = ReactDOMServer.renderToStaticMarkup(wrappedTree);
    const jsPaths = jsRegistry.getScriptFilePaths()!;
    return new PageTemplate(`<!DOCTYPE html>${html}`, jsPaths);
  };

  let routeConfig: RouteConfig | null = null;
  if (route.configPath) {
    const fullConfigPath = path.join(distPath, route.configPath);
    routeConfig = require(fullConfigPath);
  }

  const outPath = path.join(distPath, route.filePath);
  const { default: rootComponent, ...componentConfig } = require(outPath);

  if (route.isDynamic()) {
    const { getInitialPropsMap } = componentConfig;
    if (getInitialPropsMap == null) {
      throw new Error('dynamic page must be export getInitialPropsMap');
    }
    // TODO: Consider the case where propsMap is empty.
    const propsMap: Map<unknown, object> = await getInitialPropsMap();
    const templates = Array.from(propsMap.entries()).map(([name, props]) => {
      const domTree = React.createElement(rootComponent, props);
      const template = routeConfig ? routeConfig.renderHTML(domTree, render) : render(domTree);
      return { name: path.join(route.dirName(), String(name)), template };
    });
    return new PageGroup(route.name, templates);
  } else {
    const { getInitialProps } = componentConfig;
    const initialProps = getInitialProps ? await getInitialProps() : null;
    const domTree = React.createElement(rootComponent, initialProps);
    const template = routeConfig ? routeConfig.renderHTML(domTree, render) : render(domTree);

    return new PageGroup(route.name, [{ name: route.name, template }]);
  }
};

const removeComponentFiles = async (distPath: string, routes: Route[]) => {
  const uniqueConfigPaths = routes.reduce<Set<string>>((paths, route) => {
    if (route.configPath != null) {
      paths.add(route.configPath);
    }
    return paths;
  }, new Set());

  return Promise.all([
    ...Array.from(uniqueConfigPaths).map((configPath) =>
      removeFile(path.join(distPath, configPath))
    ),
    ...routes.map((route) => removeFile(path.join(distPath, route.filePath))),
  ]);
};
