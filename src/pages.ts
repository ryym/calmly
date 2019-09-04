import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const fileStat = promisify(fs.stat);

class PageConfig {
  readonly relativePath: string;
  readonly name: string;

  constructor({ relativePath }: { relativePath: string }) {
    this.relativePath = relativePath;
    // TODO: Accept TypeScript files.
    this.name = relativePath.replace(/\.js$/, '');
  }
}

export const loadPageConfigs = async (rootDir: string) => {
  const paths = await loadPagePaths(rootDir);
  return paths.map(p => new PageConfig({ relativePath: p }));
};

const loadPagePaths = async (rootDir: string, parent?: string): Promise<string[]> => {
  const files = await readdir(rootDir);

  const fileLists = await Promise.all(
    files.map(async name => {
      const fullPath = path.join(rootDir, name);
      const stat = await fileStat(fullPath);
      const relPath = parent ? `${parent}/${name}` : name;
      if (stat.isDirectory()) {
        return await loadPagePaths(fullPath, relPath);
      } else if (!name.endsWith('.js')) {
        return [];
      }
      return [relPath];
    })
  );

  return fileLists.reduce((all, list) => all.concat(list), []);
};
