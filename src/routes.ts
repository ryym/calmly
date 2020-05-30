import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

// TODO: Support extensions other than '.js' (.e.g. '.ts', '.jsx').

export class Route {
  readonly filePath: string;
  readonly name: string;
  readonly configPath: string | null;

  constructor({ filePath, configPath }: RouteArgs) {
    this.filePath = filePath;
    this.name = filePath.slice(1).replace(/\.js$/, '');
    this.configPath = configPath;
  }

  isDynamic(): boolean {
    return this.fileName().startsWith('_');
  }

  fileName(): string {
    return path.basename(this.name);
  }

  dirName(): string {
    return path.dirname(this.name);
  }
}

export interface RouteArgs {
  filePath: string;
  configPath: string | null;
}

interface Context {
  rootDir: string;
  configFileName: string;
}

export const loadRoutes = async (rootDir: string): Promise<Route[]> => {
  return _loadRoutes('', null, { rootDir, configFileName: 'route.config.js' });
};

const readdir = promisify(fs.readdir);
const fileStat = promisify(fs.stat);

const _loadRoutes = async (
  parent: string,
  parentConfigPath: string | null,
  ctx: Context
): Promise<Route[]> => {
  const parentPath = path.join(ctx.rootDir, parent);
  const localConfigPath = path.join(parentPath, ctx.configFileName);
  const configPath = fs.existsSync(localConfigPath)
    ? path.relative(parentPath, localConfigPath)
    : parentConfigPath;

  const files = await readdir(parentPath);
  const fileLists = await Promise.all(
    files.map(async (name) => {
      const fullPath = path.join(parentPath, name);
      const stat = await fileStat(fullPath);
      const filePath = `${parent}/${name}`;

      if (stat.isDirectory()) {
        return await _loadRoutes(filePath, configPath, ctx);
      }
      if (name === ctx.configFileName || !name.endsWith('.js')) {
        return [];
      }
      return [new Route({ filePath, configPath })];
    })
  );

  return fileLists.reduce((all, list) => all.concat(list), []);
};
