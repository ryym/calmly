const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const fileStat = promisify(fs.stat);

class PageConfig {
  constructor({ relativePath }) {
    this.relativePath = relativePath;
    // TODO: Accept TypeScript files.
    this.name = relativePath.replace(/\.js$/, '');
  }
}

const loadPageConfigs = async rootDir => {
  const paths = await loadPagePaths(rootDir);
  return paths.map(p => new PageConfig({ relativePath: p }));
};

const loadPagePaths = async (rootDir, parent = null) => {
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

module.exports = { loadPageConfigs };
